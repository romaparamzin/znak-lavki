import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MarkService } from './mark.service';
import { MarkGeneratorService } from './mark-generator.service';
import { QrCodeService } from './qr-code.service';
import { CacheService } from './cache.service';
import { AuditService } from './audit.service';
import { QualityMark } from '../entities/quality-mark.entity';
import { MarkStatus } from '../common/enums/mark-status.enum';

describe('MarkService', () => {
  let service: MarkService;
  let repository: Repository<QualityMark>;
  let markGeneratorService: MarkGeneratorService;
  let qrCodeService: QrCodeService;
  let cacheService: CacheService;
  let auditService: AuditService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMarkGeneratorService = {
    generateMarkCodesBatch: jest.fn(),
  };

  const mockQrCodeService = {
    generateQrCodesBatch: jest.fn(),
  };

  const mockCacheService = {
    getMark: jest.fn(),
    setMark: jest.fn(),
    deleteMark: jest.fn(),
    getValidation: jest.fn(),
    setValidation: jest.fn(),
  };

  const mockAuditService = {
    logMarkGenerated: jest.fn(),
    logMarkBlocked: jest.fn(),
    logMarkUnblocked: jest.fn(),
    logMarkValidated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkService,
        {
          provide: getRepositoryToken(QualityMark),
          useValue: mockRepository,
        },
        {
          provide: MarkGeneratorService,
          useValue: mockMarkGeneratorService,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<MarkService>(MarkService);
    repository = module.get<Repository<QualityMark>>(
      getRepositoryToken(QualityMark),
    );
    markGeneratorService = module.get<MarkGeneratorService>(MarkGeneratorService);
    qrCodeService = module.get<QrCodeService>(QrCodeService);
    cacheService = module.get<CacheService>(CacheService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMarks', () => {
    it('should generate marks successfully', async () => {
      const dto = {
        gtin: '04607177964089',
        quantity: 10,
        productionDate: '2025-10-10T00:00:00Z',
        expiryDate: '2026-10-10T00:00:00Z',
        generateQrCodes: false,
      };

      const markCodes = Array.from({ length: 10 }, (_, i) =>
        `99LAV0460717796408966LAV${i.toString().padStart(14, '0')}AB`,
      );

      mockMarkGeneratorService.generateMarkCodesBatch.mockResolvedValue(markCodes);
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockResolvedValue(
        markCodes.map((code) => ({ markCode: code })),
      );

      const result = await service.generateMarks(dto);

      expect(result.count).toBe(10);
      expect(result.marks).toHaveLength(10);
      expect(mockMarkGeneratorService.generateMarkCodesBatch).toHaveBeenCalled();
    });

    it('should throw error for invalid dates', async () => {
      const dto = {
        gtin: '04607177964089',
        quantity: 10,
        productionDate: '2026-10-10T00:00:00Z',
        expiryDate: '2025-10-10T00:00:00Z', // Before production date
      };

      await expect(service.generateMarks(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMarkByCode', () => {
    it('should return mark from cache if available', async () => {
      const markCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      const cachedMark = {
        markCode,
        gtin: '04607177964089',
        status: MarkStatus.ACTIVE,
      };

      mockCacheService.getMark.mockResolvedValue(cachedMark);

      const result = await service.getMarkByCode(markCode);

      expect(result).toEqual(cachedMark);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database if not in cache', async () => {
      const markCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      const dbMark = {
        markCode,
        gtin: '04607177964089',
        status: MarkStatus.ACTIVE,
        productionDate: new Date(),
        expiryDate: new Date(),
        validationCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getMark.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(dbMark);

      const result = await service.getMarkByCode(markCode);

      expect(result.markCode).toBe(markCode);
      expect(mockCacheService.setMark).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent mark', async () => {
      const markCode = 'non-existent';

      mockCacheService.getMark.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getMarkByCode(markCode)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('blockMark', () => {
    it('should block mark successfully', async () => {
      const markCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      const dto = {
        reason: 'Product recall',
        blockedBy: 'admin',
      };

      const mark = {
        markCode,
        status: MarkStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mark);
      mockRepository.save.mockResolvedValue({
        ...mark,
        status: MarkStatus.BLOCKED,
      });

      const result = await service.blockMark(markCode, dto, 'admin');

      expect(result.status).toBe(MarkStatus.BLOCKED);
      expect(mockCacheService.deleteMark).toHaveBeenCalledWith(markCode);
      expect(mockAuditService.logMarkBlocked).toHaveBeenCalled();
    });

    it('should throw error if mark already blocked', async () => {
      const markCode = '99LAV0460717796408966LAV1234567890ABCDEF';
      const dto = {
        reason: 'Product recall',
      };

      mockRepository.findOne.mockResolvedValue({
        markCode,
        status: MarkStatus.BLOCKED,
      });

      await expect(service.blockMark(markCode, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateMark', () => {
    it('should validate active mark successfully', async () => {
      const dto = {
        markCode: '99LAV0460717796408966LAV1234567890ABCDEF',
      };

      const mark = {
        markCode: dto.markCode,
        status: MarkStatus.ACTIVE,
        expiryDate: new Date(Date.now() + 86400000), // Tomorrow
        validationCount: 0,
        save: jest.fn(),
      };

      mockCacheService.getValidation.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mark);
      mockRepository.save.mockResolvedValue({
        ...mark,
        validationCount: 1,
      });

      const result = await service.validateMark(dto);

      expect(result.isValid).toBe(true);
      expect(mockCacheService.setValidation).toHaveBeenCalled();
    });

    it('should return invalid for blocked mark', async () => {
      const dto = {
        markCode: '99LAV0460717796408966LAV1234567890ABCDEF',
      };

      const mark = {
        markCode: dto.markCode,
        status: MarkStatus.BLOCKED,
        blockedReason: 'Product recall',
        validationCount: 0,
      };

      mockCacheService.getValidation.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mark);
      mockRepository.save.mockResolvedValue(mark);

      const result = await service.validateMark(dto);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('blocked');
    });

    it('should return invalid for expired mark', async () => {
      const dto = {
        markCode: '99LAV0460717796408966LAV1234567890ABCDEF',
      };

      const mark = {
        markCode: dto.markCode,
        status: MarkStatus.ACTIVE,
        expiryDate: new Date(Date.now() - 86400000), // Yesterday
        validationCount: 0,
      };

      mockCacheService.getValidation.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mark);
      mockRepository.save.mockResolvedValue(mark);

      const result = await service.validateMark(dto);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('expired');
    });
  });
});

