import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';
import type { AppConfig } from '../config/config.module';
import { redisConnectionFromUrl } from '../redis/redis.util';

/**
 * Socket.IO adapter backed by Redis pub/sub so events fan out across multiple
 * backend instances — required for horizontal scaling at peak.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly config: AppConfig,
  ) {
    super(app);
  }

  async connect(): Promise<void> {
    const pub = new Redis(redisConnectionFromUrl(this.config.redis.url));
    const sub = pub.duplicate();
    this.adapterConstructor = createAdapter(pub, sub);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
