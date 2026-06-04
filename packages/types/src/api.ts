/** Uniform response envelope returned by every backend endpoint. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  /** Present only on errors. */
  error?: ApiError;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Correlates the response with server logs. */
  traceId?: string;
}

export interface ApiError {
  code: string;
  detail?: string;
  /** Field-level validation messages, keyed by property path. */
  fields?: Record<string, string[]>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** A geographic point. Order is { lat, lng } everywhere in the platform. */
export interface GeoPoint {
  lat: number;
  lng: number;
}
