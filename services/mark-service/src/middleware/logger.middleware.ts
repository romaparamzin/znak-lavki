import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithCorrelation extends Request {
  correlationId?: string;
  startTime?: number;
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Structured Logging Middleware
 * Adds correlation IDs, tracks request/response, and provides audit trail
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithCorrelation, res: Response, next: NextFunction) {
    // Generate or extract correlation ID
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      uuidv4();

    req.correlationId = correlationId;
    req.startTime = Date.now();

    // Set correlation ID in response headers
    res.setHeader('X-Correlation-ID', correlationId);

    // Log incoming request
    this.logRequest(req);

    // Capture response
    const originalSend = res.send;
    let responseBody: any;

    res.send = function (body: any): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Log response when finished
    res.on('finish', () => {
      this.logResponse(req, res, responseBody);
    });

    next();
  }

  /**
   * Log incoming request with structured format
   */
  private logRequest(req: RequestWithCorrelation): void {
    const logData = {
      type: 'request',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      headers: this.sanitizeHeaders(req.headers),
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      user: req.user
        ? {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          }
        : undefined,
    };

    this.logger.log(JSON.stringify(logData));
  }

  /**
   * Log outgoing response with structured format
   */
  private logResponse(req: RequestWithCorrelation, res: Response, responseBody: any): void {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const statusCode = res.statusCode;
    const isError = statusCode >= 400;

    const logData = {
      type: 'response',
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration,
      contentLength: res.get('content-length'),
      user: req.user
        ? {
            id: req.user.id,
            action: `${req.method} ${req.path}`,
          }
        : undefined,
      // Include error details if status is error
      error: isError ? this.extractErrorInfo(responseBody) : undefined,
    };

    if (isError) {
      this.logger.error(JSON.stringify(logData));
    } else {
      this.logger.log(JSON.stringify(logData));
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Extract error information from response body
   */
  private extractErrorInfo(responseBody: any): any {
    try {
      const body = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;

      return {
        message: body?.message || 'Unknown error',
        error: body?.error,
        statusCode: body?.statusCode,
        stack: body?.stack,
      };
    } catch {
      return {
        message: 'Error parsing response body',
      };
    }
  }
}

/**
 * User Action Audit Logger
 * Logs critical user actions for audit trail
 */
@Injectable()
export class AuditLogger {
  private readonly logger = new Logger('AUDIT');

  /**
   * Log user action with full context
   */
  logAction(
    action: string,
    userId: string,
    correlationId: string,
    details?: Record<string, any>,
    result?: 'success' | 'failure',
    error?: Error,
  ): void {
    const auditLog = {
      type: 'audit',
      timestamp: new Date().toISOString(),
      correlationId,
      action,
      userId,
      result: result || 'success',
      details: details || {},
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    if (result === 'failure') {
      this.logger.error(JSON.stringify(auditLog));
    } else {
      this.logger.log(JSON.stringify(auditLog));
    }
  }

  /**
   * Log mark generation action
   */
  logMarkGeneration(
    userId: string,
    correlationId: string,
    count: number,
    supplier: string,
    result: 'success' | 'failure',
    error?: Error,
  ): void {
    this.logAction('mark_generation', userId, correlationId, { count, supplier }, result, error);
  }

  /**
   * Log mark validation action
   */
  logMarkValidation(
    userId: string,
    correlationId: string,
    markId: string,
    isValid: boolean,
    reason?: string,
  ): void {
    this.logAction(
      'mark_validation',
      userId,
      correlationId,
      { markId, isValid, reason },
      isValid ? 'success' : 'failure',
    );
  }

  /**
   * Log mark blocking action
   */
  logMarkBlocking(
    userId: string,
    correlationId: string,
    markIds: string[],
    reason: string,
    result: 'success' | 'failure',
    error?: Error,
  ): void {
    this.logAction(
      'mark_blocking',
      userId,
      correlationId,
      { markIds, reason, count: markIds.length },
      result,
      error,
    );
  }

  /**
   * Log data export action
   */
  logDataExport(
    userId: string,
    correlationId: string,
    format: string,
    recordCount: number,
    filters?: Record<string, any>,
  ): void {
    this.logAction(
      'data_export',
      userId,
      correlationId,
      { format, recordCount, filters },
      'success',
    );
  }

  /**
   * Log authentication event
   */
  logAuthentication(
    userId: string,
    correlationId: string,
    method: string,
    result: 'success' | 'failure',
    ip?: string,
    userAgent?: string,
  ): void {
    this.logAction('authentication', userId, correlationId, { method, ip, userAgent }, result);
  }

  /**
   * Log permission denial
   */
  logPermissionDenial(
    userId: string,
    correlationId: string,
    resource: string,
    action: string,
    reason?: string,
  ): void {
    this.logAction(
      'permission_denied',
      userId,
      correlationId,
      { resource, action, reason },
      'failure',
    );
  }
}
