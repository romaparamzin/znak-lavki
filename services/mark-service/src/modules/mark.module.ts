import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarkController } from '../controllers/mark.controller';
import { MarkService } from '../services/mark.service';
import { MarkGeneratorService } from '../services/mark-generator.service';
import { QrCodeService } from '../services/qr-code.service';
import { AuditService } from '../services/audit.service';
import { CacheService } from '../services/cache.service';
import { MetricsService } from '../services/metrics.service';
import { AuditLogger } from '../middleware/logger.middleware';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Mark Module
 * Handles all quality mark operations
 */
@Module({
  imports: [TypeOrmModule.forFeature([QualityMark, AuditLog])],
  controllers: [MarkController],
  providers: [
    MarkService,
    MarkGeneratorService,
    QrCodeService,
    AuditService,
    CacheService,
    MetricsService,
    AuditLogger,
  ],
  exports: [MarkService],
})
export class MarkModule {}
