import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal as RNModal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, SPACING } from '../../constants';
import { Card } from './Card';

export interface ModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Custom modal component with glassmorphism
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  style,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Card
              style={style ? [styles.modal, style] : styles.modal}
              padding="lg"
              testID={testID ? `${testID}-card` : undefined}
            >
              {title && (
                <View style={styles.header}>
                  <Text
                    style={styles.title}
                    testID={testID ? `${testID}-title` : undefined}
                  >
                    {title}
                  </Text>
                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      testID={testID ? `${testID}-close` : undefined}
                      accessibilityLabel="Close modal"
                    >
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.content}>{children}</View>
            </Card>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.white,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
});

