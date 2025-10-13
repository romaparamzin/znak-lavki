import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { IsOptional, IsInt, IsString, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditService } from '../services/audit.service';
import { AuditAction } from '../entities/audit-log.entity';

/**
 * Audit Log Filter DTO
 */
export class AuditLogFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  markCode?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * Audit Controller
 * Provides access to audit logs
 */
@ApiTags('Audit')
@Controller('audit')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs with filters
   * Rate limit: 30 requests per minute
   */
  @Get('logs')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve paginated audit logs with optional filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'markCode', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
  })
  async getAuditLogs(@Query() filters: AuditLogFilterDto) {
    this.logger.log(`Fetching audit logs with filters: ${JSON.stringify(filters)}`);
    
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);

    const result = await this.auditService.getAuditLogs({
      page,
      limit,
      markCode: filters.markCode,
      action: filters.action,
      userId: filters.userId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    return result;
  }

  /**
   * Export audit logs
   * Rate limit: 5 requests per minute
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Export audit logs',
    description: 'Export audit logs as CSV',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs exported successfully',
  })
  async exportAuditLogs(@Query() filters: AuditLogFilterDto) {
    this.logger.log(`Exporting audit logs with filters: ${JSON.stringify(filters)}`);
    // TODO: Implement export functionality
    return { message: 'Export functionality coming soon' };
  }
}

