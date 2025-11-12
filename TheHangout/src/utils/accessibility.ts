import { AccessibilityInfo, Platform } from 'react-native';

// WCAG 2.1 AA Accessibility Standards Implementation

export interface AccessibilityLabels {
  label?: string;
  hint?: string;
  role?: 'button' | 'link' | 'text' | 'image' | 'header' | 'search' | 'tab' | 'tablist';
  state?: 'selected' | 'disabled' | 'expanded' | 'collapsed';
  value?: string;
  minimum?: number;
  maximum?: number;
  now?: number;
}

export interface AccessibilityConfig {
  accessible: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityLabels['role'];
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

// Accessibility hook for screen readers and assistive technology
export const useAccessibility = () => {
  const announceForScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android implementation
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: priority === 'assertive' ? false : true,
      });
    }
  };

  const isScreenReaderEnabled = async (): Promise<boolean> => {
    return await AccessibilityInfo.isScreenReaderEnabled();
  };

  const isReduceMotionEnabled = async (): Promise<boolean> => {
    return await AccessibilityInfo.isReduceMotionEnabled();
  };

  return {
    announceForScreenReader,
    isScreenReaderEnabled,
    isReduceMotionEnabled,
  };
};

// Button accessibility helper
export const createButtonAccessibility = (
  label: string,
  hint?: string,
  disabled?: boolean,
  selected?: boolean
): AccessibilityConfig => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    disabled: disabled || false,
    selected: selected || false,
  },
});

// Input field accessibility helper
export const createInputAccessibility = (
  label: string,
  value?: string,
  placeholder?: string,
  required?: boolean,
  invalid?: boolean,
  errorMessage?: string
): AccessibilityConfig => {
  const accessibilityLabel = required ? `${label}, required` : label;
  const accessibilityHint = invalid && errorMessage 
    ? `Invalid input: ${errorMessage}` 
    : placeholder 
    ? `Enter ${placeholder.toLowerCase()}` 
    : undefined;

  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel,
    accessibilityHint,
    accessibilityValue: value ? { text: value } : undefined,
    accessibilityState: {
      disabled: false,
    },
  };
};

// Image accessibility helper
export const createImageAccessibility = (
  description: string,
  decorative?: boolean
): AccessibilityConfig => ({
  accessible: !decorative,
  accessibilityRole: 'image',
  accessibilityLabel: decorative ? '' : description,
  importantForAccessibility: decorative ? 'no' : 'yes',
});

// Header accessibility helper
export const createHeaderAccessibility = (
  title: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1
): AccessibilityConfig => ({
  accessible: true,
  accessibilityRole: 'header',
  accessibilityLabel: `${title}, heading level ${level}`,
});

// List item accessibility helper
export const createListItemAccessibility = (
  title: string,
  description?: string,
  position?: { current: number; total: number },
  actionable?: boolean
): AccessibilityConfig => {
  let label = title;
  if (description) label += `, ${description}`;
  if (position) label += `, ${position.current} of ${position.total}`;

  return {
    accessible: true,
    accessibilityRole: actionable ? 'button' : 'text',
    accessibilityLabel: label,
  };
};

// Navigation accessibility helper
export const createNavigationAccessibility = (
  label: string,
  selected?: boolean,
  index?: number,
  total?: number
): AccessibilityConfig => {
  let accessibilityLabel = label;
  if (index !== undefined && total !== undefined) {
    accessibilityLabel += `, tab ${index + 1} of ${total}`;
  }

  return {
    accessible: true,
    accessibilityRole: 'tab',
    accessibilityLabel,
    accessibilityState: {
      selected: selected || false,
    },
  };
};

// Form validation accessibility
export const createFormFieldAccessibility = (
  label: string,
  value?: string,
  required?: boolean,
  error?: string,
  valid?: boolean
): AccessibilityConfig => {
  let accessibilityLabel = label;
  if (required) accessibilityLabel += ', required';
  
  let accessibilityHint = '';
  if (error) {
    accessibilityHint = `Error: ${error}`;
  } else if (valid) {
    accessibilityHint = 'Valid input';
  }

  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel,
    accessibilityHint: accessibilityHint || undefined,
    accessibilityValue: value ? { text: value } : undefined,
    accessibilityLiveRegion: error ? 'assertive' : 'polite',
  };
};

// Loading state accessibility
export const createLoadingAccessibility = (
  message: string = 'Loading',
  progress?: number
): AccessibilityConfig => ({
  accessible: true,
  accessibilityRole: 'text',
  accessibilityLabel: message,
  accessibilityValue: progress !== undefined ? {
    min: 0,
    max: 100,
    now: progress,
    text: `${Math.round(progress)}% complete`
  } : undefined,
  accessibilityLiveRegion: 'polite',
});

// Modal accessibility helper
export const createModalAccessibility = (
  title: string,
  description?: string
): AccessibilityConfig => ({
  accessible: true,
  accessibilityRole: 'text',
  accessibilityLabel: `${title}${description ? `, ${description}` : ''}, dialog`,
  accessibilityLiveRegion: 'polite',
});

