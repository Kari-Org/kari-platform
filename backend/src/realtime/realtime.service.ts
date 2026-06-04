import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

/**
 * Thin facade over the Socket.IO server so feature services can push targeted
 * events without depending on the gateway. Emissions are always scoped to a
 * room (user or ride) — never a global broadcast.
 */
@Injectable()
export class RealtimeService {
  private server?: Server;

  /** Called by the gateway once the server is initialized. */
  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }
}
