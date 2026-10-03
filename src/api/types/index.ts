import type { IsoDateTime, Paise, Uuid } from './common';

export type { CursorPage, IsoDateTime, Paise, Uuid } from './common';

// ---- Config ---------------------------------------------------------------

export type AppConfig = {
  minAppVersion: string;
  featureFlags: Record<string, boolean>;
  links: {
    about: string;
    terms: string;
    privacy: string;
    support: string;
    /** Force-update targets; null until the store listings exist (Q-06). */
    appStore: string | null;
    playStore: string | null;
  };
};

// ---- Auth -----------------------------------------------------------------

export type OtpSendRequest = { phone: string; whatsappOptIn: boolean };
export type OtpSendResponse = { resendAfterSec: number };
export type OtpVerifyRequest = { phone: string; otp: string };

export type AuthTokens = { accessToken: string; refreshToken: string };
export type User = {
  id: Uuid;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};
export type OtpVerifyResponse = AuthTokens & { user: User; isNewUser: boolean };

// ---- Geo ------------------------------------------------------------------

export type Serviceability = {
  serviceable: boolean;
  cityId: Uuid | null;
  hubId: Uuid | null;
  label: string;
  line: string;
};

export type PlaceResult = { id: string; title: string; line: string; lat: number; lng: number };

export type Address = {
  id: Uuid;
  label: string;
  line1: string;
  flatNo: string | null;
  landmark: string | null;
  lat: number;
  lng: number;
  contactName: string;
  contactPhone: string;
};

// ---- Catalog / Home -------------------------------------------------------

export type ServiceSummary = {
  slug: string;
  name: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  pricePaise: Paise;
  mrpPaise: Paise | null;
  defaultDurationMin: number;
  isNew: boolean;
};

export type HomeResponse = {
  serviceable: boolean;
  headline: string;
  passBanner: { title: string; subtitle: string } | null;
  services: ServiceSummary[];
  trust: { familiesServed: string; avgRating: number };
};

export type DurationOption = {
  durationMin: number;
  pricePaise: Paise;
  mrpPaise: Paise | null;
};

export type ServiceDetail = ServiceSummary & {
  tagline: string;
  durations: DurationOption[];
  includes: string[];
  excludes: string[];
  steps: { title: string; body: string }[];
  faqs: { question: string; answer: string }[];
};

// ---- Bookings (shape fixed early because many features read it) -----------

export type BookingMode = 'instant' | 'scheduled' | 'recurring';
export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

export type BookingSummary = {
  id: Uuid;
  mode: BookingMode;
  status: BookingStatus;
  slotStart: IsoDateTime;
  durationMin: number;
  serviceNames: string[];
  addressLine: string;
  totalPaise: Paise;
};

// ---- Addresses --------------------------------------------------------------

export type AddressInput = Omit<Address, 'id'>;

// ---- Cart & slots (contract defined here first; mirrored in Backend/api/openapi.yaml) ---

export type CartItemInput = { serviceSlug: string; durationMin: number };

/** Weekly plan for Recurring mode: 0 = Sunday … 6 = Saturday; slotTime is IST "HH:mm". */
export type Recurrence = { daysOfWeek: number[]; slotTime: string };

/**
 * A weekly plan (Recurring mode, CD-041): the same services on the chosen weekdays at one time.
 * Paid only from ChoreDash Money — each visit's amount is held 48 h before; a visit the balance
 * can't cover 12 h before is skipped, not cancelled. Prices are the server's, per visit.
 */
export type RecurringPlan = {
  id: Uuid;
  status: 'active' | 'stopped';
  /** 0 = Sunday … 6 = Saturday, as in Recurrence. */
  daysOfWeek: number[];
  /** IST HH:mm. */
  slotTime: string;
  items: { serviceSlug: string; name: string; imageUrl: string; durationMin: number }[];
  perVisitPaise: Paise;
  /** The next visit that will be booked; null once stopped. */
  nextVisitAt: IsoDateTime | null;
  addressLine: string;
  createdAt: IsoDateTime;
};

/** PUT /cart replaces the whole cart and returns a fresh quote. Guests get a quote too (Q-16). */
export type CartInput = {
  mode: BookingMode;
  items: CartItemInput[];
  /** A saved address, or a raw point while the user hasn't saved one yet. */
  addressId: Uuid | null;
  location: { lat: number; lng: number } | null;
  slotStart: IsoDateTime | null;
  recurrence: Recurrence | null;
  couponCode: string | null;
};

export type QuoteLine = {
  serviceSlug: string;
  name: string;
  imageUrl: string;
  durationMin: number;
  pricePaise: Paise;
  mrpPaise: Paise | null;
};

export type InstantAvailability = {
  available: boolean;
  /** Why instant isn't possible right now (CT-4). */
  reason: 'PARTNERS_BUSY' | 'LARGE_ORDER' | 'OUTSIDE_HOURS' | null;
  /** Earliest slot to suggest instead of a dead end. */
  nextAvailableAt: IsoDateTime | null;
};

