import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import { createCircuitBreaker, IntegrationCircuitBreaker } from '../common/circuit-breaker';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { Retry } from '../common/retry.decorator';
import { PIMIntegration, Product, ProductSyncResult } from '../interfaces/pim.interface';
import { RabbitMQService } from '../queue/rabbitmq.service';

@Injectable()
export class PIMService implements PIMIntegration, OnModuleInit {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: IntegrationCircuitBreaker;
  private readonly serviceName = 'pim';

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly metricsService: MetricsService,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('PIM_BASE_URL') || 'http://localhost:8081',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.configService.get<string>('PIM_API_TOKEN') || ''}`,
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
  async getProductByGTIN(gtin: string): Promise<Product> {
    this.logger.log(`Getting product by GTIN: ${gtin}`, 'PIM');

    try {
      const product = await this.circuitBreaker.fire('GET', `/api/v1/products/${gtin}`);

      this.logger.logIntegrationEvent('product_fetched', this.serviceName, { gtin }, 'success');

      return product;
    } catch (error) {
      this.logger.error(`Failed to get product: ${gtin}`, error.stack, 'PIM');
      this.logger.logIntegrationEvent(
        'product_fetched',
        this.serviceName,
        { gtin, error: error.message },
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
  async updateProductAttribute(gtin: string, attributes: any): Promise<void> {
    this.logger.log(`Updating product attributes: ${gtin}`, 'PIM');

    try {
      await this.circuitBreaker.fire('PATCH', `/api/v1/products/${gtin}/attributes`, {
        attributes,
        updatedAt: new Date().toISOString(),
      });

      this.logger.logIntegrationEvent(
        'product_updated',
        this.serviceName,
        { gtin, attributes },
        'success',
      );

      // Publish sync event to queue
      await this.rabbitMQService.publishPIMSync({
        eventType: 'product.updated',
        gtin,
        attributes,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to update product: ${gtin}`, error.stack, 'PIM');
      this.logger.logIntegrationEvent(
        'product_updated',
        this.serviceName,
        { gtin, attributes, error: error.message },
        'error',
      );
      throw error;
    }
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 5000,
    exponentialBackoff: true,
    maxDelayMs: 30000,
  })
  async syncProductCatalog(): Promise<void> {
    this.logger.log('Starting product catalog sync', 'PIM');

    const startTime = Date.now();
    const syncResult: ProductSyncResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Get all products with pagination
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.circuitBreaker.fire(
          'GET',
          `/api/v1/products?page=${page}&pageSize=${pageSize}`,
        );

        const products = response.products || [];
        syncResult.totalProcessed += products.length;

        for (const product of products) {
          try {
            await this.processProductSync(product);
            syncResult.successful++;
          } catch (error) {
            syncResult.failed++;
            syncResult.errors.push({
              gtin: product.gtin,
              error: error.message,
              timestamp: new Date(),
            });
          }
        }

        hasMore = response.hasMore;
        page++;

        // Publish progress to queue
        await this.rabbitMQService.publishPIMSync({
          eventType: 'catalog.sync.progress',
          page,
          totalProcessed: syncResult.totalProcessed,
          successful: syncResult.successful,
          failed: syncResult.failed,
        });
      }

      syncResult.duration = Date.now() - startTime;

      this.logger.logIntegrationEvent('catalog_synced', this.serviceName, syncResult, 'success');

      // Publish completion event
      await this.rabbitMQService.publishPIMSync({
        eventType: 'catalog.sync.completed',
        result: syncResult,
        timestamp: new Date(),
      });
    } catch (error) {
      syncResult.duration = Date.now() - startTime;
      this.logger.error('Failed to sync product catalog', error.stack, 'PIM');
      this.logger.logIntegrationEvent(
        'catalog_synced',
        this.serviceName,
        { ...syncResult, error: error.message },
        'error',
      );
      throw error;
    }
  }

  private async processProductSync(product: Product): Promise<void> {
    // Add your product sync logic here
    // This could include:
    // - Transforming data
    // - Validating product data
    // - Updating local database
    // - Triggering related processes

    this.logger.debug(`Processing product sync for GTIN: ${product.gtin}`, 'PIM');
  }

  async searchProducts(query: string, filters?: any): Promise<Product[]> {
    this.logger.log(`Searching products: ${query}`, 'PIM');

    try {
      const response = await this.circuitBreaker.fire('POST', '/api/v1/products/search', {
        query,
        filters,
      });

      return response.products || [];
    } catch (error) {
      this.logger.error('Failed to search products', error.stack, 'PIM');
      throw error;
    }
  }

  async getProductCategories(): Promise<any[]> {
    this.logger.log('Getting product categories', 'PIM');

    try {
      const response = await this.circuitBreaker.fire('GET', '/api/v1/categories');
      return response.categories || [];
    } catch (error) {
      this.logger.error('Failed to get categories', error.stack, 'PIM');
      throw error;
    }
  }

  async bulkUpdateProducts(updates: Array<{ gtin: string; attributes: any }>): Promise<void> {
    this.logger.log(`Bulk updating ${updates.length} products`, 'PIM');

    try {
      await this.circuitBreaker.fire('POST', '/api/v1/products/bulk-update', {
        updates,
      });

      // Publish bulk update event
      await this.rabbitMQService.publishPIMSync({
        eventType: 'products.bulk.updated',
        count: updates.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to bulk update products', error.stack, 'PIM');
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error('PIM health check failed', error.message, 'PIM');
      return false;
    }
  }
}
