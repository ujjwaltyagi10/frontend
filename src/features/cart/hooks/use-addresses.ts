import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, queryKeys, type AddressInput } from '@/api';
import { useLocationStore } from '@/stores';

/** Saves an address and makes it the booking address. */
export function useCreateAddress() {
  const qc = useQueryClient();
  const setLocation = useLocationStore((s) => s.setLocation);
  const location = useLocationStore((s) => s.location);
  return useMutation({
    mutationFn: (input: AddressInput) => api.addresses.create(input),
    onSuccess: (address) => {
      if (location) setLocation({ ...location, label: address.label, addressId: address.id });
      void qc.invalidateQueries({ queryKey: queryKeys.addresses });
    },
  });
}
