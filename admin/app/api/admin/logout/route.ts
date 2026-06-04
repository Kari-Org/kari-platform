import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/constants';

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.delete(ADMIN_COOKIE);
  return out;
}
