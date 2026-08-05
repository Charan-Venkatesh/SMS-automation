/**
 * Permissions Utility
 * Purpose: Handles Android runtime permissions for SMS operations.
 * Requests SEND_SMS, READ_SMS, and READ_PHONE_STATE automatically.
 */

import { Platform } from 'react-native';
import { request, check, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { logger } from './logger';

const SMS_PERMISSIONS: Permission[] = [
  PERMISSIONS.ANDROID.SEND_SMS,
  PERMISSIONS.ANDROID.READ_SMS,
  PERMISSIONS.ANDROID.READ_PHONE_STATE,
];

export class PermissionManager {
  /**
   * Check if all required SMS permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      logger.warn('SMS permissions only applicable on Android');
      return false;
    }

    try {
      const results = await Promise.all(
        SMS_PERMISSIONS.map((permission) => check(permission))
      );
      return results.every((result) => result === RESULTS.GRANTED);
    } catch (error) {
      logger.error('Error checking permissions', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Request all required SMS permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      logger.warn('SMS permissions only applicable on Android');
      return false;
    }

    try {
      const results = await Promise.all(
        SMS_PERMISSIONS.map((permission) => request(permission))
      );

      const allGranted = results.every((result) => result === RESULTS.GRANTED);

      if (allGranted) {
        logger.info('All SMS permissions granted');
      } else {
        logger.warn('Some SMS permissions denied', { results });
      }

      return allGranted;
    } catch (error) {
      logger.error('Error requesting permissions', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get detailed permission status for each permission
   */
  async getPermissionStatus(): Promise<Record<string, string>> {
    const status: Record<string, string> = {};

    for (const permission of SMS_PERMISSIONS) {
      const result = await check(permission);
      status[permission] = result;
    }

    return status;
  }
}

export const permissionManager = new PermissionManager();
