import { ApiError } from '@/api/client';

/** Human-readable message for any thrown error (prefers the API's message). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
