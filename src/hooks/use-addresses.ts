// Saved addresses, shared by the cart (booking details, address step) and profile (H4).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, queryKeys } from '@/api';
import { useLocationStore, useSessionStore } from '@/stores';

/** Saved addresses; only for logged-in users. */
export function useAddresses() {
  const isUser = useSessionStore((s) => s.status === 'authenticated');
  return useQuery({ queryKey: queryKeys.addresses, queryFn: api.addresses.list, enabled: isUser });
}

/** Deletes an address. If it was the booking address, the location stays but loses its addressId. */
export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.addresses.remove,
    onSuccess: (_r, id) => {
      const { location, setLocation } = useLocationStore.getState();
      if (location?.addressId === id) setLocation({ ...location, addressId: null });
      void qc.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });
}
