import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { DeviceEvent } from '../types/scam';

/**
 * Resolves the native SMS module instance.
 */
function getSmsModule(): any {
  if (NativeModules.Sms) {
    return NativeModules.Sms;
  }
  try {
    const mod = require('react-native-get-sms-android');
    return mod?.default || mod || NativeModules.Sms;
  } catch (e) {
    console.log('[DeviceScanner] react-native-get-sms-android fallback failed:', e);
    return NativeModules.Sms;
  }
}

/**
 * Request runtime permissions for SMS and Call Log access on Android.
 */
export async function requestDevicePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    console.log('[DeviceScanner] Non-Android environment detected.');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]);

    const hasSmsPermission =
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED;
    const hasCallLogPermission =
      granted['android.permission.READ_CALL_LOG'] === PermissionsAndroid.RESULTS.GRANTED;

    console.log('[DeviceScanner] Permissions status -> SMS:', hasSmsPermission, 'CallLog:', hasCallLogPermission);
    return hasSmsPermission && hasCallLogPermission;
  } catch (error) {
    console.warn('[DeviceScanner] Error requesting Android device permissions:', error);
    return false;
  }
}

/**
 * Fetch recent SMS messages from device inbox using native Sms module in DESCENDING order (newest first).
 */
export async function fetchRecentSMS(limit = 15): Promise<DeviceEvent[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    const SmsModule = getSmsModule();

    if (!SmsModule || !SmsModule.list) {
      console.warn('[DeviceScanner] SmsModule.list not found on NativeModules.Sms.');
      return [];
    }

    // sortOrder: 'date DESC' ensures newest SMS are retrieved first
    const filter = {
      box: 'inbox',
      maxCount: limit,
      sortOrder: 'date DESC',
    };

    return new Promise((resolve) => {
      SmsModule.list(
        JSON.stringify(filter),
        (fail: string) => {
          console.warn('[DeviceScanner] Failed to fetch SMS:', fail);
          resolve([]);
        },
        (count: number, smsListString: string) => {
          try {
            const list = typeof smsListString === 'string' ? JSON.parse(smsListString) : smsListString;
            if (!Array.isArray(list)) {
              console.log('[DeviceScanner] SMS list result is not an array:', list);
              resolve([]);
              return;
            }

            console.log(`[DeviceScanner] Retrieved ${list.length} recent messages from device inbox.`);

            const events: DeviceEvent[] = list.map((item: any) => ({
              id: `sms_${item._id || item.date || Math.random().toString(36).substring(7)}`,
              timestamp: Number(item.date) || Date.now(),
              type: 'SMS',
              senderOrNumber: item.address || 'Unknown Sender',
              contentOrDuration: item.body || '',
              rawPayload: item,
            }));
            resolve(events);
          } catch (parseErr) {
            console.warn('[DeviceScanner] Error parsing SMS list JSON:', parseErr);
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.warn('[DeviceScanner] Exception fetching device SMS:', error);
    return [];
  }
}

/**
 * Fetch recent Call Logs using react-native-call-log.
 */
export async function fetchRecentCalls(limit = 10): Promise<DeviceEvent[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  try {
    let CallLog: any = null;
    try {
      CallLog = require('react-native-call-log');
    } catch {
      console.log('[DeviceScanner] react-native-call-log not loaded in this environment.');
    }

    if (!CallLog || !CallLog.get) {
      return [];
    }

    const logs = await CallLog.get(limit);
    if (!Array.isArray(logs)) {
      return [];
    }

    const events: DeviceEvent[] = logs.map((log: any) => {
      const durationSec = Number(log.duration) || 0;
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;
      const typeStr = log.type === 'INCOMING' ? 'Incoming Call' : log.type === 'MISSED' ? 'Missed Call' : 'Outgoing Call';

      return {
        id: `call_${log.timestamp || Math.random().toString(36).substring(7)}`,
        timestamp: Number(log.timestamp) || Date.now(),
        type: 'CALL',
        senderOrNumber: log.phoneNumber || log.name || 'Unknown Number',
        contentOrDuration: `${typeStr} (Duration: ${minutes}m ${seconds}s)`,
        rawPayload: log,
      };
    });

    return events;
  } catch (error) {
    console.warn('[DeviceScanner] Exception fetching device Call Logs:', error);
    return [];
  }
}

/**
 * Combined scanner that retrieves and chronologically sorts recent device communications.
 */
export async function scanDeviceComms(): Promise<DeviceEvent[]> {
  const [smsEvents, callEvents] = await Promise.all([fetchRecentSMS(15), fetchRecentCalls(10)]);
  const combined = [...smsEvents, ...callEvents];
  combined.sort((a, b) => a.timestamp - b.timestamp);
  return combined;
}
