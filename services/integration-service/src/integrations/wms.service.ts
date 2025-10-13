import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { WMSIntegration, ValidationResult, Order, ExpiringItem } from '../interfaces/wms.interface';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { createCircuitBreaker, IntegrationCircuitBreaker } from '../common/circuit-breaker';
import { Retry } from '../common/retry.decorator';
import { RabbitMQService } from '../queue/rabbitmq.service';

@Injectable()
export class WMSService implements WMSIntegration, OnModuleInit {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: IntegrationCircuitBreaker;
  private readonly serviceName = 'wms';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly metricsService: MetricsService,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('WMS_BASE_URL') || 'http://localhost:8080',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.configService.get<string>('WMS_API_KEY') || '',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      config['requestStartTime'] = Date.now();
      return config;
    });

    // Add response interceptor for metrics
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config['requestStartTime'];
        this.metricsService.recordRequest(this.serviceName, duration, false);
        this.logger.logApiCall(
          response.config.method.toUpperCase(),
          response.config.url,
          response.status,
          duration,
        );
        return response;
      },
      (error) => {
        const duration = error.config ? Date.now() - error.config['requestStartTime'] : 0;
        this.metricsService.recordRequest(this.serviceName, duration, true);
        this.logger.logApiCall(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || 'UNKNOWN',
          error.response?.status || 500,
          duration,
          error.message,
        );
        return Promise.reject(error);
      },
    );
  }

  onModuleInit() {
    this.circuitBreaker = createCircuitBreaker(
      this.makeApiCall.bind(this),
      this.serviceName,
      this.logger,
      this.metricsService,
      {
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );
  }

  private async makeApiCall(method: string, endpoint: string, data?: any): Promise<any> {
    const response = await this.axiosInstance.request({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    maxDelayMs: 10000,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  })
  async validateMarkOnScan(markCode: string): Promise<ValidationResult> {
    this.logger.log(`Validating mark code: ${markCode}`, 'WMS');

    try {
      const result = await this.circuitBreaker.fire('POST', '/api/v1/marks/validate', {
        markCode,
      });

      this.logger.logIntegrationEvent(
        'mark_validation',
        this.serviceName,
        { markCode, result },
        'success',
      );

      // Publish event to queue
      await this.rabbitMQService.publishWMSEvent({
        eventType: 'mark.validated',
        eventId: `${Date.now()}-${markCode}`,
        data: { markCode, result },
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to validate mark: ${markCode}`, error.stack, 'WMS');
      this.logger.logIntegrationEvent(
        'mark_validation',
        this.serviceName,
        { markCode, error: error.message },
        'error',
      );
      throw error;
    }
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    maxDelayMs: 10000,
  })
  async blockItemInWarehouse(markCode: string, reason: string): Promise<void> {
    this.logger.log(`Blocking item in warehouse: ${markCode}`, 'WMS');

    try {
      await this.circuitBreaker.fire('POST', '/api/v1/inventory/block', {
        markCode,
        reason,
        timestamp: new Date().toISOString(),
      });

      this.logger.logIntegrationEvent(
        'item_blocked',
        this.serviceName,
        { markCode, reason },
        'success',
      );

      // Publish event to queue
      await this.rabbitMQService.publishWMSEvent({
        eventType: 'item.blocked',
        eventId: `${Date.now()}-${markCode}`,
        data: { markCode, reason },
      });
    } catch (error) {
      this.logger.error(`Failed to block item: ${markCode}`, error.stack, 'WMS');
      this.logger.logIntegrationEvent(
        'item_blocked',
        this.serviceName,
        { markCode, reason, error: error.message },
        'error',
      );
      throw error;
    }
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    maxDelayMs: 10000,
  })
  async getOrderDetails(orderId: string): Promise<Order> {
    this.logger.log(`Getting order details: ${orderId}`, 'WMS');

    try {
      const order = await this.circuitBreaker.fire('GET', `/api/v1/orders/${orderId}`);

      this.logger.logIntegrationEvent('order_fetched', this.serviceName, { orderId }, 'success');

      return order;
    } catch (error) {
      this.logger.error(`Failed to get order: ${orderId}`, error.stack, 'WMS');
      this.logger.logIntegrationEvent(
        'order_fetched',
        this.serviceName,
        { orderId, error: error.message },
        'error',
      );
      throw error;
    }
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 2000,
    exponentialBackoff: true,
    maxDelayMs: 15000,
  })
  async notifyExpiringItems(items: ExpiringItem[]): Promise<void> {
    this.logger.log(`Notifying expiring items: ${items.length} items`, 'WMS');

    try {
      await this.circuitBreaker.fire('POST', '/api/v1/notifications/expiring', {
        items,
        notificationDate: new Date().toISOString(),
      });

      this.logger.logIntegrationEvent(
        'expiring_items_notified',
        this.serviceName,
        { itemCount: items.length },
        'success',
      );

      // Publish notification to queue
      await this.rabbitMQService.publishNotification({
        type: 'expiring_items',
        items,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to notify expiring items', error.stack, 'WMS');
      this.logger.logIntegrationEvent(
        'expiring_items_notified',
        this.serviceName,
        { itemCount: items.length, error: error.message },
        'error',
      );
      throw error;
    }
  }

  async getInventoryStatus(markCode: string): Promise<any> {
    this.logger.log(`Getting inventory status: ${markCode}`, 'WMS');

    try {
      return await this.circuitBreaker.fire('GET', `/api/v1/inventory/${markCode}`);
    } catch (error) {
      this.logger.error(`Failed to get inventory status: ${markCode}`, error.stack, 'WMS');
      throw error;
    }
  }

  async updateWarehouseLocation(markCode: string, location: string): Promise<void> {
    this.logger.log(`Updating warehouse location: ${markCode} -> ${location}`, 'WMS');

    try {
      await this.circuitBreaker.fire('PUT', `/api/v1/inventory/${markCode}/location`, {
        location,
      });

      await this.rabbitMQService.publishWMSEvent({
        eventType: 'location.updated',
        eventId: `${Date.now()}-${markCode}`,
        data: { markCode, location },
      });
    } catch (error) {
      this.logger.error(`Failed to update location: ${markCode}`, error.stack, 'WMS');
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error('WMS health check failed', error.message, 'WMS');
      return false;
    }
  }
}
