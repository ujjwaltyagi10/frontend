// Reference catalog copied from the Pronto screenshots (PRD → Pricing). Placeholder values
// until ChoreDash prices are decided (Q-08, Q-09). Money in paise.
import type { ServiceDetail, ServiceSummary } from '@/api/types';

// No stock photos: real service images come from the CDN later; until then ServiceArt draws an icon.
const img = (_slug: string) => '';

const tile = (
  slug: string,
  name: string,
  price: number,
  mrp: number | null,
  rating = 4.8,
  ratingCount = 12_000,
  isNew = false,
): ServiceSummary => ({
  slug,
  name,
  imageUrl: img(slug),
  rating,
  ratingCount,
  pricePaise: price * 100,
  mrpPaise: mrp === null ? null : mrp * 100,
  defaultDurationMin: 30,
  isNew,
});

export const services: ServiceSummary[] = [
  tile('hourly', 'Hourly Service', 25, 125, 4.9, 238_400),
  tile('festive-home-help', 'Festive Home Help', 199, null, 4.7, 22_300, true),
  tile('packing-unpacking', 'Packing or Unpacking', 30, 125, 4.9, 23_400),
  tile('dusting', 'Dusting', 30, 125),
  tile('sweeping-mopping', 'Sweeping & Mopping', 30, 125),
  tile('bathroom', 'Bathroom Cleaning', 30, 125),
  tile('utensils', 'Utensils', 30, 125),
  tile('fridge', 'Fridge Cleaning', 59, 250),
  tile('kitchen', 'Kitchen Cleaning', 30, 125),
  tile('kitchen-cabinets', 'Kitchen Cabinets', 177, 750),
  tile('wardrobe', 'Complete Wardrobe', 177, 750),
  tile('laundry', 'Laundry', 30, 125),
];

const hourly: ServiceDetail = {
  ...services[0],
  tagline: 'One visit. Everything handled.',
  durations: [
    { durationMin: 30, pricePaise: 2_500, mrpPaise: 12_500 },
    { durationMin: 60, pricePaise: 4_900, mrpPaise: 25_000 },
    { durationMin: 90, pricePaise: 7_400, mrpPaise: 37_500 },
    { durationMin: 120, pricePaise: 11_800, mrpPaise: 50_000 },
  ],
  includes: ['Dusting', 'Sweeping & mopping', 'Bathroom cleaning', 'Utensils', 'Kitchen prep'],
  excludes: ['Cooking', 'Deep cleaning', 'Heavy lifting', 'Electrical or plumbing work'],
  steps: [
    { title: 'Plan the work', body: 'Tell your Pro what matters most today.' },
    { title: 'Start service', body: 'Your Pro works through the list in order.' },
    { title: 'Final checks', body: 'Review together before the Pro leaves.' },
  ],
  faqs: [
    { question: 'What can I ask my Pro to do?', answer: 'Any listed task within the booked time.' },
    { question: 'What if the work takes longer?', answer: 'You can extend in 30-minute steps.' },
  ],
};

export const serviceDetails: Record<string, ServiceDetail> = Object.fromEntries(
  services.map((s) => [
    s.slug,
    s.slug === 'hourly'
      ? hourly
      : {
          ...hourly,
          ...s,
          tagline: `${s.name}, done right.`,
          durations: [{ durationMin: s.defaultDurationMin, pricePaise: s.pricePaise, mrpPaise: s.mrpPaise }],
        },
  ]),
);
