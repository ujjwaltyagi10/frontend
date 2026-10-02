import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { api } from '@/api';
import { track } from '@/lib/analytics';
import { useLocationStore, useSessionStore } from '@/stores';

type Input = { lat: number; lng: number; method: 'gps' | 'search' | 'saved'; addressId?: string };

/** Checks serviceability for a point, makes it the selected location, then moves on. */
export function useResolveLocation() {
  const setLocation = useLocationStore((s) => s.setLocation);
  return useMutation({
    mutationFn: async ({ lat, lng, addressId }: Input) => {
      const s = await api.geo.serviceability(lat, lng);
      return { ...s, lat, lng, addressId: addressId ?? null };
    },
    onSuccess: (r, { method }) => {
      setLocation({
        label: r.label,
        line: r.line,
        lat: r.lat,
        lng: r.lng,
        serviceable: r.serviceable,
        hubId: r.hubId,
        addressId: r.addressId,
      });
      track('location_set', { method, serviceable: r.serviceable });
      // First run continues to login (A7); from Home's address header it returns to Home.
      if (useSessionStore.getState().status === 'signedOut') router.replace('/login');
      else router.dismissTo('/');
    },
  });
}
