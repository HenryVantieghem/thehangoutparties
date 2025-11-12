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
import * as AppleAuthentication from 'expo-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';

import { Input } from '../../components/Input';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATIONS } from '../../constants';
import { useAuthStore } from '../../stores';
import { validateEmail } from '../../utils';

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function SignInScreen() {
  const navigation = useNavigation();
  const { signIn, loading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const validatePasswordInput = (value: string) => {
    if (!value) {
      setPasswordValid(null);
      return;
    }
    const isValid = value.length >= 8;
    setPasswordValid(isValid);
    if (!isValid) {
      setErrors({ ...errors, password: 'Password must be at least 8 characters' });
    } else {
      const { password, ...rest } = errors;
      setErrors(rest);
    }
  };

  const handleSignIn = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validate form
    const validation = signInSchema.safeParse({ email, password });
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
      await signIn(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Main' as never);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show appropriate error message
      if (err.message?.includes('Invalid')) {
        Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
      } else if (err.message?.includes('Network')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Handle Apple sign in with credential
      // This would integrate with your auth service
      console.log('Apple credential:', credential);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Main' as never);
    } catch (err: any) {
      if (err.code === 'ERR_CANCELED') {
        // User cancelled Apple Sign In
      } else {
        Alert.alert('Apple Sign In Failed', 'Please try again.');
      }
    }
  };

  const isFormValid = emailValid === true && passwordValid === true;

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
            <View style={{ alignItems: 'center', marginTop: SPACING.xxxl, marginBottom: SPACING.xxxl }}>
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
              Welcome Back
            </Text>
            <Text
              style={{
                ...TYPOGRAPHY.body,
                color: COLORS.gray500,
                textAlign: 'center',
                marginBottom: SPACING.xxxl,
              }}
            >
              Sign in to find parties and connect
            </Text>

            {/* Form */}
            <View style={{ marginBottom: SPACING.xxl }}>
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

              {/* Password Input */}
              <View style={{ marginBottom: SPACING.md }}>
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
                    onChangeText={(text) => {
                      setPassword(text);
                      validatePasswordInput(text);
                    }}
                    onBlur={() => validatePasswordInput(password)}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    style={{
                      paddingLeft: 40,
                      paddingRight: 40,
                      borderColor:
                        passwordValid === false ? COLORS.error :
                        passwordValid === true ? COLORS.success :
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

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('ResetPassword' as never);
                }}
                style={{ alignSelf: 'flex-end' }}
              >
                <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.cyan }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
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
                onPress={handleSignIn}
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
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </LinearGradient>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING.xl,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: COLORS.gray600,
                }}
              />
              <Text
                style={{
                  ...TYPOGRAPHY.caption1,
                  color: COLORS.gray600,
                  marginHorizontal: SPACING.lg,
                }}
              >
                Or continue with
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: COLORS.gray600,
                }}
              />
            </View>

            {/* Apple Sign In */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={handleAppleSignIn}
                style={{
                  height: 56,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: RADIUS.md,
                  marginBottom: SPACING.xxl,
                }}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color={COLORS.white}
                  style={{ marginRight: SPACING.sm }}
                />
                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
                  Sign in with Apple
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            {/* Sign Up Link */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: SPACING.xl,
                marginBottom: SPACING.lg,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.gray500 }}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate('SignUp' as never);
                }}
              >
                <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.cyan }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}