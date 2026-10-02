// The location the user is booking for. Set during onboarding (A2–A6) and from Home's
// address header. Persisted so a returning user lands straight on Home.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage/kv-storage';

export type SelectedLocation = {
  label: string;
  line: string;
  lat: number;
  lng: number;
  serviceable: boolean;
  hubId: string | null;
  /** Set once the location is a saved address (required before paying). */
  addressId: string | null;
};

type LocationState = {
  location: SelectedLocation | null;
  setLocation: (location: SelectedLocation) => void;
  clear: () => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
      clear: () => set({ location: null }),
    }),
    { name: 'location', storage: zustandStorage },
  ),
);
