import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultNS, resources } from './resources';

// Launch is English only; the device locale is ignored until more languages ship.
const i18n = createInstance();
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources,
  defaultNS,
  ns: Object.keys(resources.en),
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

export { i18n };
export { useTranslation } from 'react-i18next';
export { useErrorMessage } from './use-error-message';
