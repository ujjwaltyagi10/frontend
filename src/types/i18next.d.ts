// Makes `t('namespace:key')` type-checked against the English JSON files.
import 'i18next';

import type { defaultNS, resources } from '@/lib/i18n/resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
