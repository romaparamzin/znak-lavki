import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from '../controllers/audit.controller';
import { AuditService } from '../services/audit.service';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Audit Module
 * Handles audit logging and retrieval
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

