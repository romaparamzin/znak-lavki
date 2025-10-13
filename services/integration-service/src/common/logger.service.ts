import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'integration-service' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  logIntegrationEvent(event: string, source: string, data: any, status: 'success' | 'error') {
    this.logger.info('Integration Event', {
      event,
      source,
      data,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  logApiCall(method: string, url: string, statusCode: number, duration: number, error?: string) {
    const logData = {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      error,
    };

    if (statusCode >= 500) {
      this.logger.error('API Call Failed', logData);
    } else if (statusCode >= 400) {
      this.logger.warn('API Call Warning', logData);
    } else {
      this.logger.info('API Call Success', logData);
    }
  }

  logCircuitBreakerEvent(service: string, event: 'open' | 'close' | 'half-open', details?: any) {
    this.logger.warn('Circuit Breaker Event', {
      service,
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  logRetryAttempt(operation: string, attempt: number, maxAttempts: number, error?: string) {
    this.logger.warn('Retry Attempt', {
      operation,
      attempt,
      maxAttempts,
      error,
    });
  }
}
