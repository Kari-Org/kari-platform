// Liveness probe for Railway's healthcheck (railway.json → healthcheckPath /health).
// Whitelisted in middleware.ts so it isn't redirected to /login.
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return new Response('ok', { status: 200 });
}
