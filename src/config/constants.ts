// Product constants from the PRD / Security doc. Values marked (Q-xx) are still open questions —
// keep them here (or move to remote config) so a decision is a one-line change.

export const PHONE_COUNTRY_CODE = '+91';
export const PHONE_LENGTH = 10;

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 45;

export const BOOKING_STEP_MIN = 30; // (Q-15)
export const ARRIVAL_WINDOW_MIN = 30; // (Q-05)

export const WALLET_TOPUP_PRESETS_PAISE = [25_000, 50_000, 100_000] as const; // (Q-12)
export const WALLET_TOPUP_MIN_PAISE = 100;
export const WALLET_TOPUP_MAX_PAISE = 1_000_000;

export const LOCATION_SEARCH_MIN_CHARS = 3;
export const LOCATION_SEARCH_DEBOUNCE_MS = 300;
export const LOCATION_TIMEOUT_MS = 10_000;
export const CART_SYNC_DEBOUNCE_MS = 400;

export const PAYMENT_POLL_INTERVAL_MS = 2_000;
export const PAYMENT_POLL_TIMEOUT_MS = 60_000;
