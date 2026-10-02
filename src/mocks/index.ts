// Entry point loaded by `src/api/client.ts` only when EXPO_PUBLIC_USE_MOCKS=true.
// Importing a handler file registers its routes. Add one file per backend module.
import './handlers/auth';
import './handlers/bookings';
import './handlers/cart';
import './handlers/catalog';
import './handlers/config';
import './handlers/geo';
import './handlers/payments';
import './handlers/profile';
import './handlers/wallet';

import { createMockTransport } from './router';

export const mockTransport = createMockTransport();
