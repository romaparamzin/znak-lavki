import CircuitBreaker from 'opossum';
import { CustomLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

export interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  name: string;
}

export class IntegrationCircuitBreaker {
  private breaker: CircuitBreaker;
  private serviceName: string;

  constructor(
    action: (...args: any[]) => Promise<any>,
    options: CircuitBreakerOptions,
    private logger: CustomLoggerService,
    private metricsService: MetricsService,
  ) {
    this.serviceName = options.name;

    const breakerOptions = {
      timeout: options.timeout,
      errorThresholdPercentage: options.errorThresholdPercentage,
      resetTimeout: options.resetTimeout,
      rollingCountTimeout: options.rollingCountTimeout,
      rollingCountBuckets: options.rollingCountBuckets,
      name: options.name,
    };

    this.breaker = new CircuitBreaker(action, breakerOptions);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.breaker.on('open', () => {
      this.logger.logCircuitBreakerEvent(this.serviceName, 'open', {
        stats: this.breaker.stats,
      });
      this.metricsService.updateCircuitBreakerStatus(this.serviceName, 'open');
      this.metricsService.updateHealthStatus(this.serviceName, 'unhealthy');
    });

    this.breaker.on('halfOpen', () => {
      this.logger.logCircuitBreakerEvent(this.serviceName, 'half-open', {
        stats: this.breaker.stats,
      });
      this.metricsService.updateCircuitBreakerStatus(this.serviceName, 'half-open');
      this.metricsService.updateHealthStatus(this.serviceName, 'degraded');
    });

    this.breaker.on('close', () => {
      this.logger.logCircuitBreakerEvent(this.serviceName, 'close', {
        stats: this.breaker.stats,
      });
      this.metricsService.updateCircuitBreakerStatus(this.serviceName, 'closed');
      this.metricsService.updateHealthStatus(this.serviceName, 'healthy');
    });

    this.breaker.on('success', (result) => {
      this.logger.debug(`Circuit breaker success for ${this.serviceName}`);
    });

    this.breaker.on('failure', (error) => {
      this.logger.error(`Circuit breaker failure for ${this.serviceName}`, error.stack);
    });

    this.breaker.on('timeout', () => {
      this.logger.warn(`Circuit breaker timeout for ${this.serviceName}`);
    });

    this.breaker.on('reject', () => {
      this.logger.warn(`Circuit breaker rejected request for ${this.serviceName}`);
    });
  }

  async fire(...args: any[]): Promise<any> {
    return this.breaker.fire(...args);
  }

  getStats() {
    return this.breaker.stats;
  }

  isOpen(): boolean {
    return this.breaker.opened;
  }

  shutdown() {
    this.breaker.shutdown();
  }
}

export function createCircuitBreaker(
  action: (...args: any[]) => Promise<any>,
  serviceName: string,
  logger: CustomLoggerService,
  metricsService: MetricsService,
  customOptions?: Partial<CircuitBreakerOptions>,
): IntegrationCircuitBreaker {
  const defaultOptions: CircuitBreakerOptions = {
    timeout: 30000, // 30 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
    name: serviceName,
  };

  const options = { ...defaultOptions, ...customOptions };

  return new IntegrationCircuitBreaker(action, options, logger, metricsService);
}
