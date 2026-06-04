import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminRole } from '@kari/types';
import { ADMIN_COOKIE } from './constants';
import { env } from './env';

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  role: string;
  adminRole: AdminRole | null;
}

/** Reads the session cookie and validates it against the backend. Null if unauthenticated / not an admin. */
export async function getSession(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${env.apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: AdminUser };
    const u = json?.data;
    return u && u.role === 'ADMIN' ? u : null;
  } catch {
    return null;
  }
}

/** Server-component guard — redirects to /login when there's no valid admin session. */
export async function requireSession(): Promise<AdminUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}
