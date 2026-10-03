// One JSON file per namespace per language. Add a namespace per feature as it grows;
// Hindi/Kannada later = a new folder with the same files (Q-45).
import common from './locales/en/common.json';
import errors from './locales/en/errors.json';
import home from './locales/en/home.json';
import onboarding from './locales/en/onboarding.json';
import recurring from './locales/en/recurring.json';
import support from './locales/en/support.json';

export const resources = {
  en: { common, errors, home, onboarding, recurring, support },
} as const;

export const defaultNS = 'common';
