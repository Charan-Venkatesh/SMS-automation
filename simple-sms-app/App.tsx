import React, { useRef, useState } from 'react';
import { NativeModules, PermissionsAndroid, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { DirectSms } = NativeModules as {
  DirectSms?: { sendDirectSms(phoneNumber: string, message: string): void };
};

// Local test queue. Replace with real numbers/messages before building.
const MESSAGE_COUNT = 100;
const queue = Array.from({ length: MESSAGE_COUNT }, (_, i) => ({
  phoneNumber: '+15550000000',
  message: `Test message ${i + 1}`,
}));

const SEND_DELAY_MS = 1500;

export default function App() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(0);
  const [status, setStatus] = useState('Ready');
  const stopRef = useRef(false);

  const requestSmsPermission = async (): Promise<boolean> => {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS, {
      title: 'SMS Permission',
      message: 'This app needs permission to send SMS messages.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startSending = async () => {
    if (isSending) {
      stopRef.current = true;
      return;
    }

    if (!DirectSms) {
      setStatus('SMS module not available on this build.');
      return;
    }

    const hasPermission = await requestSmsPermission();
    if (!hasPermission) {
      setStatus('SMS permission denied.');
      return;
    }

    stopRef.current = false;
    setIsSending(true);
    setSent(0);
    setStatus('Sending...');

    let sentCount = 0;
    for (const item of queue) {
      if (stopRef.current) break;
      DirectSms.sendDirectSms(item.phoneNumber, item.message);
      sentCount += 1;
      setSent(sentCount);
      await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
    }

    setIsSending(false);
    setStatus(stopRef.current ? 'Stopped.' : 'Done.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMS Sender</Text>
      <Text style={styles.subtitle}>{MESSAGE_COUNT} messages queued</Text>

      <TouchableOpacity style={styles.button} onPress={startSending}>
        <Text style={styles.buttonText}>{isSending ? 'Stop Messages' : 'Start Messages'}</Text>
      </TouchableOpacity>

      <Text style={styles.status}>{status}</Text>
      <Text style={styles.counts}>Sent: {sent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  button: { backgroundColor: '#2563eb', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  status: { marginTop: 24, fontSize: 16, color: '#333' },
  counts: { marginTop: 8, fontSize: 16, color: '#059669', fontWeight: '600' },
});
