import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';

import { Input } from '../../components/Input';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATIONS } from '../../constants';
import { useAuthStore } from '../../stores';
import { validateEmail } from '../../utils';

// Validation schema
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { resetPassword, loading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...ANIMATIONS.springConfig,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (emailSent) {
      // Animate success icon
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          ...ANIMATIONS.springConfig,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...ANIMATIONS.springConfig,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [emailSent]);

  const validateEmailInput = (value: string) => {
    if (!value) {
      setEmailValid(null);
      return;
    }
    const isValid = validateEmail(value);
    setEmailValid(isValid);
    if (!isValid) {
      setErrors({ email: 'Invalid email format' });
    } else {
      setErrors({});
    }
  };

  const handleSendResetLink = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate form
    const validation = resetPasswordSchema.safeParse({ email });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      
      // Shake animation for error
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      return;
    }

    try {
      await resetPassword(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmailSent(true);
      setResendTimer(30);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (err.message?.includes('not found')) {
        Alert.alert('Email Not Found', 'No account found with this email address.');
      } else if (err.message?.includes('Network')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to send reset link. Please try again.');
      }
    }
  };

  const handleResendLink = async () => {
    if (resendTimer > 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await resetPassword(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResendTimer(30);
      Alert.alert('Link Sent', 'A new password reset link has been sent to your email.');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend link. Please try again.');
    }
  };

  const handleBackToSignIn = () => {
    Haptics.selectionAsync();
    navigation.navigate('SignIn' as never);
  };

  if (emailSent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.dark }}>
        <View style={{ flex: 1, padding: SPACING.lg }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setEmailSent(false);
              setEmail('');
              setEmailValid(null);
            }}
            style={{ marginBottom: SPACING.xl }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {/* Success Icon */}
            <Animated.View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING.xxl,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Ionicons name="mail-open" size={48} color={COLORS.cyan} />
            </Animated.View>

            {/* Headline */}
            <Text
              style={{
                ...TYPOGRAPHY.title1,
                color: COLORS.white,
                textAlign: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              Check Your Email
            </Text>

            {/* Description */}
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.gray500,
                textAlign: 'center',
                marginBottom: SPACING.xxl,
                paddingHorizontal: SPACING.xl,
                lineHeight: 24,
              }}
            >
              We've sent a password reset link to{'\n'}
              <Text style={{ color: COLORS.cyan, fontWeight: '600' as const }}>{email}</Text>
              {'\n\n'}
              Check your inbox and click the link to reset your password.
            </Text>

            {/* Timer Info */}
            <Text
              style={{
                ...TYPOGRAPHY.caption1,
                color: COLORS.gray600,
                textAlign: 'center',
                marginBottom: SPACING.xxl,
                paddingHorizontal: SPACING.xl,
              }}
            >
              Can't find the email? Check your spam folder or try again
              {resendTimer > 0 ? ` in ${resendTimer} seconds` : ''}
            </Text>

            {/* Buttons */}
            <View style={{ width: '100%', paddingHorizontal: SPACING.lg }}>
              {/* Resend Link Button */}
              <TouchableOpacity
                onPress={handleResendLink}
                disabled={resendTimer > 0}
                style={{
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: resendTimer > 0 ? COLORS.gray700 : COLORS.cyan,
                  borderRadius: RADIUS.md,
                  marginBottom: SPACING.md,
                  opacity: resendTimer > 0 ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    ...TYPOGRAPHY.bodyBold,
                    color: resendTimer > 0 ? COLORS.gray600 : COLORS.white,
                  }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Link'}
                </Text>
              </TouchableOpacity>

              {/* Back to Sign In Button */}
              <LinearGradient
                colors={[COLORS.cyan, COLORS.pink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: RADIUS.md,
                }}
              >
                <TouchableOpacity
                  onPress={handleBackToSignIn}
                  activeOpacity={0.8}
                  style={{
                    height: 56,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, padding: SPACING.lg }}>
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                navigation.goBack();
              }}
              style={{ marginBottom: SPACING.xl }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* Headline */}
            <Text
              style={{
                ...TYPOGRAPHY.title1,
                color: COLORS.white,
                marginTop: SPACING.xxl,
                marginBottom: SPACING.lg,
              }}
            >
              Reset Password
            </Text>
            
            {/* Subtitle */}
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.gray500,
                marginBottom: SPACING.xxl,
                lineHeight: 24,
              }}
            >
              Enter your email to receive a password reset link
            </Text>

            {/* Form */}
            <View>
              {/* Email Input */}
              <View style={{ marginBottom: SPACING.xxl }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption1,
                    fontWeight: '600' as const,
                    color: COLORS.white,
                    marginBottom: SPACING.sm,
                  }}
                >
                  Email Address
                </Text>
                <View style={{ position: 'relative' }}>
                  <Input
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      validateEmailInput(text);
                    }}
                    onBlur={() => validateEmailInput(email)}
                    placeholder="your@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    style={{
                      paddingLeft: 40,
                      paddingRight: 40,
                      borderColor:
                        emailValid === false ? COLORS.error :
                        emailValid === true ? COLORS.success :
                        'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.gray600}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  />
                  {emailValid === true && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.success}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: [{ translateY: -8 }],
                      }}
                    />
                  )}
                </View>
                {errors.email && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.caption1,
                      color: COLORS.error,
                      marginTop: SPACING.xs,
                    }}
                  >
                    {errors.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Send Link Button */}
            <LinearGradient
              colors={emailValid === true ? [COLORS.cyan, COLORS.pink] : [COLORS.gray700, COLORS.gray700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: RADIUS.md,
                marginBottom: SPACING.xl,
                opacity: emailValid === true ? 1 : 0.5,
              }}
            >
              <TouchableOpacity
                onPress={handleSendResetLink}
                disabled={emailValid !== true || loading}
                activeOpacity={0.8}
                style={{
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
                    Send Reset Link
                  </Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Back to Sign In Link */}
            <TouchableOpacity
              onPress={handleBackToSignIn}
              style={{ alignItems: 'center' }}
            >
              <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.cyan }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}