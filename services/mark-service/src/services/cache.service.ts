import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service
 * Handles Redis caching for hot data with configurable TTL
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Cache key prefixes
  private readonly MARK_PREFIX = 'mark:';
  private readonly VALIDATION_PREFIX = 'validation:';
  private readonly STATS_PREFIX = 'stats:';

  // Default TTL values (in seconds)
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly VALIDATION_TTL = 300; // 5 minutes
  private readonly STATS_TTL = 60; // 1 minute

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Get cached mark by mark code
   * @param markCode - Mark code
   * @returns Promise<any | null> - Cached mark or null
   */
  async getMark(markCode: string): Promise<any | null> {
    try {
      const key = `${this.MARK_PREFIX}${markCode}`;
      const cached = await this.cacheManager.get(key);
      
      if (cached) {
        this.logger.debug(`Cache HIT for mark: ${markCode}`);
      } else {
        this.logger.debug(`Cache MISS for mark: ${markCode}`);
      }
      
      return cached || null;
    } catch (error) {
      this.logger.error(
        `Failed to get mark from cache: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set mark in cache
   * @param markCode - Mark code
   * @param mark - Mark data
   * @param ttl - Time to live in seconds (optional)
   */
  async setMark(markCode: string, mark: any, ttl?: number): Promise<void> {
    try {
      const key = `${this.MARK_PREFIX}${markCode}`;
      await this.cacheManager.set(key, mark, ttl || this.DEFAULT_TTL);
      this.logger.debug(`Cached mark: ${markCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to set mark in cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Delete mark from cache
   * @param markCode - Mark code
   */
  async deleteMark(markCode: string): Promise<void> {
    try {
      const key = `${this.MARK_PREFIX}${markCode}`;
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted mark from cache: ${markCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete mark from cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get cached validation result
   * @param markCode - Mark code
   * @returns Promise<any | null> - Cached validation result or null
   */
  async getValidation(markCode: string): Promise<any | null> {
    try {
      const key = `${this.VALIDATION_PREFIX}${markCode}`;
      const cached = await this.cacheManager.get(key);
      
      if (cached) {
        this.logger.debug(`Cache HIT for validation: ${markCode}`);
      }
      
      return cached || null;
    } catch (error) {
      this.logger.error(
        `Failed to get validation from cache: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set validation result in cache
   * @param markCode - Mark code
   * @param validationResult - Validation result
   */
  async setValidation(markCode: string, validationResult: any): Promise<void> {
    try {
      const key = `${this.VALIDATION_PREFIX}${markCode}`;
      await this.cacheManager.set(key, validationResult, this.VALIDATION_TTL);
      this.logger.debug(`Cached validation result: ${markCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to set validation in cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get statistics from cache
   * @param key - Stats key
   * @returns Promise<any | null> - Cached stats or null
   */
  async getStats(key: string): Promise<any | null> {
    try {
      const cacheKey = `${this.STATS_PREFIX}${key}`;
      return await this.cacheManager.get(cacheKey) || null;
    } catch (error) {
      this.logger.error(
        `Failed to get stats from cache: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Set statistics in cache
   * @param key - Stats key
   * @param stats - Stats data
   */
  async setStats(key: string, stats: any): Promise<void> {
    try {
      const cacheKey = `${this.STATS_PREFIX}${key}`;
      await this.cacheManager.set(cacheKey, stats, this.STATS_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to set stats in cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Invalidate multiple marks by pattern
   * @param pattern - Pattern to match (e.g., 'mark:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In production, you might need to use Redis SCAN command
      this.logger.debug(`Invalidating cache pattern: ${pattern}`);
      // Implementation depends on cache-manager store (Redis)
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache pattern: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error(
        `Failed to clear cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get cache statistics
   * @returns Promise<any> - Cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      // Implementation depends on cache-manager store
      // This is a placeholder that would be implemented based on Redis
      return {
        provider: 'redis',
        status: 'operational',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get cache stats: ${error.message}`,
        error.stack,
      );
      return { status: 'error' };
    }
  }
}