export type CartQuote = {
  quoteId: string;
  mode: BookingMode;
  lines: QuoteLine[];
  itemTotalPaise: Paise;
  mrpTotalPaise: Paise;
  discountPaise: Paise;
  /** "GST & service fees" as one line until the split is decided (Q-26). */
  feesPaise: Paise;
  totalPaise: Paise;
  savingsPaise: Paise;
  coupon: { code: string; valid: boolean; message: string | null } | null;
  instant: InstantAvailability;
  serviceable: boolean;
};

export type Slot = { start: IsoDateTime; available: boolean };

/** GET /slots?hub_id&date&duration — date is an IST calendar day "YYYY-MM-DD". */
export type SlotDay = { date: string; slots: Slot[] };

// ---- Booking create, payments, offers ----------------------------------------

/** POST /bookings — books exactly the quote the user saw; the slot is held for 10 minutes. */
export type BookingCreateRequest = { quoteId: string };
export type Booking = BookingSummary & { holdExpiresAt: IsoDateTime | null };

export type PaymentPurpose = 'booking' | 'topup' | 'pass';

/** POST /payments — the server sets the amount from its own records; the app never sends one for bookings. */
export type PaymentCreateRequest =
  | { purpose: 'booking'; bookingId: Uuid }
  | { purpose: 'topup'; amountPaise: Paise }
  | { purpose: 'pass'; offerId: string };

export type PaymentStatus = 'created' | 'pending' | 'succeeded' | 'failed' | 'cancelled';

export type Payment = {
  id: Uuid;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  amountPaise: Paise;
  /** What the gateway SDK needs to open checkout (public values only). */
  gateway: { provider: 'razorpay'; orderId: string; keyId: string };
  bookingId: Uuid | null;
  /** Present once a booking payment succeeds, for the result screen. */
  booking: BookingSummary | null;
  errorCode: string | null;
};

export type Offer = {
  id: string;
  kind: 'coupon' | 'bank';
  /** Coupons have a code to apply; bank/UPI offers apply at the gateway. */
  code: string | null;
  title: string;
  description: string;
};

// ---- ChoreDash Money (wallet) -------------------------------------------------

export type TopupRules = {
  minPaise: Paise;
  maxPaise: Paise;
  presetsPaise: Paise[];
  /** Bonus credited as promo balance: `bps` basis points on top-ups ≥ `minPaise` (Q-12). */
  bonus: { minPaise: Paise; bps: number };
};

export type WalletSummary = {
  cashBalancePaise: Paise;
  promoBalancePaise: Paise;
  totalPaise: Paise;
  /** Server decides when to nudge a top-up (WL-1). */
  lowBalance: boolean;
  topup: TopupRules;
  promoExpiryDays: number;
  cashExpiryDays: number;
};

export type WalletTransaction = {
  id: Uuid;
  direction: 'credit' | 'debit';
  bucket: 'cash' | 'promo';
  kind: 'topup' | 'bonus' | 'giftcard' | 'booking' | 'refund' | 'expiry';
  title: string;
  amountPaise: Paise;
  status: 'pending' | 'success' | 'failed';
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime | null;
};

export type GiftCardRedeemResponse = { creditedPaise: Paise; wallet: WalletSummary };

// ---- ChoreDash Pass -------------------------------------------------------------

export type PassOffer = {
  id: string;
  title: string;
  visits: number;
  minutesPerVisit: number;
  pricePaise: Paise;
  mrpPaise: Paise | null;
  /** What the customer actually pays, taxes included (E5 "Pay ₹103.95"). */
  totalWithTaxPaise: Paise;
  validityDays: number;
  benefits: { title: string; body: string }[];
  steps: string[];
  faqs: { question: string; answer: string }[];
};

export type Pass = {
  id: Uuid;
  visitsTotal: number;
  visitsUsed: number;
  minutesPerVisit: number;
  expiresAt: IsoDateTime;
  status: 'active' | 'expired' | 'exhausted';
};

// ---- Profile (/me) and booking detail -------------------------------------------

export type Me = User & { whatsappOptIn: boolean };

/** PATCH /me — omit a field to keep it, send "" to clear it. The mobile number is read-only. */
export type MePatch = { firstName?: string; lastName?: string; email?: string };

export type BookingDetail = BookingSummary & {
  slotEnd: IsoDateTime;
  items: { name: string; durationMin: number; pricePaise: Paise; mrpPaise: Paise | null }[];
  bill: {
    itemTotalPaise: Paise;
    discountPaise: Paise;
    feesPaise: Paise;
    totalPaise: Paise;
    couponCode: string | null;
  };
  timeline: { status: BookingStatus; at: IsoDateTime }[];
  /** Assigned professional once dispatch exists (CD-070); never their location. */
  partner: null;
  arrivalEstimate: IsoDateTime | null;
};
