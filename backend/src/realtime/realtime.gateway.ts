import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { APP_CONFIG, type AppConfig } from '../config/config.module';
import type { JwtPayload } from '../auth/types';
import { RealtimeService } from './realtime.service';

/**
 * Authenticated Socket.IO gateway. JWT is validated on connect (handshake auth,
 * Authorization header, or `token` query); authenticated sockets auto-join their
 * `user:{id}` room so the platform can dispatch targeted ride/chat events.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.realtime.setServer(server);
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket): void {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new Error('missing token');
      }
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.jwt.accessSecret,
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      void client.join(`user:${payload.sub}`);
      this.logger.debug(`socket ${client.id} authenticated as ${payload.sub}`);
    } catch (err) {
      this.logger.warn(`socket ${client.id} rejected: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`socket ${client.id} disconnected`);
  }

  private extractToken(client: Socket): string | undefined {
    const strip = (s: string) => s.replace(/^Bearer\s+/i, '');
    const auth = client.handshake.auth?.token as string | undefined;
    if (auth) {
      return strip(auth);
    }
    const header = client.handshake.headers?.authorization;
    if (header) {
      return strip(header);
    }
    const q = client.handshake.query?.token;
    return typeof q === 'string' ? q : undefined;
  }
}
