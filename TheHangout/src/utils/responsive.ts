import React from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

// Device dimension interfaces
export interface DeviceDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

export interface ResponsiveConfig {
  baseWidth: number;
  baseHeight: number;
  minScaleFactor: number;
  maxScaleFactor: number;
}

// Device type classification
export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type ScreenSize = 'small' | 'medium' | 'large' | 'xlarge';

// Responsive breakpoints (based on width)
export const BREAKPOINTS = {
  small: 320,    // iPhone SE, small phones
  medium: 375,   // iPhone 6/7/8, standard phones  
  large: 414,    // iPhone Plus, large phones
  xlarge: 768,   // iPad Mini, small tablets
  xxlarge: 1024, // iPad, large tablets
  xxxlarge: 1200, // Desktop
} as const;

// Base design dimensions (iPhone 12/13/14 as reference)
const BASE_DIMENSIONS = {
  width: 390,
  height: 844,
} as const;

// Get current device dimensions
export const getDeviceDimensions = (): DeviceDimensions => {
  const { width, height } = Dimensions.get('window');
  const scale = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  
  return { width, height, scale, fontScale };
};

// Determine device type based on dimensions
export const getDeviceType = (dimensions?: DeviceDimensions): DeviceType => {
  const { width, height } = dimensions || getDeviceDimensions();
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Desktop/web detection
  if (Platform.OS === 'web' && minDimension >= BREAKPOINTS.xxlarge) {
    return 'desktop';
  }
  
  // Tablet detection (7+ inches)
  if (minDimension >= BREAKPOINTS.xlarge) {
    return 'tablet';
  }
  
  return 'phone';
};

// Determine screen size category
export const getScreenSize = (width?: number): ScreenSize => {
  const deviceWidth = width || getDeviceDimensions().width;
  
  if (deviceWidth >= BREAKPOINTS.xxlarge) return 'xlarge';
  if (deviceWidth >= BREAKPOINTS.xlarge) return 'large';
  if (deviceWidth >= BREAKPOINTS.medium) return 'medium';
  return 'small';
};

// Get orientation
export const getOrientation = (dimensions?: DeviceDimensions): Orientation => {
  const { width, height } = dimensions || getDeviceDimensions();
  return width > height ? 'landscape' : 'portrait';
};

// Responsive scaling functions
export const responsiveWidth = (size: number): number => {
  const { width } = getDeviceDimensions();
  return (width * size) / BASE_DIMENSIONS.width;
};

export const responsiveHeight = (size: number): number => {
  const { height } = getDeviceDimensions();
  return (height * size) / BASE_DIMENSIONS.height;
};

export const responsiveFont = (size: number): number => {
  const { width, fontScale } = getDeviceDimensions();
  const scale = width / BASE_DIMENSIONS.width;
  
  // Apply constraints to prevent extreme scaling
  const constrainedScale = Math.max(0.8, Math.min(scale, 1.4));
  
  // Consider user's font scale preference
  return Math.round(size * constrainedScale * Math.min(fontScale, 1.3));
};

// Responsive spacing system
export const createResponsiveSpacing = () => {
  const deviceType = getDeviceType();
  const { width } = getDeviceDimensions();
  
  // Base spacing multipliers by device type
  const multipliers = {
    phone: 1,
    tablet: 1.2,
    desktop: 1.4,
  };
  
  const multiplier = multipliers[deviceType];
  
  // Dynamic scaling based on screen width
  const widthScale = Math.min(width / BASE_DIMENSIONS.width, 1.5);
  const finalMultiplier = multiplier * widthScale;
  
  return {
    xs: Math.round(4 * finalMultiplier),
    sm: Math.round(8 * finalMultiplier),
    md: Math.round(12 * finalMultiplier),
    lg: Math.round(16 * finalMultiplier),
    xl: Math.round(24 * finalMultiplier),
    xxl: Math.round(32 * finalMultiplier),
    xxxl: Math.round(48 * finalMultiplier),
  };
};

