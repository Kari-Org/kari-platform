import { create } from 'zustand';

interface AvailabilityState {
  online: boolean;
  lastFix: { lat: number; lng: number } | null;
  watching: boolean;
  setOnline: (online: boolean) => void;
  setFix: (fix: { lat: number; lng: number }) => void;
  setWatching: (watching: boolean) => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  online: false,
  lastFix: null,
  watching: false,
  setOnline: (online) => set({ online }),
  setFix: (lastFix) => set({ lastFix }),
  setWatching: (watching) => set({ watching }),
}));
