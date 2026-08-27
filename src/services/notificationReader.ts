import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DeviceEvent } from '../types/scam';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the OS.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[NotificationReader] Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Parses an incoming notification into a structured SeniorShield DeviceEvent.
 */
export function parseNotificationToDeviceEvent(
  notification: Notifications.Notification
): DeviceEvent {
  const content = notification.request.content;
  const title = content.title || 'Incoming Message';
  const body = content.body || '';

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
    type: 'SMS',
    senderOrNumber: title,
    contentOrDuration: body,
    rawPayload: content.data || {},
  };
}

/**
 * Subscribes to incoming device notifications and invokes callback when received.
 * Returns a subscription cleaner.
 */
export function setupNotificationListener(
  onNotificationReceived: (event: DeviceEvent) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[NotificationReader] Notification received:', notification);
    const event = parseNotificationToDeviceEvent(notification);
    onNotificationReceived(event);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Triggers a local test SMS/Notification on the device to test the live reader pipeline.
 */
export async function triggerTestSMSNotification(
  sender: string,
  body: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: sender,
        body: body,
        sound: true,
        data: { type: 'SMS_SIMULATION', sender, body },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.warn('[NotificationReader] Error triggering local test notification:', error);
  }
}
