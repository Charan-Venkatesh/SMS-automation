/**
 * Home Screen
 * Purpose: Main dashboard displaying connection status, pending count,
 * and the primary "Send Messages" action button with progress tracking.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  ProgressBar,
  Surface,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSmsQueue } from '../hooks/useSmsQueue';
import { logger } from '../utils/logger';
import { updateBaseUrl } from '../api/axiosConfig';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const {
    isConnected,
    isBackendConnected,
    pendingCount,
    lastSyncTime,
    isProcessing,
    processingStats,
    error,
    checkBackendConnection,
    fetchPendingCount,
    processMessages,
    abortProcessing,
    retryFailed,
  } = useSmsQueue();

  const [refreshing, setRefreshing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [backendUrl, setBackendUrl] = useState('http://192.168.1.100:3000');

  // Initial load
  useEffect(() => {
    const load = async () => {
      await checkBackendConnection();
      await fetchPendingCount();
    };
    load();
  }, [checkBackendConnection, fetchPendingCount]);

  // Auto-refresh pending count every 10 seconds when not processing
  useEffect(() => {
    if (isProcessing) return;
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [isProcessing, fetchPendingCount]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkBackendConnection();
    await fetchPendingCount();
    setRefreshing(false);
  };

  const handleSendPress = () => {
    if (pendingCount === 0) {
      Alert.alert('No Messages', 'There are no pending messages to send.');
      return;
    }
    Alert.alert(
      'Send Messages',
      `You are about to send ${pendingCount} SMS messages. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: processMessages },
      ]
    );
  };

  const handleSaveSettings = async () => {
    try {
      await updateBaseUrl(backendUrl);
      setSettingsVisible(false);
      await checkBackendConnection();
      Alert.alert('Success', 'Backend URL updated successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update backend URL.');
    }
  };

  const progress = processingStats.total > 0
    ? (processingStats.sent + processingStats.failed) / processingStats.total
    : 0;

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.title}>
            SMS Automation
          </Text>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setSettingsVisible(true)}
          />
        </View>
      </Surface>

      {/* Status Cards */}
      <View style={styles.statusContainer}>
        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={[styles.indicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
              <View>
                <Text variant="titleSmall">Network</Text>
                <Text variant="bodySmall">{isConnected ? 'Connected' : 'Disconnected'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statusCard}>
          <Card.Content>
            <View style={styles.statusRow}>
              <View style={[styles.indicator, { backgroundColor: isBackendConnected ? '#4CAF50' : '#F44336' }]} />
              <View>
                <Text variant="titleSmall">Backend</Text>
                <Text variant="bodySmall">{isBackendConnected ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Pending Count */}
      <Card style={styles.countCard}>
        <Card.Content style={styles.countContent}>
          <Text variant="displayLarge" style={{ color: theme.colors.primary }}>
            {pendingCount}
          </Text>
          <Text variant="titleMedium">Pending Messages</Text>
          <Text variant="bodySmall" style={styles.syncTime}>
            Last sync: {formatTime(lastSyncTime)}
          </Text>
        </Card.Content>
      </Card>

      {/* Error Display */}
      {error && (
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
              {error}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Progress Section */}
      {isProcessing && (
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.progressTitle}>
              Sending Messages...
            </Text>
            <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
            <View style={styles.statsRow}>
              <Text variant="bodySmall">Total: {processingStats.total}</Text>
              <Text variant="bodySmall" style={{ color: '#4CAF50' }}>
                Sent: {processingStats.sent}
              </Text>
              <Text variant="bodySmall" style={{ color: '#F44336' }}>
                Failed: {processingStats.failed}
              </Text>
            </View>
            <Button mode="outlined" onPress={abortProcessing} style={styles.abortButton}>
              Cancel
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Results Section */}
      {!isProcessing && processingStats.total > 0 && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.resultTitle}>
              Processing Complete
            </Text>
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: '#4CAF50' }}>
                  {processingStats.sent}
                </Text>
                <Text variant="bodySmall">Sent</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: '#F44336' }}>
                  {processingStats.failed}
                </Text>
                <Text variant="bodySmall">Failed</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall">
                  {processingStats.total}
                </Text>
                <Text variant="bodySmall">Total</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          icon="send"
          onPress={handleSendPress}
          loading={isProcessing}
          disabled={isProcessing || pendingCount === 0}
          style={styles.sendButton}
          contentStyle={styles.buttonContent}
        >
          {isProcessing ? 'Sending...' : 'Send Messages'}
        </Button>

        {processingStats.failed > 0 && (
          <Button
            mode="outlined"
            icon="refresh"
            onPress={retryFailed}
            disabled={isProcessing}
            style={styles.retryButton}
          >
            Retry Failed
          </Button>
        )}
      </View>

      {/* Settings Dialog */}
      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Backend Settings</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.settingHint}>
              Enter the backend server URL. Use your laptop's IP address.
            </Text>
            <TextInput
              label="Backend URL"
              value={backendUrl}
              onChangeText={setBackendUrl}
              placeholder="http://192.168.1.100:3000"
              style={styles.input}
            />
            <Text variant="bodySmall" style={styles.settingHint}>
              Examples:
              {'\n'}• WiFi: http://192.168.1.100:3000
              {'\n'}• USB Tethering: http://192.168.42.1:3000
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveSettings}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statusCard: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  countCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  countContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  syncTime: {
    marginTop: 8,
    opacity: 0.6,
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  progressTitle: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  abortButton: {
    marginTop: 8,
  },
  resultCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  resultTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  sendButton: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  retryButton: {
    borderRadius: 8,
  },
  settingHint: {
    marginBottom: 12,
    opacity: 0.7,
  },
  input: {
    marginBottom: 8,
  },
});
