import React, { useState, useCallback, memo } from 'react';
import {
  Image,
  ImageStyle,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
  ImageResizeMode,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  style?: ImageStyle;
  resizeMode?: ImageResizeMode;
  showLoadingIndicator?: boolean;
  showErrorState?: boolean;
  placeholderColor?: string;
  borderRadius?: number;
}

/**
 * Optimized Image component with proper loading states, error handling, and performance optimization
 */
export const OptimizedImage = memo<OptimizedImageProps>(({
  uri,
  width,
  height,
  style,
  resizeMode = 'cover',
  showLoadingIndicator = true,
  showErrorState = true,
  placeholderColor = COLORS.gray700,
  borderRadius = 0,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const containerStyle = [
    styles.container,
    {
      width,
      height,
      borderRadius,
    },
    style,
  ];

  const imageStyle = [
    styles.image,
    {
      width: width || '100%',
      height: height || '100%',
      borderRadius,
    },
  ];

  // Don't render anything if no URI provided
  if (!uri) {
    return (
      <View style={containerStyle}>
        <View style={[styles.placeholder, { backgroundColor: placeholderColor, borderRadius }]}>
          {showErrorState && (
            <Ionicons name="image-outline" size={24} color={COLORS.gray500} />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Main Image */}
      <Image
        {...props}
        source={{ uri }}
        style={imageStyle}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
        // Performance optimizations
        fadeDuration={200}
        resizeMethod="resize" // More memory efficient
        defaultSource={undefined} // Avoid flash of default image
      />

      {/* Loading State */}
      {loading && showLoadingIndicator && (
        <View style={[styles.overlay, { borderRadius }]}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
            style={[styles.gradientOverlay, { borderRadius }]}
          >
            <ActivityIndicator size="small" color={COLORS.white} />
          </LinearGradient>
        </View>
      )}

      {/* Error State */}
      {error && showErrorState && (
        <View style={[styles.overlay, { borderRadius }]}>
          <View style={[styles.errorState, { backgroundColor: placeholderColor, borderRadius }]}>
            <Ionicons name="image-outline" size={24} color={COLORS.gray500} />
          </View>
        </View>
      )}
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});