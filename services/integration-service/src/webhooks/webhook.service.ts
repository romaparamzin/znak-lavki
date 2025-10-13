import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhookEventDto } from '../dto/integration.dto';
import { CustomLoggerService } from '../common/logger.service';
import { RabbitMQService } from '../queue/rabbitmq.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationEventEntity } from '../entities/integration-event.entity';

@Injectable()
export class WebhookService {
  private readonly secrets: Map<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(IntegrationEventEntity)
    private readonly eventRepository: Repository<IntegrationEventEntity>,
  ) {
    this.secrets = new Map([
      ['wms', this.configService.get<string>('WMS_WEBHOOK_SECRET') || 'wms-secret'],
      ['pim', this.configService.get<string>('PIM_WEBHOOK_SECRET') || 'pim-secret'],
      ['1c', this.configService.get<string>('ONEC_WEBHOOK_SECRET') || '1c-secret'],
    ]);
  }

  verifySignature(payload: any, signature: string, source: string): boolean {
    if (!signature) {
      return false;
    }

    const secret = this.secrets.get(source);
    if (!secret) {
      this.logger.warn(`No secret configured for source: ${source}`, 'Webhook');
      return false;
    }

    const expectedSignature = this.generateSignature(payload, secret);
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    if (!isValid) {
      this.logger.warn(`Signature verification failed for ${source}`, 'Webhook');
    }

    return isValid;
  }

  private generateSignature(payload: any, secret: string): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  async processWMSWebhook(payload: WebhookEventDto): Promise<void> {
    this.logger.log(`Processing WMS webhook: ${payload.eventType}`, 'Webhook');

    // Save event to database
    await this.saveWebhookEvent(payload);

    // Route event based on type
    switch (payload.eventType) {
      case 'inventory.updated':
        await this.handleInventoryUpdate(payload);
        break;
      case 'order.created':
      case 'order.updated':
        await this.handleOrderUpdate(payload);
        break;
      case 'item.blocked':
        await this.handleItemBlocked(payload);
        break;
      case 'item.expired':
        await this.handleItemExpired(payload);
        break;
      default:
        this.logger.warn(`Unknown WMS event type: ${payload.eventType}`, 'Webhook');
    }

    // Publish to queue for async processing
    await this.rabbitMQService.publishWMSEvent(payload);
  }

  async processPIMWebhook(payload: WebhookEventDto): Promise<void> {
    this.logger.log(`Processing PIM webhook: ${payload.eventType}`, 'Webhook');

    // Save event to database
    await this.saveWebhookEvent(payload);

    // Route event based on type
    switch (payload.eventType) {
      case 'product.created':
      case 'product.updated':
        await this.handleProductUpdate(payload);
        break;
      case 'product.deleted':
        await this.handleProductDeleted(payload);
        break;
      case 'category.updated':
        await this.handleCategoryUpdate(payload);
        break;
      case 'price.updated':
        await this.handlePriceUpdate(payload);
        break;
      default:
        this.logger.warn(`Unknown PIM event type: ${payload.eventType}`, 'Webhook');
    }

    // Publish to queue for async processing
    await this.rabbitMQService.publishPIMSync(payload);
  }

  async processOneCWebhook(payload: WebhookEventDto): Promise<void> {
    this.logger.log(`Processing 1C webhook: ${payload.eventType}`, 'Webhook');

    // Save event to database
    await this.saveWebhookEvent(payload);

    // Route event based on type
    switch (payload.eventType) {
      case 'marks.generated':
        await this.handleMarksGenerated(payload);
        break;
      case 'batch.completed':
        await this.handleBatchCompleted(payload);
        break;
      case 'document.exported':
        await this.handleDocumentExported(payload);
        break;
      case 'print.completed':
        await this.handlePrintCompleted(payload);
        break;
      default:
        this.logger.warn(`Unknown 1C event type: ${payload.eventType}`, 'Webhook');
    }

    // Publish to queue for async processing
    await this.rabbitMQService.publishOneCMarkRequest(payload);
  }

  async processGenericWebhook(payload: any): Promise<void> {
    this.logger.log('Processing generic webhook', 'Webhook');

    // Save event to database
    await this.saveWebhookEvent({
      eventType: 'generic.webhook',
      eventId: payload.eventId || `generic-${Date.now()}`,
      source: payload.source || 'unknown',
      data: payload,
      timestamp: new Date(payload.timestamp || Date.now()),
    });

    // Publish notification
    await this.rabbitMQService.publishNotification({
      type: 'generic.webhook',
      data: payload,
      timestamp: new Date(),
    });
  }

  private async handleInventoryUpdate(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling inventory update', 'Webhook');
    // Add your inventory update logic here
  }

  private async handleOrderUpdate(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling order update', 'Webhook');
    // Add your order update logic here
  }

  private async handleItemBlocked(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling item blocked', 'Webhook');
    // Add your item blocked logic here
  }

  private async handleItemExpired(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling item expired', 'Webhook');
    // Add your item expired logic here
  }

  private async handleProductUpdate(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling product update', 'Webhook');
    // Add your product update logic here
  }

  private async handleProductDeleted(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling product deleted', 'Webhook');
    // Add your product deleted logic here
  }

  private async handleCategoryUpdate(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling category update', 'Webhook');
    // Add your category update logic here
  }

  private async handlePriceUpdate(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling price update', 'Webhook');
    // Add your price update logic here
  }

  private async handleMarksGenerated(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling marks generated', 'Webhook');
    // Add your marks generated logic here
  }

  private async handleBatchCompleted(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling batch completed', 'Webhook');
    // Add your batch completed logic here
  }

  private async handleDocumentExported(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling document exported', 'Webhook');
    // Add your document exported logic here
  }

  private async handlePrintCompleted(payload: WebhookEventDto): Promise<void> {
    this.logger.log('Handling print completed', 'Webhook');
    // Add your print completed logic here
  }

  private async saveWebhookEvent(payload: any): Promise<void> {
    try {
      const event = this.eventRepository.create({
        eventId: payload.eventId,
        eventType: payload.eventType,
        source: payload.source,
        payload: payload.data || payload,
        status: 'pending',
        retryCount: 0,
      });

      await this.eventRepository.save(event);
    } catch (error) {
      this.logger.error('Failed to save webhook event', error.stack, 'Webhook');
    }
  }
}
