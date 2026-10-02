const { colors, fontFamily, fontSize, radius } = require('./src/theme/tokens');

const px = (n) => `${n}px`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Usage: bg-primary text-on-primary bg-page bg-card text-fg text-fg-muted border-line ...
      colors: {
        primary: colors.brand.primary,
        'primary-strong': colors.brand.primaryStrong,
        'on-primary': colors.brand.onPrimary,
        'on-primary-muted': colors.brand.onPrimaryMuted,
        dark: colors.brand.dark,
        'on-dark': colors.brand.onDark,
        tint: colors.brand.tint,
        page: colors.surface.page,
        card: colors.surface.card,
        muted: colors.surface.muted,
        fg: colors.text.primary,
        'fg-muted': colors.text.secondary,
        'fg-inverse': colors.text.inverse,
        line: colors.border,
        'line-strong': colors.borderStrong,
        icon: colors.icon,
        success: colors.success,
        danger: colors.danger,
        warning: colors.warning.bg,
        info: colors.info,
      },
      // Usage: text-display text-h1 ... text-micro
      fontSize: Object.fromEntries(
        Object.entries(fontSize).map(([k, [size, lh]]) => [k, [px(size), px(lh)]]),
      ),
      // Usage: font-regular font-medium font-semibold font-bold — these set the Lexend file for that
      // weight (fontFamily), replacing Tailwind's fontWeight utilities of the same name.
      fontFamily: Object.fromEntries(Object.entries(fontFamily).map(([k, v]) => [k, [v]])),
      // Usage: rounded-chip rounded-card rounded-hero rounded-pill
      borderRadius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, px(v)])),
      // Default Tailwind spacing (p-1 = 4, p-4 = 16 …) already matches the spec's scale.
    },
  },
  // Weight comes from the font file (see fontFamily); disable fontWeight utilities so
  // `font-bold` can't also set fontWeight and make Android synthesize bold on a bold file.
  corePlugins: { fontWeight: false },
  plugins: [],
};
