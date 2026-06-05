import { useEffect } from 'react';
import { connectSocket, getSocket } from '@kari/mobile-core';

/** Events the driver receives over its `user:{id}` room. */
const DRIVER_EVENTS = ['ride:offer', 'ride:accepted', 'ride:cancelled', 'carpool:offer'] as const;

/**
 * Subscribes to dispatch + ride events. `ride:offer` = a new dispatch (STANDARD
 * or NEGOTIATE); `ride:accepted` = the rider accepted my counter-offer;
 * `ride:cancelled` = the rider cancelled. `onEvent` should be stable (useCallback).
 */
export function useDispatchChannel(onEvent: (event: string, payload: unknown) => void): void {
  useEffect(() => {
    const socket = connectSocket();
    const handlers = DRIVER_EVENTS.map((evt) => {
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
