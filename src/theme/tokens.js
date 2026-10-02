/**
 * ChoreDash design tokens — the single source of truth for colours, type and shape.
 *
 * Plain CommonJS so both `tailwind.config.js` (Node) and app code (via `@/theme`) can read it.
 * Never hard-code a colour or size in a component; add a token here instead.
 * Brand: cyan #26CCF0 + white, zinc neutrals (user, 2026-10-02 — replaces the spec's Tuatara/Mustard/Bianca).
 */

const palette = {
  cyan: '#26CCF0', // brand primary (2026-10-02)
  cyanStrong: '#0891B2', // cyan for text/icons on white: #26CCF0 on white is ~1.9:1, too faint to read
  cyanTint: '#E8F9FE',
  white: '#FFFFFF',
  zinc50: '#FAFAFA',
  zinc100: '#F4F4F5',
  zinc200: '#E4E4E7',
  zinc300: '#D4D4D8',
  zinc400: '#A1A1AA',
  zinc500: '#71717A',
  zinc900: '#18181B',
};

/**
 * Cyan is an accent: primary buttons, the selected tab, prices saved, small highlights. Everything
 * else is white surfaces, zinc borders and zinc icons. Cyan fills always carry zinc-900 text —
 * white on #26CCF0 fails contrast.
 */
const colors = {
  brand: {
    primary: palette.cyan,
    onPrimary: palette.white,
    /** Subtitles on cyan cards. */
    onPrimaryMuted: palette.zinc100,
    /** Cyan text, icons and borders on white or tint (selected tab label, links, active inputs). */
    primaryStrong: palette.cyanStrong,
    dark: palette.zinc900,
    onDark: palette.white,
    tint: palette.cyanTint,
  },
  surface: {
    page: palette.white,
    card: palette.white,
    muted: palette.zinc100,
  },
  text: {
    primary: palette.zinc900,
    secondary: palette.zinc500,
    inverse: palette.white,
  },
  /** Decorative and inactive icons (chevrons, unselected tabs, row icons). */
  icon: palette.zinc400,
  border: palette.zinc200,
  borderStrong: palette.zinc300,
  /** Rating stars. */
  rating: '#F59E0B',
  success: '#16A34A',
  danger: '#DC2626',
  warning: { bg: '#FEF3C7' },
  info: palette.cyanStrong,
};

/** Font sizes in pt, with line heights. */
const fontSize = {
  display: [32, 40],
  h1: [24, 32],
  h2: [22, 28], // section titles ("All house help services")
  h3: [17, 24],
  body: [15, 22],
  caption: [13, 18],
  micro: [11, 14],
};

/** Spacing scale in pt; screen gutter is 16. */
const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 };

const radius = { chip: 8, card: 12, hero: 16, pill: 999 };

/**
 * One font file per weight (Lexend — still to confirm, Q-33). Weight is chosen by family name,
 * never by fontWeight, so Android doesn't fake-bold a regular file.
 */
const fontFamily = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
};

/** Cards are flat with a 1px border; only sheets and sticky footers lift. (boxShadow strings) */
const shadows = {
  footer: '0 -2px 12px rgba(32, 32, 30, 0.08)',
  raised: '0 4px 12px rgba(32, 32, 30, 0.10)',
};

/** Animation durations in ms. */
const motion = { fast: 150, base: 250, slow: 400 };

const touchTarget = 44;

module.exports = { palette, colors, fontSize, fontFamily, spacing, radius, shadows, motion, touchTarget };
