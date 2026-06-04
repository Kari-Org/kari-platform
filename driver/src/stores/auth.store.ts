import { create } from 'zustand';
import { configureApi } from '@kari/mobile-core';
import type { AuthTokens, PublicUser } from '../api/types';
import { env } from '../lib/env';
import { secureStorage } from '../lib/storage';

const ACCESS_KEY = 'kari.driver.accessToken';
const REFRESH_KEY = 'kari.driver.refreshToken';

type Status = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthState {
  status: Status;
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (tokens: AuthTokens, user?: PublicUser) => Promise<void>;
  setUser: (user: PublicUser) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      secureStorage.get(ACCESS_KEY),
      secureStorage.get(REFRESH_KEY),
    ]);
    set({
      accessToken,
      refreshToken,
      status: accessToken && refreshToken ? 'authenticated' : 'unauthenticated',
    });
  },

  setSession: async (tokens, user) => {
    await Promise.all([
      secureStorage.set(ACCESS_KEY, tokens.accessToken),
      secureStorage.set(REFRESH_KEY, tokens.refreshToken),
    ]);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
      ...(user ? { user } : {}),
    });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await Promise.all([secureStorage.remove(ACCESS_KEY), secureStorage.remove(REFRESH_KEY)]);
    set({ accessToken: null, refreshToken: null, user: null, status: 'unauthenticated' });
  },
}));

// Wire the shared API client + socket to this store + this app's env URLs.
configureApi({
  baseUrl: env.apiBaseUrl,
  socketUrl: env.socketUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (accessToken, refreshToken) => {
    useAuthStore.setState({ accessToken, refreshToken });
    void secureStorage.set(ACCESS_KEY, accessToken);
    void secureStorage.set(REFRESH_KEY, refreshToken);
  },
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  },
});
