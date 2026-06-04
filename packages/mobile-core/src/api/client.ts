import type { ApiResponse } from '@kari/types';
import { session } from './session';

/** Normalized API error surfaced to the UI. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = session.refreshToken;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${session.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiResponse<{
      tokens: { accessToken: string; refreshToken: string };
    }>;
    if (!res.ok || !json.success || !json.data) return false;
    session.setTokens(json.data.tokens.accessToken, json.data.tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * The one path to the API. Attaches the bearer token, unwraps the
 * `ApiResponse<T>` envelope, transparently refreshes once on 401, and throws a
 * normalized {@link ApiError} on failure.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const send = (): Promise<Response> => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (auth && session.accessToken) {
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return fetch(`${session.baseUrl}${path}`, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();

  if (res.status === 401 && auth && session.refreshToken) {
    refreshing = refreshing ?? refreshTokens();
    const ok = await refreshing;
    refreshing = null;
    if (ok) {
      res = await send();
    } else {
      session.unauthorized();
    }
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, 'NETWORK', 'Unexpected response from server');
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      json.error?.code ?? 'ERROR',
      json.message ?? 'Request failed',
      json.error?.fields,
    );
  }
  return json.data as T;
}