// Alert/Notification accessibility
export const createAlertAccessibility = (
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): AccessibilityConfig => ({
  accessible: true,
  accessibilityRole: 'text',
  accessibilityLabel: `${type} alert: ${message}`,
  accessibilityLiveRegion: type === 'error' ? 'assertive' : 'polite',
});

// Progress indicator accessibility
export const createProgressAccessibility = (
  current: number,
  total: number,
  label?: string
): AccessibilityConfig => {
  const percentage = Math.round((current / total) * 100);
  const accessibilityLabel = label || 'Progress';
  
  return {
    accessible: true,
    accessibilityRole: 'text',
    accessibilityLabel: `${accessibilityLabel}: ${current} of ${total}`,
    accessibilityValue: {
      min: 0,
      max: total,
      now: current,
      text: `${percentage}% complete`,
    },
    accessibilityLiveRegion: 'polite',
  };
};

// Color contrast helpers (WCAG 2.1 AA compliance)
export const COLOR_CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,    // Minimum for normal text
  AA_LARGE: 3,       // Minimum for large text (18pt+)
  AAA_NORMAL: 7,     // Enhanced for normal text
  AAA_LARGE: 4.5,    // Enhanced for large text
};

// Calculate relative luminance (for contrast calculation)
export const getRelativeLuminance = (color: string): number => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const sRGB = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Check if color combination meets WCAG standards
export const isAccessibleColorCombination = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return large ? ratio >= COLOR_CONTRAST_RATIOS.AAA_LARGE : ratio >= COLOR_CONTRAST_RATIOS.AAA_NORMAL;
  }
  
  return large ? ratio >= COLOR_CONTRAST_RATIOS.AA_LARGE : ratio >= COLOR_CONTRAST_RATIOS.AA_NORMAL;
};

// Focus management helpers
export class FocusManager {
  private static focusableElements: Array<{ ref: any; id: string }> = [];
  
  static registerFocusableElement(ref: any, id: string) {
    this.focusableElements.push({ ref, id });
  }
  
  static unregisterFocusableElement(id: string) {
    this.focusableElements = this.focusableElements.filter(el => el.id !== id);
  }
  
  static focusElement(id: string) {
    const element = this.focusableElements.find(el => el.id === id);
    if (element && element.ref && element.ref.current) {
      element.ref.current.focus();
    }
  }
  
  static focusNext(currentId: string) {
    const currentIndex = this.focusableElements.findIndex(el => el.id === currentId);
    if (currentIndex >= 0 && currentIndex < this.focusableElements.length - 1) {
      const nextElement = this.focusableElements[currentIndex + 1];
      this.focusElement(nextElement.id);
    }
  }
  
  static focusPrevious(currentId: string) {
    const currentIndex = this.focusableElements.findIndex(el => el.id === currentId);
    if (currentIndex > 0) {
      const previousElement = this.focusableElements[currentIndex - 1];
      this.focusElement(previousElement.id);
    }
  }
}

// Semantic HTML mapping for React Native
export const getSemanticRole = (element: string): AccessibilityLabels['role'] => {
  const mappings: Record<string, AccessibilityLabels['role']> = {
    button: 'button',
    link: 'link',
    text: 'text',
    heading: 'header',
    image: 'image',
    input: 'text',
    search: 'search',
    tab: 'tab',
  };
  
  return mappings[element] || 'text';
};

// Accessibility testing helpers
export const AccessibilityChecker = {
  checkButtonAccessibility: (props: any) => {
    const issues: string[] = [];
    
    if (!props.accessibilityLabel) {
      issues.push('Button missing accessibilityLabel');
    }
    
    if (!props.accessibilityRole) {
      issues.push('Button missing accessibilityRole');
    }
    
    if (props.disabled && !props.accessibilityState?.disabled) {
      issues.push('Disabled button should have accessibilityState.disabled = true');
    }
    
    return issues;
  },
  
  checkImageAccessibility: (props: any) => {
    const issues: string[] = [];
    
    if (props.accessible !== false && !props.accessibilityLabel) {
      issues.push('Image missing accessibilityLabel (use empty string for decorative images)');
    }
    
    return issues;
  },
  
  checkFormFieldAccessibility: (props: any) => {
    const issues: string[] = [];
    
    if (!props.accessibilityLabel) {
      issues.push('Form field missing accessibilityLabel');
    }
    
    if (props.error && !props.accessibilityHint?.includes('Error')) {
      issues.push('Form field with error should include error in accessibilityHint');
    }
    
    return issues;
  },
};

// Accessibility announcements for common actions
export const AccessibilityAnnouncements = {
  PARTY_JOINED: 'Successfully joined party',
  PARTY_LEFT: 'Left party',
  LIKED_PARTY: 'Liked party',
  UNLIKED_PARTY: 'Unliked party',
  MESSAGE_SENT: 'Message sent',
  PHOTO_UPLOADED: 'Photo uploaded successfully',
  LOCATION_UPDATED: 'Location updated',
  SEARCH_RESULTS_UPDATED: 'Search results updated',
  ERROR_OCCURRED: 'An error occurred',
  LOADING_STARTED: 'Loading content',
  LOADING_COMPLETED: 'Content loaded',
  NAVIGATION_CHANGED: 'Navigated to new screen',
};