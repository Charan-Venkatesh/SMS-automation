/**
 * SMS Queue Model
 * Purpose: Defines the domain entity for SMS queue records.
 * Enforces type safety and business rules for SMS messages.
 */

export type SmsStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface SmsQueue {
  id: string;
  phoneNumber: string;
  message: string;
  status: SmsStatus;
  createdAt: Date;
  sentAt?: Date;
  retryCount: number;
  errorMessage?: string;
  deviceId?: string;
  updatedAt: Date;
}

export interface CreateSmsRequest {
  phoneNumber: string;
  message: string;
}

export interface UpdateStatusRequest {
  status: SmsStatus;
  errorMessage?: string;
  deviceId?: string;
}

export interface SmsQueueRow {
  id: string;
  phone_number: string;
  message: string;
  status: SmsStatus;
  created_at: Date;
  sent_at: Date | null;
  retry_count: number;
  error_message: string | null;
  device_id: string | null;
  updated_at: Date;
}

export const mapRowToModel = (row: SmsQueueRow): SmsQueue => ({
  id: row.id,
  phoneNumber: row.phone_number,
  message: row.message,
  status: row.status,
  createdAt: row.created_at,
  sentAt: row.sent_at || undefined,
  retryCount: row.retry_count,
  errorMessage: row.error_message || undefined,
  deviceId: row.device_id || undefined,
  updatedAt: row.updated_at,
});
