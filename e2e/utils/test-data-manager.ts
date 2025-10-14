/**
 * Test Data Manager
 * Handles test data seeding and cleanup
 */

import { Pool } from 'pg';
import { createClient } from 'redis';
import { faker } from '@faker-js/faker';

export class TestDataManager {
  private pgPool: Pool;
  private redisClient: ReturnType<typeof createClient>;
  private createdIds: {
    marks: string[];
    users: string[];
    auditLogs: string[];
  } = {
    marks: [],
    users: [],
    auditLogs: [],
  };

  constructor() {
    this.pgPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'znak_lavki_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    this.redisClient = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
  }

  async connect() {
    await this.redisClient.connect();
  }

  async disconnect() {
    await this.pgPool.end();
    await this.redisClient.quit();
  }

  /**
   * Seed test data
   */
  async seed() {
    await this.connect();
    await this.seedUsers();
    await this.seedMarks();
  }

  /**
   * Seed test users
   */
  private async seedUsers() {
    const users = [
      {
        email: 'admin@znak-lavki.com',
        password: 'Admin123!@#',
        role: 'admin',
        name: 'Test Admin',
      },
      {
        email: 'manager@znak-lavki.com',
        password: 'Manager123!@#',
        role: 'manager',
        name: 'Test Manager',
      },
      {
        email: 'operator@znak-lavki.com',
        password: 'Operator123!@#',
        role: 'operator',
        name: 'Test Operator',
      },
    ];

    for (const user of users) {
      const result = await this.pgPool.query(
        `INSERT INTO users (email, password_hash, role, name, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (email) DO UPDATE SET role = $3, name = $4
         RETURNING id`,
        [user.email, user.password, user.role, user.name],
      );

      if (result.rows[0]) {
        this.createdIds.users.push(result.rows[0].id);
      }
    }
  }

  /**
   * Seed test marks
   */
  private async seedMarks() {
    const marksBatch = Array(100)
      .fill(null)
      .map(() => ({
        markCode: this.generateMarkCode(),
        gtin: faker.string.numeric(13),
        status: faker.helpers.arrayElement(['active', 'blocked', 'expired']),
        productionDate: faker.date.past(),
        expiryDate: faker.date.future(),
        supplierId: faker.number.int({ min: 1000, max: 9999 }),
        manufacturerId: faker.number.int({ min: 10000, max: 99999 }),
      }));

    for (const mark of marksBatch) {
      const result = await this.pgPool.query(
        `INSERT INTO quality_marks 
         (mark_code, gtin, status, production_date, expiry_date, supplier_id, manufacturer_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          mark.markCode,
          mark.gtin,
          mark.status,
          mark.productionDate,
          mark.expiryDate,
          mark.supplierId,
          mark.manufacturerId,
        ],
      );

      if (result.rows[0]) {
        this.createdIds.marks.push(result.rows[0].id);
      }
    }
  }

  /**
   * Generate valid mark code
   */
  private generateMarkCode(): string {
    const prefix = '99LAV';
    const gln = '0460717796408966';
    const serial = faker.string.alphanumeric(20).toUpperCase();
    return `${prefix}${gln}LAV${serial}`;
  }

  /**
   * Cleanup all test data
   */
  async cleanup() {
    try {
      // Delete marks
      if (this.createdIds.marks.length > 0) {
        await this.pgPool.query('DELETE FROM quality_marks WHERE id = ANY($1)', [
          this.createdIds.marks,
        ]);
      }

      // Delete audit logs
      await this.pgPool.query('DELETE FROM audit_logs WHERE entity_id = ANY($1)', [
        this.createdIds.marks,
      ]);

      // Clear Redis cache
      await this.redisClient.flushDb();

      console.log('✓ Test data cleaned up successfully');
    } catch (error) {
      console.error('✗ Error cleaning up test data:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * Create specific test mark
   */
  async createMark(data: Partial<any> = {}) {
    const markData = {
      markCode: this.generateMarkCode(),
      gtin: faker.string.numeric(13),
      status: 'active',
      productionDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      supplierId: faker.number.int({ min: 1000, max: 9999 }),
      manufacturerId: faker.number.int({ min: 10000, max: 99999 }),
      ...data,
    };

    const result = await this.pgPool.query(
      `INSERT INTO quality_marks 
       (mark_code, gtin, status, production_date, expiry_date, supplier_id, manufacturer_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        markData.markCode,
        markData.gtin,
        markData.status,
        markData.productionDate,
        markData.expiryDate,
        markData.supplierId,
        markData.manufacturerId,
      ],
    );

    this.createdIds.marks.push(result.rows[0].id);
    return result.rows[0];
  }

  /**
   * Create marks in bulk
   */
  async createMarks(count: number, data: Partial<any> = {}) {
    const marks = [];

    for (let i = 0; i < count; i++) {
      const mark = await this.createMark(data);
      marks.push(mark);
    }

    return marks;
  }

  /**
   * Get database connection for custom queries
   */
  getDbConnection() {
    return this.pgPool;
  }

  /**
   * Get Redis client for cache operations
   */
  getRedisClient() {
    return this.redisClient;
  }
}
