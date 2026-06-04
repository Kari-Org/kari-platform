import type { RedisOptions } from 'ioredis';

/**
 * Parse a `redis://[user:pass@]host:port[/db]` URL into ioredis connection
 * options. Used by the shared client, BullMQ, and the Socket.IO adapter so they
 * all speak the same connection config.
 */
export function redisConnectionFromUrl(url: string): RedisOptions {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password || undefined,
    db: u.pathname && u.pathname !== '/' ? Number(u.pathname.slice(1)) : 0,
  };
}
