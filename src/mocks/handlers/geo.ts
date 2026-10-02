import type { Address } from '@/api/types';

import { addresses, places } from '../fixtures/geo';
import { describePoint, isServed } from '../fixtures/serviceability';
import { MockHttpError, route, requireUser } from '../router';

route('GET', '/geo/serviceability', ({ query }) => {
  const lat = Number(query?.lat);
  const lng = Number(query?.lng);
  const serviceable = isServed(lat);
  return {
    serviceable,
    cityId: serviceable ? 'city_blr' : null,
    hubId: serviceable ? 'hub_hsr' : null,
    ...describePoint(lat, lng),
  };
});

route('GET', '/geo/search', ({ query }) => {
  const q = String(query?.q ?? '').toLowerCase();
  return places.filter((p) => `${p.title} ${p.line}`.toLowerCase().includes(q));
});

route('GET', '/addresses', (ctx) => {
  requireUser(ctx);
  return addresses;
});

route('POST', '/addresses', (ctx) => {
  requireUser(ctx);
  const b = ctx.body ?? {};
  if (!b.line1 || !b.label || !/^[6-9]\d{9}$/.test(b.contactPhone ?? '')) {
    throw new MockHttpError(422, 'VALIDATION_FAILED');
  }
  const created: Address = {
    id: `a${addresses.length + 1}_${Date.now()}`,
    label: b.label,
    line1: b.line1,
    flatNo: b.flatNo ?? null,
    landmark: b.landmark ?? null,
    lat: b.lat,
    lng: b.lng,
    contactName: b.contactName,
    contactPhone: b.contactPhone,
  };
  addresses.push(created);
  return created;
});
