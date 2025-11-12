import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants';
import { usePartyStore, useLocationStore } from '../stores';
import { Party } from '../types';

const { width } = Dimensions.get('window');

const VIBES = [
  { id: 'chill', label: 'Chill', icon: '🌙', color: COLORS.cyan },
  { id: 'lit', label: 'Lit', icon: '🔥', color: COLORS.orange },
  { id: 'banger', label: 'Banger', icon: '💥', color: COLORS.pink },
  { id: 'exclusive', label: 'Exclusive', icon: '✨', color: COLORS.warning },
  { id: 'casual', label: 'Casual', icon: '☕', color: COLORS.gray500 },
] as const;

const STEPS = ['Details', 'Photo', 'Location', 'Review'] as const;

export function CreatePartyScreen() {
  const navigation = useNavigation();
  const { addParty } = usePartyStore();
  const { currentLocation } = useLocationStore();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: null as string | null,
    address: '',
    latitude: currentLocation?.latitude || 40.7128,
    longitude: currentLocation?.longitude || -74.0060,
    max_attendees: 50,
    vibe: 'chill' as 'chill' | 'lit' | 'exclusive' | 'casual' | 'banger' | null,
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    animateToStep(currentStep);
  }, [currentStep]);

  const animateToStep = (step: number) => {
    const progress = step / (STEPS.length - 1);
    
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Details
        if (!formData.title.trim()) {
          newErrors.title = 'Party title is required';
        } else if (formData.title.length > 100) {
          newErrors.title = 'Title must be under 100 characters';
        }
        
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length > 500) {
          newErrors.description = 'Description must be under 500 characters';
        }

        if (formData.max_attendees < 5 || formData.max_attendees > 500) {
          newErrors.max_attendees = 'Must be between 5 and 500 attendees';
        }
        break;

      case 1: // Photo
        if (!formData.photo_url) {
          newErrors.photo = 'Party photo is required';
        }
        break;

      case 2: // Location
        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [currentStep, validateStep]);

  const handlePrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleImagePick = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, photo_url: result.assets[0].uri });
        setErrors({ ...errors, photo: '' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [formData, errors]);

  const handleLocationPick = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to set party location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const formattedAddress = `${address[0].streetNumber || ''} ${address[0].street || ''}, ${address[0].city || ''}`.trim();
        setFormData({
          ...formData,
          address: formattedAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setErrors({ ...errors, address: '' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  }, [formData, errors]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newParty: Partial<Party> = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        photo_url: formData.photo_url,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        max_attendees: formData.max_attendees,
        vibe: formData.vibe,
        tags: formData.tags,
        created_by: 'current-user-id',
        attendee_count: 1,
        status: 'active',
        is_trending: false,
        view_count: 0,
        engagement_score: 7.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ended_at: null,
        last_activity_at: new Date().toISOString(),
      };

      addParty(newParty as Party);
      
      Alert.alert(
        'Party Created! 🎉',
        'Your party has been created successfully. People can now discover and join!',
        [{ text: 'Great!', onPress: () => navigation.navigate('Discover' as never) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create party. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, addParty, navigation]);

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <View style={styles.stepsContainer}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= currentStep && styles.stepNumberActive,
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive,
            ]}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDetailsStep();
      case 1:
        return renderPhotoStep();
      case 2:
        return renderLocationStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderDetailsStep = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Party Details</Text>
      <Text style={styles.stepSubtitle}>What's your party about?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Party Title</Text>
        <View style={[styles.inputContainer, errors.title && styles.inputError]}>
          <BlurView intensity={15} style={styles.inputBlur}>
            <TextInput
              style={styles.textInput}
              value={formData.title}
              onChangeText={(text) => {
                setFormData({ ...formData, title: text });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="Epic House Party 🎉"
              placeholderTextColor={COLORS.gray500}
              maxLength={100}
            />
          </BlurView>
        </View>
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <View style={[styles.inputContainer, styles.textAreaContainer, errors.description && styles.inputError]}>
          <BlurView intensity={15} style={styles.inputBlur}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              placeholder="Tell people what makes your party special..."
              placeholderTextColor={COLORS.gray500}
              multiline
              maxLength={500}
            />
          </BlurView>
        </View>
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vibe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vibesScroll}>
          {VIBES.map((vibe) => (
            <TouchableOpacity
              key={vibe.id}
              style={[
                styles.vibeButton,
                formData.vibe === vibe.id && { borderColor: vibe.color },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFormData({ ...formData, vibe: vibe.id as 'chill' | 'lit' | 'exclusive' | 'casual' | 'banger' });
              }}
            >
              <BlurView intensity={15} style={styles.vibeBlur}>
                <LinearGradient
                  colors={formData.vibe === vibe.id ? 
                    [vibe.color + '40', vibe.color + '20'] :
                    ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                  }
                  style={styles.vibeGradient}
                >
                  <Text style={styles.vibeEmoji}>{vibe.icon}</Text>
                  <Text style={[
                    styles.vibeLabel,
                    formData.vibe === vibe.id && { color: vibe.color },
                  ]}>
                    {vibe.label}
                  </Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Max Attendees</Text>
        <View style={styles.attendeesContainer}>
          <TouchableOpacity
            style={styles.attendeesButton}
            onPress={() => {
              Haptics.selectionAsync();
              setFormData({ 
                ...formData, 
                max_attendees: Math.max(5, formData.max_attendees - 5) 
              });
            }}
          >
            <BlurView intensity={15} style={styles.attendeesButtonBlur}>
              <Ionicons name="remove" size={20} color={COLORS.white} />
            </BlurView>
          </TouchableOpacity>
          
          <View style={styles.attendeesDisplay}>
            <BlurView intensity={15} style={styles.attendeesDisplayBlur}>
              <Text style={styles.attendeesText}>{formData.max_attendees}</Text>
            </BlurView>
          </View>
          
          <TouchableOpacity
            style={styles.attendeesButton}
            onPress={() => {
              Haptics.selectionAsync();
              setFormData({ 
                ...formData, 
                max_attendees: Math.min(500, formData.max_attendees + 5) 
              });
            }}
          >
            <BlurView intensity={15} style={styles.attendeesButtonBlur}>
              <Ionicons name="add" size={20} color={COLORS.white} />
            </BlurView>
          </TouchableOpacity>
        </View>
        {errors.max_attendees && <Text style={styles.errorText}>{errors.max_attendees}</Text>}
      </View>
    </Animated.View>
  );

  const renderPhotoStep = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Add Photo</Text>
      <Text style={styles.stepSubtitle}>Make your party stand out with a great photo</Text>

      <TouchableOpacity style={styles.photoPickerContainer} onPress={handleImagePick}>
        <BlurView intensity={15} style={styles.photoPickerBlur}>
          {formData.photo_url ? (
            <Image source={{ uri: formData.photo_url }} style={styles.selectedPhoto} />
          ) : (
            <LinearGradient
              colors={['rgba(0, 217, 255, 0.2)', 'rgba(255, 0, 110, 0.2)']}
              style={styles.photoPickerGradient}
            >
              <Ionicons name="camera" size={48} color={COLORS.cyan} />
              <Text style={styles.photoPickerText}>Tap to add photo</Text>
              <Text style={styles.photoPickerSubtext}>Choose from your camera roll</Text>
            </LinearGradient>
          )}
        </BlurView>
      </TouchableOpacity>
      {errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}
    </Animated.View>
  );

  const renderLocationStep = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepSubtitle}>Where's the party happening?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <View style={[styles.inputContainer, errors.address && styles.inputError]}>
          <BlurView intensity={15} style={styles.inputBlur}>
            <TextInput
              style={[styles.textInput, { paddingRight: 50 }]}
              value={formData.address}
              onChangeText={(text) => {
                setFormData({ ...formData, address: text });
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              placeholder="123 Party Street, NYC"
              placeholderTextColor={COLORS.gray500}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleLocationPick}
            >
              <Ionicons name="locate" size={20} color={COLORS.cyan} />
            </TouchableOpacity>
          </BlurView>
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      <View style={styles.locationPreview}>
        <BlurView intensity={15} style={styles.locationPreviewBlur}>
          <LinearGradient
            colors={['rgba(0, 217, 255, 0.1)', 'rgba(255, 0, 110, 0.1)']}
            style={styles.locationPreviewGradient}
          >
            <View style={styles.locationPreviewContent}>
              <Ionicons name="location" size={24} color={COLORS.cyan} />
              <View style={styles.locationPreviewText}>
                <Text style={styles.locationPreviewTitle}>
                  {formData.address || 'No address set'}
                </Text>
                <Text style={styles.locationPreviewSubtitle}>
                  Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );

  const renderReviewStep = () => (
    <Animated.View style={[styles.stepContent, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.stepTitle}>Review & Create</Text>
      <Text style={styles.stepSubtitle}>Everything looks good?</Text>

      <View style={styles.reviewCard}>
        <BlurView intensity={20} style={styles.reviewCardBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.reviewCardGradient}
          >
            {formData.photo_url && (
              <Image source={{ uri: formData.photo_url }} style={styles.reviewPhoto} />
            )}
            <View style={styles.reviewContent}>
              <Text style={styles.reviewTitle}>{formData.title}</Text>
              <Text style={styles.reviewDescription} numberOfLines={3}>
                {formData.description}
              </Text>
              <View style={styles.reviewDetails}>
                <View style={styles.reviewDetailItem}>
                  <Ionicons name="location" size={16} color={COLORS.gray400} />
                  <Text style={styles.reviewDetailText}>{formData.address}</Text>
                </View>
                <View style={styles.reviewDetailItem}>
                  <Ionicons name="people" size={16} color={COLORS.gray400} />
                  <Text style={styles.reviewDetailText}>Max {formData.max_attendees} people</Text>
                </View>
                <View style={styles.reviewDetailItem}>
                  <Text style={styles.vibeEmoji}>
                    {VIBES.find(v => v.id === formData.vibe)?.icon}
                  </Text>
                  <Text style={styles.reviewDetailText}>
                    {VIBES.find(v => v.id === formData.vibe)?.label} vibe
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <BlurView intensity={20} style={styles.closeButtonBlur}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Party</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderProgressBar()}

        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <BlurView intensity={20} style={styles.actionsBlur}>
            <View style={styles.actionsContent}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handlePrev}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.primaryButton, { flex: currentStep === 0 ? 1 : undefined }]}
                onPress={handleNext}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[COLORS.cyan, COLORS.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  {isLoading ? (
                    <Text style={styles.primaryButtonText}>Creating...</Text>
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {currentStep === STEPS.length - 1 ? 'Create Party 🎉' : 'Next'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
  },
  closeButtonBlur: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: SPACING.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  stepNumber: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
    fontWeight: '600' as const,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray500,
    fontWeight: '500' as const,
  },
  stepLabelActive: {
    color: COLORS.cyan,
  },
  scrollContainer: {
    flex: 1,
  },
  stepContent: {
    padding: SPACING.lg,
    minHeight: 500,
  },
  stepTitle: {
    ...TYPOGRAPHY.title1,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.medium,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  textInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    padding: SPACING.lg,
    minHeight: 56,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  errorText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontWeight: '500' as const,
  },
  vibesScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  vibeButton: {
    marginRight: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.small,
  },
  vibeBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  vibeGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    minWidth: 90,
  },
  vibeEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  vibeLabel: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray300,
    fontWeight: '600' as const,
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  attendeesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  attendeesButtonBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
  },
  attendeesDisplay: {
    minWidth: 80,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  attendeesDisplayBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 22,
  },
  attendeesText: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
  photoPickerContainer: {
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  photoPickerBlur: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photoPickerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  selectedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xl,
  },
  photoPickerText: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  photoPickerSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
  },
  locationButton: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPreview: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  locationPreviewBlur: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationPreviewGradient: {
    padding: SPACING.lg,
  },
  locationPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  locationPreviewText: {
    flex: 1,
  },
  locationPreviewTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
    marginBottom: SPACING.xs,
  },
  locationPreviewSubtitle: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.gray400,
  },
  reviewCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  reviewCardBlur: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewCardGradient: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  reviewPhoto: {
    width: '100%',
    height: 160,
  },
  reviewContent: {
    padding: SPACING.lg,
  },
  reviewTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
    fontWeight: '700' as const,
    marginBottom: SPACING.sm,
  },
  reviewDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray300,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  reviewDetails: {
    gap: SPACING.sm,
  },
  reviewDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewDetailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    flex: 1,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionsBlur: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  actionsContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  primaryButton: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  primaryButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
    fontWeight: '700' as const,
  },
});