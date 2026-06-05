import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  socketUrl?: string;
};

/**
 * In dev, derive the API host from Metro's `hostUri` (the Mac's LAN IP); the
 * backend runs on :5001 of that same machine. Tracks LAN IP changes with no edits.
 * In production builds `hostUri` is undefined, so fall back to `extra`.
 */
function devApiBase(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  return host ? `http://${host}:5001` : null;
}

const base = (__DEV__ && devApiBase()) || extra.apiBaseUrl || 'http://localhost:5001';
const socket = (__DEV__ && devApiBase()) || extra.socketUrl || 'http://localhost:5001';

export const env = {
  apiBaseUrl: base,
  socketUrl: socket,
};
