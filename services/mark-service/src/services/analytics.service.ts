import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityMark } from '../entities/quality-mark.entity';
import { MarkStatus } from '../common/enums/mark-status.enum';

/**
 * Analytics Service
 * Provides data for charts and analytics
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(QualityMark)
    private readonly markRepository: Repository<QualityMark>,
  ) {}

  /**
   * Get daily trends for mark generation and validation
   */
  async getTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get daily generation counts
    const generationTrends = await this.markRepository
      .createQueryBuilder('mark')
      .select('DATE(mark.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('mark.created_at >= :startDate', { startDate })
      .groupBy('DATE(mark.created_at)')
      .orderBy('DATE(mark.created_at)', 'ASC')
      .getRawMany();

    // Get daily validation counts
    const validationTrends = await this.markRepository
      .createQueryBuilder('mark')
      .select('DATE(mark.lastValidatedAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('mark.lastValidatedAt >= :startDate', { startDate })
      .andWhere('mark.lastValidatedAt IS NOT NULL')
      .groupBy('DATE(mark.lastValidatedAt)')
      .orderBy('DATE(mark.lastValidatedAt)', 'ASC')
      .getRawMany();

    // Create complete date range
    const trends = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const generated = generationTrends.find(t => t.date === dateStr)?.count || 0;
      const validated = validationTrends.find(t => t.date === dateStr)?.count || 0;

      trends.push({
        date: dateStr,
        generated: parseInt(generated),
        validated: parseInt(validated),
      });
    }

    return trends;
  }

  /**
   * Get distribution of marks by status
   */
  async getStatusDistribution() {
    const distribution = await this.markRepository
      .createQueryBuilder('mark')
      .select('mark.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('mark.status')
      .getRawMany();

    return distribution.map(item => ({
      status: item.status,
      count: parseInt(item.count),
      percentage: 0, // Will be calculated on frontend
    }));
  }

  /**
   * Get validation statistics by day
   */
  async getValidationStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await this.markRepository
      .createQueryBuilder('mark')
      .select('DATE(mark.lastValidatedAt)', 'date')
      .addSelect('COUNT(*)', 'validations')
      .addSelect('COUNT(DISTINCT mark.id)', 'uniqueMarks')
      .where('mark.lastValidatedAt >= :startDate', { startDate })
      .andWhere('mark.lastValidatedAt IS NOT NULL')
      .groupBy('DATE(mark.lastValidatedAt)')
      .orderBy('DATE(mark.lastValidatedAt)', 'ASC')
      .getRawMany();

    // Create complete date range
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const stat = stats.find(s => s.date === dateStr);
      result.push({
        date: dateStr,
        validations: stat ? parseInt(stat.validations) : 0,
        uniqueMarks: stat ? parseInt(stat.uniqueMarks) : 0,
      });
    }

    return result;
  }

  /**
   * Get statistics by supplier
   */
  async getSupplierStats() {
    const stats = await this.markRepository
      .createQueryBuilder('mark')
      .select('mark.supplierId', 'supplierId')
      .addSelect('COUNT(*)', 'totalMarks')
      .addSelect('SUM(CASE WHEN mark.status = :active THEN 1 ELSE 0 END)', 'activeMarks')
      .addSelect('SUM(CASE WHEN mark.status = :blocked THEN 1 ELSE 0 END)', 'blockedMarks')
      .addSelect('AVG(mark.validationCount)', 'avgValidations')
      .where('mark.supplierId IS NOT NULL')
      .setParameter('active', MarkStatus.ACTIVE)
      .setParameter('blocked', MarkStatus.BLOCKED)
      .groupBy('mark.supplierId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    return stats.map(stat => ({
      supplierId: stat.supplierId,
      totalMarks: parseInt(stat.totalMarks),
      activeMarks: parseInt(stat.activeMarks || 0),
      blockedMarks: parseInt(stat.blockedMarks || 0),
      avgValidations: parseFloat(parseFloat(stat.avgValidations || 0).toFixed(2)),
    }));
  }
}

