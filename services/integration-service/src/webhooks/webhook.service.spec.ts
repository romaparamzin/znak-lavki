import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { CustomLoggerService } from '../common/logger.service';
import { RabbitMQService } from '../queue/rabbitmq.service';
import { IntegrationEventEntity } from '../entities/integration-event.entity';

describe('WebhookService', () => {
  let service: WebhookService;
  let mockLogger: Partial<CustomLoggerService>;
  let mockRabbitMQ: Partial<RabbitMQService>;
  let mockRepository: any;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockRabbitMQ = {
      publishWMSEvent: jest.fn().mockResolvedValue(true),
      publishPIMSync: jest.fn().mockResolvedValue(true),
      publishOneCMarkRequest: jest.fn().mockResolvedValue(true),
      publishNotification: jest.fn().mockResolvedValue(true),
    };

    mockRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WMS_WEBHOOK_SECRET') return 'wms-secret';
              if (key === 'PIM_WEBHOOK_SECRET') return 'pim-secret';
              if (key === 'ONEC_WEBHOOK_SECRET') return '1c-secret';
              return null;
            }),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: mockLogger,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQ,
        },
        {
          provide: getRepositoryToken(IntegrationEventEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = { eventType: 'test', data: 'test-data' };
      const signature = service['generateSignature'](payload, 'wms-secret');

      const result = service.verifySignature(payload, signature, 'wms');

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = { eventType: 'test', data: 'test-data' };
      const invalidSignature = 'invalid-signature-123';

      const result = service.verifySignature(payload, invalidSignature, 'wms');

      expect(result).toBe(false);
    });
  });

  describe('processWMSWebhook', () => {
    it('should process WMS webhook successfully', async () => {
      const payload = {
        eventType: 'inventory.updated',
        eventId: 'evt-123',
        source: 'wms' as const,
        data: { markCode: '123456' },
        timestamp: new Date(),
      };

      await service.processWMSWebhook(payload);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRabbitMQ.publishWMSEvent).toHaveBeenCalledWith(payload);
    });
  });

  describe('processPIMWebhook', () => {
    it('should process PIM webhook successfully', async () => {
      const payload = {
        eventType: 'product.updated',
        eventId: 'evt-456',
        source: 'pim' as const,
        data: { gtin: '04600123456789' },
        timestamp: new Date(),
      };

      await service.processPIMWebhook(payload);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRabbitMQ.publishPIMSync).toHaveBeenCalledWith(payload);
    });
  });

  describe('processOneCWebhook', () => {
    it('should process 1C webhook successfully', async () => {
      const payload = {
        eventType: 'marks.generated',
        eventId: 'evt-789',
        source: '1c' as const,
        data: { requestId: 'req-123', marks: [] },
        timestamp: new Date(),
      };

      await service.processOneCWebhook(payload);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRabbitMQ.publishOneCMarkRequest).toHaveBeenCalledWith(payload);
    });
  });
});
