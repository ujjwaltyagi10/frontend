// Typed access to the design tokens for places that need raw values
// (navigation options, SymbolView tint, StatusBar). Prefer NativeWind classes in components.
import tokens from './tokens';

export const { palette, colors, fontSize, fontFamily, spacing, radius, shadows, motion, touchTarget } =
  tokens as unknown as {
    palette: Record<string, string>;
    colors: {
      brand: Record<
        'primary' | 'onPrimary' | 'onPrimaryMuted' | 'primaryStrong' | 'dark' | 'onDark' | 'tint',
        string
      >;
      surface: Record<'page' | 'card' | 'muted', string>;
      text: Record<'primary' | 'secondary' | 'inverse', string>;
      icon: string;
      border: string;
      borderStrong: string;
      rating: string;
      success: string;
      danger: string;
      warning: { bg: string };
      info: string;
    };
    fontSize: Record<'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'micro', [number, number]>;
    spacing: Record<1 | 2 | 3 | 4 | 5 | 6 | 8, number>;
    fontFamily: Record<FontWeight, string>;
    radius: Record<'chip' | 'card' | 'hero' | 'pill', number>;
    shadows: Record<'footer' | 'raised', string>;
    motion: Record<'fast' | 'base' | 'slow', number>;
    touchTarget: number;
  };

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';
