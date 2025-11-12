import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { supabaseService } from '../../services/supabase';

// Validation schema
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms'),
});

type PasswordRequirement = {
  text: string;
  met: boolean;
};

export function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp, loading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const strengthBarAnim = useRef(new Animated.Value(0)).current;

  const passwordRequirements: PasswordRequirement[] = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Number', met: /[0-9]/.test(password) },
    { text: 'Special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
  ];
  
  const passwordStrength = passwordRequirements.filter(req => req.met).length;

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
    // Animate password strength bar
    Animated.timing(strengthBarAnim, {
      toValue: passwordStrength / 4,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordStrength]);

  const validateEmailInput = (value: string) => {
    if (!value) {
      setEmailValid(null);
      return;
    }
    const isValid = validateEmail(value);
    setEmailValid(isValid);
    if (!isValid) {
      setErrors({ ...errors, email: 'Invalid email format' });
    } else {
      const { email, ...rest } = errors;
      setErrors(rest);
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameValid(null);
      return;
    }
    
    const isValid = /^[a-zA-Z0-9_]+$/.test(value) && value.length >= 3 && value.length <= 20;
    setUsernameValid(isValid);
    
    if (!isValid) {
      setErrors({ ...errors, username: 'Username can only contain letters, numbers, and underscores' });
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const available = await supabaseService.checkUsernameAvailability(value);
      setUsernameAvailable(available);
      if (!available) {
        setErrors({ ...errors, username: 'Username is already taken' });
      } else {
        const { username, ...rest } = errors;
        setErrors(rest);
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validatePasswords = () => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordsMatch(false);
      setErrors({ ...errors, confirmPassword: 'Passwords don\'t match' });
    } else if (confirmPassword && password === confirmPassword) {
      setPasswordsMatch(true);
      const { confirmPassword: _, ...rest } = errors;
      setErrors(rest);
    } else {
      setPasswordsMatch(null);
    }
  };

  const handleSignUp = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate form
    const validation = signUpSchema.safeParse({
      email,
      username,
      password,
      confirmPassword,
      termsAccepted,
    });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'confirmPassword') {
          fieldErrors[err.path[0]] = 'Passwords don\'t match';
        } else {
          fieldErrors[err.path[0]] = err.message;
        }
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

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords don\'t match' });
      return;
    }

    if (!usernameAvailable) {
      setErrors({ username: 'Username is not available' });
      return;
    }

    try {
      await signUp(email, password, username);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Account Created!',
        'Welcome to The Hangout! Let\'s set up your profile.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Onboarding' as never),
          },
        ]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (err.message?.includes('already')) {
        Alert.alert('Account Exists', 'An account with this email already exists.');
      } else if (err.message?.includes('Network')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return COLORS.gray600;
    if (passwordStrength === 1) return COLORS.error;
    if (passwordStrength === 2) return COLORS.warning;
    if (passwordStrength === 3) return '#FFD700';
    return COLORS.success;
  };

  const isFormValid = 
    emailValid === true &&
    usernameValid === true &&
    usernameAvailable === true &&
    passwordStrength === 4 &&
    passwordsMatch === true &&
    termsAccepted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.dark }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: SPACING.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Logo */}
            <View style={{ alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl }}>
              <Text style={{ fontSize: 48, fontWeight: '700' as const, color: COLORS.cyan }}>
                TH
              </Text>
            </View>

            {/* Headline */}
            <Text
              style={{
                ...TYPOGRAPHY.largeTitle,
                color: COLORS.white,
                textAlign: 'center',
                marginBottom: SPACING.sm,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.gray500,
                textAlign: 'center',
                marginBottom: SPACING.xxl,
              }}
            >
              Join The Hangout community
            </Text>

            {/* Form */}
            <View>
              {/* Email Input */}
              <View style={{ marginBottom: SPACING.xl }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption1,
                    fontWeight: '600' as const,
                    color: COLORS.white,
                    marginBottom: SPACING.sm,
                  }}
                >
                  Email
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

              {/* Username Input */}
              <View style={{ marginBottom: SPACING.xl }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption1,
                    fontWeight: '600' as const,
                    color: COLORS.white,
                    marginBottom: SPACING.sm,
                  }}
                >
                  Username
                </Text>
                <View style={{ position: 'relative' }}>
                  <Input
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      checkUsernameAvailability(text);
                    }}
                    onBlur={() => checkUsernameAvailability(username)}
                    placeholder="Pick a cool username"
                    autoCapitalize="none"
                    maxLength={20}
                    style={{
                      paddingLeft: 40,
                      paddingRight: 40,
                      borderColor:
                        usernameValid === false || usernameAvailable === false ? COLORS.error :
                        usernameValid === true && usernameAvailable === true ? COLORS.success :
                        'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={COLORS.gray600}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  >
                    {isCheckingUsername ? (
                      <ActivityIndicator size="small" color={COLORS.cyan} />
                    ) : usernameAvailable === true ? (
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    ) : usernameAvailable === false ? (
                      <Ionicons name="close-circle" size={16} color={COLORS.error} />
                    ) : null}
                  </View>
                </View>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption2,
                    color: COLORS.gray600,
                    textAlign: 'right',
                    marginTop: SPACING.xs,
                  }}
                >
                  {username.length} / 20
                </Text>
                {errors.username && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.caption1,
                      color: COLORS.error,
                      marginTop: SPACING.xs,
                    }}
                  >
                    {errors.username}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: SPACING.xl }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption1,
                    fontWeight: '600' as const,
                    color: COLORS.white,
                    marginBottom: SPACING.sm,
                  }}
                >
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    style={{
                      paddingLeft: 40,
                      paddingRight: 40,
                      borderColor: password && passwordStrength < 4 ? COLORS.warning : 'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={COLORS.gray600}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowPassword(!showPassword);
                    }}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={16}
                      color={COLORS.gray600}
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Password Strength Meter */}
                {password && (
                  <View style={{ marginTop: SPACING.sm }}>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: COLORS.gray700,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Animated.View
                        style={{
                          height: '100%',
                          backgroundColor: getPasswordStrengthColor(),
                          width: strengthBarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        }}
                      />
                    </View>
                    
                    {/* Requirements List */}
                    <View style={{ marginTop: SPACING.sm }}>
                      {passwordRequirements.map((req, index) => (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: SPACING.xs,
                          }}
                        >
                          <Ionicons
                            name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                            size={14}
                            color={req.met ? COLORS.cyan : COLORS.gray600}
                            style={{ marginRight: SPACING.sm }}
                          />
                          <Text
                            style={{
                              ...TYPOGRAPHY.caption1,
                              color: req.met ? COLORS.gray400 : COLORS.gray600,
                            }}
                          >
                            {req.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {errors.password && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.caption1,
                      color: COLORS.error,
                      marginTop: SPACING.xs,
                    }}
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={{ marginBottom: SPACING.xl }}>
                <Text
                  style={{
                    ...TYPOGRAPHY.caption1,
                    fontWeight: '600' as const,
                    color: COLORS.white,
                    marginBottom: SPACING.sm,
                  }}
                >
                  Confirm Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <Input
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (text) {
                        setPasswordsMatch(text === password);
                      }
                    }}
                    onBlur={validatePasswords}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={{
                      paddingLeft: 40,
                      paddingRight: 40,
                      borderColor:
                        passwordsMatch === false ? COLORS.error :
                        passwordsMatch === true ? COLORS.success :
                        'rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={COLORS.gray600}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -8 }],
                    }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={16}
                      color={COLORS.gray600}
                    />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text
                    style={{
                      ...TYPOGRAPHY.caption1,
                      color: COLORS.error,
                      marginTop: SPACING.xs,
                    }}
                  >
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setTermsAccepted(!termsAccepted);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: SPACING.xxl,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderWidth: 1,
                    borderColor: termsAccepted ? COLORS.cyan : COLORS.gray600,
                    borderRadius: 4,
                    backgroundColor: termsAccepted ? COLORS.cyan : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: SPACING.sm,
                  }}
                >
                  {termsAccepted && (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  )}
                </View>
                <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.gray500, flex: 1 }}>
                  I agree to the{' '}
                  <Text
                    style={{ color: COLORS.cyan, textDecorationLine: 'underline' }}
                    onPress={() => {
                      // Open Terms of Service
                      Alert.alert('Terms of Service', 'Terms of Service would open here');
                    }}
                  >
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={{ color: COLORS.cyan, textDecorationLine: 'underline' }}
                    onPress={() => {
                      // Open Privacy Policy
                      Alert.alert('Privacy Policy', 'Privacy Policy would open here');
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <LinearGradient
              colors={isFormValid ? [COLORS.cyan, COLORS.pink] : [COLORS.gray700, COLORS.gray700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: RADIUS.md,
                marginBottom: SPACING.xl,
                opacity: isFormValid ? 1 : 0.5,
              }}
            >
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={!isFormValid || loading}
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
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Sign In Link */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: SPACING.lg,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray500 }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('SignIn' as never);
                }}
              >
                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.cyan }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}