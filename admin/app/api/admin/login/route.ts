import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/constants';
import { env } from '@/lib/env';

/** Exchanges email/password for a backend admin JWT, stored in an httpOnly cookie. */
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  const res = await fetch(`${env.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    message?: string;
    data?: { user?: { role?: string }; tokens?: { accessToken?: string } };
  };

  if (!res.ok) {
    return NextResponse.json({ error: json?.message ?? 'Login failed' }, { status: res.status });
  }
  const user = json?.data?.user;
  const token = json?.data?.tokens?.accessToken;
  if (!user || user.role !== 'ADMIN' || !token) {
    return NextResponse.json({ error: 'This account is not an admin.' }, { status: 403 });
  }

  const out = NextResponse.json({ user });
  out.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
  });
  return out;
}
