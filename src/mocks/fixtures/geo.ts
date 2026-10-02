import type { Address, PlaceResult } from '@/api/types';

import { persisted } from '../persist';

export const places: PlaceResult[] = [
  { id: 'p1', title: 'HSR Layout', line: 'Sector 2, HSR Layout, Bengaluru', lat: 12.9116, lng: 77.6474 },
  { id: 'p2', title: 'Koramangala', line: '5th Block, Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  {
    id: 'p3',
    title: 'Indiranagar',
    line: '100 Feet Road, Indiranagar, Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
  },
  { id: 'p4', title: 'Sector 62', line: 'Sector 62, Noida (not served)', lat: 28.6208, lng: 77.3639 },
];

export const addresses: Address[] = [
  {
    id: 'a1',
    label: 'Home',
    line1: 'S R Brindavan, Sector 2, HSR Layout, Bengaluru',
    flatNo: 'B-304',
    landmark: 'Near Agara Lake',
    lat: 12.9116,
    lng: 77.6474,
    contactName: 'Aditya',
    contactPhone: '9876543210',
  },
];

const initialAddresses = addresses.map((a) => ({ ...a }));
persisted('addresses', {
  save: () => addresses,
  load: (v) => addresses.splice(0, addresses.length, ...(v as Address[])),
  reset: () => addresses.splice(0, addresses.length, ...initialAddresses.map((a) => ({ ...a }))),
});
