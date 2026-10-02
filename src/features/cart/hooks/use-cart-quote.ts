import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { api, isApiError, queryKeys, staleTimes, type CartInput } from '@/api';
import { CART_SYNC_DEBOUNCE_MS } from '@/config/constants';
import { useCartDraftStore, useLocationStore } from '@/stores';

/**
 * Sends the cart draft to PUT /cart (debounced 400 ms) and returns the server quote.
 * While the draft has changed but the new quote hasn't arrived, `isStale` is true and the
 * bill shows a spinner — the app never shows a price it calculated itself.
 */
export function useCartQuote() {
  const { mode, items, slotStart, recurrence, couponCode } = useCartDraftStore(
    useShallow((s) => ({
      mode: s.mode,
      items: s.items,
      slotStart: s.slotStart,
      recurrence: s.recurrence,
      couponCode: s.couponCode,
    })),
  );
  const location = useLocationStore((s) => s.location);

  const input = useMemo<CartInput>(
    () => ({
      mode,
      items,
      addressId: location?.addressId ?? null,
      // Always send the point too: the server uses the saved address when it has one, and the
      // point lets the cart recover if that address is gone (see below).
      location: location ? { lat: location.lat, lng: location.lng } : null,
      slotStart: mode === 'scheduled' ? slotStart : null,
      recurrence: mode === 'recurring' ? recurrence : null,
      couponCode,
    }),
    [mode, items, slotStart, recurrence, couponCode, location],
  );

  const debounced = useDebounced(input, CART_SYNC_DEBOUNCE_MS);

  const query = useQuery({
    queryKey: queryKeys.cartQuote(debounced),
    queryFn: () => api.cart.put(debounced),
    enabled: debounced.items.length > 0,
    staleTime: staleTimes.cart,
    placeholderData: keepPreviousData,
  });

  // The saved address was deleted (another device, or the account was reset): forget it and
  // re-quote from the location, so the footer asks for the address again instead of failing.
  const addressGone =
    !!debounced.addressId && isApiError(query.error) && query.error.code === 'NOT_FOUND' && !query.data;
  useEffect(() => {
    if (!addressGone) return;
    const { location: current, setLocation } = useLocationStore.getState();
    if (current?.addressId) setLocation({ ...current, addressId: null });
  }, [addressGone]);

  return {
    input,
    quote: query.data,
    error: query.error,
    refetch: query.refetch,
    isStale: input !== debounced || query.isPlaceholderData || query.isFetching,
  };
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
