import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Registry, register } from 'prom-client';

/**
 * Metrics Service
 * Handles Prometheus metrics collection
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

    this.logger.log('Metrics service initialized');
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
}

