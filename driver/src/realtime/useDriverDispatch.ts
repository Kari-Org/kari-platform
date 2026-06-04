import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import type { Ride } from '@/api/types';
import { useAvailabilityStore } from '@/stores/availability.store';
import { useRideStore } from '@/stores/ride.store';
import { useDispatchChannel } from './useDispatchChannel';

/**
 * Global dispatch brain — mounted once in the tabs layout. Turns socket events
 * into store + navigation side-effects:
 *   • `ride:offer`     → surface an incoming-request card (only while online & idle)
 *   • `ride:accepted`  → my counter-offer won → take over the active ride
 *   • `ride:cancelled` → the pending offer's rider bailed → dismiss the card
 *
 * The active-ride screen has its own listener for arrived/started/completed, so
 * we deliberately ignore cancellations of a ride we're already driving here.
 */
export function useDriverDispatch(): void {
  const router = useRouter();

  const onEvent = useCallback(
    (evt: string, payload: unknown) => {
      const { online } = useAvailabilityStore.getState();
      const { activeRideId, incomingOffer, setActiveRide, setIncomingOffer } =
        useRideStore.getState();

      if (evt === 'ride:offer') {
        // Only surface a fresh dispatch when we're online and not already busy.
        if (!online || activeRideId || incomingOffer) return;
        setIncomingOffer(payload as Ride);
      } else if (evt === 'ride:accepted') {
        // A rider accepted MY counter-offer — I now own this ride.
        const ride = payload as Ride;
        setIncomingOffer(null);
        setActiveRide(ride.id);
        router.replace('/ride');
      } else if (evt === 'ride:cancelled') {
        const p = payload as { rideId?: string };
        if (p?.rideId && incomingOffer?.id === p.rideId) setIncomingOffer(null);
      }
    },
    [router],
  );

  useDispatchChannel(onEvent);
}
