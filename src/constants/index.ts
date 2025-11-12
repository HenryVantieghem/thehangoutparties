export const COLORS = {
  // Primary
  dark: '#0A0E27',
  darkSecondary: '#1a1f3a',
  darkTertiary: '#2D3748',
  
  // Accent
  cyan: '#00D9FF',
  cyanLight: '#00FFFF',
  cyanDark: '#00A8CC',
  pink: '#FF006E',
  pinkLight: '#FF4D95',
  pinkDark: '#CC0052',
  
  // Neutral
  white: '#FFFFFF',
  gray100: '#F7FAFC',
  gray200: '#EDF2F7',
  gray300: '#E2E8F0',
  gray400: '#CBD5E0',
  gray500: '#A0AEC0',
  gray600: '#718096',
  gray700: '#4A5568',
  gray800: '#2D3748',
  
  // Status
  error: '#FF3B30',
  errorLight: '#FF6B63',
  success: '#34C759',
  warning: '#FF9500',
  info: '#00D9FF',
};

export const TYPOGRAPHY = {
  display1: { fontSize: 40, fontWeight: '700', lineHeight: 48, letterSpacing: -0.5 },
  display2: { fontSize: 34, fontWeight: '700', lineHeight: 41, letterSpacing: -0.3 },
  largeTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34, letterSpacing: -0.2 },
  title1: { fontSize: 24, fontWeight: '700', lineHeight: 29, letterSpacing: -0.1 },
  title2: { fontSize: 20, fontWeight: '700', lineHeight: 24, letterSpacing: 0 },
  title3: { fontSize: 18, fontWeight: '600', lineHeight: 22, letterSpacing: 0 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0.3 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24, letterSpacing: 0.3 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20, letterSpacing: 0.2 },
  caption1: { fontSize: 12, fontWeight: '400', lineHeight: 16, letterSpacing: 0.4 },
  caption2: { fontSize: 11, fontWeight: '400', lineHeight: 13, letterSpacing: 0.5 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const ANIMATIONS = {
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 400,
  slowest: 500,
  springConfig: { damping: 10, mass: 1, stiffness: 100, overshootClamping: false },
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const API = {
  PARTIES_SEARCH_RADIUS: 10,
  MAX_ATTENDEES: 500,
  MESSAGE_HISTORY_LIMIT: 50,
  PHOTO_PAGINATION_LIMIT: 10,
  PARTY_PAGINATION_LIMIT: 10,
  IMAGE_MAX_WIDTH: 1080,
  IMAGE_QUALITY: 0.9,
};

export const VALIDATION = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  BIO_MAX: 200,
  PARTY_TITLE_MAX: 100,
  PARTY_DESC_MAX: 500,
  CAPTION_MAX: 200,
  MESSAGE_MAX: 300,
};