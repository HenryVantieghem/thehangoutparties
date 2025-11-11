/**
 * Color palette for the application
 */
export const COLORS = {
  /** Dark primary color */
  dark: '#000000',
  /** Dark secondary color */
  darkSecondary: '#1a1a1a',
  /** Cyan accent color */
  cyan: '#00d4ff',
  /** Pink accent color */
  pink: '#ff006e',
  /** White color */
  white: '#ffffff',
  /** Gray color */
  gray: '#808080',
  /** Error/red color */
  error: '#ff3333',
  /** Success/green color */
  success: '#00ff88',
} as const;

/**
 * Typography scale for text styles
 */
export const TYPOGRAPHY = {
  /** Display text style - largest heading */
  display: 'display',
  /** Large title text style */
  largeTitle: 'largeTitle',
  /** Title 3 text style */
  title3: 'title3',
  /** Body text style */
  body: 'body',
  /** Caption 1 text style - smallest text */
  caption1: 'caption1',
} as const;

/**
 * Spacing scale for consistent layout spacing
 */
export const SPACING = {
  /** Extra small spacing: 4px */
  xs: 4,
  /** Small spacing: 8px */
  sm: 8,
  /** Medium spacing: 12px */
  md: 12,
  /** Large spacing: 16px */
  lg: 16,
  /** Extra large spacing: 24px */
  xl: 24,
  /** Extra extra large spacing: 32px */
  xxl: 32,
} as const;

/**
 * Animation configuration constants
 */
export const ANIMATIONS = {
  /** Animation duration in milliseconds */
  duration: 300,
  /** Animation easing function */
  easing: 'ease-in-out',
  /** Spring animation damping value */
  springDamping: 0.7,
} as const;

/**
 * API configuration constants
 */
export const API = {
  /** Search radius for finding parties in kilometers */
  PARTIES_SEARCH_RADIUS: 10,
  /** Maximum number of attendees allowed per party */
  MAX_ATTENDEES: 500,
  /** Number of items per page for pagination */
  PAGINATION_LIMIT: 10,
} as const;

/**
 * Validation rules and constraints
 */
export const VALIDATION = {
  /** Minimum username length */
  USERNAME_MIN: 3,
  /** Minimum password length */
  PASSWORD_MIN: 8,
  /** Maximum caption length */
  CAPTION_MAX: 200,
} as const;

