import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import { Button } from '../../components';
import { AuthService } from '../../services/supabase';

export default function ResetPasswordEmailSentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const email = (route.params as any)?.email || '';
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Bounce animation on mount
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Timer countdown
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (!canResend || !email) return;

    try {
      setIsResending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AuthService.resetPassword(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset timer
      setResendTimer(30);
      setCanResend(false);
      
      // Restart timer
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: bounceAnim }],
            },
          ]}
        >
          <Ionicons name="mail-open" size={80} color={COLORS.cyan} />
        </Animated.View>

        {/* Headline */}
        <Text style={styles.headline}>Check Your Email</Text>

        {/* Description */}
        <Text style={styles.description}>
          We've sent a password reset link to{' '}
          <Text style={styles.emailText}>{email}</Text>. Check your inbox and click the link to reset your password.
        </Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            Can't find the email? Check your spam folder or try again in{' '}
            <Text style={styles.timerNumber}>{resendTimer}</Text> seconds
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isResending ? 'Resending...' : 'Resend Link'}
            variant="secondary"
            size="large"
            onPress={handleResend}
            disabled={!canResend || isResending}
            style={styles.resendButton}
          />
          
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SignIn' as never);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.xxl,
  },
  headline: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emailText: {
    color: COLORS.cyan,
    fontWeight: '600',
  },
  timerContainer: {
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  timerText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  timerNumber: {
    color: COLORS.cyan,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  resendButton: {
    marginBottom: SPACING.md,
  },
  backButton: {
    alignSelf: 'center',
    padding: SPACING.md,
  },
  backButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
});

