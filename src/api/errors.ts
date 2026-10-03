// Stable error codes shared with the backend (Architecture doc → API design).
// UI text for each code lives in the `errors` i18n namespace, never here.

export const ERROR_CODES = [
  'OTP_INVALID',
  'OTP_LOCKED',
  'OTP_SEND_LIMIT',
  'SLOT_UNAVAILABLE',
  'LARGE_ORDER_SCHEDULE_ONLY',
  'NOT_SERVICEABLE',
  'PAYMENT_FAILED',
  'LOGIN_REQUIRED',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'FORBIDDEN',
  'PARTNER_NOT_REGISTERED',
  'RATE_LIMITED',
  'CONFLICT',
  'NOT_IMPLEMENTED',
  'GIFT_CARD_INVALID',
  'GIFT_CARD_LOCKED',
  'INSUFFICIENT_BALANCE',
  'NETWORK_ERROR',
  'UNKNOWN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function toErrorCode(raw: unknown): ErrorCode {
  return ERROR_CODES.includes(raw as ErrorCode) ? (raw as ErrorCode) : 'UNKNOWN';
}
