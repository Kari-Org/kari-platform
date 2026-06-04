import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { availabilityApi } from '@/api/endpoints';
import { useAvailabilityStore } from '@/stores/availability.store';

const BG_TASK = 'kari-driver-location';

/**
 * Background location task. Runs in a headless JS context (no React state), so
 * it only pushes the fix to the store + backend. Registered at module load.
 */
TaskManager.defineTask(BG_TASK, async ({ data, error }) => {
  if (error) return;
  const locs = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const fix = locs?.[locs.length - 1];
  if (!fix) return;
  const lat = fix.coords.latitude;
  const lng = fix.coords.longitude;
  useAvailabilityStore.getState().setFix({ lat, lng });
  try {
    await availabilityApi.location({ lat, lng });
  } catch {
    /* best-effort; next fix will retry */
  }
});

let foregroundSub: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

function pushFix(lat: number, lng: number) {
  useAvailabilityStore.getState().setFix({ lat, lng });
  void availabilityApi.location({ lat, lng }).catch(() => {});
}

/**
 * Streams the driver's location while online. Prefers a **true background task**
 * (`startLocationUpdatesAsync`, keeps tracking when backgrounded) — that needs an
 * EAS dev/standalone build. In Expo Go (which can't run the task) it falls back
 * to a **foreground** watcher so dev still works.
 */
export async function startTracking(): Promise<boolean> {
  const ok = await requestLocationPermission();
  if (!ok) return false;
  useAvailabilityStore.getState().setWatching(true);

  try {
    // Background ("Always") permission is only granted in a dev/standalone build.
    await Location.requestBackgroundPermissionsAsync().catch(() => undefined);
    const already = await Location.hasStartedLocationUpdatesAsync(BG_TASK).catch(() => false);
    if (!already) {
      await Location.startLocationUpdatesAsync(BG_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
        timeInterval: 10_000,
        showsBackgroundLocationIndicator: false,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: 'Kari Driver',
          notificationBody: 'Sharing your location while you’re online.',
        },
      });
    }
    return true;
  } catch {
    // Expo Go (no background task) → foreground watcher.
    if (foregroundSub) return true;
    foregroundSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 10_000 },
      (pos) => pushFix(pos.coords.latitude, pos.coords.longitude),
    );
    return true;
  }
}

export async function stopTracking(): Promise<void> {
  foregroundSub?.remove();
  foregroundSub = null;
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(BG_TASK).catch(() => false);
    if (started) await Location.stopLocationUpdatesAsync(BG_TASK);
  } catch {
    /* nothing to stop */
  }
  useAvailabilityStore.getState().setWatching(false);
}
