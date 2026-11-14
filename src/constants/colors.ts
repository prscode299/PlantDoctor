export const LightColors = {
  // Stitch Material You & Botanical Serenity Palette
  primary: '#004625', // Deep rich forest green
  primaryContainer: '#1E5E3A', // Rich velvet container
  onPrimaryContainer: '#94D5A8',
  primaryDark: '#002B16',
  primaryMedium: '#1E5E3A',
  primaryLight: '#40916C',
  primaryMint: '#52B788',
  primarySubtle: '#D8F3DC',
  primarySurface: '#EBF5EE',
  primaryGlow: 'rgba(30, 94, 58, 0.16)',

  // Secondary Accents
  secondary: '#006C48',
  secondaryContainer: '#92F7C3',
  secondaryFixed: '#92F7C3',

  // Earth & Warm Terracotta Accents
  terracotta: '#C85A32',
  terracottaLight: '#FDEAE4',
  terracottaDark: '#9E3B1B',
  earthBrown: '#6B4226',
  sand: '#D8C5B2',
  warmCream: '#FAF7F2',

  // Water & Droplet Accents
  waterBlue: '#003F62',
  waterLight: '#E0F2FE',
  waterDark: '#00253B',
  tertiary: '#003F62',
  tertiaryContainer: '#005785',

  // Fertilizer & Sunlight Accents
  fertilizerAmber: '#D97706',
  fertilizerLight: '#FEF3C7',
  fertilizerDark: '#92400E',
  sunYellow: '#F59E0B',
  sunLight: '#FEF9C3',

  // Stitch Container Layers (Organic layered surfaces)
  background: '#ECFEEE', // Morning dew tinted surface
  surface: '#FFFFFF',
  surfaceSubtle: '#E6F8E8',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#E6F8E8',
  surfaceContainer: '#E0F3E3',
  surfaceContainerHigh: '#DBEDDD',
  surfaceContainerHighest: '#D5E7D8',
  border: '#C0C9BF',
  borderLight: '#D5E7D8',

  // Typography
  textPrimary: '#101F15',
  textSecondary: '#404941',
  textMuted: '#6B7E73',
  textLight: '#9BB0A4',
  textInverse: '#FFFFFF',

  // Status & Feedback
  success: '#006C48',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#BA1A1A',
  dangerLight: '#FFDAD6',
  info: '#003F62',
  infoLight: '#E0F2FE',

  // Shadows & Elevation
  shadow: 'rgba(30, 94, 58, 0.08)',
  shadowHeavy: 'rgba(30, 94, 58, 0.22)',
};

export const DarkColors = {
  // Stitch Dark Mode — Deep Obsidian Forest
  primary: '#75DAA8', // Glowing emerald mint in dark
  primaryContainer: '#005235',
  onPrimaryContainer: '#92F7C3',
  primaryDark: '#92F7C3',
  primaryMedium: '#10B981',
  primaryLight: '#A7F3D0',
  primaryMint: '#75DAA8',
  primarySubtle: '#064E3B',
  primarySurface: '#15231A',
  primaryGlow: 'rgba(117, 218, 168, 0.25)',

  // Secondary Accents
  secondary: '#75DAA8',
  secondaryContainer: '#1A3525',
  secondaryFixed: '#92F7C3',

  // Warm Terracotta in Dark Mode
  terracotta: '#FF6B6B',
  terracottaLight: '#3D1114',
  terracottaDark: '#EF4444',
  earthBrown: '#A8A29E',
  sand: '#57534E',
  warmCream: '#292524',

  // Water Accents
  waterBlue: '#38BDF8',
  waterLight: '#082F49',
  waterDark: '#7DD3FC',
  tertiary: '#38BDF8',
  tertiaryContainer: '#005785',

  // Fertilizer Accents
  fertilizerAmber: '#FBBF24',
  fertilizerLight: '#451A03',
  fertilizerDark: '#FDE68A',
  sunYellow: '#FBBF24',
  sunLight: '#422006',

  // Stitch Dark Container Layers (Lush night forest)
  background: '#0B130E', // Obsidian deep green night
  surface: '#111C15',
  surfaceSubtle: '#15231A',
  surfaceContainerLowest: '#080E0A',
  surfaceContainerLow: '#111C15',
  surfaceContainer: '#15231A',
  surfaceContainerHigh: '#1E3327',
  surfaceContainerHighest: '#284433',
  border: '#233F2E',
  borderLight: '#1E3327',

  // Typography
  textPrimary: '#F1F7F3', // High-contrast clean white
  textSecondary: '#D1E0D5',
  textMuted: '#9BB5A2',
  textLight: '#6B7E73',
  textInverse: '#0B130E',

  // Status & Feedback
  success: '#75DAA8',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  danger: '#FF6B6B',
  dangerLight: '#3D1114',
  info: '#38BDF8',
  infoLight: '#082F49',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.7)',
  shadowHeavy: 'rgba(0, 0, 0, 0.9)',
};

export type ColorPalette = typeof LightColors;
export const Colors = LightColors;
export default Colors;
