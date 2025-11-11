import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants';
import { Input, Button, Toast } from '../../components';
import { AuthService } from '../../services/supabase';
import { validateEmail } from '../../utils';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      shakeAnimation();
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      shakeAnimation();
      return false;
    }

    setEmailError(null);
    return true;
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendResetLink = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AuthService.resetPassword(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to email sent screen
      navigation.navigate('ResetPasswordEmailSent' as never, { email: email.trim() } as never);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToastMessage('Failed to send reset email. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && validateEmail(text)) {
      setEmailError(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headline}>Reset Password</Text>
            <Text style={styles.subheadline}>
              Enter your email to receive a password reset link
            </Text>
          </View>

          {/* Email Input */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            <Input
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError || undefined}
              containerStyle={styles.inputContainer}
              leftIcon={<Ionicons name="mail-outline" size={16} color={COLORS.gray600} />}
              rightIcon={
                email && validateEmail(email) ? (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                ) : undefined
              }
            />
          </Animated.View>

          {/* Send Link Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSendResetLink}
              activeOpacity={0.8}
              disabled={!email.trim() || !validateEmail(email) || isLoading}
            >
              <LinearGradient
                colors={
                  email.trim() && validateEmail(email) && !isLoading
                    ? [COLORS.cyan, COLORS.pink]
                    : [COLORS.gray700, COLORS.gray700]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButton}
              >
                {isLoading ? (
                  <Text style={styles.sendButtonText}>Sending...</Text>
                ) : (
                  <Text style={styles.sendButtonText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Back to Sign In Link */}
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SignIn' as never);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.backToSignIn}
          >
            <Text style={styles.backToSignInText}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="error"
          onDismiss={() => setShowToast(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  backButton: {
    marginBottom: SPACING.xl,
    padding: SPACING.xs,
  },
  header: {
    marginBottom: SPACING.xxxl,
  },
  headline: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subheadline: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    marginBottom: 0,
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  sendButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  sendButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  backToSignIn: {
    alignSelf: 'center',
    padding: SPACING.sm,
  },
  backToSignInText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.cyan,
  },
});
