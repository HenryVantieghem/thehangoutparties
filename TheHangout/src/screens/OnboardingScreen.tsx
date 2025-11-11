import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { Button, Input } from '../components';
import { useAuthStore } from '../stores';
import { validateUsername, validateEmail } from '../utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Profile setup state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Logo rotation animation (continuous)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Float animation for step 2
    if (currentStep === 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
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
    }

    // Pulse animation for step 3
    if (currentStep === 3) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Bounce animation for step 4
    if (currentStep === 4) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [currentStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };

  const handleLocationPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleNext();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Show error toast
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const handleCameraPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleNext();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Camera permission error:', error);
    }
  };

  const handleNotificationsPermission = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Request notifications permission
      // Note: In production, use expo-notifications
      handleNext();
    } catch (error) {
      console.error('Notifications permission error:', error);
    }
  };

  const handleAvatarSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Avatar selection error:', error);
    }
  };

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    const validation = validateUsername(text);
    
    if (!validation.isValid) {
      setUsernameError(validation.error || null);
      return;
    }

    // Check uniqueness (placeholder - in production, call API)
    setIsCheckingUsername(true);
    setTimeout(() => {
      setIsCheckingUsername(false);
      setUsernameError(null);
    }, 500);
  };

  const handleVibeToggle = (vibe: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Render Step 1: Welcome Screen
  const renderWelcomeScreen = () => (
    <View style={styles.stepContainer}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>1 / 5</Text>
      </View>

      {/* Hero Image */}
      <Animated.View
        style={[
          styles.heroContainer,
          {
            opacity: fadeAnim,
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🎉</Text>
        </View>
      </Animated.View>

      {/* Headline */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.headline}>The Hangout</Text>
        <Text style={styles.subheadline}>Find parties. Make memories.</Text>
      </Animated.View>

      {/* Features List */}
      <Animated.View style={[styles.featuresList, { opacity: fadeAnim }]}>
        <Text style={styles.featureItem}>🗺️ Discover parties in real-time</Text>
        <Text style={styles.featureItem}>📸 Share moments with friends</Text>
        <Text style={styles.featureItem}>🎉 Connect with your community</Text>
      </Animated.View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={styles.continueButton}
        >
          <LinearGradient
            colors={[COLORS.cyan, COLORS.pink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.continueButtonText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Step 2: Location Permission
  const renderLocationScreen = () => (
    <View style={styles.stepContainer}>
      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>2 / 5</Text>
      </View>

      {/* Illustration */}
      <Animated.View
        style={[
          styles.illustrationContainer,
          {
            transform: [{ translateY: floatInterpolate }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={60} color={COLORS.cyan} />
        </View>
      </Animated.View>

      {/* Title */}
      <Text style={styles.stepTitle}>Find Parties Near You</Text>
      <Text style={styles.stepDescription}>
        We use your location to show you parties happening around you. Your location is only shared with people you've accepted as friends.
      </Text>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={COLORS.cyan} />
        <Text style={styles.infoText}>
          We'll never sell your location. You can disable this anytime in Settings.
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Allow Location Access"
          variant="primary"
          size="large"
          onPress={handleLocationPermission}
          style={styles.permissionButton}
        />
        <Button
          title="Maybe Later"
          variant="secondary"
          size="large"
          onPress={handleNext}
          style={styles.skipButton}
        />
      </View>
    </View>
  );

  // Render Step 3: Camera Permission
  const renderCameraScreen = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>3 / 5</Text>
      </View>

      <Animated.View
        style={[
          styles.illustrationContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { borderColor: COLORS.pink }]}>
          <Ionicons name="camera" size={60} color={COLORS.pink} />
        </View>
      </Animated.View>

      <Text style={styles.stepTitle}>Share Your Moments</Text>
      <Text style={styles.stepDescription}>
        Upload photos to parties you attend. Show everyone the vibes!
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={COLORS.pink} />
        <Text style={styles.infoText}>
          Only photos you select will be uploaded. We never access your photos without permission.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Allow Camera Access"
          variant="primary"
          size="large"
          onPress={handleCameraPermission}
          style={styles.permissionButton}
        />
        <Button
          title="Skip for Now"
          variant="secondary"
          size="large"
          onPress={handleNext}
          style={styles.skipButton}
        />
      </View>
    </View>
  );

  // Render Step 4: Notifications Permission
  const renderNotificationsScreen = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>4 / 5</Text>
      </View>

      <Animated.View
        style={[
          styles.illustrationContainer,
          {
            transform: [{ scale: bounceAnim }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { borderColor: COLORS.warning }]}>
          <Ionicons name="notifications" size={60} color={COLORS.warning} />
        </View>
      </Animated.View>

      <Text style={styles.stepTitle}>Get Real-Time Updates</Text>
      <Text style={styles.stepDescription}>
        Get notified when friends join parties, when new comments come in, and more.
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={COLORS.warning} />
        <Text style={styles.infoText}>
          You can control notifications anytime in your Settings.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Enable Notifications"
          variant="primary"
          size="large"
          onPress={handleNotificationsPermission}
          style={styles.permissionButton}
        />
        <Button
          title="Not Right Now"
          variant="secondary"
          size="large"
          onPress={handleNext}
          style={styles.skipButton}
        />
      </View>
    </View>
  );

  // Render Step 5: Profile Setup
  const renderProfileSetupScreen = () => (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Skip Button */}
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.skipButtonTop}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>5 / 5</Text>
      </View>

      <Text style={styles.profileTitle}>Create Your Profile</Text>
      <Text style={styles.profileSubtitle}>Tell us a bit about yourself</Text>

      {/* Avatar */}
      <TouchableOpacity
        onPress={handleAvatarSelect}
        style={styles.avatarContainer}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera" size={48} color={COLORS.cyan} />
          </View>
        )}
      </TouchableOpacity>

      {/* Username */}
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Username</Text>
        <Input
          placeholder="Enter username"
          value={username}
          onChangeText={handleUsernameChange}
          maxLength={20}
          error={usernameError || undefined}
          containerStyle={styles.inputContainer}
        />
        <View style={styles.charCounter}>
          <Text style={styles.counterText}>
            {username.length} / 20
          </Text>
          {isCheckingUsername && (
            <Text style={styles.checkingText}>Checking...</Text>
          )}
          {!usernameError && username.length >= 3 && !isCheckingUsername && (
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          )}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Bio (optional)</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="Tell us what you're into..."
          placeholderTextColor={COLORS.gray500}
          value={bio}
          onChangeText={setBio}
          maxLength={200}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.charCounter}>{bio.length} / 200</Text>
      </View>

      {/* Interests */}
      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>What parties are you into?</Text>
        <View style={styles.vibeContainer}>
          {['Chill', 'Lit', 'Exclusive', 'Casual', 'Banger'].map((vibe) => (
            <TouchableOpacity
              key={vibe}
              onPress={() => handleVibeToggle(vibe.toLowerCase())}
              style={[
                styles.vibeButton,
                selectedVibes.includes(vibe.toLowerCase()) && styles.vibeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.vibeButtonText,
                  selectedVibes.includes(vibe.toLowerCase()) && styles.vibeButtonTextSelected,
                ]}
              >
                {vibe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Complete Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleComplete}
          activeOpacity={0.8}
          style={styles.continueButton}
          disabled={username.length < 3}
        >
          <LinearGradient
            colors={username.length >= 3 ? [COLORS.cyan, COLORS.pink] : [COLORS.gray700, COLORS.gray700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.continueButtonText}>Complete Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {currentStep === 1 && renderWelcomeScreen()}
        {currentStep === 2 && renderLocationScreen()}
        {currentStep === 3 && renderCameraScreen()}
        {currentStep === 4 && renderNotificationsScreen()}
        {currentStep === 5 && renderProfileSetupScreen()}
      </Animated.View>
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
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  progressContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  progressText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray500,
  },
  backButton: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    zIndex: 10,
    padding: SPACING.xs,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_HEIGHT * 0.3,
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  logoText: {
    fontSize: 120,
  },
  headline: {
    ...TYPOGRAPHY.display2,
    color: COLORS.cyan,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subheadline: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  featuresList: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  featureItem: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  buttonContainer: {
    paddingBottom: SPACING.lg,
  },
  continueButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_HEIGHT * 0.3,
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cyan,
  },
  stepTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    alignItems: 'flex-start',
  },
  infoText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    flex: 1,
    marginLeft: SPACING.sm,
  },
  permissionButton: {
    marginBottom: SPACING.md,
  },
  skipButton: {
    marginTop: SPACING.sm,
  },
  skipButtonTop: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.cyan,
  },
  profileTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.sm,
  },
  profileSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarContainer: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formField: {
    marginBottom: SPACING.xl,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    marginBottom: SPACING.xs,
  },
  charCounter: {
    flexDirection: 'row',
    alignItems: 'center',
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
  bioInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  vibeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  vibeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray600,
  },
  vibeButtonSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  vibeButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.dark,
    fontWeight: '600',
  },
  vibeButtonTextSelected: {
    color: COLORS.dark,
  },
});
