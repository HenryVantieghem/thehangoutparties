import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, VALIDATION } from '../../constants';
import { Input, Button, Toast } from '../../components';
import { useAuthStore } from '../../stores';
import { validateEmail, validateUsername } from '../../utils';

interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp, isLoading, error, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });
  
  const [showToast, setShowToast] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const strengthBarAnim = useRef(new Animated.Value(0)).current;

  // Check password requirements
  useEffect(() => {
    const requirements: PasswordRequirements = {
      length: password.length >= VALIDATION.PASSWORD_MIN,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    };
    setPasswordRequirements(requirements);

    // Animate strength bar
    const strength = Object.values(requirements).filter(Boolean).length;
    Animated.timing(strengthBarAnim, {
      toValue: strength,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [password]);

  // Check username uniqueness (debounced)
  useEffect(() => {
    if (username.length < VALIDATION.USERNAME_MIN) {
      setIsUsernameAvailable(null);
      return;
    }

    const validation = validateUsername(username);
    if (!validation.isValid) {
      setUsernameError(validation.error || null);
      setIsUsernameAvailable(false);
      return;
    }

    // Debounce username check
    const timer = setTimeout(() => {
      setIsCheckingUsername(true);
      // In production, call API to check username availability
      setTimeout(() => {
        setIsCheckingUsername(false);
        // Mock: assume available if valid format
        setIsUsernameAvailable(true);
        setUsernameError(null);
      }, 500);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

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

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      setUsernameError(usernameValidation.error || null);
      isValid = false;
    } else if (isUsernameAvailable === false) {
      setUsernameError('Username is already taken');
      isValid = false;
    } else {
      setUsernameError(null);
    }

    // Validate password
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!allRequirementsMet) {
      setPasswordError('Password does not meet requirements');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError(null);
    }

    // Validate terms
    if (!acceptedTerms) {
      isValid = false;
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

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await signUp(email.trim(), password, username.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        // Navigation handled by RootNavigator
      }, 2000);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const getPasswordStrengthColor = (): string => {
    const strength = Object.values(passwordRequirements).filter(Boolean).length;
    if (strength === 0) return COLORS.error;
    if (strength <= 2) return COLORS.warning;
    if (strength === 3) return '#FFD700';
    return COLORS.success;
  };

  const getPasswordStrengthWidth = (): number => {
    const strength = Object.values(passwordRequirements).filter(Boolean).length;
    return (strength / 4) * 100;
  };

  const isFormValid =
    email.trim() &&
    validateEmail(email) &&
    username.trim() &&
    validateUsername(username).isValid &&
    isUsernameAvailable === true &&
    Object.values(passwordRequirements).every(Boolean) &&
    password === confirmPassword &&
    acceptedTerms;

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
          <Text style={styles.headline}>Create Account</Text>
          <Text style={styles.subheadline}>Join The Hangout community</Text>

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
                onChangeText={setEmail}
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

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <Input
                label="Username"
                placeholder="Pick a cool username"
                value={username}
                onChangeText={setUsername}
                maxLength={VALIDATION.USERNAME_MAX}
                autoCapitalize="none"
                autoCorrect={false}
                error={usernameError || undefined}
                containerStyle={styles.inputContainer}
                leftIcon={<Ionicons name="person-outline" size={16} color={COLORS.gray600} />}
                rightIcon={
                  isCheckingUsername ? (
                    <Text style={styles.checkingText}>...</Text>
                  ) : isUsernameAvailable === true && username.length >= VALIDATION.USERNAME_MIN ? (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  ) : isUsernameAvailable === false ? (
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  ) : undefined
                }
              />
              <View style={styles.charCounter}>
                <Text style={styles.counterText}>{username.length} / {VALIDATION.USERNAME_MAX}</Text>
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
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

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((index) => {
                      const strength = Object.values(passwordRequirements).filter(Boolean).length;
                      const isFilled = index <= strength;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.strengthBar,
                            isFilled && {
                              backgroundColor: getPasswordStrengthColor(),
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <RequirementItem
                    met={passwordRequirements.length}
                    text={`At least ${VALIDATION.PASSWORD_MIN} characters`}
                  />
                  <RequirementItem met={passwordRequirements.uppercase} text="Uppercase letter" />
                  <RequirementItem met={passwordRequirements.number} text="Number" />
                  <RequirementItem met={passwordRequirements.special} text="Special character (@$!%*?&)" />
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                error={confirmPasswordError || undefined}
                containerStyle={styles.inputContainer}
                leftIcon={<Ionicons name="lock-closed-outline" size={16} color={COLORS.gray600} />}
                rightIcon={
                  <>
                    {confirmPassword && password === confirmPassword && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    )}
                    {confirmPassword && password !== confirmPassword && (
                      <Ionicons name="close-circle" size={20} color={COLORS.error} />
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        setShowConfirmPassword(!showConfirmPassword);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{ marginLeft: SPACING.xs }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.gray600}
                      />
                    </TouchableOpacity>
                  </>
                }
              />
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              onPress={() => {
                setAcceptedTerms(!acceptedTerms);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.termsContainer}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Ionicons name="checkmark" size={16} color={COLORS.dark} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://thehangout.app/terms')}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL('https://thehangout.app/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSignUp}
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
                style={styles.signUpButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.signUpButtonText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('SignIn' as never);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success/Error Toast */}
      {showToast && (
        <Toast
          message={error || 'Account created successfully!'}
          type={error ? 'error' : 'success'}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </SafeAreaView>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <View style={styles.requirementItem}>
    <Ionicons
      name={met ? 'checkmark-circle' : 'ellipse-outline'}
      size={16}
      color={met ? COLORS.cyan : COLORS.gray600}
    />
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

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
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
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
  charCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  counterText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray600,
  },
  checkingText: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.cyan,
  },
  strengthContainer: {
    marginTop: SPACING.sm,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.gray700,
    borderRadius: 2,
  },
  requirementsContainer: {
    marginTop: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  requirementText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray600,
    marginLeft: SPACING.xs,
  },
  requirementTextMet: {
    color: COLORS.cyan,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray600,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  termsText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray500,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.cyan,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  signUpButton: {
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
  signUpButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signInText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
  },
  signInLink: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
});
