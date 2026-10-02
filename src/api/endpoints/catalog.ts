import { request } from '../client';
import type { HomeResponse, ServiceDetail } from '../types';

export const catalogApi = {
  /** Saved address when there is one; otherwise the raw point (guests, unsaved locations). */
  home: (params: { addressId?: string; lat?: number; lng?: number }) =>
    request<HomeResponse>({
      method: 'GET',
      path: '/home',
      query: { address_id: params.addressId, lat: params.lat, lng: params.lng },
    }),
  service: (slug: string) =>
    request<ServiceDetail>({ method: 'GET', path: `/services/${encodeURIComponent(slug)}` }),
};
