/**
 * useSmsQueue Hook
 * Purpose: Custom React hook that orchestrates the entire SMS automation workflow.
 * Manages state, backend communication, permission handling, and sequential processing.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';
import { smsApi } from '../api/smsApi';
import { smsService } from '../services/smsService';
import { permissionManager } from '../utils/permissions';
import { initializeAxios } from '../api/axiosConfig';
import { logger } from '../utils/logger';
import { SmsMessage, AppState, ProcessingStats } from '../types';

const DEFAULT_DELAY_MS = 2000; // 2 seconds between messages
const MAX_RETRIES = 3;

export const useSmsQueue = () => {
  const [state, setState] = useState<AppState>({
    isConnected: false,
    isBackendConnected: false,
    pendingCount: 0,
    lastSyncTime: null,
    isProcessing: false,
    processingStats: { total: 0, sent: 0, failed: 0, skipped: 0 },
    error: null,
  });

  const isProcessingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deviceIdRef = useRef<string>('');

  // Initialize device ID and axios on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeAxios();
        const deviceId = await DeviceInfo.getUniqueId();
        deviceIdRef.current = deviceId;
        logger.info('App initialized', { deviceId });
      } catch (error) {
        logger.error('Initialization failed', { error: (error as Error).message });
      }
    };
    init();

    // Network state listener
    const unsubscribe = NetInfo.addEventListener((netInfo) => {
      setState((prev) => ({
        ...prev,
        isConnected: netInfo.isConnected ?? false,
      }));
    });

    return () => {
      unsubscribe();
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Check backend connectivity
   */
  const checkBackendConnection = useCallback(async (): Promise<boolean> => {
    try {
      const isHealthy = await smsApi.checkHealth();
      setState((prev) => ({
        ...prev,
        isBackendConnected: isHealthy,
        lastSyncTime: isHealthy ? new Date().toISOString() : prev.lastSyncTime,
        error: isHealthy ? null : prev.error,
      }));
      return isHealthy;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isBackendConnected: false,
        error: 'Backend connection failed',
      }));
      return false;
    }
  }, []);

  /**
   * Fetch pending message count
   */
  const fetchPendingCount = useCallback(async (): Promise<void> => {
    try {
      const count = await smsApi.getPendingCount();
      setState((prev) => ({ ...prev, pendingCount: count }));
    } catch (error) {
      logger.error('Failed to fetch pending count', { error: (error as Error).message });
    }
  }, []);

  /**
   * Process all pending messages sequentially
   */
  const processMessages = useCallback(async (): Promise<void> => {
    if (isProcessingRef.current) {
      logger.warn('Processing already in progress');
      return;
    }

    // Check network
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setState((prev) => ({ ...prev, error: 'No internet connection. Connect via USB tethering or WiFi.' }));
      return;
    }

    // Check permissions
    const hasPermissions = await permissionManager.checkPermissions();
    if (!hasPermissions) {
      const granted = await permissionManager.requestPermissions();
      if (!granted) {
        setState((prev) => ({ ...prev, error: 'SMS permissions required. Please grant permissions in settings.' }));
        return;
      }
    }

    // Check backend
    const isBackendHealthy = await checkBackendConnection();
    if (!isBackendHealthy) {
      setState((prev) => ({ ...prev, error: 'Cannot connect to backend server. Check IP and server status.' }));
      return;
    }

    isProcessingRef.current = true;
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
      processingStats: { total: 0, sent: 0, failed: 0, skipped: 0 },
    }));

    try {
      logger.info('Starting message processing');
      const messages = await smsApi.getPendingMessages();

      if (messages.length === 0) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          pendingCount: 0,
          error: 'No pending messages to send.',
        }));
        isProcessingRef.current = false;
        return;
      }

      const stats: ProcessingStats = { total: messages.length, sent: 0, failed: 0, skipped: 0 };

      for (let i = 0; i < messages.length; i++) {
        // Check if aborted
        if (abortControllerRef.current.signal.aborted) {
          logger.info('Processing aborted by user');
          break;
        }

        const msg = messages[i];
        logger.info(`Processing message ${i + 1}/${messages.length}`, { id: msg.id });

        // Send SMS
        const result = await smsService.sendSms(msg.phoneNumber, msg.message, msg.id);

        if (result.success) {
          // Notify backend
          try {
            await smsApi.markAsSent(msg.id, deviceIdRef.current);
            stats.sent++;
            logger.info('Message marked as sent in backend', { id: msg.id });
          } catch (backendError) {
            logger.error('Failed to update backend status', { id: msg.id, error: (backendError as Error).message });
            stats.failed++;
          }
        } else {
          // Notify backend of failure
          try {
            await smsApi.markAsFailed(msg.id, result.error || 'Unknown error', deviceIdRef.current);
            stats.failed++;
          } catch (backendError) {
            logger.error('Failed to report failure to backend', { id: msg.id });
            stats.failed++;
          }
        }

        // Update progress
        setState((prev) => ({
          ...prev,
          processingStats: { ...stats },
        }));

        // Delay between messages (configurable)
        if (i < messages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, DEFAULT_DELAY_MS));
        }
      }

      // Clear cache and update final state
      smsService.clearCache();
      const finalCount = await smsApi.getPendingCount();

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        pendingCount: finalCount,
        lastSyncTime: new Date().toISOString(),
        processingStats: stats,
        error: stats.failed > 0 ? `${stats.failed} messages failed. Tap Retry to attempt again.` : null,
      }));

      logger.info('Message processing completed', stats);
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error('Processing error', { error: errorMsg });
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMsg,
      }));
    } finally {
      isProcessingRef.current = false;
    }
  }, [checkBackendConnection]);

  /**
   * Abort current processing
   */
  const abortProcessing = useCallback((): void => {
    abortControllerRef.current?.abort();
    isProcessingRef.current = false;
    setState((prev) => ({ ...prev, isProcessing: false }));
    logger.info('Processing aborted');
  }, []);

  /**
   * Retry failed messages
   */
  const retryFailed = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));
      const count = await smsApi.retryFailedMessages();
      logger.info('Failed messages queued for retry', { count });
      await fetchPendingCount();
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: count > 0 ? `${count} messages queued for retry. Tap Send to process.` : 'No failed messages to retry.',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: (error as Error).message,
      }));
    }
  }, [fetchPendingCount]);

  return {
    ...state,
    checkBackendConnection,
    fetchPendingCount,
    processMessages,
    abortProcessing,
    retryFailed,
  };
};
