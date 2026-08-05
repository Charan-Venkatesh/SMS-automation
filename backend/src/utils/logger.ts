/**
 * Logger Utility
 * Purpose: Centralized logging using Winston with structured JSON format.
 * Supports console and file transports with configurable log levels.
 */

import winston from 'winston';

const { combine, timestamp, json, errors, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${meta}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'sms-automation-backend' },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}
