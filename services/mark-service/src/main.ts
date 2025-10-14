import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

/**
 * Bootstrap function
 * Initializes and starts the NestJS application
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Enable CORS with dynamic origin
  const allowedOrigins = configService
    .get('CORS_ORIGIN', '*')
    .split(',')
    .map((o: string) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in DTOs
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mark Service API')
    .setDescription(
      'Quality Mark Generation and Validation Service\n\n' +
        'Features:\n' +
        '- Batch mark generation (up to 10,000)\n' +
        '- QR code generation with logo embedding\n' +
        '- Mark validation with caching\n' +
        '- Bulk operations (block/unblock)\n' +
        '- Audit logging\n' +
        '- Prometheus metrics\n' +
        '- Rate limiting',
    )
    .setVersion('1.0.0')
    .setContact('Znak Lavki Team', 'https://znak-lavki.ru', 'support@znak-lavki.ru')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .addTag('Quality Marks', 'Quality mark generation and management')
    .addTag('Validation', 'Mark validation endpoints')
    .addTag('Health', 'Health check and metrics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Metrics endpoint
  app.getHttpAdapter().get('/metrics', async (req, res) => {
    const metricsService = app.get('MetricsService');
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'mark-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Start server
  const port = configService.get('PORT', 3001);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(`🔖 Mark Service is running on: http://${host}:${port}`);
  logger.log(`📚 Swagger docs available at: http://${host}:${port}/api/docs`);
  logger.log(`📊 Metrics available at: http://${host}:${port}/metrics`);
  logger.log(`❤️  Health check at: http://${host}:${port}/health`);
}

// Start the application
bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
