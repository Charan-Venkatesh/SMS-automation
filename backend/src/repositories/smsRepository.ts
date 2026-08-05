/**
 * SMS Repository
 * Purpose: Data access layer for SMS queue operations.
 * Implements Repository Pattern to abstract database interactions.
 * All SQL queries are centralized here for maintainability.
 */

import { query } from '../config/database';
import { SmsQueue, SmsQueueRow, SmsStatus, mapRowToModel } from '../models/smsQueue';
import { logger } from '../utils/logger';

export class SmsRepository {
  private readonly tableName = 'sms_queue';

  /**
   * Retrieve all pending SMS messages ordered by creation time (FIFO)
   */
  async getPendingMessages(): Promise<SmsQueue[]> {
    const sql = `
      SELECT id, phone_number, message, status, created_at, sent_at, 
             retry_count, error_message, device_id, updated_at
      FROM ${this.tableName}
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
    `;
    const result = await query<SmsQueueRow>(sql);
    return result.rows.map(mapRowToModel);
  }

  /**
   * Retrieve all messages with optional status filter
   */
  async getAllMessages(status?: SmsStatus): Promise<SmsQueue[]> {
    let sql = `
      SELECT id, phone_number, message, status, created_at, sent_at,
             retry_count, error_message, device_id, updated_at
      FROM ${this.tableName}
    `;
    const params: any[] = [];

    if (status) {
      sql += ` WHERE status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query<SmsQueueRow>(sql, params);
    return result.rows.map(mapRowToModel);
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(id: string): Promise<SmsQueue | null> {
    const sql = `
      SELECT id, phone_number, message, status, created_at, sent_at,
             retry_count, error_message, device_id, updated_at
      FROM ${this.tableName}
      WHERE id = $1
    `;
    const result = await query<SmsQueueRow>(sql, [id]);
    return result.rows.length > 0 ? mapRowToModel(result.rows[0]) : null;
  }

  /**
   * Update message status to SENT
   */
  async markAsSent(id: string, deviceId?: string): Promise<SmsQueue | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'SENT', sent_at = CURRENT_TIMESTAMP, device_id = $2
      WHERE id = $1
      RETURNING id, phone_number, message, status, created_at, sent_at,
                retry_count, error_message, device_id, updated_at
    `;
    const result = await query<SmsQueueRow>(sql, [id, deviceId || null]);
    logger.info('Message marked as sent', { id, deviceId });
    return result.rows.length > 0 ? mapRowToModel(result.rows[0]) : null;
  }

  /**
   * Update message status to FAILED with retry tracking
   */
  async markAsFailed(id: string, errorMessage: string, deviceId?: string): Promise<SmsQueue | null> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'FAILED', 
          error_message = $2, 
          retry_count = retry_count + 1,
          device_id = $3
      WHERE id = $1
      RETURNING id, phone_number, message, status, created_at, sent_at,
                retry_count, error_message, device_id, updated_at
    `;
    const result = await query<SmsQueueRow>(sql, [id, errorMessage, deviceId || null]);
    logger.warn('Message marked as failed', { id, errorMessage, retryCount: result.rows[0]?.retry_count });
    return result.rows.length > 0 ? mapRowToModel(result.rows[0]) : null;
  }

  /**
   * Reset failed messages back to PENDING for retry
   */
  async resetFailedMessages(): Promise<number> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = 'PENDING', error_message = NULL
      WHERE status = 'FAILED' AND retry_count < 3
    `;
    const result = await query(sql);
    logger.info('Failed messages reset for retry', { count: result.rowCount });
    return result.rowCount || 0;
  }

  /**
   * Get count of pending messages
   */
  async getPendingCount(): Promise<number> {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE status = 'PENDING'`;
    const result = await query<{ count: string }>(sql);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Insert a new SMS message
   */
  async createMessage(phoneNumber: string, message: string): Promise<SmsQueue> {
    const sql = `
      INSERT INTO ${this.tableName} (phone_number, message)
      VALUES ($1, $2)
      RETURNING id, phone_number, message, status, created_at, sent_at,
                retry_count, error_message, device_id, updated_at
    `;
    const result = await query<SmsQueueRow>(sql, [phoneNumber, message]);
    logger.info('New message created', { id: result.rows[0].id, phoneNumber });
    return mapRowToModel(result.rows[0]);
  }
}
