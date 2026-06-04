import { io, type Socket } from 'socket.io-client';
import { env } from './env';

let socket: Socket | null = null;

/** Lazily create the singleton socket (does not auto-connect). */
export function getSocket(token?: string): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: token ? { token } : undefined,
    });
  }
  return socket;
}

/** Connect (or reconnect) with the latest admin JWT. */
export function connectSocket(token?: string): Socket {
  const s = getSocket(token);
  if (token) s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
