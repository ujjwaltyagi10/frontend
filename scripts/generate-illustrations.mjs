#!/usr/bin/env node
/**
 * Generates ChoreDash illustrations with Gemini image generation, in the Pronto style:
 * photoreal 3D product shots, one subject, soft studio light, near-white background.
 *
 *   GEMINI_API_KEY=... node scripts/generate-illustrations.mjs            # everything missing
 *   GEMINI_API_KEY=... node scripts/generate-illustrations.mjs laundry fridge   # just these
 *   GEMINI_API_KEY=... node scripts/generate-illustrations.mjs --force hourly   # regenerate
 *
 * Output: assets/illustrations/<name>.png. Existing files are skipped unless --force.
 * Consistency: once you like one tile, copy it to assets/illustrations/_style-ref.png — every
 * later request sends it along as the style reference.
 * Model: GEMINI_IMAGE_MODEL (default gemini-2.5-flash-image). Check Google's docs for newer ones.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'assets/illustrations';
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image';
const KEY = process.env.GEMINI_API_KEY;

// Shared look, appended to every prompt so the set matches.
const STYLE = [
  'Photorealistic 3D product render, e-commerce catalogue style, like a premium home-services app.',
  'Single subject, centred, occupying about 70% of the frame, three-quarter front view, slightly from above.',
  'Soft diffused studio lighting from the top left, gentle soft contact shadow under the subject.',
  'Seamless plain very light grey background (#F4F4F5), no floor line, no props beyond those described.',
  'Clean, bright, modern Indian home aesthetic; warm whites, light wood, soft neutral tones;',
  'small accents of sky blue (#38BDF8) where natural. Crisp, high detail, no noise.',
  'No text, no letters, no logos, no watermark, no border, no frame.',
].join(' ');

// Hero art sits on coloured cards, so it's rendered on pure white for easy background removal.
const CUTOUT = [
  'Isolated on a pure white background (#FFFFFF) for background removal, no shadow on the background.',
  'No text, no logos, no watermark.',
].join(' ');

const PRO =
  'a friendly young Indian woman house-help professional, early 30s, warm natural smile, hair neatly tied back, ' +
  'wearing a sky blue (#38BDF8) polo-collar uniform t-shirt with no logo and bright yellow rubber gloves';

/** name → [prompt, aspect ratio, style]. Service names match the catalogue slugs (ServiceArt). */
const ART = {
  // B1 service tiles (1:1, shown ~110 pt wide)
  hourly: [
    `Waist-up portrait of ${PRO}, holding a woven basket full of cleaning bottles, sprays and cloths.`,
    '1:1',
    STYLE,
  ],
  'festive-home-help': [
    'A wooden front door frame decorated with a marigold flower toran garland, two lit brass diyas and a small rangoli on the floor.',
    '1:1',
    STYLE,
  ],
  'packing-unpacking': [
    'An open grey hard-shell suitcase with neatly folded clothes, next to two taped cardboard moving boxes.',
    '1:1',
    STYLE,
  ],
  dusting: [
    'A fluffy feather duster resting on a clean light-wood shelf with a small potted plant and two books.',
    '1:1',
    STYLE,
  ],
  'sweeping-mopping': [
    'A flat microfibre mop and a sky blue mop bucket on a freshly mopped, glossy light tiled floor.',
    '1:1',
    STYLE,
  ],
  bathroom: [
    'A spotless white bathroom washbasin with a chrome tap, a folded white towel and a small bottle of cleaning spray.',
    '1:1',
    STYLE,
  ],
  utensils: [
    'A steel dish rack with freshly washed stainless steel plates, bowls and glasses, a few water droplets.',
    '1:1',
    STYLE,
  ],
  fridge: [
    'A single-door fridge with the door open, neatly organised shelves of vegetables, fruit, milk and containers.',
    '1:1',
    STYLE,
  ],
  kitchen: [
    'A wooden chopping board with sliced tomatoes, a red bell pepper, coriander and a kitchen knife.',
    '1:1',
    STYLE,
  ],
  'kitchen-cabinets': [
    'An open white kitchen wall cabinet with neatly arranged jars, spice containers and stacked plates.',
    '1:1',
    STYLE,
  ],
  wardrobe: [
    'An open white wardrobe with neatly hung shirts and kurtas and folded clothes on the shelves.',
    '1:1',
    STYLE,
  ],
  laundry: [
    'A white front-loading washing machine with a woven laundry basket of folded towels beside it.',
    '1:1',
    STYLE,
  ],
  balcony: [
    'A small clean balcony corner with white railings, a potted plant and a folded floor mat.',
    '1:1',
    STYLE,
  ],
  'fan-cleaning': [
    'A dark brown three-blade ceiling fan, freshly cleaned and shiny, seen from slightly below.',
    '1:1',
    STYLE,
  ],
  'ironing-folding': [
    'A white ironing board with a steam iron and a neat stack of folded shirts.',
    '1:1',
    STYLE,
  ],
  window: [
    'A clean glass window with a white frame, a small potted plant on the sill and a squeegee resting on it.',
    '1:1',
    STYLE,
  ],

  // B1 hero + accents
  'hero-pro': [
    `Waist-up portrait of ${PRO}, holding a woven basket of cleaning supplies at her side, looking at the camera.`,
    '3:4',
    CUTOUT,
  ],
  'icon-instant': [
    'A glossy 3D lightning bolt icon in sky blue (#38BDF8), soft clay render, slight tilt.',
    '1:1',
    CUTOUT,
  ],
  'icon-schedule': [
    'A glossy 3D desk calendar icon with a sky blue (#38BDF8) top and a white page with a grid, soft clay render.',
    '1:1',
    CUTOUT,
  ],
  'icon-wallet': [
    'A glossy 3D wallet icon in sky blue (#38BDF8) with a few green rupee notes sticking out, soft clay render.',
    '1:1',
    CUTOUT,
  ],
  'pass-tickets': [
    'Three overlapping 3D paper tickets fanned out, white and sky blue (#38BDF8), with perforated edges, blank faces.',
    '4:3',
    CUTOUT,
  ],

  // A2 location screen
  'location-city': [
    'An isometric 3D miniature city block: white and light grey apartment buildings, small trees, roads, and three glossy sky blue (#38BDF8) map pins floating above. Soft, airy, mostly white palette.',
    '3:4',
    STYLE,
  ],

  // Empty / result states (G1 no bookings, F payment success)
  'empty-bookings': [
    'A 3D clipboard with a blank checklist and a sky blue (#38BDF8) pencil, soft clay render.',
    '1:1',
    CUTOUT,
  ],
  'payment-success': [
    'A glossy 3D sky blue (#38BDF8) circle badge with a white check mark, a few small confetti pieces around it.',
    '1:1',
    CUTOUT,
  ],
};