// Responsive radius system
export const createResponsiveRadius = () => {
  const deviceType = getDeviceType();
  
  const baseRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  };
  
  const multipliers = {
    phone: 1,
    tablet: 1.15,
    desktop: 1.25,
  };
  
  const multiplier = multipliers[deviceType];
  
  return Object.fromEntries(
    Object.entries(baseRadius).map(([key, value]) => [
      key,
      key === 'full' ? value : Math.round(value * multiplier),
    ])
  );
};

// Responsive typography system
export const createResponsiveTypography = () => {
  const deviceType = getDeviceType();
  const { fontScale } = getDeviceDimensions();
  
  // Base font sizes
  const baseSizes = {
    display1: 40,
    display2: 34,
    largeTitle: 28,
    title1: 24,
    title2: 20,
    title3: 18,
    body: 16,
    bodyBold: 16,
    bodySmall: 14,
    caption1: 12,
    caption2: 11,
  };
  
  // Device-specific multipliers
  const deviceMultipliers = {
    phone: 1,
    tablet: 1.1,
    desktop: 1.15,
  };
  
  const deviceMultiplier = deviceMultipliers[deviceType];
  const userFontScale = Math.min(fontScale, 1.3); // Cap at 130% to prevent layout issues
  
  return Object.fromEntries(
    Object.entries(baseSizes).map(([key, size]) => {
      const responsiveSize = responsiveFont(size * deviceMultiplier);
      const finalSize = Math.round(responsiveSize * userFontScale);
      
      return [
        key,
        {
          fontSize: finalSize,
          lineHeight: Math.round(finalSize * 1.4), // 1.4 ratio for good readability
          ...(key.includes('display') && { letterSpacing: -0.5 }),
          ...(key.includes('title') && { letterSpacing: -0.2 }),
          ...(key.includes('body') && { letterSpacing: 0.3 }),
          ...(key.includes('caption') && { letterSpacing: 0.4 }),
        },
      ];
    })
  );
};

// Layout helpers
export const getLayoutConfig = () => {
  const deviceType = getDeviceType();
  const orientation = getOrientation();
  const { width, height } = getDeviceDimensions();
  
  return {
    deviceType,
    orientation,
    width,
    height,
    isPhone: deviceType === 'phone',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isSmallScreen: width < BREAKPOINTS.medium,
    isMediumScreen: width >= BREAKPOINTS.medium && width < BREAKPOINTS.large,
    isLargeScreen: width >= BREAKPOINTS.large && width < BREAKPOINTS.xlarge,
    isXLargeScreen: width >= BREAKPOINTS.xlarge,
  };
};

// Grid system
export interface GridConfig {
  columns: number;
  gutterWidth: number;
  marginWidth: number;
}

export const getGridConfig = (): GridConfig => {
  const { deviceType, width } = getLayoutConfig();
  
  // Grid configurations by device type
  const configs: Record<DeviceType, GridConfig> = {
    phone: {
      columns: 4,
      gutterWidth: responsiveWidth(16),
      marginWidth: responsiveWidth(16),
    },
    tablet: {
      columns: 8,
      gutterWidth: responsiveWidth(20),
      marginWidth: responsiveWidth(24),
    },
    desktop: {
      columns: 12,
      gutterWidth: responsiveWidth(24),
      marginWidth: responsiveWidth(32),
    },
  };
  
  return configs[deviceType];
};

// Calculate column width
export const getColumnWidth = (columns: number = 1): number => {
  const { columns: totalColumns, gutterWidth, marginWidth } = getGridConfig();
  const { width } = getDeviceDimensions();
  
  const availableWidth = width - (marginWidth * 2);
  const totalGutterWidth = gutterWidth * (totalColumns - 1);
  const contentWidth = availableWidth - totalGutterWidth;
  const columnWidth = contentWidth / totalColumns;
  
  return (columnWidth * columns) + (gutterWidth * (columns - 1));
};

