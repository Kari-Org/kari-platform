import { io, type Socket } from 'socket.io-client';
import { session } from '../api/session';

let socket: Socket | null = null;

/** Lazily-created singleton socket; sends the current access token on connect. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(session.socketUrl, {
      transports: ['websocket'],
      autoConnect: false,
      auth: (cb) => cb({ token: session.accessToken ?? '' }),
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
