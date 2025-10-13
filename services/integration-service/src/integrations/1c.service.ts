import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as xml2js from 'xml2js';
import {
  OneC_Integration,
  MarkGenerationRequest,
  PrintRequest,
  MarkCodeResponse,
  ProductionBatch,
} from '../interfaces/1c.interface';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { createCircuitBreaker, IntegrationCircuitBreaker } from '../common/circuit-breaker';
import { Retry } from '../common/retry.decorator';
import { RabbitMQService } from '../queue/rabbitmq.service';

@Injectable()
export class OneCService implements OneC_Integration, OnModuleInit {
  private axiosInstance: AxiosInstance;
  private circuitBreaker: IntegrationCircuitBreaker;
  private readonly serviceName = '1c';
  private xmlParser: xml2js.Parser;
  private xmlBuilder: xml2js.Builder;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly metricsService: MetricsService,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    const username = this.configService.get<string>('ONEC_USERNAME') || 'admin';
    const password = this.configService.get<string>('ONEC_PASSWORD') || 'admin';
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('ONEC_BASE_URL') || 'http://localhost:8082',
      timeout: 60000, // 1C может быть медленным
      headers: {
        'Content-Type': 'application/xml',
        Authorization: `Basic ${auth}`,
      },
    });

    this.xmlParser = new xml2js.Parser({ explicitArray: false });
    this.xmlBuilder = new xml2js.Builder();

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
        timeout: 60000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
      },
    );
  }

  private async makeApiCall(
    method: string,
    endpoint: string,
    data?: any,
    format: 'json' | 'xml' = 'json',
  ): Promise<any> {
    const headers =
      format === 'xml'
        ? { 'Content-Type': 'application/xml' }
        : { 'Content-Type': 'application/json' };

    const requestData = format === 'xml' && data ? this.xmlBuilder.buildObject(data) : data;

    const response = await this.axiosInstance.request({
      method,
      url: endpoint,
      data: requestData,
      headers,
    });

    // Parse XML response if needed
    if (format === 'xml' && typeof response.data === 'string') {
      return await this.xmlParser.parseStringPromise(response.data);
    }

    return response.data;
  }

  @Retry({
    maxAttempts: 3,
    delayMs: 2000,
    exponentialBackoff: true,
    maxDelayMs: 15000,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  })
  async requestMarkCodes(request: MarkGenerationRequest): Promise<string[]> {
    this.logger.log(
      `Requesting mark codes: ${request.quantity} for GTIN ${request.productGtin}`,
      '1C',
    );

    try {
      // Publish request to queue for async processing
      await this.rabbitMQService.publishOneCMarkRequest(request);

      // Make synchronous request to 1C
      const xmlRequest = {
        MarkRequest: {
          RequestId: request.requestId,
          ProductGTIN: request.productGtin,
          Quantity: request.quantity,
          ProductionBatchId: request.productionBatchId || '',
          ExpirationDate: request.expirationDate?.toISOString() || '',
          RequestedBy: request.requestedBy,
          Priority: request.priority,
          Timestamp: new Date().toISOString(),
        },
      };

      const response: MarkCodeResponse = await this.circuitBreaker.fire(
        'POST',
        '/api/v1/marks/generate',
        xmlRequest,
        'xml',
      );

      const marks = this.parseMarkResponse(response);

      this.logger.logIntegrationEvent(
        'marks_generated',
        this.serviceName,
        { requestId: request.requestId, count: marks.length },
        'success',
      );

      return marks;
    } catch (error) {
      this.logger.error(`Failed to request mark codes: ${request.requestId}`, error.stack, '1C');
      this.logger.logIntegrationEvent(
        'marks_generated',
        this.serviceName,
        { requestId: request.requestId, error: error.message },
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
  async sendMarksToPrinter(marks: PrintRequest): Promise<void> {
    this.logger.log(`Sending ${marks.marks.length} marks to printer: ${marks.printerQueue}`, '1C');

    try {
      const xmlRequest = {
        PrintRequest: {
          PrintJobId: marks.printJobId,
          PrinterQueue: marks.printerQueue,
          PrintFormat: marks.printFormat,
          Copies: marks.copies,
          Priority: marks.priority,
          Marks: {
            Mark: marks.marks.map((mark) => ({
              MarkCode: mark.markCode,
              GTIN: mark.gtin,
              SerialNumber: mark.serialNumber,
              ExpirationDate: mark.expirationDate?.toISOString() || '',
              BatchNumber: mark.batchNumber || '',
            })),
          },
          Timestamp: new Date().toISOString(),
        },
      };

      await this.circuitBreaker.fire('POST', '/api/v1/printer/print', xmlRequest, 'xml');

      this.logger.logIntegrationEvent(
        'marks_sent_to_printer',
        this.serviceName,
        { printJobId: marks.printJobId, count: marks.marks.length },
        'success',
      );

      // Publish event to queue
      await this.rabbitMQService.publishOneCMarkRequest({
        eventType: 'marks.printed',
        printJobId: marks.printJobId,
        count: marks.marks.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to send marks to printer: ${marks.printJobId}`, error.stack, '1C');
      this.logger.logIntegrationEvent(
        'marks_sent_to_printer',
        this.serviceName,
        { printJobId: marks.printJobId, error: error.message },
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
  async syncProductionBatches(): Promise<void> {
    this.logger.log('Starting production batches sync', '1C');

    const startTime = Date.now();

    try {
      const response = await this.circuitBreaker.fire(
        'GET',
        '/api/v1/production/batches',
        null,
        'xml',
      );

      const batches = this.parseProductionBatchesResponse(response);

      for (const batch of batches) {
        await this.processProductionBatch(batch);
      }

      const duration = Date.now() - startTime;

      this.logger.logIntegrationEvent(
        'production_batches_synced',
        this.serviceName,
        { count: batches.length, duration },
        'success',
      );

      // Publish sync completion event
      await this.rabbitMQService.publishOneCMarkRequest({
        eventType: 'production.batches.synced',
        count: batches.length,
        duration,
        timestamp: new Date(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to sync production batches', error.stack, '1C');
      this.logger.logIntegrationEvent(
        'production_batches_synced',
        this.serviceName,
        { error: error.message, duration },
        'error',
      );
      throw error;
    }
  }

  private parseMarkResponse(response: any): string[] {
    // Parse XML response and extract mark codes
    try {
      if (response.MarkResponse?.Marks?.Mark) {
        const marks = Array.isArray(response.MarkResponse.Marks.Mark)
          ? response.MarkResponse.Marks.Mark
          : [response.MarkResponse.Marks.Mark];
        return marks.map((mark) => mark.MarkCode || mark);
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to parse mark response', error.stack, '1C');
      return [];
    }
  }

  private parseProductionBatchesResponse(response: any): ProductionBatch[] {
    // Parse XML response and extract production batches
    try {
      if (response.ProductionBatches?.Batch) {
        const batches = Array.isArray(response.ProductionBatches.Batch)
          ? response.ProductionBatches.Batch
          : [response.ProductionBatches.Batch];

        return batches.map((batch) => ({
          batchId: batch.BatchId,
          productGtin: batch.ProductGTIN,
          productName: batch.ProductName,
          productionDate: new Date(batch.ProductionDate),
          expirationDate: batch.ExpirationDate ? new Date(batch.ExpirationDate) : undefined,
          quantity: parseInt(batch.Quantity),
          status: batch.Status,
          marks: this.parseMarksArray(batch.Marks),
          qualityCheck: batch.QualityCheck
            ? {
                passed: batch.QualityCheck.Passed === 'true',
                checkedBy: batch.QualityCheck.CheckedBy,
                checkDate: new Date(batch.QualityCheck.CheckDate),
                notes: batch.QualityCheck.Notes,
              }
            : undefined,
        }));
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to parse production batches response', error.stack, '1C');
      return [];
    }
  }

  private parseMarksArray(marks: any): string[] {
    if (!marks || !marks.Mark) return [];
    return Array.isArray(marks.Mark) ? marks.Mark : [marks.Mark];
  }

  private async processProductionBatch(batch: ProductionBatch): Promise<void> {
    // Add your batch processing logic here
    this.logger.debug(`Processing production batch: ${batch.batchId}`, '1C');
  }

  async getDocumentStatus(documentId: string): Promise<any> {
    this.logger.log(`Getting document status: ${documentId}`, '1C');

    try {
      return await this.circuitBreaker.fire(
        'GET',
        `/api/v1/documents/${documentId}/status`,
        null,
        'xml',
      );
    } catch (error) {
      this.logger.error(`Failed to get document status: ${documentId}`, error.stack, '1C');
      throw error;
    }
  }

  async exportDocument(documentId: string, documentType: string): Promise<string> {
    this.logger.log(`Exporting document: ${documentId} (${documentType})`, '1C');

    try {
      const response = await this.circuitBreaker.fire(
        'GET',
        `/api/v1/documents/${documentId}/export?type=${documentType}`,
        null,
        'xml',
      );

      return typeof response === 'string' ? response : this.xmlBuilder.buildObject(response);
    } catch (error) {
      this.logger.error(`Failed to export document: ${documentId}`, error.stack, '1C');
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      this.logger.error('1C health check failed', error.message, '1C');
      return false;
    }
  }
}
