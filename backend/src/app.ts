/**
 * Express Application Setup
 * Purpose: Configures Express app with middleware, routes, and error handling.
 * Follows clean separation of concerns.
 */

import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { securityHeaders, rateLimiter, apiKeyAuth } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import smsRoutes from './routes/smsRoutes';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(securityHeaders);
  app.use(rateLimiter);
  app.use(apiKeyAuth);

  // CORS - Allow mobile app connections
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.debug('Incoming request', { method: req.method, path: req.path, ip: req.ip });
    next();
  });

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Backend health check
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Backend is healthy
   */
  const healthCheck = (_req: express.Request, res: express.Response): void => {
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  };
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);

  // Swagger API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // API routes
  app.use('/messages', smsRoutes);
  app.use('/api/messages', smsRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
