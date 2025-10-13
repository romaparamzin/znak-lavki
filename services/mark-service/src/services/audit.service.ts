import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog, AuditAction } from '../entities/audit-log.entity';

/**
 * Audit Service
 * Handles audit logging for all mark operations
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an audit event
   * @param params - Audit log parameters
   */
  async log(params: {
    markCode?: string;
    action: AuditAction;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    previousState?: any;
    newState?: any;
    metadata?: any;
    reason?: string;
  }): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        markCode: params.markCode,
        action: params.action,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        previousState: params.previousState,
        newState: params.newState,
        metadata: params.metadata,
        reason: params.reason,
      });

      await this.auditRepository.save(auditLog);

      this.logger.debug(`Audit log created: ${params.action} for mark ${params.markCode || 'N/A'}`);
    } catch (error) {
      // Audit logging failures should not break the main operation
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Log mark generation
   */
  async logMarkGenerated(markCodes: string[], userId?: string, metadata?: any): Promise<void> {
    // Log in batch for performance
    const auditLogs = markCodes.map((markCode) =>
      this.auditRepository.create({
        markCode,
        action: AuditAction.MARK_GENERATED,
        userId,
        metadata,
      }),
    );

    try {
      // Use batch insert for better performance
      await this.auditRepository.insert(auditLogs);
      this.logger.debug(`Logged generation of ${markCodes.length} marks`);
    } catch (error) {
      this.logger.error(`Failed to log mark generation: ${error.message}`, error.stack);
    }
  }

  /**
   * Log mark block operation
   */
  async logMarkBlocked(
    markCode: string,
    reason: string,
    userId?: string,
    ipAddress?: string,
    previousState?: any,
    newState?: any,
  ): Promise<void> {
    await this.log({
      markCode,
      action: AuditAction.MARK_BLOCKED,
      userId,
      ipAddress,
      reason,
      previousState,
      newState,
    });
  }

  /**
   * Log mark unblock operation
   */
  async logMarkUnblocked(
    markCode: string,
    reason: string,
    userId?: string,
    ipAddress?: string,
    previousState?: any,
    newState?: any,
  ): Promise<void> {
    await this.log({
      markCode,
      action: AuditAction.MARK_UNBLOCKED,
      userId,
      ipAddress,
      reason,
      previousState,
      newState,
    });
  }

  /**
   * Log mark validation
   */
  async logMarkValidated(
    markCode: string,
    userId?: string,
    ipAddress?: string,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      markCode,
      action: AuditAction.MARK_VALIDATED,
      userId,
      ipAddress,
      metadata,
    });
  }

  /**
   * Log bulk block operation
   */
  async logBulkBlock(
    markCodes: string[],
    reason: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.BULK_BLOCK,
      userId,
      ipAddress,
      reason,
      metadata: {
        markCodes,
        count: markCodes.length,
      },
    });
  }

  /**
   * Log bulk unblock operation
   */
  async logBulkUnblock(
    markCodes: string[],
    reason: string,
    userId?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      action: AuditAction.BULK_UNBLOCK,
      userId,
      ipAddress,
      reason,
      metadata: {
        markCodes,
        count: markCodes.length,
      },
    });
  }

  /**
   * Get audit logs for a specific mark
   * @param markCode - Mark code
   * @param limit - Maximum number of logs to retrieve
   * @returns Promise<AuditLog[]>
   */
  async getMarkAuditLogs(markCode: string, limit: number = 50): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { markCode },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs by action type
   * @param action - Audit action
   * @param limit - Maximum number of logs to retrieve
   * @returns Promise<AuditLog[]>
   */
  async getAuditLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs by user
   * @param userId - User ID
   * @param limit - Maximum number of logs to retrieve
   * @returns Promise<AuditLog[]>
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get audit logs with pagination and filters
   */
  async getAuditLogs(filters: {
    page?: number;
    limit?: number;
    markCode?: string;
    action?: AuditAction;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (filters.markCode) {
      queryBuilder.andWhere('audit.markCode = :markCode', { markCode: filters.markCode });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }
}
