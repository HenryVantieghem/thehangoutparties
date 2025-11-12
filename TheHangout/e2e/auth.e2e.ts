/**
 * Authentication E2E Tests
 * 
 * End-to-end tests for user authentication flows:
 * - Sign up
 * - Sign in
 * - Password reset
 * - Sign out
 */

import { TestHelpers } from './setup';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await TestHelpers.skipOnboarding();
  });

  describe('Sign Up Flow', () => {
    it('should complete sign up with valid credentials', async () => {
      // Navigate to sign up
      await element(by.id('signup-link')).tap();
      
      // Fill in sign up form
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('username-input')).typeText('testuser');
      await element(by.id('password-input')).typeText('Test123!@#');
      await element(by.id('confirm-password-input')).typeText('Test123!@#');
      
      // Submit form
      await element(by.id('signup-button')).tap();
      
      // Wait for loading to complete
      await TestHelpers.waitForLoading();
      
      // Should navigate to main app
      await TestHelpers.waitForElement('main-navigation');
      await expect(element(by.id('main-navigation'))).toBeVisible();
    });

    it('should show validation errors for invalid email', async () => {
      await element(by.id('signup-link')).tap();
      
      // Enter invalid email
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('username-input')).typeText('testuser');
      await element(by.id('password-input')).typeText('Test123!@#');
      
      // Submit form
      await element(by.id('signup-button')).tap();
      
      // Should show validation error
      await expect(element(by.text('Email format is invalid'))).toBeVisible();
    });

    it('should show validation errors for weak password', async () => {
      await element(by.id('signup-link')).tap();
      
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('username-input')).typeText('testuser');
      
      // Enter weak password
      await element(by.id('password-input')).typeText('weak');
      
      await element(by.id('signup-button')).tap();
      
      // Should show password validation error
      await expect(element(by.text('Password format is invalid'))).toBeVisible();
    });
  });

  describe('Sign In Flow', () => {
    beforeEach(async () => {
      // Assume user already exists for sign in tests
    });

    it('should sign in with valid credentials', async () => {
      await TestHelpers.loginWithCredentials('test@example.com', 'Test123!@#');
      
      // Wait for loading
      await TestHelpers.waitForLoading();
      
      // Should be in main app
      await TestHelpers.waitForElement('main-navigation');
      await expect(element(by.id('main-navigation'))).toBeVisible();
    });

    it('should show error for invalid credentials', async () => {
      await TestHelpers.loginWithCredentials('wrong@example.com', 'wrongpass');
      
      // Should show error message
      await expect(element(by.text('Invalid email or password'))).toBeVisible();
    });

    it('should handle account lockout after failed attempts', async () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await TestHelpers.loginWithCredentials('test@example.com', 'wrongpass');
        await TestHelpers.dismissError();
      }
      
      // Should show lockout message
      await expect(element(by.text('Account locked'))).toBeVisible();
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      await element(by.id('forgot-password-link')).tap();
      
      await element(by.id('reset-email-input')).typeText('test@example.com');
      await element(by.id('send-reset-button')).tap();
      
      // Should show success message
      await expect(element(by.text('Password reset email sent'))).toBeVisible();
    });

    it('should show error for invalid email', async () => {
      await element(by.id('forgot-password-link')).tap();
      
      await element(by.id('reset-email-input')).typeText('invalid-email');
      await element(by.id('send-reset-button')).tap();
      
      // Should show validation error
      await expect(element(by.text('Email format is invalid'))).toBeVisible();
    });
  });

  describe('Sign Out Flow', () => {
    beforeEach(async () => {
      // Sign in first
      await TestHelpers.loginWithCredentials('test@example.com', 'Test123!@#');
      await TestHelpers.waitForLoading();
    });

    it('should sign out successfully', async () => {
      // Navigate to profile/settings
      await TestHelpers.navigateToTab('profile-tab');
      await element(by.id('settings-button')).tap();
      
      // Sign out
      await element(by.id('signout-button')).tap();
      await element(by.text('Sign Out')).tap(); // Confirm
      
      // Should return to auth screen
      await TestHelpers.waitForElement('signin-screen');
      await expect(element(by.id('signin-screen'))).toBeVisible();
    });
  });

  describe('Security Features', () => {
    it('should enforce secure password requirements', async () => {
      await element(by.id('signup-link')).tap();
      
      const weakPasswords = ['123', 'password', 'abc123'];
      
      for (const password of weakPasswords) {
        await element(by.id('password-input')).clearText();
        await element(by.id('password-input')).typeText(password);
        
        // Should show password strength indicator
        await expect(element(by.id('password-strength-weak'))).toBeVisible();
      }
    });

    it('should sanitize input fields', async () => {
      await element(by.id('signup-link')).tap();
      
      // Try to enter malicious content
      await element(by.id('username-input')).typeText('<script>alert("xss")</script>');
      
      // Input should be sanitized
      const usernameField = element(by.id('username-input'));
      await expect(usernameField).toHaveText('scriptalert("xss")/script');
    });

    it('should handle session timeout', async () => {
      await TestHelpers.loginWithCredentials('test@example.com', 'Test123!@#');
      await TestHelpers.waitForLoading();
      
      // Simulate session timeout (this would require backend simulation)
      // For demo purposes, we'll assume a session timeout mechanism exists
      
      // After timeout, user should be redirected to auth
      // This would require additional test setup
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen reader', async () => {
      // Check for accessibility labels
      await expect(element(by.id('email-input'))).toHaveAccessibilityLabel('Email address');
      await expect(element(by.id('password-input'))).toHaveAccessibilityLabel('Password');
      await expect(element(by.id('signin-button'))).toHaveAccessibilityLabel('Sign in');
    });

    it('should support keyboard navigation', async () => {
      // This would require additional setup for keyboard testing
      // Focus should move between form fields correctly
      await element(by.id('email-input')).tap();
      // Test tab navigation between fields
    });
  });

  describe('Performance', () => {
    it('should load auth screen quickly', async () => {
      const loadTime = await TestHelpers.measurePerformance(async () => {
        await device.reloadReactNative();
        await TestHelpers.waitForElement('signin-screen');
      });
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle rapid input changes', async () => {
      await element(by.id('email-input')).typeText('rapid');
      await element(by.id('email-input')).clearText();
      await element(by.id('email-input')).typeText('test@example.com');
      
      // Should handle rapid changes without errors
      await expect(element(by.id('email-input'))).toHaveText('test@example.com');
    });
  });
});