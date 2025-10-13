/**
 * Redis Cache Service
 * Implements caching strategy for hot marks and frequently accessed data
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QualityMark } from '../entities/quality-mark.entity';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  // ============================================
  // CACHE KEY PATTERNS
  // ============================================
  private readonly KEYS = {
    MARK: (markCode: string) => `mark:${markCode}`,
    MARK_LIST: (filters: string) => `marks:list:${filters}`,
    DASHBOARD_METRICS: 'dashboard:metrics',
    ANALYTICS_TRENDS: (days: number) => `analytics:trends:${days}`,
    STATUS_DISTRIBUTION: 'analytics:status-distribution',
    HOT_MARKS: 'hot:marks', // Sorted set of frequently accessed marks
    MARK_VALIDATION_COUNT: (markCode: string) => `mark:validation:${markCode}`,
  };

  // ============================================
  // CACHE TTL (Time To Live)
  // ============================================
  private readonly TTL = {
    MARK: 3600, // 1 hour (hot marks)
    MARK_LIST: 300, // 5 minutes
    DASHBOARD: 60, // 1 minute
    ANALYTICS: 1800, // 30 minutes
    HOT_MARKS: 86400, // 24 hours
  };

  // ============================================
  // MARK CACHING
  // ============================================

  /**
   * Get mark from cache
   */
  async getMark(markCode: string): Promise<QualityMark | null> {
    try {
      const cached = await this.cacheManager.get<QualityMark>(this.KEYS.MARK(markCode));

      if (cached) {
        this.logger.debug(`Cache HIT: mark ${markCode}`);
        // Track as hot mark
        await this.incrementHotMark(markCode);
      } else {
        this.logger.debug(`Cache MISS: mark ${markCode}`);
      }

      return cached || null;
    } catch (error) {
      this.logger.error(`Cache get error for mark ${markCode}:`, error);
      return null;
    }
  }

  /**
   * Set mark in cache
   */
  async setMark(mark: QualityMark): Promise<void> {
    try {
      await this.cacheManager.set(this.KEYS.MARK(mark.markCode), mark, this.TTL.MARK);
      this.logger.debug(`Cached mark: ${mark.markCode}`);
    } catch (error) {
      this.logger.error(`Cache set error for mark ${mark.markCode}:`, error);
    }
  }

  /**
   * Invalidate mark cache
   */
  async invalidateMark(markCode: string): Promise<void> {
    try {
      await this.cacheManager.del(this.KEYS.MARK(markCode));
      this.logger.debug(`Invalidated cache for mark: ${markCode}`);
    } catch (error) {
      this.logger.error(`Cache delete error for mark ${markCode}:`, error);
    }
  }

  /**
   * Delete mark from cache (alias for invalidateMark)
   */
  async deleteMark(markCode: string): Promise<void> {
    return this.invalidateMark(markCode);
  }

  /**
   * Get validation result from cache
   */
  async getValidation(markCode: string): Promise<any | null> {
    try {
      const key = `validation:${markCode}`;
      const cached = await this.cacheManager.get(key);
      if (cached) {
        this.logger.debug(`Cache HIT: validation ${markCode}`);
      }
      return cached || null;
    } catch (error) {
      this.logger.error(`Cache get validation error for mark ${markCode}:`, error);
      return null;
    }
  }

  /**
   * Set validation result in cache
   */
  async setValidation(markCode: string, data: any): Promise<void> {
    try {
      const key = `validation:${markCode}`;
      await this.cacheManager.set(key, data, 3600); // 1 hour TTL
      this.logger.debug(`Cached validation: ${markCode}`);
    } catch (error) {
      this.logger.error(`Cache set validation error for mark ${markCode}:`, error);
    }
  }

  /**
   * Batch invalidate marks
   */
  async invalidateMarks(markCodes: string[]): Promise<void> {
    try {
      const keys = markCodes.map((code) => this.KEYS.MARK(code));
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
      this.logger.debug(`Invalidated cache for ${markCodes.length} marks`);
    } catch (error) {
      this.logger.error('Batch cache delete error:', error);
    }
  }

  // ============================================
  // HOT MARKS TRACKING
  // ============================================

  /**
   * Increment hot mark counter
   */
  async incrementHotMark(markCode: string): Promise<void> {
    try {
      const key = this.KEYS.MARK_VALIDATION_COUNT(markCode);
      const count = (await this.cacheManager.get<number>(key)) || 0;
      await this.cacheManager.set(key, count + 1, this.TTL.HOT_MARKS);

      // If mark is accessed frequently, keep it in cache longer
      if (count > 10) {
        const mark = await this.getMark(markCode);
        if (mark) {
          await this.setMark(mark); // Refresh TTL
        }
      }
    } catch (error) {
      this.logger.error(`Error tracking hot mark ${markCode}:`, error);
    }
  }

  /**
   * Get hot marks list
   */
  async getHotMarks(limit: number = 100): Promise<string[]> {
    try {
      // This would require Redis sorted sets
      // For now, return empty array
      return [];
    } catch (error) {
      this.logger.error('Error getting hot marks:', error);
      return [];
    }
  }

  // ============================================
  // DASHBOARD CACHING
  // ============================================

  /**
   * Cache dashboard metrics
   */
  async setDashboardMetrics(metrics: any): Promise<void> {
    try {
      await this.cacheManager.set(this.KEYS.DASHBOARD_METRICS, metrics, this.TTL.DASHBOARD);
      this.logger.debug('Cached dashboard metrics');
    } catch (error) {
      this.logger.error('Error caching dashboard metrics:', error);
    }
  }

  /**
   * Get cached dashboard metrics
   */
  async getDashboardMetrics(): Promise<any | null> {
    try {
      return await this.cacheManager.get(this.KEYS.DASHBOARD_METRICS);
    } catch (error) {
      this.logger.error('Error getting cached dashboard metrics:', error);
      return null;
    }
  }

  // ============================================
  // ANALYTICS CACHING
  // ============================================

  /**
   * Cache analytics trends
   */
  async setAnalyticsTrends(days: number, trends: any): Promise<void> {
    try {
      await this.cacheManager.set(this.KEYS.ANALYTICS_TRENDS(days), trends, this.TTL.ANALYTICS);
      this.logger.debug(`Cached analytics trends for ${days} days`);
    } catch (error) {
      this.logger.error('Error caching analytics trends:', error);
    }
  }

  /**
   * Get cached analytics trends
   */
  async getAnalyticsTrends(days: number): Promise<any | null> {
    try {
      return await this.cacheManager.get(this.KEYS.ANALYTICS_TRENDS(days));
    } catch (error) {
      this.logger.error('Error getting cached analytics trends:', error);
      return null;
    }
  }

  /**
   * Cache status distribution
   */
  async setStatusDistribution(distribution: any): Promise<void> {
    try {
      await this.cacheManager.set(this.KEYS.STATUS_DISTRIBUTION, distribution, this.TTL.ANALYTICS);
      this.logger.debug('Cached status distribution');
    } catch (error) {
      this.logger.error('Error caching status distribution:', error);
    }
  }

  /**
   * Get cached status distribution
   */
  async getStatusDistribution(): Promise<any | null> {
    try {
      return await this.cacheManager.get(this.KEYS.STATUS_DISTRIBUTION);
    } catch (error) {
      this.logger.error('Error getting cached status distribution:', error);
      return null;
    }
  }

  // ============================================
  // CACHE INVALIDATION
  // ============================================

  /**
   * Invalidate all dashboard caches
   */
  async invalidateDashboard(): Promise<void> {
    try {
      await Promise.all([
        this.cacheManager.del(this.KEYS.DASHBOARD_METRICS),
        this.cacheManager.del(this.KEYS.STATUS_DISTRIBUTION),
      ]);
      this.logger.debug('Invalidated dashboard caches');
    } catch (error) {
      this.logger.error('Error invalidating dashboard caches:', error);
    }
  }

  /**
   * Invalidate all analytics caches
   */
  async invalidateAnalytics(): Promise<void> {
    try {
      const days = [7, 14, 30, 90];
      await Promise.all([
        ...days.map((d) => this.cacheManager.del(this.KEYS.ANALYTICS_TRENDS(d))),
        this.cacheManager.del(this.KEYS.STATUS_DISTRIBUTION),
      ]);
      this.logger.debug('Invalidated analytics caches');
    } catch (error) {
      this.logger.error('Error invalidating analytics caches:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.warn('Cleared all caches');
    } catch (error) {
      this.logger.error('Error clearing all caches:', error);
    }
  }

  // ============================================
  // CACHE WARMING
  // ============================================

  /**
   * Warm up cache with hot marks
   * Call this on application startup or periodically
   */
  async warmUpCache(marks: QualityMark[]): Promise<void> {
    try {
      this.logger.log(`Warming up cache with ${marks.length} marks...`);

      await Promise.all(marks.map((mark) => this.setMark(mark)));

      this.logger.log('Cache warm-up completed');
    } catch (error) {
      this.logger.error('Error warming up cache:', error);
    }
  }

  // ============================================
  // CACHE STATISTICS
  // ============================================

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      // This would require Redis INFO command
      // For now, return basic info
      return {
        status: 'operational',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { status: 'error', error: error.message };
    }
  }
}
