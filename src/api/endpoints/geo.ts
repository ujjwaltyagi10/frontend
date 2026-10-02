import { request } from '../client';
import type { Address, AddressInput, PlaceResult, Serviceability } from '../types';

export const geoApi = {
  serviceability: (lat: number, lng: number) =>
    request<Serviceability>({ method: 'GET', path: '/geo/serviceability', query: { lat, lng }, auth: false }),
  search: (q: string) =>
    request<PlaceResult[]>({ method: 'GET', path: '/geo/search', query: { q }, auth: false }),
};

export const addressesApi = {
  list: () => request<Address[]>({ method: 'GET', path: '/addresses' }),
  create: (body: AddressInput) => request<Address>({ method: 'POST', path: '/addresses', body }),
  remove: (id: string) => request<void>({ method: 'DELETE', path: `/addresses/${encodeURIComponent(id)}` }),
};
