import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * Dashboard Service
 * Provides aggregated metrics for admin dashboard
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(QualityMark)
    private readonly markRepository: Repository<QualityMark>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Get dashboard metrics
   */
  async getMetrics() {
    const startTime = Date.now();

    try {
      // Get counts by status in parallel
      const [
        totalMarks,
        activeMarks,
        blockedMarks,
        expiredMarks,
        usedMarks,
        todayGenerated,
        todayValidated,
        yesterdayGenerated,
        yesterdayValidated,
      ] = await Promise.all([
        this.markRepository.count(),
        this.markRepository.count({ where: { status: MarkStatus.ACTIVE } }),
        this.markRepository.count({ where: { status: MarkStatus.BLOCKED } }),
        this.markRepository.count({ where: { status: MarkStatus.EXPIRED } }),
        this.markRepository.count({ where: { status: MarkStatus.USED } }),
        this.getTodayGenerated(),
        this.getTodayValidated(),
        this.getYesterdayGenerated(),
        this.getYesterdayValidated(),
      ]);

      // Calculate trends (percentage change from yesterday)
      const generatedTrend = this.calculateTrend(todayGenerated, yesterdayGenerated);
      const validatedTrend = this.calculateTrend(todayValidated, yesterdayValidated);

      const duration = Date.now() - startTime;
      this.logger.log(`Dashboard metrics calculated in ${duration}ms`);

      return {
        totalMarks,
        activeMarks,
        blockedMarks,
        expiredMarks,
        usedMarks,
        todayGenerated,
        todayValidated,
        generatedTrend,
        validatedTrend,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics', error);
      throw error;
    }
  }

  /**
   * Get recent activity (last 50 audit logs)
   */
  async getRecentActivity() {
    try {
      const logs = await this.auditRepository.find({
        order: { createdAt: 'DESC' },
        take: 50,
      });

      return {
        activities: logs,
        count: logs.length,
      };
    } catch (error) {
      this.logger.error('Failed to get recent activity', error);
      throw error;
    }
  }

  /**
   * Get marks generated today
   */
  private async getTodayGenerated(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.markRepository
      .createQueryBuilder('mark')
      .where('mark.createdAt >= :today', { today })
      .getCount();
  }

  /**
   * Get marks validated today
   */
  private async getTodayValidated(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.markRepository
      .createQueryBuilder('mark')
      .where('mark.lastValidatedAt >= :today', { today })
      .getCount();
  }

  /**
   * Get marks generated yesterday
   */
  private async getYesterdayGenerated(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.markRepository
      .createQueryBuilder('mark')
      .where('mark.createdAt >= :yesterday', { yesterday })
      .andWhere('mark.createdAt < :today', { today })
      .getCount();
  }

  /**
   * Get marks validated yesterday
   */
  private async getYesterdayValidated(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.markRepository
      .createQueryBuilder('mark')
      .where('mark.lastValidatedAt >= :yesterday', { yesterday })
      .andWhere('mark.lastValidatedAt < :today', { today })
      .getCount();
  }

  /**
   * Calculate percentage trend
   */
  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  }
}
