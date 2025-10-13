import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';

/**
 * Metrics Controller
 * Exposes Prometheus metrics endpoint
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get Prometheus metrics
   * @returns Prometheus-formatted metrics
   */
  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns all collected metrics in Prometheus format',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics successfully retrieved',
  })
  async getMetrics(): Promise<string> {
    return await this.metricsService.getMetrics();
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Simple health check endpoint for monitoring',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
