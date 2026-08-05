/**
 * SMS Service
 * Purpose: Business logic layer for SMS queue operations.
 * Orchestrates between controllers and repositories.
 * Handles validation, retry logic, and status transitions.
 */

import { SmsRepository } from '../repositories/smsRepository';
import { SmsQueue, SmsStatus } from '../models/smsQueue';
import { logger } from '../utils/logger';

export class SmsService {
  private readonly repository: SmsRepository;

  constructor(repository: SmsRepository = new SmsRepository()) {
    this.repository = repository;
  }

  /**
   * Get all pending messages for processing
   */
  async getPendingMessages(): Promise<SmsQueue[]> {
    logger.info('Fetching pending messages');
    return this.repository.getPendingMessages();
  }

  /**
   * Get all messages with optional filtering
   */
  async getAllMessages(status?: SmsStatus): Promise<SmsQueue[]> {
    logger.info('Fetching all messages', { status });
    return this.repository.getAllMessages(status);
  }

  /**
   * Mark message as successfully sent
   */
  async markMessageAsSent(id: string, deviceId?: string): Promise<SmsQueue> {
    logger.info('Marking message as sent', { id, deviceId });
    const message = await this.repository.markAsSent(id, deviceId);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    return message;
  }

  /**
   * Mark message as failed with error tracking
   */
  async markMessageAsFailed(id: string, errorMessage: string, deviceId?: string): Promise<SmsQueue> {
    logger.info('Marking message as failed', { id, errorMessage });
    const message = await this.repository.markAsFailed(id, errorMessage, deviceId);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    return message;
  }

  /**
   * Retry failed messages (reset to PENDING if retry count < 3)
   */
  async retryFailedMessages(): Promise<number> {
    logger.info('Retrying failed messages');
    return this.repository.resetFailedMessages();
  }

  /**
   * Get pending message count for dashboard
   */
  async getPendingCount(): Promise<number> {
    return this.repository.getPendingCount();
  }

  /**
   * Create a new SMS message
   */
  async createMessage(phoneNumber: string, message: string): Promise<SmsQueue> {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new Error('Invalid phone number');
    }
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    if (message.length > 1600) {
      throw new Error('Message exceeds maximum length of 1600 characters');
    }
    return this.repository.createMessage(phoneNumber.trim(), message.trim());
  }
}
