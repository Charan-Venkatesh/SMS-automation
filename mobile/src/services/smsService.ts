/**
 * SMS Service
 * Purpose: Handles native Android SMS sending using SmsManager.
 * Bridges React Native JavaScript with Android native SMS APIs.
 * 
 * NOTE: This service uses react-native-sms package. For custom native module,
 * see the Android native module implementation in the android/ directory.
 */

import { NativeModules, Platform } from 'react-native';
import { logger } from '../utils/logger';
import { SendResult } from '../types';

// Native module interface
interface SmsManagerModule {
  sendSms(phoneNumber: string, message: string): Promise<string>;
}

const { SmsManager } = NativeModules as { SmsManager?: SmsManagerModule };

export class SmsService {
  private sentMessages: Set<string> = new Set();

  /**
   * Send a single SMS message using native Android SmsManager
   */
  async sendSms(phoneNumber: string, message: string, messageId: string): Promise<SendResult> {
    // Duplicate prevention
    if (this.sentMessages.has(messageId)) {
      logger.warn('Duplicate message detected, skipping', { messageId });
      return { messageId, success: true };
    }

    if (Platform.OS !== 'android') {
      logger.error('SMS sending only supported on Android');
      return { messageId, success: false, error: 'Platform not supported' };
    }

    try {
      logger.info('Sending SMS', { messageId, phoneNumber: this.maskPhone(phoneNumber) });

      // Option 1: Using react-native-sms package (recommended for production)
      // import SendSMS from 'react-native-sms';
      // await SendSMS.send({
      //   body: message,
      //   recipients: [phoneNumber],
      //   successTypes: ['sent', 'queued'],
      // });

      // Option 2: Using custom native module (see android/ directory)
      if (SmsManager) {
        await SmsManager.sendSms(phoneNumber, message);
      } else {
        // Fallback: Use Intent-based SMS (opens SMS app - not fully automatic)
        // For fully automatic, native module is required
        throw new Error('Native SMS module not available. Please build with custom native module.');
      }

      this.sentMessages.add(messageId);
      logger.info('SMS sent successfully', { messageId });

      return { messageId, success: true };
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error('SMS send failed', { messageId, error: errorMsg });
      return { messageId, success: false, error: errorMsg };
    }
  }

  /**
   * Clear sent message cache (call after batch completion)
   */
  clearCache(): void {
    this.sentMessages.clear();
    logger.info('Sent message cache cleared');
  }

  /**
   * Mask phone number for logging (privacy)
   */
  private maskPhone(phone: string): string {
    if (phone.length < 8) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-3);
  }
}

export const smsService = new SmsService();
