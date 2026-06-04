import { create } from 'zustand';

export interface GeoPlace {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationState {
  current: GeoPlace | null;
  pickup: GeoPlace | null;
  dropoff: GeoPlace | null;
  setCurrent: (place: GeoPlace) => void;
  setPickup: (place: GeoPlace | null) => void;
  setDropoff: (place: GeoPlace | null) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  pickup: null,
  dropoff: null,
  setCurrent: (current) => set({ current }),
  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  reset: () => set({ pickup: null, dropoff: null }),
}));
