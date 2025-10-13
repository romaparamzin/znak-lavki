import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QualityMark } from '../entities/quality-mark.entity';
import { MarkStatus } from '../common/enums/mark-status.enum';
import { MarkGeneratorService } from './mark-generator.service';
import { QrCodeService } from './qr-code.service';
import { CacheService } from './cache.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../entities/audit-log.entity';
import {
  GenerateMarkDto,
  BlockMarkDto,
  UnblockMarkDto,
  BulkBlockDto,
  BulkUnblockDto,
  ValidateMarkDto,
  MarkFilterDto,
  ExpiringMarksDto,
} from '../dto';
import {
  MarkResponseDto,
  GenerateMarkResponseDto,
  PaginatedMarkResponseDto,
  ValidateMarkResponseDto,
  BulkOperationResponseDto,
} from '../dto/mark-response.dto';

/**
 * Mark Service
 * Main service orchestrating all mark operations
 */
@Injectable()
export class MarkService {
  private readonly logger = new Logger(MarkService.name);

  constructor(
    @InjectRepository(QualityMark)
    private readonly markRepository: Repository<QualityMark>,
    private readonly markGeneratorService: MarkGeneratorService,
    private readonly qrCodeService: QrCodeService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generate quality marks
   * @param dto - Generation parameters
   * @param userId - User performing the operation
   * @returns Promise<GenerateMarkResponseDto>
   */
  async generateMarks(dto: GenerateMarkDto, userId?: string): Promise<GenerateMarkResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Generating ${dto.quantity} marks for GTIN: ${dto.gtin}`);

    try {
      // Validate dates
      const productionDate = new Date(dto.productionDate);
      const expiryDate = new Date(dto.expiryDate);

      if (expiryDate <= productionDate) {
        throw new BadRequestException('Expiry date must be after production date');
      }

      // Generate unique mark codes
      const markCodes = await this.markGeneratorService.generateMarkCodesBatch(
        dto.gtin,
        dto.quantity,
      );

      // Create mark entities
      const marks = markCodes.map((markCode) =>
        this.markRepository.create({
          markCode,
          gtin: dto.gtin,
          status: MarkStatus.ACTIVE,
          productionDate,
          expiryDate,
          supplierId: dto.supplierId,
          manufacturerId: dto.manufacturerId,
          orderId: dto.orderId,
          metadata: dto.metadata,
        }),
      );

      // Save marks in batch
      const savedMarks = await this.markRepository.save(marks);

      // Generate QR codes if requested
      let qrCodes: string[] | undefined;
      if (dto.generateQrCodes) {
        qrCodes = await this.qrCodeService.generateQrCodesBatch(
          markCodes,
          true, // Embed logo
        );
      }

      // Audit logging (batch)
      await this.auditService.logMarkGenerated(markCodes, userId, {
        gtin: dto.gtin,
        quantity: dto.quantity,
        supplierId: dto.supplierId,
        manufacturerId: dto.manufacturerId,
        orderId: dto.orderId,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(`Successfully generated ${savedMarks.length} marks in ${processingTime}ms`);

      return {
        marks: savedMarks.map((mark) => this.toResponseDto(mark)),
        count: savedMarks.length,
        qrCodes,
        processingTimeMs: processingTime,
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate marks: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get mark by ID
   * @param id - Mark ID
   * @returns Promise<MarkResponseDto>
   */
  async getMarkById(id: string): Promise<MarkResponseDto> {
    const mark = await this.markRepository.findOne({ where: { id } });

    if (!mark) {
      throw new NotFoundException(`Mark with ID ${id} not found`);
    }

    return this.toResponseDto(mark);
  }

  /**
   * Get mark by mark code
   * @param markCode - Mark code
   * @param useCache - Whether to use cache
   * @returns Promise<MarkResponseDto>
   */
  async getMarkByCode(markCode: string, useCache: boolean = true): Promise<MarkResponseDto> {
    // Try cache first
    if (useCache) {
      const cached = await this.cacheService.getMark(markCode);
      if (cached) {
        return cached;
      }
    }

    const mark = await this.markRepository.findOne({ where: { markCode } });

    if (!mark) {
      throw new NotFoundException(`Mark with code ${markCode} not found`);
    }

    const response = this.toResponseDto(mark);

    // Cache the result
    if (useCache) {
      await this.cacheService.setMark(mark);
    }

    return response;
  }

  /**
   * Get marks with filters and pagination
   * @param filterDto - Filter parameters
   * @returns Promise<PaginatedMarkResponseDto>
   */
  async getMarks(filterDto: MarkFilterDto): Promise<PaginatedMarkResponseDto> {
    const {
      page = 1,
      limit = 20,
      status,
      gtin,
      supplierId,
      manufacturerId,
      orderId,
      createdFrom,
      createdTo,
      expiryFrom,
      expiryTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const queryBuilder = this.markRepository.createQueryBuilder('mark');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('mark.status = :status', { status });
    }

    if (gtin) {
      queryBuilder.andWhere('mark.gtin = :gtin', { gtin });
    }

    if (supplierId) {
      queryBuilder.andWhere('mark.supplierId = :supplierId', { supplierId });
    }

    if (manufacturerId) {
      queryBuilder.andWhere('mark.manufacturerId = :manufacturerId', {
        manufacturerId,
      });
    }

    if (orderId) {
      queryBuilder.andWhere('mark.orderId = :orderId', { orderId });
    }

    if (createdFrom && createdTo) {
      queryBuilder.andWhere('mark.createdAt BETWEEN :createdFrom AND :createdTo', {
        createdFrom,
        createdTo,
      });
    } else if (createdFrom) {
      queryBuilder.andWhere('mark.createdAt >= :createdFrom', { createdFrom });
    } else if (createdTo) {
      queryBuilder.andWhere('mark.createdAt <= :createdTo', { createdTo });
    }

    if (expiryFrom && expiryTo) {
      queryBuilder.andWhere('mark.expiryDate BETWEEN :expiryFrom AND :expiryTo', {
        expiryFrom,
        expiryTo,
      });
    } else if (expiryFrom) {
      queryBuilder.andWhere('mark.expiryDate >= :expiryFrom', { expiryFrom });
    } else if (expiryTo) {
      queryBuilder.andWhere('mark.expiryDate <= :expiryTo', { expiryTo });
    }

    if (search) {
      queryBuilder.andWhere('mark.markCode LIKE :search', {
        search: `%${search}%`,
      });
    }

    // Sorting
    queryBuilder.orderBy(`mark.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [marks, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: marks.map((mark) => this.toResponseDto(mark)),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Block a mark
   * @param markCode - Mark code
   * @param dto - Block parameters
   * @param userId - User performing the operation
   * @param ipAddress - IP address
   * @returns Promise<MarkResponseDto>
   */
  async blockMark(
    markCode: string,
    dto: BlockMarkDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<MarkResponseDto> {
    const mark = await this.markRepository.findOne({ where: { markCode } });

    if (!mark) {
      throw new NotFoundException(`Mark with code ${markCode} not found`);
    }

    if (mark.status === MarkStatus.BLOCKED) {
      throw new BadRequestException('Mark is already blocked');
    }

    const previousState = { ...mark };

    // Update mark
    mark.status = MarkStatus.BLOCKED;
    mark.blockedReason = dto.reason;
    mark.blockedBy = dto.blockedBy || userId;
    mark.blockedAt = new Date();

    const updatedMark = await this.markRepository.save(mark);

    // Invalidate cache
    await this.cacheService.deleteMark(markCode);

    // Audit log
    await this.auditService.logMarkBlocked(
      markCode,
      dto.reason,
      userId,
      ipAddress,
      previousState,
      updatedMark,
    );

    this.logger.log(`Mark blocked: ${markCode}`);

    return this.toResponseDto(updatedMark);
  }

  /**
   * Unblock a mark
   * @param markCode - Mark code
   * @param dto - Unblock parameters
   * @param userId - User performing the operation
   * @param ipAddress - IP address
   * @returns Promise<MarkResponseDto>
   */
  async unblockMark(
    markCode: string,
    dto: UnblockMarkDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<MarkResponseDto> {
    const mark = await this.markRepository.findOne({ where: { markCode } });

    if (!mark) {
      throw new NotFoundException(`Mark with code ${markCode} not found`);
    }

    if (mark.status !== MarkStatus.BLOCKED) {
      throw new BadRequestException('Mark is not blocked');
    }

    const previousState = { ...mark };

    // Update mark
    mark.status = MarkStatus.ACTIVE;
    mark.blockedReason = null;
    mark.blockedBy = null;
    mark.blockedAt = null;

    const updatedMark = await this.markRepository.save(mark);

    // Invalidate cache
    await this.cacheService.deleteMark(markCode);

    // Audit log
    await this.auditService.logMarkUnblocked(
      markCode,
      dto.reason || 'Unblocked',
      userId,
      ipAddress,
      previousState,
      updatedMark,
    );

    this.logger.log(`Mark unblocked: ${markCode}`);

    return this.toResponseDto(updatedMark);
  }

  /**
   * Bulk block marks
   * @param dto - Bulk block parameters
   * @param userId - User performing the operation
   * @param ipAddress - IP address
   * @returns Promise<BulkOperationResponseDto>
   */
  async bulkBlockMarks(
    dto: BulkBlockDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<BulkOperationResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Bulk blocking ${dto.markCodes.length} marks`);

    const successfulMarkCodes: string[] = [];
    const failures: Array<{ markCode: string; reason: string }> = [];

    // Process in batches for better performance
    const BATCH_SIZE = 100;
    for (let i = 0; i < dto.markCodes.length; i += BATCH_SIZE) {
      const batch = dto.markCodes.slice(i, i + BATCH_SIZE);

      const marks = await this.markRepository.find({
        where: { markCode: In(batch) },
      });

      const foundCodes = new Set(marks.map((m) => m.markCode));

      // Find not found marks
      batch.forEach((code) => {
        if (!foundCodes.has(code)) {
          failures.push({ markCode: code, reason: 'Mark not found' });
        }
      });

      // Update found marks
      marks.forEach((mark) => {
        if (mark.status === MarkStatus.BLOCKED) {
          failures.push({
            markCode: mark.markCode,
            reason: 'Already blocked',
          });
        } else {
          mark.status = MarkStatus.BLOCKED;
          mark.blockedReason = dto.reason;
          mark.blockedBy = dto.blockedBy || userId;
          mark.blockedAt = new Date();
          successfulMarkCodes.push(mark.markCode);
        }
      });

      // Save batch
      if (marks.length > 0) {
        await this.markRepository.save(marks);

        // Invalidate cache for all updated marks
        for (const mark of marks) {
          await this.cacheService.deleteMark(mark.markCode);
        }
      }
    }

    // Audit log
    await this.auditService.logBulkBlock(successfulMarkCodes, dto.reason, userId, ipAddress);

    const processingTime = Date.now() - startTime;

    this.logger.log(
      `Bulk block completed: ${successfulMarkCodes.length} successful, ${failures.length} failed in ${processingTime}ms`,
    );

    return {
      successCount: successfulMarkCodes.length,
      failureCount: failures.length,
      successfulMarkCodes,
      failures,
      processingTimeMs: processingTime,
    };
  }

  /**
   * Bulk unblock marks
   * @param dto - Bulk unblock parameters
   * @param userId - User performing the operation
   * @param ipAddress - IP address
   * @returns Promise<BulkOperationResponseDto>
   */
  async bulkUnblockMarks(
    dto: BulkUnblockDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<BulkOperationResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Bulk unblocking ${dto.markCodes.length} marks`);

    const successfulMarkCodes: string[] = [];
    const failures: Array<{ markCode: string; reason: string }> = [];

    // Process in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < dto.markCodes.length; i += BATCH_SIZE) {
      const batch = dto.markCodes.slice(i, i + BATCH_SIZE);

      const marks = await this.markRepository.find({
        where: { markCode: In(batch) },
      });

      const foundCodes = new Set(marks.map((m) => m.markCode));

      // Find not found marks
      batch.forEach((code) => {
        if (!foundCodes.has(code)) {
          failures.push({ markCode: code, reason: 'Mark not found' });
        }
      });

      // Update found marks
      marks.forEach((mark) => {
        if (mark.status !== MarkStatus.BLOCKED) {
          failures.push({
            markCode: mark.markCode,
            reason: 'Not blocked',
          });
        } else {
          mark.status = MarkStatus.ACTIVE;
          mark.blockedReason = null;
          mark.blockedBy = null;
          mark.blockedAt = null;
          successfulMarkCodes.push(mark.markCode);
        }
      });

      // Save batch
      if (marks.length > 0) {
        await this.markRepository.save(marks);

        // Invalidate cache
        for (const mark of marks) {
          await this.cacheService.deleteMark(mark.markCode);
        }
      }
    }

    // Audit log
    await this.auditService.logBulkUnblock(
      successfulMarkCodes,
      dto.reason || 'Bulk unblocked',
      userId,
      ipAddress,
    );

    const processingTime = Date.now() - startTime;

    this.logger.log(
      `Bulk unblock completed: ${successfulMarkCodes.length} successful, ${failures.length} failed in ${processingTime}ms`,
    );

    return {
      successCount: successfulMarkCodes.length,
      failureCount: failures.length,
      successfulMarkCodes,
      failures,
      processingTimeMs: processingTime,
    };
  }

  /**
   * Get expiring marks
   * @param dto - Expiring marks parameters
   * @returns Promise<PaginatedMarkResponseDto>
   */
  async getExpiringMarks(dto: ExpiringMarksDto): Promise<PaginatedMarkResponseDto> {
    const { daysBeforeExpiry = 30, page = 1, limit = 20 } = dto;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);

    const skip = (page - 1) * limit;

    const [marks, total] = await this.markRepository.findAndCount({
      where: {
        expiryDate: Between(now, futureDate),
        status: In([MarkStatus.ACTIVE, MarkStatus.BLOCKED]),
      },
      order: { expiryDate: 'ASC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: marks.map((mark) => this.toResponseDto(mark)),
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Validate mark for WMS
   * @param dto - Validation parameters
   * @param userId - User performing validation
   * @param ipAddress - IP address
   * @returns Promise<ValidateMarkResponseDto>
   */
  async validateMark(
    dto: ValidateMarkDto,
    userId?: string,
    ipAddress?: string,
  ): Promise<ValidateMarkResponseDto> {
    const { markCode, location } = dto;

    // Check cache first
    const cached = await this.cacheService.getValidation(markCode);
    if (cached) {
      this.logger.debug(`Validation cache hit for: ${markCode}`);
      return cached;
    }

    const mark = await this.markRepository.findOne({ where: { markCode } });

    if (!mark) {
      const response: ValidateMarkResponseDto = {
        isValid: false,
        mark: null,
        reason: 'Mark not found',
        validatedAt: new Date(),
      };

      await this.cacheService.setValidation(markCode, response);
      return response;
    }

    // Determine validity
    let isValid = true;
    let reason: string | undefined;

    if (mark.status === MarkStatus.BLOCKED) {
      isValid = false;
      reason = `Mark is blocked: ${mark.blockedReason}`;
    } else if (mark.status === MarkStatus.EXPIRED) {
      isValid = false;
      reason = 'Mark has expired';
    } else if (mark.status === MarkStatus.USED) {
      isValid = false;
      reason = 'Mark has already been used';
    } else if (mark.expiryDate < new Date()) {
      isValid = false;
      reason = 'Product has expired';
    }

    // Update validation stats
    mark.validationCount += 1;
    mark.lastValidatedAt = new Date();
    await this.markRepository.save(mark);

    // Audit log
    await this.auditService.logMarkValidated(markCode, userId || dto.userId, ipAddress, {
      location,
      isValid,
      reason,
    });

    const response: ValidateMarkResponseDto = {
      isValid,
      mark: this.toResponseDto(mark),
      reason,
      validatedAt: new Date(),
    };

    // Cache the validation result
    await this.cacheService.setValidation(markCode, response);

    return response;
  }

  /**
   * Auto-expiry job - runs daily
   * Marks expired marks as EXPIRED status
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredMarks(): Promise<void> {
    this.logger.log('Running auto-expiry job...');

    try {
      const now = new Date();

      // Find all active/blocked marks that have expired
      const expiredMarks = await this.markRepository.find({
        where: {
          expiryDate: LessThanOrEqual(now),
          status: In([MarkStatus.ACTIVE, MarkStatus.BLOCKED]),
        },
      });

      if (expiredMarks.length === 0) {
        this.logger.log('No expired marks found');
        return;
      }

      // Update status to expired
      expiredMarks.forEach((mark) => {
        mark.status = MarkStatus.EXPIRED;
      });

      await this.markRepository.save(expiredMarks);

      // Invalidate cache for all expired marks
      for (const mark of expiredMarks) {
        await this.cacheService.deleteMark(mark.markCode);
      }

      this.logger.log(`Auto-expiry job completed: ${expiredMarks.length} marks marked as expired`);
    } catch (error: any) {
      this.logger.error(`Auto-expiry job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Convert entity to response DTO
   * @param mark - Quality mark entity
   * @returns MarkResponseDto
   */
  private toResponseDto(mark: QualityMark): MarkResponseDto {
    return {
      id: mark.id,
      markCode: mark.markCode,
      gtin: mark.gtin,
      status: mark.status,
      productionDate: mark.productionDate,
      expiryDate: mark.expiryDate,
      supplierId: mark.supplierId,
      manufacturerId: mark.manufacturerId,
      orderId: mark.orderId,
      blockedReason: mark.blockedReason,
      blockedBy: mark.blockedBy,
      blockedAt: mark.blockedAt,
      validationCount: mark.validationCount,
      lastValidatedAt: mark.lastValidatedAt,
      metadata: mark.metadata,
      createdAt: mark.createdAt,
      updatedAt: mark.updatedAt,
    };
  }
}
