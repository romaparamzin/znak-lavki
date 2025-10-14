/**
 * API Integration Tests for Marks Endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { ApiClient } from '../../utils/api-client';
import { TestDataManager } from '../../utils/test-data-manager';
import { faker } from '@faker-js/faker';

describe('Marks API Integration Tests', () => {
  let api: ApiClient;
  let testData: TestDataManager;

  beforeAll(async () => {
    api = new ApiClient(process.env.API_BASE_URL || 'http://localhost:3001');
    testData = new TestDataManager();
    await testData.seed();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('POST /api/v1/marks/generate', () => {
    test('should generate marks successfully', async () => {
      const response = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 10,
        productionDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        supplierId: 1234,
        manufacturerId: 5678,
        generateQrCodes: true,
      });

      expect(response.status).toBe(201);
      expect(response.data.count).toBe(10);
      expect(response.data.marks).toHaveLength(10);
      expect(response.data.marks[0]).toHaveProperty('markCode');
      expect(response.data.marks[0]).toHaveProperty('qrCodeUrl');
    });

    test('should reject invalid GTIN', async () => {
      await expect(
        api.post('/api/v1/marks/generate', {
          gtin: '123', // Invalid GTIN
          quantity: 1,
        }),
      ).rejects.toMatchObject({
        status: 400,
        data: {
          message: expect.stringContaining('GTIN'),
        },
      });
    });

    test('should reject quantity > 10000', async () => {
      await expect(
        api.post('/api/v1/marks/generate', {
          gtin: faker.string.numeric(13),
          quantity: 15000,
        }),
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    test('should handle concurrent generation requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          api.post('/api/v1/marks/generate', {
            gtin: faker.string.numeric(13),
            quantity: 100,
            productionDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.data.count).toBe(100);
      });

      // Verify all marks have unique codes
      const allMarkCodes = responses.flatMap((r) => r.data.marks.map((m: any) => m.markCode));
      const uniqueCodes = new Set(allMarkCodes);
      expect(uniqueCodes.size).toBe(allMarkCodes.length);
    });
  });

  describe('GET /api/v1/marks', () => {
    test('should return paginated marks', async () => {
      const response = await api.get('/api/v1/marks', {
        params: { page: 1, limit: 20 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeLessThanOrEqual(20);
    });

    test('should filter by status', async () => {
      const response = await api.get('/api/v1/marks', {
        params: { status: 'active' },
      });

      expect(response.status).toBe(200);
      response.data.data.forEach((mark: any) => {
        expect(mark.status).toBe('active');
      });
    });

    test('should filter by GTIN', async () => {
      const gtin = faker.string.numeric(13);
      await api.post('/api/v1/marks/generate', {
        gtin,
        quantity: 5,
      });

      const response = await api.get('/api/v1/marks', {
        params: { gtin },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThanOrEqual(5);
      response.data.data.forEach((mark: any) => {
        expect(mark.gtin).toBe(gtin);
      });
    });

    test('should search by mark code', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = createResponse.data.marks[0].markCode;
      const searchResponse = await api.get('/api/v1/marks', {
        params: { search: markCode },
      });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.data.data[0].markCode).toBe(markCode);
    });
  });

  describe('PUT /api/v1/marks/:markCode/block', () => {
    test('should block mark successfully', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = createResponse.data.marks[0].markCode;
      const blockResponse = await api.put(`/api/v1/marks/${markCode}/block`, {
        reason: 'Test block',
      });

      expect(blockResponse.status).toBe(200);
      expect(blockResponse.data.status).toBe('blocked');
      expect(blockResponse.data.blockedReason).toBe('Test block');
    });

    test('should reject blocking non-existent mark', async () => {
      await expect(
        api.put('/api/v1/marks/NONEXISTENT/block', { reason: 'Test' }),
      ).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('POST /api/v1/marks/validate', () => {
    test('should validate active mark', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = createResponse.data.marks[0].markCode;
      const validateResponse = await api.post('/api/v1/marks/validate', {
        markCode,
      });

      expect(validateResponse.status).toBe(200);
      expect(validateResponse.data.isValid).toBe(true);
      expect(validateResponse.data.mark).toBeDefined();
    });

    test('should reject blocked mark', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = createResponse.data.marks[0].markCode;

      // Block the mark
      await api.put(`/api/v1/marks/${markCode}/block`, {
        reason: 'Test block',
      });

      // Try to validate
      const validateResponse = await api.post('/api/v1/marks/validate', {
        markCode,
      });

      expect(validateResponse.status).toBe(200);
      expect(validateResponse.data.isValid).toBe(false);
      expect(validateResponse.data.reason).toContain('заблокирована');
    });

    test('should increment validation count', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 1,
      });

      const markCode = createResponse.data.marks[0].markCode;

      // Validate 3 times
      for (let i = 0; i < 3; i++) {
        await api.post('/api/v1/marks/validate', { markCode });
      }

      // Get mark and check count
      const markResponse = await api.get(`/api/v1/marks/code/${markCode}`);
      expect(markResponse.data.validationCount).toBe(3);
    });
  });

  describe('POST /api/v1/marks/bulk-block', () => {
    test('should block multiple marks', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 10,
      });

      const markCodes = createResponse.data.marks.map((m: any) => m.markCode);

      const blockResponse = await api.post('/api/v1/marks/bulk-block', {
        markCodes,
        reason: 'Bulk test block',
      });

      expect(blockResponse.status).toBe(200);
      expect(blockResponse.data.successCount).toBe(10);
      expect(blockResponse.data.failureCount).toBe(0);
    });

    test('should handle partial failures', async () => {
      const createResponse = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 5,
      });

      const markCodes = createResponse.data.marks.map((m: any) => m.markCode);
      markCodes.push('INVALID_CODE_1', 'INVALID_CODE_2');

      const blockResponse = await api.post('/api/v1/marks/bulk-block', {
        markCodes,
        reason: 'Bulk test',
      });

      expect(blockResponse.status).toBe(200);
      expect(blockResponse.data.successCount).toBe(5);
      expect(blockResponse.data.failureCount).toBe(2);
      expect(blockResponse.data.errors).toHaveLength(2);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on generation endpoint', async () => {
      const requests = Array(15)
        .fill(null)
        .map(() =>
          api
            .post('/api/v1/marks/generate', {
              gtin: faker.string.numeric(13),
              quantity: 1,
            })
            .catch((err) => err),
        );

      const responses = await Promise.all(requests);

      // Should have at least one rate-limited request
      const rateLimited = responses.some((r) => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should generate 10k marks within acceptable time', async () => {
      const startTime = Date.now();

      const response = await api.post('/api/v1/marks/generate', {
        gtin: faker.string.numeric(13),
        quantity: 10000,
        generateQrCodes: false, // Skip QR generation for speed
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(response.data.count).toBe(10000);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle complex filtering efficiently', async () => {
      const startTime = Date.now();

      const response = await api.get('/api/v1/marks', {
        params: {
          status: 'active',
          gtinStartsWith: '0460',
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31',
          page: 1,
          limit: 100,
        },
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
