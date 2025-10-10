import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarkGeneratorService } from './mark-generator.service';
import { QualityMark } from '../entities/quality-mark.entity';

describe('MarkGeneratorService', () => {
  let service: MarkGeneratorService;
  let repository: Repository<QualityMark>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkGeneratorService,
        {
          provide: getRepositoryToken(QualityMark),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MarkGeneratorService>(MarkGeneratorService);
    repository = module.get<Repository<QualityMark>>(
      getRepositoryToken(QualityMark),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMarkCode', () => {
    it('should generate a valid mark code', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const gtin = '04607177964089';
      const markCode = await service.generateMarkCode(gtin);

      expect(markCode).toMatch(/^99LAV04607177964089 66LAV[A-Z0-9]{16}$/);
    });

    it('should handle collision and regenerate', async () => {
      mockRepository.findOne
        .mockResolvedValueOnce({ markCode: 'collision' })
        .mockResolvedValueOnce(null);

      const gtin = '04607177964089';
      const markCode = await service.generateMarkCode(gtin);

      expect(markCode).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateMarkCodesBatch', () => {
    it('should generate multiple unique mark codes', async () => {
      mockRepository.find.mockResolvedValue([]);

      const gtin = '04607177964089';
      const quantity = 10;
      const markCodes = await service.generateMarkCodesBatch(gtin, quantity);

      expect(markCodes).toHaveLength(quantity);
      expect(new Set(markCodes).size).toBe(quantity); // All unique
    });

    it('should generate large batch efficiently', async () => {
      mockRepository.find.mockResolvedValue([]);

      const gtin = '04607177964089';
      const quantity = 1000;
      const startTime = Date.now();
      const markCodes = await service.generateMarkCodesBatch(gtin, quantity);
      const elapsed = Date.now() - startTime;

      expect(markCodes).toHaveLength(quantity);
      expect(elapsed).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });

  describe('validateMarkCodeFormat', () => {
    it('should validate correct format', () => {
      const validCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      expect(service.validateMarkCodeFormat(validCode)).toBe(true);
    });

    it('should reject invalid format', () => {
      const invalidCode = 'invalid-mark-code';
      expect(service.validateMarkCodeFormat(invalidCode)).toBe(false);
    });
  });

  describe('extractGtin', () => {
    it('should extract GTIN from mark code', () => {
      const markCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      const gtin = service.extractGtin(markCode);

      expect(gtin).toBe('04607177964089');
    });

    it('should return null for invalid mark code', () => {
      const invalidCode = 'invalid';
      const gtin = service.extractGtin(invalidCode);

      expect(gtin).toBeNull();
    });
  });
});

