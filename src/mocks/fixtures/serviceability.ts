import { places } from './geo';

/** Mock rule: anything south of latitude 28° is served (Bengaluru fixtures), north is not (Noida → B6). */
export const isServed = (lat: number) => lat <= 28;

/** Nearest known place within ~20 km, so a GPS fix far away isn't mislabelled as HSR Layout. */
export function describePoint(lat: number, lng: number) {
  const near = places
    .map((p) => ({ p, d: Math.hypot(p.lat - lat, p.lng - lng) }))
    .sort((a, b) => a.d - b.d)[0];
  if (near && near.d < 0.2) return { label: near.p.title, line: near.p.line };
  return { label: 'Current location', line: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}
