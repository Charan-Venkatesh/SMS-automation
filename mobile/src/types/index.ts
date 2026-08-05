/**
 * Type Definitions
 * Purpose: Centralized TypeScript interfaces and types for the mobile application.
 */

export type SmsStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface SmsMessage {
  id: string;
  phoneNumber: string;
  message: string;
  status: SmsStatus;
  createdAt: string;
  sentAt?: string;
  retryCount: number;
  errorMessage?: string;
  deviceId?: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

export interface SendResult {
  messageId: string;
  success: boolean;
  error?: string;
}

export interface ProcessingStats {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface AppState {
  isConnected: boolean;
  isBackendConnected: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  isProcessing: boolean;
  processingStats: ProcessingStats;
  error: string | null;
}

export interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryDelay: number;
}
