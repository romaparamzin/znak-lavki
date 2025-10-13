import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import nock from 'nock';
import { WMSService } from './wms.service';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { RabbitMQService } from '../queue/rabbitmq.service';

describe('WMSService', () => {
  let service: WMSService;
  let mockLogger: Partial<CustomLoggerService>;
  let mockMetrics: Partial<MetricsService>;
  let mockRabbitMQ: Partial<RabbitMQService>;

  const WMS_BASE_URL = 'http://localhost:8080';

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logApiCall: jest.fn(),
      logIntegrationEvent: jest.fn(),
      logRetryAttempt: jest.fn(),
    };

    mockMetrics = {
      recordRequest: jest.fn(),
      updateCircuitBreakerStatus: jest.fn(),
      updateHealthStatus: jest.fn(),
    };

    mockRabbitMQ = {
      publishWMSEvent: jest.fn().mockResolvedValue(true),
      publishNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WMSService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WMS_BASE_URL') return WMS_BASE_URL;
              if (key === 'WMS_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
        {
          provide: MetricsService,
          useValue: mockMetrics,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQ,
        },
      ],
    }).compile();

    service = module.get<WMSService>(WMSService);
    service.onModuleInit();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('validateMarkOnScan', () => {
    it('should successfully validate a mark code', async () => {
      const markCode = '0104600123456789012110ABC123';
      const mockResponse = {
        isValid: true,
        markCode,
        status: 'valid',
        productInfo: {
          gtin: '04600123456789',
          name: 'Test Product',
        },
      };

      nock(WMS_BASE_URL).post('/api/v1/marks/validate', { markCode }).reply(200, mockResponse);

      const result = await service.validateMarkOnScan(markCode);

      expect(result).toEqual(mockResponse);
      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockRabbitMQ.publishWMSEvent).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const markCode = 'invalid-mark';

      nock(WMS_BASE_URL)
        .post('/api/v1/marks/validate')
        .reply(400, { error: 'Invalid mark code format' });

      await expect(service.validateMarkOnScan(markCode)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('blockItemInWarehouse', () => {
    it('should successfully block an item', async () => {
      const markCode = '0104600123456789012110ABC123';
      const reason = 'Quality control failed';

      nock(WMS_BASE_URL).post('/api/v1/inventory/block').reply(200, { success: true });

      await service.blockItemInWarehouse(markCode, reason);

      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockRabbitMQ.publishWMSEvent).toHaveBeenCalled();
    });
  });

  describe('getOrderDetails', () => {
    it('should successfully get order details', async () => {
      const orderId = 'ORDER-123';
      const mockOrder = {
        orderId,
        customerId: 'CUST-456',
        orderDate: new Date(),
        status: 'pending',
        items: [],
        totalAmount: 1000,
      };

      nock(WMS_BASE_URL).get(`/api/v1/orders/${orderId}`).reply(200, mockOrder);

      const result = await service.getOrderDetails(orderId);

      expect(result).toEqual(mockOrder);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      nock(WMS_BASE_URL).get('/health').reply(200);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      nock(WMS_BASE_URL).get('/health').reply(503);

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
