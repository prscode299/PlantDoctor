export const LightColors = {
  // Botanical Garden & Forest Palette
  primary: '#1E5E3A', // Rich lush forest green
  primaryDark: '#123A24',
  primaryMedium: '#2D6A4F',
  primaryLight: '#40916C',
  primaryMint: '#52B788',
  primarySubtle: '#D8F3DC',
  primarySurface: '#EBF5EE', // Soft morning dew green
  primaryGlow: 'rgba(30, 94, 58, 0.12)',

  // Earth & Warm Terracotta Accents
  terracotta: '#C85A32',
  terracottaLight: '#FDEAE4',
  terracottaDark: '#9E3B1B',
  earthBrown: '#6B4226',
  sand: '#D8C5B2',
  warmCream: '#FAF7F2',

  // Water & Droplet Accents
  waterBlue: '#0284C7',
  waterLight: '#E0F2FE',
  waterDark: '#0369A1',

  // Fertilizer & Sunlight Accents
  fertilizerAmber: '#D97706',
  fertilizerLight: '#FEF3C7',
  fertilizerDark: '#92400E',
  sunYellow: '#F59E0B',
  sunLight: '#FEF9C3',

  // Backgrounds & Neutrals (Organic, non-sterile)
  background: '#F2F7F2', // Crisp gentle garden mist
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAF8',
  border: '#DDE7DD',
  borderLight: '#EAF0EA',

  // Typography
  textPrimary: '#112218',
  textSecondary: '#3C4F44',
  textMuted: '#6B7E73',
  textLight: '#9BB0A4',
  textInverse: '#FFFFFF',

  // Status & Feedback
  success: '#15803D',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Shadows & Elevation
  shadow: 'rgba(18, 58, 36, 0.08)',
  shadowHeavy: 'rgba(18, 58, 36, 0.16)',
};

export const DarkColors = {
  // Vibrant Natural Emerald & Mint Accents on Dark
  primary: '#10B981', // Clean vibrant emerald green
  primaryDark: '#34D399',
  primaryMedium: '#059669',
  primaryLight: '#6EE7B7',
  primaryMint: '#10B981',
  primarySubtle: '#064E3B',
  primarySurface: '#1F2937',
  primaryGlow: 'rgba(16, 185, 129, 0.25)',

  // Warm Terracotta in Dark Mode
  terracotta: '#F87171',
  terracottaLight: '#450A0A',
  terracottaDark: '#EF4444',
  earthBrown: '#A8A29E',
  sand: '#57534E',
  warmCream: '#292524',

  // Water Accents
  waterBlue: '#38BDF8',
  waterLight: '#082F49',
  waterDark: '#7DD3FC',

  // Fertilizer Accents
  fertilizerAmber: '#FBBF24',
  fertilizerLight: '#451A03',
  fertilizerDark: '#FDE68A',
  sunYellow: '#FBBF24',
  sunLight: '#422006',

  // Backgrounds & Surfaces (Standard Modern Material Dark)
  background: '#121212', // Pure sleek neutral dark background
  surface: '#1E1E1E', // Standard dark elevated card surface
  surfaceSubtle: '#262626',
  border: '#333333',
  borderLight: '#2A2A2A',

  // Typography
  textPrimary: '#FFFFFF', // High-contrast clean white
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  textLight: '#6B7280',
  textInverse: '#121212',

  // Status & Feedback
  success: '#10B981',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  danger: '#F87171',
  dangerLight: '#450A0A',
  info: '#38BDF8',
  infoLight: '#082F49',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.6)',
  shadowHeavy: 'rgba(0, 0, 0, 0.85)',
};

export type ColorPalette = typeof LightColors;
export const Colors = LightColors;
export default Colors;
