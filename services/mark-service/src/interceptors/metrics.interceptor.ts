import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

/**
 * Metrics Interceptor
 * Collects metrics for all API endpoints
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, route } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const endpoint = route?.path || url;

          // Record metrics
          this.metricsService.recordRequest(method, endpoint, 'success', duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const endpoint = route?.path || url;
          const statusCode = error.status || 500;

          // Record error metrics
          this.metricsService.recordRequest(
            method,
            endpoint,
            'error',
            duration,
            statusCode,
          );

          this.logger.error(
            `Request failed: ${method} ${endpoint} - ${error.message}`,
          );
        },
      }),
    );
  }
}

