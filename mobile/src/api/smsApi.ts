/**
 * SMS API Service
 * Purpose: Encapsulates all backend API calls for SMS operations.
 * Provides a clean interface for the rest of the app.
 */

import { getAxiosInstance } from './axiosConfig';
import { SmsMessage, ApiResponse, ProcessingStats } from '../types';

export class SmsApi {
  /**
   * Check backend health status
   */
  async checkHealth(): Promise<boolean> {
    try {
      const axios = getAxiosInstance();
      const response = await axios.get<ApiResponse<any>>('/health', { timeout: 5000 });
      return response.data.success === true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch all pending messages from backend
   */
  async getPendingMessages(): Promise<SmsMessage[]> {
    const axios = getAxiosInstance();
    const response = await axios.get<ApiResponse<SmsMessage[]>>('/messages/pending');
    return response.data.data || [];
  }

  /**
   * Get count of pending messages
   */
  async getPendingCount(): Promise<number> {
    const axios = getAxiosInstance();
    const response = await axios.get<ApiResponse<{ pendingCount: number }>>('/messages/count');
    return response.data.data?.pendingCount || 0;
  }

  /**
   * Mark message as successfully sent
   */
  async markAsSent(messageId: string, deviceId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.post(`/messages/${messageId}/sent`, { deviceId });
  }

  /**
   * Mark message as failed
   */
  async markAsFailed(messageId: string, errorMessage: string, deviceId: string): Promise<void> {
    const axios = getAxiosInstance();
    await axios.post(`/messages/${messageId}/failed`, { errorMessage, deviceId });
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(): Promise<number> {
    const axios = getAxiosInstance();
    const response = await axios.post<ApiResponse<{ count: number }>>('/messages/retry');
    return response.data.count || 0;
  }
}

export const smsApi = new SmsApi();
