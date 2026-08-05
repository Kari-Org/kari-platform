/**
 * Backend-URL precedence in src/lib/env.ts — the logic that decides which API a
 * build or OTA actually talks to. Order:
 *   EXPO_PUBLIC_API_URL > (dev LAN host) > extra.apiBaseUrl > localhost
 * A regression here silently points the app at the wrong backend, so it's worth
 * pinning. hostUri stays undefined in the mock, so the dev-LAN branch is inert
 * and __DEV__ does not affect these cases.
 */
type Extra = { apiBaseUrl?: string; socketUrl?: string };
const mockConstants: { expoConfig: { extra?: Extra; hostUri?: string } } = {
  expoConfig: { extra: {} },
};
jest.mock('expo-constants', () => ({ __esModule: true, default: mockConstants }));

type Env = { apiBaseUrl: string; socketUrl: string };
function loadEnv(): Env {
  let mod: { env: Env } | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../src/lib/env') as { env: Env };
  });
  return (mod as { env: Env }).env;
}

describe('env backend-URL precedence', () => {
  const savedEnv = process.env;
  beforeEach(() => {
    process.env = { ...savedEnv };
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_SOCKET_URL;
    mockConstants.expoConfig = { extra: {} };
  });
  afterAll(() => {
    process.env = savedEnv;
  });

  it('EXPO_PUBLIC_API_URL overrides extra.apiBaseUrl', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://override.test';
    mockConstants.expoConfig.extra = { apiBaseUrl: 'https://prod.test' };
    expect(loadEnv().apiBaseUrl).toBe('https://override.test');
  });

  it('with no override, uses extra.apiBaseUrl (production build)', () => {
    mockConstants.expoConfig = { extra: { apiBaseUrl: 'https://prod.test' } };
    expect(loadEnv().apiBaseUrl).toBe('https://prod.test');
  });

  it('socketUrl follows EXPO_PUBLIC_API_URL when the socket var is unset', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    expect(loadEnv().socketUrl).toBe('https://api.test');
  });

  it('falls back to localhost when nothing is configured', () => {
    expect(loadEnv().apiBaseUrl).toBe('http://localhost:5001');
  });
});
