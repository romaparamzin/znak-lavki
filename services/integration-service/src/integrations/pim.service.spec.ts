import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import nock from 'nock';
import { PIMService } from './pim.service';
import { CustomLoggerService } from '../common/logger.service';
import { MetricsService } from '../common/metrics.service';
import { RabbitMQService } from '../queue/rabbitmq.service';

describe('PIMService', () => {
  let service: PIMService;
  let mockLogger: Partial<CustomLoggerService>;
  let mockMetrics: Partial<MetricsService>;
  let mockRabbitMQ: Partial<RabbitMQService>;

  const PIM_BASE_URL = 'http://localhost:8081';

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logApiCall: jest.fn(),
      logIntegrationEvent: jest.fn(),
    };

    mockMetrics = {
      recordRequest: jest.fn(),
      updateCircuitBreakerStatus: jest.fn(),
      updateHealthStatus: jest.fn(),
    };

    mockRabbitMQ = {
      publishPIMSync: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PIMService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PIM_BASE_URL') return PIM_BASE_URL;
              if (key === 'PIM_API_TOKEN') return 'test-token';
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

    service = module.get<PIMService>(PIMService);
    service.onModuleInit();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getProductByGTIN', () => {
    it('should successfully get product by GTIN', async () => {
      const gtin = '04600123456789';
      const mockProduct = {
        gtin,
        name: 'Test Product',
        category: 'Food',
        attributes: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      nock(PIM_BASE_URL).get(`/api/v1/products/${gtin}`).reply(200, mockProduct);

      const result = await service.getProductByGTIN(gtin);

      expect(result).toEqual(mockProduct);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('updateProductAttribute', () => {
    it('should successfully update product attributes', async () => {
      const gtin = '04600123456789';
      const attributes = { weight: 500 };

      nock(PIM_BASE_URL).patch(`/api/v1/products/${gtin}/attributes`).reply(200, { success: true });

      await service.updateProductAttribute(gtin, attributes);

      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockRabbitMQ.publishPIMSync).toHaveBeenCalled();
    });
  });

  describe('syncProductCatalog', () => {
    it('should successfully sync product catalog', async () => {
      const mockResponse = {
        products: [
          { gtin: '1234567890123', name: 'Product 1' },
          { gtin: '9876543210987', name: 'Product 2' },
        ],
        hasMore: false,
      };

      nock(PIM_BASE_URL).get('/api/v1/products?page=1&pageSize=100').reply(200, mockResponse);

      await service.syncProductCatalog();

      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockRabbitMQ.publishPIMSync).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      nock(PIM_BASE_URL).get('/health').reply(200);

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });
  });
});
