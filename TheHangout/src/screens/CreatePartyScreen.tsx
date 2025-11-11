import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, VALIDATION } from '../constants';
import { Input, Button, Toast } from '../components';
import { usePartyStore, useLocationStore } from '../stores';
import { validatePartyForm } from '../utils';

const VIBES = ['chill', 'lit', 'exclusive', 'casual', 'banger'] as const;

export default function CreatePartyScreen() {
  const navigation = useNavigation();
  const { createParty, loading } = usePartyStore();
  const { currentLocation } = useLocationStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [maxAttendees, setMaxAttendees] = useState(50);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handlePhotoSelect = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: API.IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!currentLocation) {
      setErrors({ location: 'Location is required' });
      return;
    }

    const validation = validatePartyForm({
      title,
      description,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      shakeAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createParty({
        title: title.trim(),
        description: description.trim() || null,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        photo_url: photoUri || null,
        max_attendees: maxAttendees,
        vibe: selectedVibe || null,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
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

  const isFormValid = title.trim().length > 0 && title.length <= VALIDATION.PARTY_TITLE_MAX;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Party</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Upload */}
          <TouchableOpacity
            onPress={handlePhotoSelect}
            style={styles.photoContainer}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Text style={styles.photoText}>Photo selected</Text>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color={COLORS.cyan} />
                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            {/* Title */}
            <View style={styles.inputWrapper}>
              <Input
                label="Party Name"
                placeholder="What's the vibe?"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                maxLength={VALIDATION.PARTY_TITLE_MAX}
                error={errors.title}
                containerStyle={styles.inputContainer}
              />
              <Text style={styles.charCounter}>
                {title.length} / {VALIDATION.PARTY_TITLE_MAX}
              </Text>
            </View>

            {/* Description */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Tell people what to expect..."
                placeholderTextColor={COLORS.gray500}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                maxLength={VALIDATION.PARTY_DESC_MAX}
                multiline
                numberOfLines={4}
              />
              <Text style={styles.charCounter}>
                {description.length} / {VALIDATION.PARTY_DESC_MAX}
              </Text>
            </View>

            {/* Location */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={20} color={COLORS.cyan} />
                <Text style={styles.locationText}>
                  {currentLocation
                    ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                    : 'Getting location...'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Open map picker
                  }}
                >
                  <Text style={styles.locationEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Max Attendees */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Max Attendees</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{maxAttendees}</Text>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${(maxAttendees / API.MAX_ATTENDEES) * 100}%` },
                    ]}
                  />
                  <View style={styles.sliderThumb} />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (maxAttendees > 0) {
                      setMaxAttendees(Math.max(0, maxAttendees - 10));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={styles.sliderButton}
                >
                  <Ionicons name="remove" size={20} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (maxAttendees < API.MAX_ATTENDEES) {
                      setMaxAttendees(Math.min(API.MAX_ATTENDEES, maxAttendees + 10));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  style={styles.sliderButton}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Vibe Selection */}
            <View style={styles.inputWrapper}>
              <Text style={styles.fieldLabel}>Vibe</Text>
              <View style={styles.vibeContainer}>
                {VIBES.map((vibe) => (
                  <TouchableOpacity
                    key={vibe}
                    onPress={() => {
                      setSelectedVibe(selectedVibe === vibe ? null : vibe);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.vibeButton,
                      selectedVibe === vibe && styles.vibeButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vibeButtonText,
                        selectedVibe === vibe && styles.vibeButtonTextSelected,
                      ]}
                    >
                      {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Create Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={!isFormValid || loading}
            >
              <LinearGradient
                colors={
                  isFormValid && !loading
                    ? [COLORS.cyan, COLORS.pink]
                    : [COLORS.gray700, COLORS.gray700]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButton}
              >
                {loading ? (
                  <Text style={styles.createButtonText}>Creating...</Text>
                ) : (
                  <Text style={styles.createButtonText}>Create Party</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Toast */}
      {showToast && (
        <Toast
          message={loading ? 'Creating party...' : 'Party created successfully! 🎉'}
          type={loading ? 'info' : 'success'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.white,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  photoContainer: {
    marginBottom: SPACING.xl,
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  photoPlaceholderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.cyan,
  },
  photoPreview: {
    height: 200,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  photoText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.success,
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
  fieldLabel: {
    ...TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  charCounter: {
    ...TYPOGRAPHY.caption2,
    color: COLORS.gray600,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  descriptionInput: {
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  locationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    flex: 1,
  },
  locationEditText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.cyan,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sliderValue: {
    ...TYPOGRAPHY.title3,
    color: COLORS.white,
    minWidth: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cyan,
    borderWidth: 2,
    borderColor: COLORS.white,
    top: -6,
    left: '50%',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.gray600,
  },
  vibeButtonSelected: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  vibeButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray500,
    fontWeight: '600',
  },
  vibeButtonTextSelected: {
    color: COLORS.dark,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  createButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  createButtonText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.white,
  },
});
