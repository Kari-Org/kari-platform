import { type NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/constants';

const PUBLIC_PATHS = ['/login'];

/** Cookie-presence gate. Full validation happens server-side via getSession(). */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = req.cookies.has(ADMIN_COOKIE);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (authed && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes + Next internals + static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