async function generate(name, [subject, aspectRatio, style]) {
  const parts = [{ text: `${subject} ${style}` }];
  const ref = join(OUT, '_style-ref.png');
  if (style === STYLE && existsSync(ref)) {
    parts.unshift({ inlineData: { mimeType: 'image/png', data: readFileSync(ref).toString('base64') } });
    parts.push({
      text: 'Match the lighting, background, camera angle and render style of the reference image exactly.',
    });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  const image = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!image) throw new Error(`no image returned: ${JSON.stringify(json).slice(0, 300)}`);
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(image.data, 'base64'));
}

if (!KEY) {
  console.error('Set GEMINI_API_KEY (https://aistudio.google.com/apikey).');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const force = args.includes('--force');
const wanted = args.filter((a) => a !== '--force');
const unknown = wanted.filter((n) => !ART[n]);
if (unknown.length) {
  console.error(`Unknown: ${unknown.join(', ')}. Known: ${Object.keys(ART).join(', ')}`);
  process.exit(1);
}

for (const name of wanted.length ? wanted : Object.keys(ART)) {
  if (!force && existsSync(join(OUT, `${name}.png`))) {
    console.log(`skip  ${name} (exists)`);
    continue;
  }
  try {
    await generate(name, ART[name]);
    console.log(`ok    ${name}`);
  } catch (e) {
    console.error(`fail  ${name}: ${e.message}`);
  }
}
