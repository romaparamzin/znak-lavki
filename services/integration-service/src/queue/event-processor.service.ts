import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RabbitMQService, QueueMessage } from './rabbitmq.service';
import { CustomLoggerService } from '../common/logger.service';
import { IntegrationEventEntity } from '../entities/integration-event.entity';

@Injectable()
export class EventProcessorService implements OnModuleInit {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly logger: CustomLoggerService,
    @InjectRepository(IntegrationEventEntity)
    private readonly eventRepository: Repository<IntegrationEventEntity>,
  ) {}

  async onModuleInit() {
    await this.startProcessors();
  }

  private async startProcessors() {
    const queues = this.rabbitMQService.getQueues();

    // Process WMS events
    await this.rabbitMQService.consumeMessages(queues.WMS_EVENTS, this.processWMSEvent.bind(this));

    // Process PIM sync
    await this.rabbitMQService.consumeMessages(queues.PIM_SYNC, this.processPIMSync.bind(this));

    // Process 1C mark requests
    await this.rabbitMQService.consumeMessages(
      queues.ONEC_MARKS,
      this.processOneCMarkRequest.bind(this),
    );

    // Process dead letter queue
    await this.rabbitMQService.consumeMessages(
      queues.DEAD_LETTER,
      this.processDeadLetter.bind(this),
    );

    this.logger.log('All event processors started', 'EventProcessor');
  }

  private async processWMSEvent(message: QueueMessage) {
    this.logger.log(`Processing WMS event: ${message.id}`, 'EventProcessor');

    await this.saveEvent({
      eventId: message.id,
      eventType: message.type,
      source: 'wms',
      payload: message.data,
      status: 'processing',
      retryCount: message.retryCount || 0,
    });

    // Process the event
    try {
      // Add your WMS event processing logic here
      await this.updateEventStatus(message.id, 'completed');
    } catch (error) {
      await this.updateEventStatus(message.id, 'failed', error.message);
      throw error;
    }
  }

  private async processPIMSync(message: QueueMessage) {
    this.logger.log(`Processing PIM sync: ${message.id}`, 'EventProcessor');

    await this.saveEvent({
      eventId: message.id,
      eventType: message.type,
      source: 'pim',
      payload: message.data,
      status: 'processing',
      retryCount: message.retryCount || 0,
    });

    try {
      // Add your PIM sync processing logic here
      await this.updateEventStatus(message.id, 'completed');
    } catch (error) {
      await this.updateEventStatus(message.id, 'failed', error.message);
      throw error;
    }
  }

  private async processOneCMarkRequest(message: QueueMessage) {
    this.logger.log(`Processing 1C mark request: ${message.id}`, 'EventProcessor');

    await this.saveEvent({
      eventId: message.id,
      eventType: message.type,
      source: '1c',
      payload: message.data,
      status: 'processing',
      retryCount: message.retryCount || 0,
    });

    try {
      // Add your 1C mark processing logic here
      await this.updateEventStatus(message.id, 'completed');
    } catch (error) {
      await this.updateEventStatus(message.id, 'failed', error.message);
      throw error;
    }
  }

  private async processDeadLetter(message: QueueMessage) {
    this.logger.error(
      `Processing dead letter: ${message.id}`,
      JSON.stringify(message),
      'EventProcessor',
    );

    await this.saveEvent({
      eventId: message.id,
      eventType: message.type,
      source: 'dead_letter',
      payload: message.data,
      status: 'dead_letter',
      retryCount: message.retryCount || 0,
      errorMessage: 'Message moved to dead letter queue after max retries',
    });
  }

  private async saveEvent(eventData: Partial<IntegrationEventEntity>) {
    const event = this.eventRepository.create(eventData);
    await this.eventRepository.save(event);
  }

  private async updateEventStatus(eventId: string, status: string, errorMessage?: string) {
    const event = await this.eventRepository.findOne({ where: { eventId } });
    if (event) {
      event.status = status;
      event.processedAt = new Date();
      if (errorMessage) {
        event.errorMessage = errorMessage;
      }
      await this.eventRepository.save(event);
    }
  }
}
