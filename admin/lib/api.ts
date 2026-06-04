import { env } from './env';

/** Backend response envelope: { success, message, data, error, timestamp, traceId }. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Token source. Set by the auth layer (A0.3) so `apiFetch` stays decoupled from
 * Auth.js — on the client a getter returns the session's admin JWT; on the
 * server callers pass `token` explicitly.
 */
let tokenGetter: () => string | null | undefined = () => null;
export function setTokenGetter(fn: () => string | null | undefined) {
  tokenGetter = fn;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined>;
}

function withQuery(path: string, query?: FetchOptions['query']): string {
  if (!query) return path;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

interface Envelope<T> {
  data?: T;
  message?: string;
  error?: { message?: string };
}

/** Calls the Kari backend, unwraps the envelope, throws ApiError on failure. */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const token = opts.token ?? tokenGetter();
  // Browser → same-origin proxy (cookie-authenticated); server → backend directly.
  const base = typeof window === 'undefined' ? env.apiBaseUrl : '/api/proxy';
  const res = await fetch(`${base}${withQuery(path, opts.query)}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: 'no-store',
  });

  let json: Envelope<T> | null = null;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const msg = json?.message ?? json?.error?.message ?? res.statusText;
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'Request failed', json);
  }
  return (json?.data ?? (json as unknown)) as T;
}
