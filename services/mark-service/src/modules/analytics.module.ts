import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { QualityMark } from '../entities/quality-mark.entity';

/**
 * Analytics Module
 * Provides analytics data for charts and reports
 */
@Module({
  imports: [TypeOrmModule.forFeature([QualityMark])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

