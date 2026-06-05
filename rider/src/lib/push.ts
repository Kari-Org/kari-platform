import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationsApi } from '@/api/endpoints';

/**
 * Best-effort Expo push registration. In Expo Go / on a simulator a token may
 * not be obtainable (no projectId, no remote-push support) — those failures are
 * swallowed rather than blocking the app. On a dev/standalone build it registers
 * the device's Expo push token with the backend.
 */
export async function registerForPush(): Promise<void> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token) {
      await notificationsApi.registerDevice({ token, platform: Platform.OS });
    }
  } catch {
    // no projectId / Expo Go / simulator — best-effort, ignore.
  }
}
