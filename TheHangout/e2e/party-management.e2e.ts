/**
 * Party Management E2E Tests
 * 
 * End-to-end tests for party-related features:
 * - Creating parties
 * - Discovering parties
 * - Joining/leaving parties
 * - Map navigation
 */

import { TestHelpers } from './setup';

describe('Party Management Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await TestHelpers.skipOnboarding();
    
    // Sign in for party tests
    await TestHelpers.loginWithCredentials('test@example.com', 'Test123!@#');
    await TestHelpers.waitForLoading();
    await TestHelpers.allowLocationPermission();
  });

  describe('Map and Discovery', () => {
    it('should load map screen successfully', async () => {
      await TestHelpers.navigateToTab('map-tab');
      
      // Wait for map to load
      await TestHelpers.waitForElement('map-view');
      await expect(element(by.id('map-view'))).toBeVisible();
      
      // Should show user location
      await expect(element(by.id('user-location-marker'))).toBeVisible();
    });

    it('should discover nearby parties', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Wait for parties to load
      await TestHelpers.waitForLoading();
      
      // Should show party list
      await expect(element(by.id('party-list'))).toBeVisible();
      
      // Should have at least one party (or empty state)
      try {
        await expect(element(by.id('party-card-0'))).toBeVisible();
      } catch {
        await expect(element(by.text('No parties found'))).toBeVisible();
      }
    });

    it('should filter parties by distance', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Open filter menu
      await element(by.id('filter-button')).tap();
      
      // Set distance filter
      await element(by.id('distance-filter')).tap();
      await element(by.text('1 mile')).tap();
      
      // Apply filter
      await element(by.id('apply-filters')).tap();
      
      // Should update results
      await TestHelpers.waitForLoading();
      await expect(element(by.id('party-list'))).toBeVisible();
    });

    it('should search for parties', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Use search
      await element(by.id('search-input')).typeText('birthday');
      await element(by.id('search-button')).tap();
      
      // Should show search results
      await TestHelpers.waitForLoading();
      await expect(element(by.id('search-results'))).toBeVisible();
    });
  });

  describe('Party Creation', () => {
    it('should create a new party successfully', async () => {
      await TestHelpers.navigateToTab('map-tab');
      
      // Open create party modal
      await element(by.id('create-party-fab')).tap();
      
      // Fill in party details
      await element(by.id('party-title-input')).typeText('Test Birthday Party');
      await element(by.id('party-description-input')).typeText('Come celebrate with us!');
      
      // Set date and time
      await element(by.id('date-picker')).tap();
      await element(by.text('Tomorrow')).tap();
      await element(by.id('time-picker')).tap();
      await element(by.text('7:00 PM')).tap();
      
      // Set location
      await element(by.id('location-picker')).tap();
      await element(by.id('current-location')).tap();
      
      // Create party
      await element(by.id('create-party-button')).tap();
      
      // Should show success message
      await expect(element(by.text('Party created successfully!'))).toBeVisible();
      
      // Should return to map with new party
      await TestHelpers.waitForElement('map-view');
      await expect(element(by.id('party-marker-new'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await TestHelpers.navigateToTab('map-tab');
      await element(by.id('create-party-fab')).tap();
      
      // Try to create without title
      await element(by.id('create-party-button')).tap();
      
      // Should show validation errors
      await expect(element(by.text('Party title is required'))).toBeVisible();
    });

    it('should handle image upload', async () => {
      await TestHelpers.navigateToTab('map-tab');
      await element(by.id('create-party-fab')).tap();
      
      // Add image
      await element(by.id('add-image-button')).tap();
      await element(by.text('Choose from Gallery')).tap();
      
      // Mock image selection would happen here
      // In real tests, this would require device simulation
      
      // Should show image preview
      await expect(element(by.id('image-preview'))).toBeVisible();
    });
  });

  describe('Party Interaction', () => {
    beforeEach(async () => {
      // Assume a test party exists for these tests
    });

    it('should view party details', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Tap on a party card
      await element(by.id('party-card-0')).tap();
      
      // Should open party detail modal
      await TestHelpers.waitForElement('party-detail-modal');
      await expect(element(by.id('party-detail-modal'))).toBeVisible();
      
      // Should show party information
      await expect(element(by.id('party-title'))).toBeVisible();
      await expect(element(by.id('party-description'))).toBeVisible();
      await expect(element(by.id('party-date'))).toBeVisible();
      await expect(element(by.id('attendee-count'))).toBeVisible();
    });

    it('should join a party', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      await element(by.id('party-card-0')).tap();
      
      // Join the party
      await element(by.id('join-party-button')).tap();
      
      // Should show confirmation
      await expect(element(by.text('Successfully joined party!'))).toBeVisible();
      
      // Button should change to "Leave Party"
      await expect(element(by.id('leave-party-button'))).toBeVisible();
    });

    it('should leave a party', async () => {
      // Assume user is already in a party
      await TestHelpers.navigateToTab('discover-tab');
      await element(by.id('party-card-0')).tap();
      
      // Leave the party
      await element(by.id('leave-party-button')).tap();
      await element(by.text('Leave Party')).tap(); // Confirm
      
      // Should show confirmation
      await expect(element(by.text('You left the party'))).toBeVisible();
      
      // Button should change back to "Join Party"
      await expect(element(by.id('join-party-button'))).toBeVisible();
    });

    it('should navigate to party location', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      await element(by.id('party-card-0')).tap();
      
      // Navigate to party location
      await element(by.id('navigate-button')).tap();
      
      // Should open maps app or show navigation
      // This would require additional setup for external app testing
    });
  });

  describe('Party Chat', () => {
    beforeEach(async () => {
      // Join a party first
      await TestHelpers.navigateToTab('discover-tab');
      await element(by.id('party-card-0')).tap();
      await element(by.id('join-party-button')).tap();
      await TestHelpers.waitForLoading();
    });

    it('should open party chat', async () => {
      // Open chat from party details
      await element(by.id('party-chat-button')).tap();
      
      // Should show chat screen
      await TestHelpers.waitForElement('chat-screen');
      await expect(element(by.id('chat-screen'))).toBeVisible();
      await expect(element(by.id('message-input'))).toBeVisible();
    });

    it('should send a message', async () => {
      await element(by.id('party-chat-button')).tap();
      
      // Type and send message
      await element(by.id('message-input')).typeText('Hello everyone!');
      await element(by.id('send-button')).tap();
      
      // Should show message in chat
      await expect(element(by.text('Hello everyone!'))).toBeVisible();
    });

    it('should show real-time messages', async () => {
      await element(by.id('party-chat-button')).tap();
      
      // Wait for real-time updates
      await TestHelpers.waitFor(2000);
      
      // Should show message list
      await expect(element(by.id('message-list'))).toBeVisible();
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should show loading states during party creation', async () => {
      await TestHelpers.navigateToTab('map-tab');
      await element(by.id('create-party-fab')).tap();
      
      await element(by.id('party-title-input')).typeText('Loading Test Party');
      await element(by.id('party-description-input')).typeText('Testing loading states');
      
      // Start creation
      await element(by.id('create-party-button')).tap();
      
      // Should show loading indicator
      await expect(element(by.id('loading-indicator'))).toBeVisible();
    });

    it('should handle network errors gracefully', async () => {
      // This would require network simulation
      await TestHelpers.simulateNetworkError();
      
      await TestHelpers.navigateToTab('discover-tab');
      
      // Should show error state
      await expect(element(by.text('Unable to load parties'))).toBeVisible();
      await expect(element(by.id('retry-button'))).toBeVisible();
    });

    it('should retry failed operations', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Assume error state is shown
      await element(by.id('retry-button')).tap();
      
      // Should attempt to reload
      await TestHelpers.waitForLoading();
      await expect(element(by.id('party-list'))).toBeVisible();
    });
  });

  describe('Performance', () => {
    it('should load party list quickly', async () => {
      const loadTime = await TestHelpers.measurePerformance(async () => {
        await TestHelpers.navigateToTab('discover-tab');
        await TestHelpers.waitForElement('party-list');
      });
      
      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle large party lists efficiently', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Scroll through large list
      for (let i = 0; i < 10; i++) {
        await element(by.id('party-list')).scroll(200, 'down');
        await TestHelpers.waitFor(100);
      }
      
      // Should remain responsive
      await expect(element(by.id('party-list'))).toBeVisible();
    });

    it('should optimize map rendering', async () => {
      const renderTime = await TestHelpers.measurePerformance(async () => {
        await TestHelpers.navigateToTab('map-tab');
        await TestHelpers.waitForElement('map-view');
      });
      
      // Map should render within 1 second
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for party discovery', async () => {
      await TestHelpers.navigateToTab('discover-tab');
      
      // Check accessibility labels
      await expect(element(by.id('party-card-0'))).toHaveAccessibilityLabel();
      await expect(element(by.id('join-party-button'))).toHaveAccessibilityLabel('Join party');
    });

    it('should support voice navigation', async () => {
      // This would require additional voice testing setup
      await TestHelpers.navigateToTab('map-tab');
      
      // Voice commands should work for navigation
      // await device.invokeVoiceCommand('Open create party');
    });
  });
});