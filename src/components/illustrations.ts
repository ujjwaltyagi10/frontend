import type { ImageSource } from 'expo-image';

/**
 * Bundled illustrations (Pronto-style 3D renders, generated with Gemini — prompts in
 * scripts/generate-illustrations.mjs). Full-size originals live in assets/illustrations/source and
 * are not bundled; these are the resized, watermark-free copies.
 */

/** Service tile art by catalogue slug. Scenes on a #F4F4F5-ish grey, 800 × 800. */
export const serviceArtwork: Record<string, ImageSource> = {
  hourly: require('@/assets/illustrations/hourly.jpg'),
  'festive-home-help': require('@/assets/illustrations/festive-home-help.jpg'),
  'packing-unpacking': require('@/assets/illustrations/packing-unpacking.jpg'),
  dusting: require('@/assets/illustrations/dusting.jpg'),
  'sweeping-mopping': require('@/assets/illustrations/sweeping-mopping.jpg'),
  bathroom: require('@/assets/illustrations/bathroom.jpg'),
  utensils: require('@/assets/illustrations/utensils.jpg'),
  fridge: require('@/assets/illustrations/fridge.jpg'),
  kitchen: require('@/assets/illustrations/kitchen.jpg'),
  'kitchen-cabinets': require('@/assets/illustrations/kitchen-cabinets.jpg'),
  wardrobe: require('@/assets/illustrations/wardrobe.jpg'),
  laundry: require('@/assets/illustrations/laundry.jpg'),
  balcony: require('@/assets/illustrations/balcony.jpg'),
  'fan-cleaning': require('@/assets/illustrations/fan-cleaning.jpg'),
  'ironing-folding': require('@/assets/illustrations/ironing-folding.jpg'),
  window: require('@/assets/illustrations/window.jpg'),
};

/** Cut-outs (transparent PNG) and full-screen art. */
export const illustrations = {
  heroPro: require('@/assets/illustrations/hero-pro.png') as ImageSource,
  instant: require('@/assets/illustrations/icon-instant.png') as ImageSource,
  schedule: require('@/assets/illustrations/icon-schedule.png') as ImageSource,
  wallet: require('@/assets/illustrations/icon-wallet.png') as ImageSource,
  passTickets: require('@/assets/illustrations/pass-tickets.png') as ImageSource,
  locationCity: require('@/assets/illustrations/location-city.jpg') as ImageSource,
  emptyBookings: require('@/assets/illustrations/empty-bookings.png') as ImageSource,
  paymentSuccess: require('@/assets/illustrations/payment-success.png') as ImageSource,
};
