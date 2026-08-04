// Liveness probe for Railway's healthcheck (railway.json → healthcheckPath /health).
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return new Response('ok', { status: 200 });
}
