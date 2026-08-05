/**
 * Database Configuration Module
 * Purpose: Manages PostgreSQL connection pool with environment-based configuration.
 * Implements connection pooling, error handling, and graceful shutdown.
 */

import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  poolSize: number;
}

const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'sms_automation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
});

const poolConfig: PoolConfig = {
  ...getDatabaseConfig(),
  max: getDatabaseConfig().poolSize,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  application_name: 'sms_automation_backend',
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database pool error', { error: err.message });
  process.exit(-1);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query failed', { text: text.substring(0, 100), error: (error as Error).message });
    throw error;
  }
};

export const closePool = async (): Promise<void> => {
  logger.info('Closing database pool...');
  await pool.end();
  logger.info('Database pool closed');
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info('Database connection verified', { time: result.rows[0].current_time });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: (error as Error).message });
    return false;
  }
};
