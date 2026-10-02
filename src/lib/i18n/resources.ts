// One JSON file per namespace per language. Add a namespace per feature as it grows;
// Hindi/Kannada later = a new folder with the same files (Q-45).
import common from './locales/en/common.json';
import errors from './locales/en/errors.json';
import home from './locales/en/home.json';
import onboarding from './locales/en/onboarding.json';

export const resources = {
  en: { common, errors, home, onboarding },
} as const;

export const defaultNS = 'common';
