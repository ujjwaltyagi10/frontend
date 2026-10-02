import { serviceDetails, services } from '../fixtures/catalog';
import { isServed } from '../fixtures/serviceability';
import { MockHttpError, route } from '../router';

route('GET', '/home', ({ query }) => ({
  serviceable: query?.lat === undefined || isServed(Number(query.lat)),
  headline: 'One professional, 16+ home services',
  passBanner: { title: 'ChoreDash Pass', subtitle: 'Save on your next 3 bookings' },
  services,
  trust: { familiesServed: '500,000+', avgRating: 4.8 },
}));

route('GET', '/services/:slug', ({ params }) => {
  const detail = serviceDetails[params.slug];
  if (!detail) throw new MockHttpError(404, 'NOT_FOUND');
  return detail;
});
