import { route } from '../router';

route('GET', '/config', () => ({
  minAppVersion: '1.0.0',
  featureFlags: { pass: true, recurring: true, referral: true },
  links: {
    about: 'https://example.com/about',
    terms: 'https://example.com/terms',
    privacy: 'https://example.com/privacy',
    support: 'https://example.com/support',
    appStore: null,
    playStore: null,
  },
}));
