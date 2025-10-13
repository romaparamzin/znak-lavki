import { Controller, Get, Query, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Analytics Controller
 * Provides analytics data for charts and reports
 */
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get trends data
   * Rate limit: 20 requests per minute
   */
  @Get('trends')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get trends data',
    description: 'Retrieve daily trends for mark generation and validation',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trends data retrieved successfully',
  })
  async getTrends(@Query('days') days?: number) {
    this.logger.log(`Fetching trends for ${days || 30} days`);
    return await this.analyticsService.getTrends(days || 30);
  }

  /**
   * Get status distribution
   * Rate limit: 20 requests per minute
   */
  @Get('status-distribution')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get status distribution',
    description: 'Retrieve distribution of marks by status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status distribution retrieved successfully',
  })
  async getStatusDistribution() {
    this.logger.log('Fetching status distribution');
    return await this.analyticsService.getStatusDistribution();
  }

  /**
   * Get validation stats
   * Rate limit: 20 requests per minute
   */
  @Get('validation-stats')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get validation statistics',
    description: 'Retrieve validation statistics by day',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation stats retrieved successfully',
  })
  async getValidationStats(@Query('days') days?: number) {
    this.logger.log(`Fetching validation stats for ${days || 7} days`);
    return await this.analyticsService.getValidationStats(days || 7);
  }

  /**
   * Get supplier stats
   * Rate limit: 20 requests per minute
   */
  @Get('supplier-stats')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get supplier statistics',
    description: 'Retrieve statistics by supplier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier stats retrieved successfully',
  })
  async getSupplierStats() {
    this.logger.log('Fetching supplier stats');
    return await this.analyticsService.getSupplierStats();
  }
}

