/**
 * HTTP Cache Interceptor
 * Automatically caches API responses based on decorators and headers
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { Reflector } from '@nestjs/core';

// Custom decorator for cache configuration
export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

export const CacheKey = (key: string) => 
  Reflect.metadata(CACHE_KEY_METADATA, key);

export const CacheTTL = (ttl: number) => 
  Reflect.metadata(CACHE_TTL_METADATA, ttl);

/**
 * HTTP Cache Interceptor
 * 
 * Usage:
 * @UseInterceptors(HttpCacheInterceptor)
 * @CacheKey('analytics:trends')
 * @CacheTTL(1800)
 * async getTrends() { ... }
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache configuration from decorators
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      handler,
    );

    // Skip caching if no cache key defined
    if (!cacheKey) {
      return next.handle();
    }

    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      handler,
    ) || 300; // Default 5 minutes

    // Build full cache key including query params
    const fullCacheKey = this.buildCacheKey(cacheKey, request);

    // Check cache-control headers
    const cacheControl = request.headers['cache-control'];
    const bypassCache = cacheControl === 'no-cache' || 
                       cacheControl === 'no-store' ||
                       request.query.nocache === 'true';

    if (bypassCache) {
      this.logger.debug(`Bypassing cache for: ${fullCacheKey}`);
      return next.handle();
    }

    // Try to get from cache
    try {
      const cachedResponse = await this.cacheService['cacheManager'].get(
        fullCacheKey,
      );

      if (cachedResponse) {
        this.logger.debug(`Cache HIT: ${fullCacheKey}`);
        
        // Add cache headers to response
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-Cache', 'HIT');
        response.setHeader('X-Cache-Key', fullCacheKey);
        
        return of(cachedResponse);
      }

      this.logger.debug(`Cache MISS: ${fullCacheKey}`);
    } catch (error) {
      this.logger.error(`Cache read error: ${error.message}`);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheService['cacheManager'].set(
            fullCacheKey,
            data,
            cacheTTL,
          );

          this.logger.debug(
            `Cached response: ${fullCacheKey} (TTL: ${cacheTTL}s)`,
          );

          // Add cache headers
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Cache', 'MISS');
          response.setHeader('X-Cache-Key', fullCacheKey);
          response.setHeader('Cache-Control', `max-age=${cacheTTL}`);
        } catch (error) {
          this.logger.error(`Cache write error: ${error.message}`);
        }
      }),
    );
  }

  /**
   * Build cache key including query parameters
   */
  private buildCacheKey(baseKey: string, request: any): string {
    const query = request.query || {};
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${query[key]}`)
      .join('&');

    return queryString ? `${baseKey}:${queryString}` : baseKey;
  }
}

/**
 * Conditional Cache Interceptor
 * Only caches if certain conditions are met
 */
@Injectable()
export class ConditionalCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConditionalCacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Don't cache authenticated user-specific data
    if (request.headers.authorization) {
      return next.handle();
    }

    // Don't cache if client explicitly requests fresh data
    if (request.headers['if-none-match'] || request.headers['if-modified-since']) {
      return next.handle();
    }

    return next.handle();
  }
}

/**
 * Cache Invalidation Interceptor
 * Invalidates cache on write operations
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only invalidate on write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          // Invalidate relevant caches based on route
          const url = request.url;

          if (url.includes('/marks')) {
            await this.cacheService.invalidateDashboard();
            await this.cacheService.invalidateAnalytics();
            this.logger.debug('Invalidated marks-related caches');
          }

          if (url.includes('/dashboard') || url.includes('/analytics')) {
            await this.cacheService.invalidateDashboard();
            await this.cacheService.invalidateAnalytics();
            this.logger.debug('Invalidated dashboard/analytics caches');
          }
        } catch (error) {
          this.logger.error(`Cache invalidation error: ${error.message}`);
        }
      }),
    );
  }
}

