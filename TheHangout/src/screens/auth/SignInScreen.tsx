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
import { useAuthStore } from '../../stores';
import { validateEmail } from '../../utils';

export default function SignInScreen() {
  const navigation = useNavigation();
  const { signIn, isLoading, error, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    } else {
      setEmailError(null);
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    if (!isValid) {
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    return isValid;
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
        toValue: 10,
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

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signIn(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation handled by RootNavigator based on auth state
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError && validateEmail(text)) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError && text.length >= 8) {
      setPasswordError(null);
    }
  };

  const isFormValid = email.trim() && validateEmail(email) && password.length >= 8;

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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>🎉</Text>
            <Text style={styles.logoTitle}>The Hangout</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>Welcome Back</Text>
          <Text style={styles.subheadline}>Sign in to find parties and connect</Text>

          {/* Form Fields */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Input
                label="Email"
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
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                error={passwordError || undefined}
                containerStyle={styles.inputContainer}
                leftIcon={<Ionicons name="lock-closed-outline" size={16} color={COLORS.gray600} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => {
                      setShowPassword(!showPassword);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.gray600}
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('ResetPassword' as never);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSignIn}
              activeOpacity={0.8}
              disabled={!isFormValid || isLoading}
            >
              <LinearGradient
                colors={
                  isFormValid && !isLoading
                    ? [COLORS.cyan, COLORS.pink]
                    : [COLORS.gray700, COLORS.gray700]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.signInButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Apple Sign In Button */}
          <Button
            title="Sign in with Apple"
            variant="secondary"
            size="large"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Apple Sign In implementation
            }}
            style={styles.appleButton}
            leftIcon={<Ionicons name="logo-apple" size={20} color={COLORS.white} />}
          />

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('SignUp' as never);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Toast */}
      {showToast && error && (
        <Toast
          message={error}
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
    paddingBottom: SPACING.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoText: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  logoTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.cyan,
  },
  headline: {
    ...TYPOGRAPHY.largeTitle,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subheadline: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.cyan,
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  signInButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray600,
  },
  dividerText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray600,
    marginHorizontal: SPACING.md,
  },
  appleButton: {
    marginBottom: SPACING.xl,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signUpText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  signUpLink: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
});
