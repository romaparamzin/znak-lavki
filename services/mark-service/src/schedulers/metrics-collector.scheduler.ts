import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityMark } from '../entities/quality-mark.entity';
import { MetricsService } from '../services/metrics.service';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * Metrics Collector Scheduler
 * Periodically collects and updates business metrics
 */
@Injectable()
export class MetricsCollectorScheduler {
  private readonly logger = new Logger(MetricsCollectorScheduler.name);

  constructor(
    @InjectRepository(QualityMark)
    private readonly markRepository: Repository<QualityMark>,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Update active marks count every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateActiveMarksCount(): Promise<void> {
    try {
      this.logger.debug('Updating active marks count...');

      // Count active marks overall
      const activeCount = await this.markRepository.count({
        where: { status: MarkStatus.ACTIVE },
      });
      this.metricsService.updateActiveMarksCount(activeCount);

      // Count by status
      const statuses = [MarkStatus.ACTIVE, MarkStatus.BLOCKED, MarkStatus.USED, MarkStatus.EXPIRED];

      for (const status of statuses) {
        const count = await this.markRepository.count({ where: { status } });
        this.metricsService.updateActiveMarksCount(count, 'all', status);
      }

      this.logger.debug(`Active marks count updated: ${activeCount}`);
    } catch (error) {
      this.logger.error('Failed to update active marks count', error.stack);
    }
  }

  /**
   * Update expired marks count every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateExpiredMarksCount(): Promise<void> {
    try {
      this.logger.debug('Updating expired marks count...');

      const expiredCount = await this.markRepository.count({
        where: { status: MarkStatus.EXPIRED },
      });

      this.metricsService.updateExpiredMarksCount(expiredCount);

      this.logger.debug(`Expired marks count updated: ${expiredCount}`);
    } catch (error) {
      this.logger.error('Failed to update expired marks count', error.stack);
    }
  }

  /**
   * Calculate and update IDR (Invalid Data Rate) every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateIDRRate(): Promise<void> {
    try {
      this.logger.debug('Calculating IDR rate...');

      // Get validation counts from the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Count total validations (this would come from validation logs in production)
      // For now, we'll use a simplified calculation based on mark statuses
      const totalMarks = await this.markRepository.count();
      const blockedMarks = await this.markRepository.count({
        where: { status: MarkStatus.BLOCKED },
      });

      // Calculate IDR as ratio of blocked to total
      const idrRate = totalMarks > 0 ? blockedMarks / totalMarks : 0;

      this.metricsService.updateIDRRate(blockedMarks, totalMarks, 'all', '5m');

      // Group by GTIN for per-supplier IDR
      const gtinGroups = await this.markRepository
        .createQueryBuilder('mark')
        .select('mark.gtin')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN mark.status = :blocked THEN 1 ELSE 0 END)', 'blocked')
        .setParameter('blocked', MarkStatus.BLOCKED)
        .groupBy('mark.gtin')
        .getRawMany();

      for (const group of gtinGroups) {
        const total = parseInt(group.total, 10);
        const blocked = parseInt(group.blocked, 10);
        const supplierIDR = total > 0 ? blocked / total : 0;

        this.metricsService.updateIDRRate(blocked, total, group.gtin, '5m');
      }

      this.logger.debug(`IDR rate updated: ${(idrRate * 100).toFixed(2)}%`);
    } catch (error) {
      this.logger.error('Failed to update IDR rate', error.stack);
    }
  }

  /**
   * Update system coverage percentage every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateSystemCoverage(): Promise<void> {
    try {
      this.logger.debug('Calculating system coverage...');

      // Count unique suppliers (GTINs)
      const uniqueSuppliers = await this.markRepository
        .createQueryBuilder('mark')
        .select('COUNT(DISTINCT mark.gtin)', 'count')
        .getRawOne();

      const supplierCount = parseInt(uniqueSuppliers.count, 10);

      // In production, this would be compared against a known total
      // For now, we'll use a placeholder calculation
      const totalPossibleSuppliers = 100; // This should come from configuration
      const supplierCoverage =
        totalPossibleSuppliers > 0 ? (supplierCount / totalPossibleSuppliers) * 100 : 0;

      this.metricsService.updateSystemCoverage(supplierCoverage, 'suppliers');

      // Count total marks as product coverage
      const totalMarks = await this.markRepository.count();
      const productCoverage = Math.min((totalMarks / 10000) * 100, 100); // Normalize to 100%

      this.metricsService.updateSystemCoverage(productCoverage, 'products');

      this.logger.debug(
        `System coverage updated - Suppliers: ${supplierCoverage.toFixed(2)}%, Products: ${productCoverage.toFixed(2)}%`,
      );
    } catch (error) {
      this.logger.error('Failed to update system coverage', error.stack);
    }
  }

  /**
   * Update cache metrics every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updateCacheMetrics(): Promise<void> {
    try {
      // This is a placeholder - actual cache metrics would be collected
      // from Redis or the cache service
      this.logger.debug('Cache metrics collected via interceptors');
    } catch (error) {
      this.logger.error('Failed to update cache metrics', error.stack);
    }
  }

  /**
   * Health check - runs every minute to ensure scheduler is working
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async healthCheck(): Promise<void> {
    this.logger.debug('Metrics collector scheduler is running');
  }
}
