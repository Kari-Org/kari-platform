import { create } from 'zustand';
import type { Carpool } from '../api/types';

/**
 * Carpool dispatch state. Unlike rides, a driver discovers carpools only via the
 * `carpool:offer` socket event (there is no "joinable carpools for drivers" read
 * endpoint). Offers accumulate here while the driver is online; once one is
 * accepted we hold its id and poll `GET /carpools/:id` for the live view.
 */
interface CarpoolState {
  offers: Carpool[];
  activeCarpoolId: string | null;
  addOffer: (offer: Carpool) => void;
  removeOffer: (id: string) => void;
  setActive: (id: string | null) => void;
  clearOffers: () => void;
}

export const useCarpoolStore = create<CarpoolState>((set) => ({
  offers: [],
  activeCarpoolId: null,
  addOffer: (offer) =>
    set((s) => (s.offers.some((o) => o.id === offer.id) ? s : { offers: [offer, ...s.offers] })),
  removeOffer: (id) => set((s) => ({ offers: s.offers.filter((o) => o.id !== id) })),
  setActive: (activeCarpoolId) => set({ activeCarpoolId }),
  clearOffers: () => set({ offers: [] }),
}));
