/**
 * Security Middleware
 * Purpose: Applies security headers, rate limiting, and API key validation.
 * Protects the backend from common attacks and abuse.
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    next();
    return;
  }

  if (!apiKey || apiKey !== expectedKey) {
    logger.warn('Unauthorized API access attempt', { ip: req.ip, path: req.path });
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing API key',
    });
    return;
  }

  next();
};
