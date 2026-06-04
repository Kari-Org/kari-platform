/**
 * API/session config hub. Each app calls {@link configureApi} once at startup
 * with its env-derived URLs + auth-store token callbacks. The client and socket
 * read from here, so they stay app-agnostic (no Zustand / env import → no cycle).
 */
interface ApiConfig {
  baseUrl: string;
  socketUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  onUnauthorized: () => void;
}

let config: ApiConfig = {
  baseUrl: '',
  socketUrl: '',
  getAccessToken: () => null,
  getRefreshToken: () => null,
  setTokens: () => {},
  onUnauthorized: () => {},
};

export function configureApi(patch: Partial<ApiConfig>): void {
  config = { ...config, ...patch };
}

export const session = {
  get baseUrl() {
    return config.baseUrl;
  },
  get socketUrl() {
    return config.socketUrl;
  },
  get accessToken() {
    return config.getAccessToken();
  },
  get refreshToken() {
    return config.getRefreshToken();
  },
  setTokens: (accessToken: string, refreshToken: string) => config.setTokens(accessToken, refreshToken),
  unauthorized: () => config.onUnauthorized(),
};
