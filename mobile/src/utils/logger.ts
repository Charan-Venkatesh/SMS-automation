/**
 * Mobile Logger Utility
 * Purpose: Structured logging for the mobile application.
 * Logs to console in development, can be extended to file logging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = __DEV__;

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    if (this.isDevelopment) {
      const colorMap: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      console.log(`${colorMap[level]}[${timestamp}] [${level.toUpperCase()}]: ${message}\x1b[0m`, meta || '');
    } else {
      // In production, could send to crash analytics or log service
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }
}

export const logger = new Logger();
