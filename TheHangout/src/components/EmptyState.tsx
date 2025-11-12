import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionText, onAction }: EmptyStateProps) {
  const handleAction = () => {
    if (onAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAction();
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={15} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <BlurView intensity={10} style={styles.iconBlur}>
                <LinearGradient
                  colors={['rgba(0, 217, 255, 0.2)', 'rgba(255, 0, 110, 0.2)']}
                  style={styles.iconGradient}
                >
                  <Ionicons name={icon as any} size={48} color={COLORS.cyan} />
                </LinearGradient>
              </BlurView>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {actionText && onAction && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAction}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.cyan, COLORS.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionText}>{actionText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  blurContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  gradient: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.xl,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconBlur: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const as const,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 280,
  },
  actionButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  actionGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  actionText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
});

