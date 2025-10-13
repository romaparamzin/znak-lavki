import { Controller, Get, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { DashboardService } from '../services/dashboard.service';

/**
 * Dashboard Metrics Response DTO
 */
export class DashboardMetricsDto {
  totalMarks: number;
  activeMarks: number;
  blockedMarks: number;
  expiredMarks: number;
  usedMarks: number;
  todayGenerated: number;
  todayValidated: number;
  generatedTrend?: number;
  validatedTrend?: number;
}

/**
 * Dashboard Controller
 * Provides aggregated metrics for admin panel
 */
@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard metrics
   * Rate limit: 30 requests per minute
   */
  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve aggregated statistics for the admin dashboard',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  async getMetrics(): Promise<DashboardMetricsDto> {
    this.logger.log('Fetching dashboard metrics');
    return await this.dashboardService.getMetrics();
  }

  /**
   * Get recent activity
   * Rate limit: 30 requests per minute
   */
  @Get('recent-activity')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get recent activity',
    description: 'Retrieve recent mark operations and validations',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent activity retrieved successfully',
  })
  async getRecentActivity() {
    this.logger.log('Fetching recent activity');
    return await this.dashboardService.getRecentActivity();
  }
}
