import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MarkController } from '../controllers/mark.controller';
import { AuditLog } from '../entities/audit-log.entity';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLogger } from '../middleware/logger.middleware';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { MarkGeneratorService } from '../services/mark-generator.service';
import { MarkService } from '../services/mark.service';
import { MetricsService } from '../services/metrics.service';
import { QrCodeService } from '../services/qr-code.service';

/**
 * QR Module
 * Main module for quality mark operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QualityMark, AuditLog]),
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL
      max: 10000, // Maximum number of items in cache
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // Default limit
      },
    ]),
  ],
  controllers: [MarkController],
  providers: [
    MarkService,
    MarkGeneratorService,
    QrCodeService,
    CacheService,
    AuditService,
    MetricsService,
    AuditLogger,
  ],
  exports: [MarkService, QrCodeService],
})
export class QrModule {}
