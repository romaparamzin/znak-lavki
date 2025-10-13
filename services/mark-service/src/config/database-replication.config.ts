/**
 * TypeORM Database Configuration with Read Replicas
 * Optimized for high-performance read/write splitting
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { QualityMark } from '../entities/quality-mark.entity';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Database configuration with replication support
 * 
 * WRITE operations go to PRIMARY
 * READ operations are load-balanced across REPLICAS
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  
  // ============================================
  // PRIMARY DATABASE (MASTER) - Write Operations
  // ============================================
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'znak_lavki',

  // ============================================
  // READ REPLICAS - Read Operations
  // ============================================
  replication: {
    master: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'znak_lavki',
    },
    slaves: [
      // Replica 1 (Analytics queries)
      {
        host: process.env.DB_REPLICA_1_HOST || 'localhost',
        port: parseInt(process.env.DB_REPLICA_1_PORT || '5433'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'znak_lavki',
      },
      // Replica 2 (Backup analytics)
      {
        host: process.env.DB_REPLICA_2_HOST || 'localhost',
        port: parseInt(process.env.DB_REPLICA_2_PORT || '5434'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'znak_lavki',
      },
    ],
  },

  // ============================================
  // CONNECTION POOL SETTINGS
  // ============================================
  extra: {
    // Connection pool for master
    max: 20, // Maximum connections to master
    min: 5,  // Minimum connections to master
    
    // Connection pool for replicas
    replication: {
      canRetry: true,
      removeNodeErrorCount: 5,
      restoreNodeTimeout: 10000,
      selector: 'RR', // Round-robin load balancing
    },
    
    // Connection timeouts
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    
    // Performance optimizations
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000,
    
    // Application name for monitoring
    application_name: 'znak-lavki-api',
  },

  // ============================================
  // ENTITIES AND MIGRATIONS
  // ============================================
  entities: [QualityMark, AuditLog],
  synchronize: false, // Always use migrations in production
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,

  // ============================================
  // LOGGING
  // ============================================
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  logger: 'advanced-console',
  
  // Log slow queries
  maxQueryExecutionTime: 1000, // Log queries taking more than 1s

  // ============================================
  // CACHING (Query Result Cache)
  // ============================================
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use DB 1 for query cache
    },
    duration: 30000, // Default cache duration: 30 seconds
    ignoreErrors: true, // Don't fail if Redis is down
  },
};

/**
 * PgBouncer Configuration (Connection Pooler)
 * Use PgBouncer for even better connection pooling
 */
export const pgBouncerConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PGBOUNCER_HOST || 'localhost',
  port: parseInt(process.env.PGBOUNCER_PORT || '6432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'znak_lavki',
  
  entities: [QualityMark, AuditLog],
  synchronize: false,
  
  extra: {
    max: 100, // More connections through PgBouncer
    min: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    application_name: 'znak-lavki-api',
  },
};

/**
 * Environment Variables Required:
 * 
 * Primary Database:
 * - DB_HOST=postgres-primary
 * - DB_PORT=5432
 * - DB_USER=postgres
 * - DB_PASSWORD=your_password
 * - DB_NAME=znak_lavki
 * 
 * Read Replicas:
 * - DB_REPLICA_1_HOST=postgres-replica-1
 * - DB_REPLICA_1_PORT=5433
 * - DB_REPLICA_2_HOST=postgres-replica-2
 * - DB_REPLICA_2_PORT=5434
 * 
 * Redis:
 * - REDIS_HOST=redis
 * - REDIS_PORT=6379
 * - REDIS_PASSWORD=your_redis_password
 * 
 * PgBouncer:
 * - PGBOUNCER_HOST=pgbouncer
 * - PGBOUNCER_PORT=6432
 */