// Container max widths
export const getContainerMaxWidth = (): number => {
  const { deviceType, width } = getLayoutConfig();
  
  const maxWidths = {
    phone: width,
    tablet: Math.min(width, 768),
    desktop: Math.min(width, 1200),
  };
  
  return maxWidths[deviceType];
};

// Safe area helpers
export const getSafeAreaPadding = () => {
  const { deviceType, isLandscape } = getLayoutConfig();
  const spacing = createResponsiveSpacing();
  
  // Different safe area handling by device type and orientation
  const basePadding = {
    top: spacing.md,
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
  };
  
  if (deviceType === 'tablet') {
    basePadding.left = spacing.xl;
    basePadding.right = spacing.xl;
    
    if (isLandscape) {
      basePadding.top = spacing.lg;
      basePadding.bottom = spacing.lg;
    }
  }
  
  if (deviceType === 'desktop') {
    basePadding.left = spacing.xxl;
    basePadding.right = spacing.xxl;
    basePadding.top = spacing.xl;
    basePadding.bottom = spacing.xl;
  }
  
  return basePadding;
};

// Touch target sizes (accessibility)
export const getTouchTargetSize = () => {
  const { deviceType } = getLayoutConfig();
  
  // Minimum touch target sizes by device type
  const sizes = {
    phone: {
      minimum: 44,
      recommended: 48,
      large: 56,
    },
    tablet: {
      minimum: 48,
      recommended: 56,
      large: 64,
    },
    desktop: {
      minimum: 40,
      recommended: 44,
      large: 52,
    },
  };
  
  return sizes[deviceType];
};

// Responsive image sizing
export const getImageDimensions = (
  aspectRatio: number,
  maxWidth?: number
): { width: number; height: number } => {
  const { width: screenWidth } = getDeviceDimensions();
  const containerMaxWidth = getContainerMaxWidth();
  
  const targetMaxWidth = maxWidth || containerMaxWidth * 0.9;
  const constrainedWidth = Math.min(targetMaxWidth, screenWidth * 0.9);
  
  return {
    width: constrainedWidth,
    height: constrainedWidth / aspectRatio,
  };
};

// React hook for responsive values
export const useResponsive = () => {
  const [dimensions, setDimensions] = React.useState(getDeviceDimensions());
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    });
    
    return () => subscription?.remove();
  }, []);
  
  const layoutConfig = getLayoutConfig();
  const spacing = createResponsiveSpacing();
  const radius = createResponsiveRadius();
  const typography = createResponsiveTypography();
  const gridConfig = getGridConfig();
  const touchTargets = getTouchTargetSize();
  const safeArea = getSafeAreaPadding();
  
  return {
    dimensions,
    ...layoutConfig,
    spacing,
    radius,
    typography,
    gridConfig,
    touchTargets,
    safeArea,
    getColumnWidth,
    getImageDimensions,
    responsiveWidth,
    responsiveHeight,
    responsiveFont,
  };
};

// Responsive style helper
export const createResponsiveStyle = <T extends Record<string, any>>(
  styles: {
    default: T;
    small?: Partial<T>;
    medium?: Partial<T>;
    large?: Partial<T>;
    xlarge?: Partial<T>;
    tablet?: Partial<T>;
    desktop?: Partial<T>;
    landscape?: Partial<T>;
  }
): T => {
  const { deviceType, width } = getLayoutConfig();
  const screenSize = getScreenSize(width);
  const orientation = getOrientation();
  
  let responsiveStyle = { ...styles.default };
  
  // Apply screen size specific styles
  if (styles[screenSize]) {
    responsiveStyle = { ...responsiveStyle, ...styles[screenSize] };
  }
  
  // Apply device type specific styles
  if (styles[deviceType]) {
    responsiveStyle = { ...responsiveStyle, ...styles[deviceType] };
  }
  
  // Apply orientation specific styles
  if (orientation === 'landscape' && styles.landscape) {
    responsiveStyle = { ...responsiveStyle, ...styles.landscape };
  }
  
  return responsiveStyle;
};