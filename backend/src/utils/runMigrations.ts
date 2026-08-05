/**
 * Migration Runner
 * Purpose: Executes SQL migration files against the database.
 * Can be run via: npm run migrate
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { pool } from '../config/database';
import { logger } from './logger';

const runMigrations = async (): Promise<void> => {
  const migrationsDir = path.join(__dirname, '../../migrations');

  try {
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        logger.info(`Running migration: ${file}`);
        await pool.query(sql);
        logger.info(`Migration completed: ${file}`);
      }
    }

    logger.info('All migrations executed successfully');
  } catch (error) {
    logger.error('Migration failed', { error: (error as Error).message });
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
