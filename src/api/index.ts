// Public surface of the API layer: `import { api, queryKeys } from '@/api'`.
// When the OpenAPI client is generated (CD-007), it replaces `endpoints/` and `types/`
// behind this same surface.
import { authApi } from './endpoints/auth';
import { bookingsApi } from './endpoints/bookings';
import { cartApi } from './endpoints/cart';
import { catalogApi } from './endpoints/catalog';
import { configApi } from './endpoints/config';
import { addressesApi, geoApi } from './endpoints/geo';
import { checkoutApi } from './endpoints/payments';
import { profileApi } from './endpoints/profile';
import { recurringApi } from './endpoints/recurring';
import { passApi, walletApi } from './endpoints/wallet';

export const api = {
  addresses: addressesApi,
  auth: authApi,
  bookings: bookingsApi,
  cart: cartApi,
  checkout: checkoutApi,
  catalog: catalogApi,
  config: configApi,
  geo: geoApi,
  pass: passApi,
  profile: profileApi,
  recurring: recurringApi,
  wallet: walletApi,
};

export { request, setAuthFailureHandler } from './client';
export { ApiError, isApiError, type ErrorCode } from './errors';
export { useAppConfig, useFeatureFlag } from './hooks';
export { queryKeys, staleTimes } from './query-keys';
export { queryClient, queryPersister } from './query-client';
export * from './types';
