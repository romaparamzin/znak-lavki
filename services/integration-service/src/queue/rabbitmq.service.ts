import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { CustomLoggerService } from '../common/logger.service';

export interface QueueMessage {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  priority?: number;
  retryCount?: number;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly queues = {
    WMS_EVENTS: 'wms.events',
    PIM_SYNC: 'pim.sync',
    ONEC_MARKS: '1c.marks',
    DEAD_LETTER: 'integration.dlq',
    NOTIFICATIONS: 'integration.notifications',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl =
        this.configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5672';

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Setup connection error handlers
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err.stack);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
      });

      // Setup dead letter exchange
      await this.channel.assertExchange('integration.dlx', 'direct', {
        durable: true,
      });

      // Setup queues
      await this.setupQueues();

      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  private async setupQueues() {
    const dlqOptions = {
      durable: true,
      arguments: {},
    };

    const queueOptions = {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'integration.dlx',
        'x-dead-letter-routing-key': 'dead-letter',
        'x-message-ttl': 86400000, // 24 hours
      },
    };

    // Setup dead letter queue
    await this.channel.assertQueue(this.queues.DEAD_LETTER, dlqOptions);
    await this.channel.bindQueue(this.queues.DEAD_LETTER, 'integration.dlx', 'dead-letter');

    // Setup main queues
    for (const queueName of Object.values(this.queues)) {
      if (queueName !== this.queues.DEAD_LETTER) {
        await this.channel.assertQueue(queueName, queueOptions);
      }
    }
  }

  async publishMessage(
    queue: string,
    message: QueueMessage,
    options?: amqp.Options.Publish,
  ): Promise<boolean> {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const defaultOptions: amqp.Options.Publish = {
        persistent: true,
        priority: message.priority || 0,
        timestamp: Date.now(),
        ...options,
      };

      const published = this.channel.sendToQueue(queue, messageBuffer, defaultOptions);

      if (published) {
        this.logger.log(`Message published to queue: ${queue}`, 'RabbitMQ');
      } else {
        this.logger.warn(`Failed to publish message to queue: ${queue}`, 'RabbitMQ');
      }

      return published;
    } catch (error) {
      this.logger.error(`Error publishing message to ${queue}`, error.stack);
      throw error;
    }
  }

  async consumeMessages(
    queue: string,
    handler: (message: QueueMessage) => Promise<void>,
    options?: amqp.Options.Consume,
  ) {
    try {
      await this.channel.consume(
        queue,
        async (msg) => {
          if (!msg) return;

          try {
            const message: QueueMessage = JSON.parse(msg.content.toString());
            await handler(message);
            this.channel.ack(msg);
            this.logger.log(`Message processed from queue: ${queue}`, 'RabbitMQ');
          } catch (error) {
            this.logger.error(`Error processing message from ${queue}`, error.stack);

            // Check retry count
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
            const maxRetries = 3;

            if (retryCount < maxRetries) {
              // Requeue with updated retry count
              const requeOptions: amqp.Options.Publish = {
                headers: {
                  'x-retry-count': retryCount,
                },
              };
              const message: QueueMessage = JSON.parse(msg.content.toString());
              message.retryCount = retryCount;
              await this.publishMessage(queue, message, requeOptions);
              this.channel.ack(msg);
            } else {
              // Send to dead letter queue
              this.channel.nack(msg, false, false);
              this.logger.warn(`Message moved to DLQ after ${maxRetries} retries`, 'RabbitMQ');
            }
          }
        },
        options,
      );

      this.logger.log(`Started consuming from queue: ${queue}`, 'RabbitMQ');
    } catch (error) {
      this.logger.error(`Error setting up consumer for ${queue}`, error.stack);
      throw error;
    }
  }

  async publishWMSEvent(event: any): Promise<boolean> {
    return this.publishMessage(this.queues.WMS_EVENTS, {
      id: event.eventId || this.generateId(),
      type: 'wms.event',
      data: event,
      timestamp: new Date(),
    });
  }

  async publishPIMSync(syncData: any): Promise<boolean> {
    return this.publishMessage(this.queues.PIM_SYNC, {
      id: this.generateId(),
      type: 'pim.sync',
      data: syncData,
      timestamp: new Date(),
    });
  }

  async publishOneCMarkRequest(markRequest: any): Promise<boolean> {
    return this.publishMessage(this.queues.ONEC_MARKS, {
      id: markRequest.requestId || this.generateId(),
      type: '1c.mark.request',
      data: markRequest,
      timestamp: new Date(),
      priority: this.getPriority(markRequest.priority),
    });
  }

  async publishNotification(notification: any): Promise<boolean> {
    return this.publishMessage(this.queues.NOTIFICATIONS, {
      id: this.generateId(),
      type: 'notification',
      data: notification,
      timestamp: new Date(),
    });
  }

  async getQueueInfo(queueName: string): Promise<amqp.Replies.AssertQueue> {
    return this.channel.checkQueue(queueName);
  }

  async purgeQueue(queueName: string): Promise<amqp.Replies.PurgeQueue> {
    return this.channel.purgeQueue(queueName);
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('RabbitMQ disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error.stack);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPriority(priority: string): number {
    const priorityMap = {
      urgent: 10,
      high: 5,
      normal: 0,
    };
    return priorityMap[priority] || 0;
  }

  getQueues() {
    return this.queues;
  }
}
