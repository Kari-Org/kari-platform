import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/constants';
import { env } from '@/lib/env';

/**
 * Same-origin proxy: the browser calls `/api/proxy/<backend path>` (cookie sent
 * automatically), and this handler forwards to the backend with the admin JWT
 * from the httpOnly cookie attached as a Bearer token. Keeps the token out of JS.
 */
async function forward(req: NextRequest, path: string[]) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const url = `${env.apiBaseUrl}/${path.join('/')}${req.nextUrl.search}`;
  const body =
    req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();

  const res = await fetch(url, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, (await ctx.params).path);
}
