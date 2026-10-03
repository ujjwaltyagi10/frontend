// Typed analytics events (Frontend Spec → Analytics events). Adding an event here is the only
// way to send it. Never put phone numbers, addresses or OTPs in properties.
import type { BookingMode } from '@/api/types';

export type AnalyticsEvents = {
  screen_viewed: { screen_id: string };
  location_set: { method: 'gps' | 'search' | 'saved'; serviceable: boolean };
  otp_requested: Record<string, never>;
  otp_verified: { attempt: number };
  otp_failed: { attempt: number };
  login_skipped: Record<string, never>;
  service_viewed: { service_slug: string };
  cart_item_added: { service_slug: string; duration_min: number; source: 'tile' | 'detail' };
  cart_mode_changed: { mode: BookingMode };
  slot_unavailable_shown: { mode: BookingMode; reason: string };
  coupon_applied: { code_type: string };
  coupon_failed: { code_type: string };
  checkout_started: { purpose: 'booking' | 'topup' | 'pass'; amount: number };
  payment_succeeded: { method: string; amount: number };
  payment_failed: { method: string; amount: number; error_code: string };
  booking_confirmed: { mode: BookingMode; amount: number };
  booking_cancelled: { fee_percent: number; refund: number };
  recurring_plan_started: { days: number; amount: number };
  recurring_plan_stopped: Record<string, never>;
  wallet_topup_started: { amount: number; bonus: number };
  pass_viewed: Record<string, never>;
  pass_purchased: Record<string, never>;
  referral_shared: { channel: string };
  support_opened: { from_screen: string };
};
