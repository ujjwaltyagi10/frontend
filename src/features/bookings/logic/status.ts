import type { BookingStatus } from '@/api';

/** Status label and badge tone, shared by the bookings list and booking detail. */
export const STATUS: Record<
  BookingStatus,
  { label: string; tone: 'primary' | 'success' | 'neutral' | 'danger' | 'dark' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_payment: { label: 'Awaiting payment', tone: 'neutral' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  assigned: { label: 'Professional assigned', tone: 'success' },
  in_progress: { label: 'In progress', tone: 'primary' },
  completed: { label: 'Completed', tone: 'dark' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
};
