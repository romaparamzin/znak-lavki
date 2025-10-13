import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from './logger.service';

interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  circuitBreakerStatus: 'closed' | 'open' | 'half-open';
  lastHealthCheck: Date;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

@Injectable()
export class MetricsService {
  private metrics: Map<string, ServiceMetrics> = new Map();

  constructor(private readonly logger: CustomLoggerService) {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    ['wms', 'pim', '1c'].forEach((service) => {
      this.metrics.set(service, {
        requestCount: 0,
        errorCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        circuitBreakerStatus: 'closed',
        lastHealthCheck: new Date(),
        healthStatus: 'healthy',
      });
    });
  }

  recordRequest(service: string, responseTime: number, isError: boolean = false) {
    const metrics = this.metrics.get(service);
    if (!metrics) return;

    metrics.requestCount++;
    metrics.totalResponseTime += responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.requestCount;

    if (isError) {
      metrics.errorCount++;
    }

    this.metrics.set(service, metrics);
  }

  updateCircuitBreakerStatus(service: string, status: 'closed' | 'open' | 'half-open') {
    const metrics = this.metrics.get(service);
    if (!metrics) return;

    metrics.circuitBreakerStatus = status;
    this.metrics.set(service, metrics);

    this.logger.logCircuitBreakerEvent(service, status);
  }

  updateHealthStatus(service: string, status: 'healthy' | 'degraded' | 'unhealthy') {
    const metrics = this.metrics.get(service);
    if (!metrics) return;

    metrics.healthStatus = status;
    metrics.lastHealthCheck = new Date();
    this.metrics.set(service, metrics);
  }

  getMetrics(service: string): ServiceMetrics | undefined {
    return this.metrics.get(service);
  }

  getAllMetrics(): Record<string, ServiceMetrics> {
    const allMetrics: Record<string, ServiceMetrics> = {};
    this.metrics.forEach((value, key) => {
      allMetrics[key] = value;
    });
    return allMetrics;
  }

  resetMetrics(service: string) {
    const metrics = this.metrics.get(service);
    if (!metrics) return;

    metrics.requestCount = 0;
    metrics.errorCount = 0;
    metrics.totalResponseTime = 0;
    metrics.averageResponseTime = 0;
    this.metrics.set(service, metrics);
  }

  getErrorRate(service: string): number {
    const metrics = this.metrics.get(service);
    if (!metrics || metrics.requestCount === 0) return 0;

    return (metrics.errorCount / metrics.requestCount) * 100;
  }
}
