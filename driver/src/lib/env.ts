import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  socketUrl?: string;
};

/**
 * In dev, derive the API host from Metro's `hostUri` (the Mac's LAN IP); the
 * backend runs on :3000 of that same machine. Tracks LAN IP changes with no edits.
 * In production builds `hostUri` is undefined, so fall back to `extra`.
 */
function devApiBase(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  return host ? `http://${host}:3000` : null;
}

const base = (__DEV__ && devApiBase()) || extra.apiBaseUrl || 'http://localhost:3000';
const socket = (__DEV__ && devApiBase()) || extra.socketUrl || 'http://localhost:3000';

export const env = {
  apiBaseUrl: base,
  socketUrl: socket,
};
