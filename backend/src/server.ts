/**
 * Server Entry Point
 * Purpose: Bootstraps the application, connects to database, and starts HTTP server.
 * Handles graceful shutdown on process termination signals.
 */

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { testConnection, closePool } from './config/database';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    // Verify database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`SMS Automation Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://0.0.0.0:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await closePool();
        logger.info('Database connections closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

startServer();
