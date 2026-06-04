import { create } from 'zustand';
import type { Ride } from '../api/types';

interface RideState {
  activeRideId: string | null;
  incomingOffer: Ride | null;
  setActiveRide: (id: string | null) => void;
  setIncomingOffer: (offer: Ride | null) => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRideId: null,
  incomingOffer: null,
  setActiveRide: (activeRideId) => set({ activeRideId }),
  setIncomingOffer: (incomingOffer) => set({ incomingOffer }),
}));
