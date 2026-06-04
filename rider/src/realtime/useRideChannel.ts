import { useEffect } from 'react';
import { connectSocket, getSocket } from './socket';

const RIDE_EVENTS = [
  'ride:accepted',
  'ride:arrived',
  'ride:started',
  'ride:completed',
  'ride:cancelled',
  'ride:offer:driver',
] as const;

/**
 * Subscribes to the rider's live ride events (the server emits them to the
 * rider's `user:{id}` room). `onEvent` should be stable (wrap in useCallback).
 */
export function useRideChannel(onEvent: (event: string, payload: unknown) => void): void {
  useEffect(() => {
    const socket = connectSocket();
    const handlers = RIDE_EVENTS.map((evt) => {
      const handler = (payload: unknown) => onEvent(evt, payload);
      socket.on(evt, handler);
      return [evt, handler] as const;
    });
    return () => {
      const s = getSocket();
      handlers.forEach(([evt, handler]) => s.off(evt, handler));
    };
  }, [onEvent]);
}
