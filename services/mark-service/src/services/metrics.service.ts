import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, register } from 'prom-client';

/**
 * Metrics Service
 * Handles Prometheus metrics collection for business and system metrics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly registry: Registry;

  // HTTP metrics
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestErrors: Counter<string>;

  // Mark-specific metrics
  private readonly marksGenerated: Counter<string>;
  private readonly marksValidated: Counter<string>;
  private readonly marksBlocked: Counter<string>;
  private readonly qrCodesGenerated: Counter<string>;
  private readonly cacheHits: Counter<string>;
  private readonly cacheMisses: Counter<string>;

  // Business metrics
  private readonly markGenerationErrors: Counter<string>;
  private readonly markValidationSuccess: Counter<string>;
  private readonly markValidationFailure: Counter<string>;
  private readonly activeMarksGauge: Gauge<string>;
  private readonly expiredMarksGauge: Gauge<string>;
  private readonly validationDuration: Histogram<string>;
  private readonly idrRateGauge: Gauge<string>;
  private readonly systemCoverageGauge: Gauge<string>;

  constructor() {
    // Use default registry and clear it to avoid duplicate registration
    this.registry = register;

    // Clear existing metrics to prevent duplicate registration errors
    this.registry.clear();

    // Initialize HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'endpoint'],
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry],
    });

    // Initialize mark-specific metrics
    this.marksGenerated = new Counter({
      name: 'marks_generated_total',
      help: 'Total number of marks generated',
      labelNames: ['gtin'],
      registers: [this.registry],
    });

    this.marksValidated = new Counter({
      name: 'marks_validated_total',
      help: 'Total number of marks validated',
      labelNames: ['is_valid'],
      registers: [this.registry],
    });

    this.marksBlocked = new Counter({
      name: 'marks_blocked_total',
      help: 'Total number of marks blocked',
      registers: [this.registry],
    });

    this.qrCodesGenerated = new Counter({
      name: 'qr_codes_generated_total',
      help: 'Total number of QR codes generated',
      registers: [this.registry],
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Initialize business metrics
    this.markGenerationErrors = new Counter({
      name: 'mark_generation_errors_total',
      help: 'Total number of mark generation errors',
      labelNames: ['error_type', 'supplier'],
      registers: [this.registry],
    });

    this.markValidationSuccess = new Counter({
      name: 'mark_validation_success_total',
      help: 'Total number of successful mark validations',
      labelNames: ['supplier'],
      registers: [this.registry],
    });

    this.markValidationFailure = new Counter({
      name: 'mark_validation_failure_total',
      help: 'Total number of failed mark validations',
      labelNames: ['reason', 'supplier'],
      registers: [this.registry],
    });

    this.activeMarksGauge = new Gauge({
      name: 'active_marks_count',
      help: 'Current number of active marks in the system',
      labelNames: ['supplier', 'status'],
      registers: [this.registry],
    });

    this.expiredMarksGauge = new Gauge({
      name: 'expired_marks_count',
      help: 'Current number of expired marks',
      labelNames: ['supplier'],
      registers: [this.registry],
    });

    this.validationDuration = new Histogram({
      name: 'mark_validation_duration_ms',
      help: 'Mark validation duration in milliseconds',
      labelNames: ['result'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry],
    });

    this.idrRateGauge = new Gauge({
      name: 'idr_rate',
      help: 'Invalid Data Rate (IDR) - percentage of failed validations',
      labelNames: ['supplier', 'time_window'],
      registers: [this.registry],
    });

    this.systemCoverageGauge = new Gauge({
      name: 'system_coverage_percentage',
      help: 'Percentage of suppliers/products covered by the system',
      labelNames: ['coverage_type'],
      registers: [this.registry],
    });

    this.logger.log('Metrics service initialized with business metrics');
  }

  /**
   * Record HTTP request metrics
   */
  recordRequest(
    method: string,
    endpoint: string,
    status: string,
    duration: number,
    statusCode?: number,
  ): void {
    this.httpRequestsTotal.inc({ method, endpoint, status });
    this.httpRequestDuration.observe({ method, endpoint }, duration);

    if (status === 'error' && statusCode) {
      this.httpRequestErrors.inc({ method, endpoint, status_code: statusCode });
    }
  }

  /**
   * Record mark generation
   */
  recordMarkGeneration(gtin: string, count: number): void {
    this.marksGenerated.inc({ gtin }, count);
  }

  /**
   * Record mark validation
   */
  recordMarkValidation(isValid: boolean): void {
    this.marksValidated.inc({ is_valid: isValid.toString() });
  }

  /**
   * Record mark blocked
   */
  recordMarkBlocked(count: number = 1): void {
    this.marksBlocked.inc(count);
  }

  /**
   * Record QR code generation
   */
  recordQrCodeGeneration(count: number): void {
    this.qrCodesGenerated.inc(count);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Record mark generation error
   */
  recordMarkGenerationError(errorType: string, supplier: string): void {
    this.markGenerationErrors.inc({ error_type: errorType, supplier });
  }

  /**
   * Record mark validation result with duration
   */
  recordValidationTime(
    duration: number,
    result: 'success' | 'failure',
    supplier?: string,
    reason?: string,
  ): void {
    this.validationDuration.observe({ result }, duration);

    if (result === 'success') {
      this.markValidationSuccess.inc({ supplier: supplier || 'unknown' });
    } else {
      this.markValidationFailure.inc({
        reason: reason || 'unknown',
        supplier: supplier || 'unknown',
      });
    }
  }

  /**
   * Update active marks count
   */
  updateActiveMarksCount(count: number, supplier?: string, status?: string): void {
    this.activeMarksGauge.set(
      {
        supplier: supplier || 'all',
        status: status || 'active',
      },
      count,
    );
  }

  /**
   * Update expired marks count
   */
  updateExpiredMarksCount(count: number, supplier?: string): void {
    this.expiredMarksGauge.set({ supplier: supplier || 'all' }, count);
  }

  /**
   * Calculate and update IDR (Invalid Data Rate)
   */
  updateIDRRate(
    failedCount: number,
    totalCount: number,
    supplier?: string,
    timeWindow?: string,
  ): void {
    const idrRate = totalCount > 0 ? failedCount / totalCount : 0;
    this.idrRateGauge.set(
      {
        supplier: supplier || 'all',
        time_window: timeWindow || '5m',
      },
      idrRate,
    );
  }

  /**
   * Update system coverage percentage
   */
  updateSystemCoverage(
    percentage: number,
    coverageType: 'suppliers' | 'products' | 'categories',
  ): void {
    this.systemCoverageGauge.set({ coverage_type: coverageType }, percentage);
  }

  /**
   * Collect mark generated with supplier tracking
   */
  collectMarkGenerated(count: number, supplier: string): void {
    this.recordMarkGeneration(supplier, count);
  }
}
