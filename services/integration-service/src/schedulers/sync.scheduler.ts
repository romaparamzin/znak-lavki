import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLoggerService } from '../common/logger.service';
import { WMSService } from '../integrations/wms.service';
import { PIMService } from '../integrations/pim.service';
import { OneCService } from '../integrations/1c.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncJobEntity } from '../entities/sync-job.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SyncScheduler {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly wmsService: WMSService,
    private readonly pimService: PIMService,
    private readonly oneCService: OneCService,
    @InjectRepository(SyncJobEntity)
    private readonly syncJobRepository: Repository<SyncJobEntity>,
  ) {}

  /**
   * Sync product catalog from PIM every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncProductCatalog() {
    const jobId = uuidv4();
    this.logger.log('Starting scheduled product catalog sync', 'Scheduler');

    const job = await this.createSyncJob(jobId, 'pim_catalog_sync');

    try {
      await this.updateSyncJobStatus(job.id, 'running');
      await this.pimService.syncProductCatalog();
      await this.updateSyncJobStatus(job.id, 'completed', 100);

      this.logger.log('Product catalog sync completed successfully', 'Scheduler');
    } catch (error) {
      this.logger.error('Product catalog sync failed', error.stack, 'Scheduler');
      await this.updateSyncJobStatus(job.id, 'failed', 0, [error.message]);
    }
  }

  /**
   * Sync production batches from 1C every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncProductionBatches() {
    const jobId = uuidv4();
    this.logger.log('Starting scheduled production batches sync', 'Scheduler');

    const job = await this.createSyncJob(jobId, '1c_batch_sync');

    try {
      await this.updateSyncJobStatus(job.id, 'running');
      await this.oneCService.syncProductionBatches();
      await this.updateSyncJobStatus(job.id, 'completed', 100);

      this.logger.log('Production batches sync completed successfully', 'Scheduler');
    } catch (error) {
      this.logger.error('Production batches sync failed', error.stack, 'Scheduler');
      await this.updateSyncJobStatus(job.id, 'failed', 0, [error.message]);
    }
  }

  /**
   * Check expiring items every day at 8 AM
   */
  @Cron('0 8 * * *')
  async checkExpiringItems() {
    const jobId = uuidv4();
    this.logger.log('Starting scheduled expiring items check', 'Scheduler');

    const job = await this.createSyncJob(jobId, 'wms_expiring_items_check');

    try {
      await this.updateSyncJobStatus(job.id, 'running');

      // Get expiring items from WMS (this would need to be implemented in WMS service)
      const expiringItems = await this.getExpiringItems();

      if (expiringItems.length > 0) {
        await this.wmsService.notifyExpiringItems(expiringItems);
        this.logger.log(`Notified ${expiringItems.length} expiring items`, 'Scheduler');
      }

      await this.updateSyncJobStatus(job.id, 'completed', 100, [], {
        itemsFound: expiringItems.length,
      });

      this.logger.log('Expiring items check completed successfully', 'Scheduler');
    } catch (error) {
      this.logger.error('Expiring items check failed', error.stack, 'Scheduler');
      await this.updateSyncJobStatus(job.id, 'failed', 0, [error.message]);
    }
  }

  /**
   * Health check for all integrations every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async healthCheckIntegrations() {
    this.logger.log('Running health checks for all integrations', 'Scheduler');

    const healthChecks = await Promise.allSettled([
      this.wmsService.healthCheck(),
      this.pimService.healthCheck(),
      this.oneCService.healthCheck(),
    ]);

    const services = ['WMS', 'PIM', '1C'];
    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        this.logger.log(`${services[index]} health check: OK`, 'Scheduler');
      } else {
        this.logger.warn(`${services[index]} health check: FAILED`, 'Scheduler');
      }
    });
  }

  /**
   * Clean up old events and jobs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData() {
    const jobId = uuidv4();
    this.logger.log('Starting scheduled data cleanup', 'Scheduler');

    const job = await this.createSyncJob(jobId, 'cleanup_old_data');

    try {
      await this.updateSyncJobStatus(job.id, 'running');

      // Delete jobs older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.syncJobRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :date', { date: thirtyDaysAgo })
        .andWhere('status IN (:...statuses)', { statuses: ['completed', 'failed'] })
        .execute();

      await this.updateSyncJobStatus(job.id, 'completed', 100, [], {
        deletedJobs: result.affected || 0,
      });

      this.logger.log(`Deleted ${result.affected || 0} old jobs`, 'Scheduler');
    } catch (error) {
      this.logger.error('Data cleanup failed', error.stack, 'Scheduler');
      await this.updateSyncJobStatus(job.id, 'failed', 0, [error.message]);
    }
  }

  /**
   * Sync inventory status every 15 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncInventoryStatus() {
    const jobId = uuidv4();
    this.logger.log('Starting scheduled inventory status sync', 'Scheduler');

    const job = await this.createSyncJob(jobId, 'wms_inventory_sync');

    try {
      await this.updateSyncJobStatus(job.id, 'running');
      // Add your inventory sync logic here
      await this.updateSyncJobStatus(job.id, 'completed', 100);

      this.logger.log('Inventory status sync completed successfully', 'Scheduler');
    } catch (error) {
      this.logger.error('Inventory status sync failed', error.stack, 'Scheduler');
      await this.updateSyncJobStatus(job.id, 'failed', 0, [error.message]);
    }
  }

  private async createSyncJob(jobId: string, jobType: string): Promise<SyncJobEntity> {
    const job = this.syncJobRepository.create({
      jobId,
      jobType,
      status: 'pending',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      errors: [],
    });

    return await this.syncJobRepository.save(job);
  }

  private async updateSyncJobStatus(
    id: string,
    status: string,
    progress: number = 0,
    errors: string[] = [],
    metadata?: any,
  ): Promise<void> {
    const job = await this.syncJobRepository.findOne({ where: { id } });
    if (!job) return;

    job.status = status;
    job.progress = progress;
    job.errors = errors;

    if (status === 'running' && !job.startTime) {
      job.startTime = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      job.endTime = new Date();
    }

    if (metadata) {
      job.metadata = metadata;
    }

    await this.syncJobRepository.save(job);
  }

  private async getExpiringItems(): Promise<any[]> {
    // This is a placeholder - implement your logic to get expiring items
    // You might want to query your database or call WMS API
    return [];
  }
}
