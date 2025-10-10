import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { MarkController } from '../controllers/mark.controller';
import { MarkService } from '../services/mark.service';
import { MarkGeneratorService } from '../services/mark-generator.service';
import { QrCodeService } from '../services/qr-code.service';
import { CacheService } from '../services/cache.service';
import { AuditService } from '../services/audit.service';
import { MetricsService } from '../services/metrics.service';

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
  ],
  exports: [MarkService, QrCodeService],
})
export class QrModule {}
