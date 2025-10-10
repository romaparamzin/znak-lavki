import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLog } from '../entities/audit-log.entity';

describe('MarkController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'znak_lavki_test',
          entities: [QualityMark, AuditLog],
          synchronize: true,
          dropSchema: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/marks/generate (POST)', () => {
    it('should generate marks successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 10,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
          generateQrCodes: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('marks');
          expect(res.body).toHaveProperty('count', 10);
          expect(res.body.marks).toHaveLength(10);
        });
    });

    it('should reject invalid quantity', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 20000, // Exceeds max
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        })
        .expect(400);
    });

    it('should reject invalid GTIN', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: 'invalid',
          quantity: 10,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        })
        .expect(400);
    });
  });

  describe('/api/v1/marks/:markCode (GET)', () => {
    let testMarkCode: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 1,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        });

      testMarkCode = response.body.marks[0].markCode;
    });

    it('should get mark by code', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/marks/code/${testMarkCode}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('markCode', testMarkCode);
          expect(res.body).toHaveProperty('status', 'active');
        });
    });

    it('should return 404 for non-existent mark', () => {
      return request(app.getHttpServer())
        .get('/api/v1/marks/code/99LAV0460717796408966LAV0000000000000000')
        .expect(404);
    });
  });

  describe('/api/v1/marks/validate (POST)', () => {
    let testMarkCode: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 1,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        });

      testMarkCode = response.body.marks[0].markCode;
    });

    it('should validate active mark', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/validate')
        .send({
          markCode: testMarkCode,
          location: 'Test Warehouse',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', true);
          expect(res.body).toHaveProperty('mark');
        });
    });

    it('should return invalid for non-existent mark', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/validate')
        .send({
          markCode: '99LAV0460717796408966LAV0000000000000000',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', false);
          expect(res.body).toHaveProperty('reason');
        });
    });
  });

  describe('/api/v1/marks/:markCode/block (PUT)', () => {
    let testMarkCode: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 1,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        });

      testMarkCode = response.body.marks[0].markCode;
    });

    it('should block mark', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/marks/${testMarkCode}/block`)
        .send({
          reason: 'Test block',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'blocked');
          expect(res.body).toHaveProperty('blockedReason', 'Test block');
        });
    });

    it('should validate blocked mark as invalid', () => {
      return request(app.getHttpServer())
        .post('/api/v1/marks/validate')
        .send({
          markCode: testMarkCode,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isValid', false);
          expect(res.body.reason).toContain('blocked');
        });
    });
  });

  describe('/api/v1/marks (GET)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/marks/generate')
        .send({
          gtin: '04607177964089',
          quantity: 25,
          productionDate: '2025-10-10T00:00:00Z',
          expiryDate: '2026-10-10T00:00:00Z',
        });
    });

    it('should get paginated marks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/marks?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 10);
          expect(res.body.data.length).toBeLessThanOrEqual(10);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/marks?status=active')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((mark: any) => mark.status === 'active')).toBe(true);
        });
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('service', 'mark-service');
        });
    });
  });
});

