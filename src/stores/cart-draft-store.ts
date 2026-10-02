// What the user has put in the cart before the server has quoted it. Prices are NEVER
// computed here — the cart screen sends this draft to PUT /cart and shows the server quote.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BookingMode, Recurrence } from '@/api/types';
import { BOOKING_STEP_MIN } from '@/config/constants';
import { zustandStorage } from '@/lib/storage/kv-storage';

export type CartDraftItem = { serviceSlug: string; durationMin: number };

type CartDraftState = {
  mode: BookingMode;
  items: CartDraftItem[];
  slotStart: string | null;
  recurrence: Recurrence | null;
  couponCode: string | null;
  setMode: (mode: BookingMode) => void;
  addItem: (serviceSlug: string, durationMin?: number) => void;
  setDuration: (serviceSlug: string, durationMin: number) => void;
  removeItem: (serviceSlug: string) => void;
  /** Picking a slot always means a Scheduled booking. */
  setSlot: (slotStart: string | null) => void;
  setRecurrence: (recurrence: Recurrence | null) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
};

const empty = {
  mode: 'instant' as BookingMode,
  items: [],
  slotStart: null,
  recurrence: null,
  couponCode: null,
};

export const useCartDraftStore = create<CartDraftState>()(
  persist(
    (set) => ({
      ...empty,
      setMode: (mode) => set({ mode }),
      addItem: (serviceSlug, durationMin = BOOKING_STEP_MIN) =>
        set((s) =>
          s.items.some((i) => i.serviceSlug === serviceSlug)
            ? s
            : { items: [...s.items, { serviceSlug, durationMin }] },
        ),
      setDuration: (serviceSlug, durationMin) =>
        set((s) => ({
          items: s.items.map((i) => (i.serviceSlug === serviceSlug ? { ...i, durationMin } : i)),
          // A slot was checked for the old total duration; make the user pick again.
          slotStart: null,
        })),
      removeItem: (serviceSlug) =>
        set((s) => ({ items: s.items.filter((i) => i.serviceSlug !== serviceSlug), slotStart: null })),
      setSlot: (slotStart) => set(slotStart ? { slotStart, mode: 'scheduled' } : { slotStart }),
      setRecurrence: (recurrence) => set({ recurrence }),
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set(empty),
    }),
    { name: 'cart-draft', storage: zustandStorage, version: 2, migrate: () => empty },
  ),
);

export const selectCartCount = (s: CartDraftState) => s.items.length;
export const selectTotalMinutes = (s: CartDraftState) => s.items.reduce((sum, i) => sum + i.durationMin, 0);
