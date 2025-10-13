import { CustomLoggerService } from './logger.service';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff: boolean;
  maxDelayMs?: number;
  retryableErrors?: string[];
}

export function Retry(options: RetryOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger: CustomLoggerService = this.logger;
      let lastError: any;

      for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error;

          // Check if error is retryable
          if (options.retryableErrors) {
            const isRetryable = options.retryableErrors.some((errType) =>
              error.message?.includes(errType),
            );
            if (!isRetryable) {
              throw error;
            }
          }

          if (attempt === options.maxAttempts) {
            if (logger) {
              logger.logRetryAttempt(propertyKey, attempt, options.maxAttempts, error.message);
            }
            throw error;
          }

          // Calculate delay with exponential backoff
          let delay = options.delayMs;
          if (options.exponentialBackoff) {
            delay = Math.min(
              options.delayMs * Math.pow(2, attempt - 1),
              options.maxDelayMs || 60000,
            );
          }

          if (logger) {
            logger.logRetryAttempt(propertyKey, attempt, options.maxAttempts, error.message);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  logger?: CustomLoggerService,
  operationName?: string,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (options.retryableErrors) {
        const isRetryable = options.retryableErrors.some((errType) =>
          error.message?.includes(errType),
        );
        if (!isRetryable) {
          throw error;
        }
      }

      if (attempt === options.maxAttempts) {
        if (logger && operationName) {
          logger.logRetryAttempt(operationName, attempt, options.maxAttempts, error.message);
        }
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = options.delayMs;
      if (options.exponentialBackoff) {
        delay = Math.min(options.delayMs * Math.pow(2, attempt - 1), options.maxDelayMs || 60000);
      }

      if (logger && operationName) {
        logger.logRetryAttempt(operationName, attempt, options.maxAttempts, error.message);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
