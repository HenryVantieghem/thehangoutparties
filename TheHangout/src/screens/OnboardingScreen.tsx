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
  Image,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, ANIMATIONS } from '../constants';
import { useAuthStore } from '../stores';
import { validateUsername } from '../utils';
import { supabaseService } from '../services/supabase';

// Validation schema
const profileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(200).optional(),
});

export function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  
  // Profile form state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuthStore();

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

    // Continuous animations
    startContinuousAnimations();
  }, [currentStep]);

  const startContinuousAnimations = () => {
    // Logo rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.2,
          ...ANIMATIONS.springConfig,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          ...ANIMATIONS.springConfig,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 4) {
      // Skip profile setup
      navigation.navigate('Main' as never);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const requestLocationPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleNext();
    } else {
      Alert.alert(
        'Location Access',
        'Location access denied. You can enable this later in Settings.',
        [{ text: 'OK', onPress: handleNext }]
      );
    }
  };

  const requestCameraPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status === 'granted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleNext();
    } else {
      Alert.alert(
        'Camera Access',
        'Camera access denied. You can enable this later in Settings.',
        [{ text: 'OK', onPress: handleNext }]
      );
    }
  };

  const requestNotificationPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleNext();
    } else {
      Alert.alert(
        'Notifications',
        'Notifications disabled. You can enable this later in Settings.',
        [{ text: 'OK', onPress: handleNext }]
      );
    }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const available = await supabaseService.checkUsernameAvailability(value);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Validate form
    const validation = profileSchema.safeParse({ username, bio });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!usernameAvailable) {
      setErrors({ username: 'Username is not available' });
      return;
    }

    setIsLoading(true);
    try {
      // Update user profile
      await supabaseService.updateProfile({
        username,
        bio,
        avatar_url: avatar || undefined,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Main' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep0 = () => (
    <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
      {/* Progress indicator */}
      <View style={{ alignItems: 'flex-end', marginBottom: SPACING.xl }}>
        <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.gray500 }}>
          1 / 5
        </Text>
      </View>

      {/* Hero Image */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
        <Animated.View
          style={{
            width: 280,
            height: 280,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: 'rgba(0, 217, 255, 0.1)',
            }}
          />
          <Text style={{ fontSize: 60, fontWeight: '700' as const, color: COLORS.cyan }}>
            TH
          </Text>
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text
          style={{
            ...TYPOGRAPHY.display2,
            color: COLORS.cyan,
            textAlign: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          The Hangout
        </Text>
        <Text
          style={{
            ...TYPOGRAPHY.body,
            color: COLORS.gray500,
            textAlign: 'center',
            marginBottom: SPACING.xxl,
          }}
        >
          Find parties. Make memories.
        </Text>

        {/* Features */}
        {['🗺️ Discover parties in real-time', '📸 Share moments with friends', '🎉 Connect with your community'].map(
          (feature, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, 50 + index * 10],
                    }),
                  },
                ],
              }}
            >
              <Text
                style={{
                  ...TYPOGRAPHY.bodySmall,
                  color: COLORS.gray400,
                  textAlign: 'center',
                  marginBottom: SPACING.md,
                }}
              >
                {feature}
              </Text>
            </Animated.View>
          )
        )}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Continue Button */}
      <LinearGradient
        colors={[COLORS.cyan, COLORS.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: RADIUS.md,
          marginBottom: SPACING.lg,
        }}
      >
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={{
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
            Get Started
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderStep1 = () => (
    <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.gray500 }}>
          2 / 5
        </Text>
      </View>

      {/* Illustration */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.xxl }}>
        <Animated.View
          style={{
            width: 200,
            height: 200,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateY: floatAnim }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(0, 217, 255, 0.1)',
            }}
          />
          <Ionicons name="location" size={120} color={COLORS.cyan} />
        </Animated.View>
      </View>

      {/* Content */}
      <Text
        style={{
          ...TYPOGRAPHY.title2,
          color: COLORS.white,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        Find Parties Near You
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.body,
          color: COLORS.gray500,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: SPACING.xxxl,
        }}
      >
        We use your location to show you parties happening around you. Your location is only shared with people you've accepted as friends.
      </Text>

      {/* Info Box */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          flexDirection: 'row',
          marginBottom: SPACING.xxl,
        }}
      >
        <Ionicons
          name="information-circle"
          size={16}
          color={COLORS.cyan}
          style={{ marginRight: SPACING.sm }}
        />
        <Text
          style={{
            ...TYPOGRAPHY.caption1,
            color: COLORS.gray400,
            flex: 1,
          }}
        >
          We'll never sell your location. You can disable this anytime in Settings.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Buttons */}
      <LinearGradient
        colors={[COLORS.cyan, COLORS.cyanDark]}
        style={{
          borderRadius: RADIUS.md,
          marginBottom: SPACING.md,
        }}
      >
        <TouchableOpacity
          onPress={requestLocationPermission}
          activeOpacity={0.8}
          style={{
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
            Allow Location Access
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity
        onPress={handleNext}
        style={{
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: COLORS.cyan,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.lg,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
          Maybe Later
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.gray500 }}>
          3 / 5
        </Text>
      </View>

      {/* Illustration */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.xxl }}>
        <Animated.View
          style={{
            width: 200,
            height: 200,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(255, 0, 110, 0.1)',
            }}
          />
          <Ionicons name="camera" size={120} color={COLORS.pink} />
        </Animated.View>
      </View>

      {/* Content */}
      <Text
        style={{
          ...TYPOGRAPHY.title2,
          color: COLORS.white,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        Share Your Moments
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.body,
          color: COLORS.gray500,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: SPACING.xxxl,
        }}
      >
        Upload photos to parties you attend. Show everyone the vibes!
      </Text>

      {/* Info Box */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          flexDirection: 'row',
          marginBottom: SPACING.xxl,
        }}
      >
        <Ionicons
          name="information-circle"
          size={16}
          color={COLORS.pink}
          style={{ marginRight: SPACING.sm }}
        />
        <Text
          style={{
            ...TYPOGRAPHY.caption1,
            color: COLORS.gray400,
            flex: 1,
          }}
        >
          Only photos you select will be uploaded. We never access your photos without permission.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Buttons */}
      <LinearGradient
        colors={[COLORS.pink, COLORS.pinkDark]}
        style={{
          borderRadius: RADIUS.md,
          marginBottom: SPACING.md,
        }}
      >
        <TouchableOpacity
          onPress={requestCameraPermission}
          activeOpacity={0.8}
          style={{
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
            Allow Camera Access
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <TouchableOpacity
        onPress={handleNext}
        style={{
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: COLORS.pink,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.lg,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
          Skip for Now
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, paddingHorizontal: SPACING.lg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.gray500 }}>
          4 / 5
        </Text>
      </View>

      {/* Illustration */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.xxl }}>
        <Animated.View
          style={{
            width: 200,
            height: 200,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ scale: bounceAnim }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(255, 149, 0, 0.1)',
            }}
          />
          <Ionicons name="notifications" size={120} color={COLORS.warning} />
        </Animated.View>
      </View>

      {/* Content */}
      <Text
        style={{
          ...TYPOGRAPHY.title2,
          color: COLORS.white,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        }}
      >
        Get Real-Time Updates
      </Text>
      <Text
        style={{
          ...TYPOGRAPHY.body,
          color: COLORS.gray500,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: SPACING.xxxl,
        }}
      >
        Get notified when friends join parties, when new comments come in, and more.
      </Text>

      {/* Info Box */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: RADIUS.md,
          padding: SPACING.lg,
          flexDirection: 'row',
          marginBottom: SPACING.xxl,
        }}
      >
        <Ionicons
          name="information-circle"
          size={16}
          color={COLORS.warning}
          style={{ marginRight: SPACING.sm }}
        />
        <Text
          style={{
            ...TYPOGRAPHY.caption1,
            color: COLORS.gray400,
            flex: 1,
          }}
        >
          You can control notifications anytime in your Settings.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Buttons */}
      <TouchableOpacity
        onPress={requestNotificationPermission}
        style={{
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.warning,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.md,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
          Enable Notifications
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNext}
        style={{
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: COLORS.warning,
          borderRadius: RADIUS.md,
          marginBottom: SPACING.lg,
        }}
      >
        <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
          Not Right Now
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: SPACING.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.xl,
          }}
        >
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={{ ...TYPOGRAPHY.caption1, color: COLORS.cyan }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text
          style={{
            ...TYPOGRAPHY.title1,
            color: COLORS.white,
            marginTop: SPACING.xxl,
            marginBottom: SPACING.sm,
          }}
        >
          Create Your Profile
        </Text>
        <Text
          style={{
            ...TYPOGRAPHY.body,
            color: COLORS.gray500,
            marginBottom: SPACING.xxl,
          }}
        >
          Tell us a bit about yourself
        </Text>

        {/* Avatar */}
        <TouchableOpacity
          onPress={pickImage}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            borderColor: COLORS.cyan,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
            marginBottom: SPACING.xxl,
          }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
              }}
            />
          ) : (
            <Ionicons name="camera" size={48} color={COLORS.cyan} />
          )}
        </TouchableOpacity>

        {/* Username */}
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
          <View>
            <Input
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                checkUsernameAvailability(text);
              }}
              placeholder="Enter username"
              maxLength={20}
              style={{
                paddingRight: 40,
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

        {/* Bio */}
        <View style={{ marginBottom: SPACING.xl }}>
          <Text
            style={{
              ...TYPOGRAPHY.caption1,
              fontWeight: '600' as const,
              color: COLORS.white,
              marginBottom: SPACING.sm,
            }}
          >
            Bio (optional)
          </Text>
          <RNTextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us what you're into..."
            placeholderTextColor={COLORS.gray600}
            multiline
            maxLength={200}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              color: COLORS.white,
              ...TYPOGRAPHY.body,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
          <Text
            style={{
              ...TYPOGRAPHY.caption2,
              color: COLORS.gray600,
              textAlign: 'right',
              marginTop: SPACING.xs,
            }}
          >
            {bio.length} / 200
          </Text>
        </View>

        {/* Interests */}
        <View style={{ marginBottom: SPACING.xxl }}>
          <Text
            style={{
              ...TYPOGRAPHY.caption1,
              fontWeight: '600' as const,
              color: COLORS.white,
              marginBottom: SPACING.sm,
            }}
          >
            What parties are you into?
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: SPACING.sm,
            }}
          >
            {['Chill', 'Lit', 'Exclusive', 'Casual', 'Banger'].map((interest) => (
              <TouchableOpacity
                key={interest}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (interests.includes(interest)) {
                    setInterests(interests.filter((i) => i !== interest));
                  } else {
                    setInterests([...interests, interest]);
                  }
                }}
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.sm,
                  borderRadius: RADIUS.full,
                  backgroundColor: interests.includes(interest)
                    ? COLORS.cyan
                    : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: interests.includes(interest)
                    ? COLORS.cyan
                    : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Text
                  style={{
                    ...TYPOGRAPHY.bodySmall,
                    fontWeight: '600' as const,
                    color: interests.includes(interest)
                      ? COLORS.white
                      : COLORS.gray400,
                  }}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Complete Button */}
        <LinearGradient
          colors={[COLORS.cyan, COLORS.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: RADIUS.md,
            marginBottom: SPACING.lg,
            opacity: !username || !usernameAvailable ? 0.5 : 1,
          }}
        >
          <TouchableOpacity
            onPress={handleCompleteOnboarding}
            disabled={!username || !usernameAvailable || isLoading}
            activeOpacity={0.8}
            style={{
              height: 56,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={{ ...TYPOGRAPHY.bodyBold, color: COLORS.white }}>
                Complete Profile
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.dark }}>
      {currentStep === 0 && renderStep0()}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
    </SafeAreaView>
  );
}