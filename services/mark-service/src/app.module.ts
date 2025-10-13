import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QrModule } from './qr/qr.module';
import { MarkModule } from './modules/mark.module';
import { DashboardModule } from './modules/dashboard.module';
import { AuditModule } from './modules/audit.module';
import { AnalyticsModule } from './modules/analytics.module';
import { QualityMark } from './entities/quality-mark.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoggerMiddleware, AuditLogger } from './middleware/logger.middleware';
import { MetricsService } from './services/metrics.service';
import { MetricsController } from './controllers/metrics.controller';
import { MetricsCollectorScheduler } from './schedulers/metrics-collector.scheduler';

/**
 * App Module
 * Root application module with database, cache, scheduling, and monitoring configuration
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database configuration with connection pooling
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'znak_lavki'),
        entities: [QualityMark, AuditLog],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        // Connection pooling for better performance
        extra: {
          max: configService.get('DB_POOL_MAX', 20),
          min: configService.get('DB_POOL_MIN', 5),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    // Redis cache configuration
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisEnabled = configService.get('REDIS_ENABLED', 'true') === 'true';

        if (redisEnabled) {
          // Redis configuration
          return {
            store: 'redis' as any,
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
            ttl: 3600, // 1 hour
            max: 10000,
          };
        } else {
          // In-memory cache fallback
          return {
            ttl: 3600,
            max: 1000,
          };
        }
      },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL', 60000), // 1 minute
          limit: configService.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Scheduling for cron jobs
    ScheduleModule.forRoot(),

    // TypeORM repositories for schedulers
    TypeOrmModule.forFeature([QualityMark, AuditLog]),

    // Feature modules
    QrModule,
    MarkModule,
    DashboardModule,
    AuditModule,
    AnalyticsModule,
  ],
  controllers: [AppController, MetricsController],
  providers: [AppService, MetricsService, AuditLogger, MetricsCollectorScheduler],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to all routes
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
