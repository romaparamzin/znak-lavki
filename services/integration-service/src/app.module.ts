import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { IntegrationEventEntity } from './entities/integration-event.entity';
import { SyncJobEntity } from './entities/sync-job.entity';

// Common services
import { CustomLoggerService } from './common/logger.service';
import { MetricsService } from './common/metrics.service';

// Integration services
import { WMSService } from './integrations/wms.service';
import { PIMService } from './integrations/pim.service';
import { OneCService } from './integrations/1c.service';

// Queue services
import { RabbitMQService } from './queue/rabbitmq.service';
import { EventProcessorService } from './queue/event-processor.service';

// Webhooks
import { WebhookController } from './webhooks/webhook.controller';
import { WebhookService } from './webhooks/webhook.service';

// Integration controller
import { IntegrationController } from './integration/integration.controller';

// Schedulers
import { SyncScheduler } from './schedulers/sync.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'znak_lavki_integration',
      entities: [IntegrationEventEntity, SyncJobEntity],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([IntegrationEventEntity, SyncJobEntity]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, WebhookController, IntegrationController],
  providers: [
    AppService,
    CustomLoggerService,
    MetricsService,
    WMSService,
    PIMService,
    OneCService,
    RabbitMQService,
    EventProcessorService,
    WebhookService,
    SyncScheduler,
  ],
})
export class AppModule {}
