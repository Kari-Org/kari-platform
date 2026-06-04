import { create } from 'zustand';

interface RideState {
  activeRideId: string | null;
  lastQuoteRef: string | null;
  setActiveRide: (id: string | null) => void;
  setQuoteRef: (ref: string | null) => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRideId: null,
  lastQuoteRef: null,
  setActiveRide: (activeRideId) => set({ activeRideId }),
  setQuoteRef: (lastQuoteRef) => set({ lastQuoteRef }),
}));
