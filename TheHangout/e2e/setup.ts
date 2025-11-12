/**
 * E2E Test Setup
 * 
 * Global setup and utilities for end-to-end testing.
 */

import { cleanup, init } from 'detox';

const config = require('../package.json').detox;

// Global setup for Detox
beforeAll(async () => {
  await init(config, { initGlobals: false });
});

// Global teardown for Detox
afterAll(async () => {
  await cleanup();
});

// Test utilities
export const TestHelpers = {
  // Authentication helpers
  async loginWithCredentials(email: string, password: string) {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('signin-button')).tap();
  },

  async skipOnboarding() {
    try {
      await element(by.id('skip-onboarding')).tap();
    } catch (error) {
      // Onboarding might not be present
      console.log('Onboarding not found or already completed');
    }
  },

  // Navigation helpers
  async navigateToTab(tabId: string) {
    await element(by.id(tabId)).tap();
  },

  async openModal(modalId: string) {
    await element(by.id(modalId)).tap();
  },

  async closeModal() {
    try {
      await element(by.id('modal-close')).tap();
    } catch (error) {
      // Try back button if close button not found
      await element(by.id('back-button')).tap();
    }
  },

  // Map helpers
  async allowLocationPermission() {
    try {
      await element(by.text('Allow While Using App')).tap();
    } catch (error) {
      console.log('Location permission already granted or not required');
    }
  },

  async searchLocation(location: string) {
    await element(by.id('location-search')).typeText(location);
    await element(by.id('search-button')).tap();
  },

  // Party helpers
  async createParty(title: string, description: string) {
    await element(by.id('create-party-button')).tap();
    await element(by.id('party-title-input')).typeText(title);
    await element(by.id('party-description-input')).typeText(description);
    await element(by.id('save-party-button')).tap();
  },

  async joinParty(partyId: string) {
    await element(by.id(`party-card-${partyId}`)).tap();
    await element(by.id('join-party-button')).tap();
  },

  // Loading and state helpers
  async waitForLoading() {
    await waitFor(element(by.id('loading-spinner')))
      .not.toBeVisible()
      .withTimeout(10000);
  },

  async waitForElement(elementId: string, timeout = 5000) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  // Error handling
  async dismissError() {
    try {
      await element(by.id('error-dismiss')).tap();
    } catch (error) {
      console.log('No error to dismiss');
    }
  },

  // Security helpers
  async enterSecureData(inputId: string, data: string) {
    await element(by.id(inputId)).typeText(data);
    // Wait for validation
    await this.waitFor(100);
  },

  // Utility functions
  async takeScreenshot(name: string) {
    await device.takeScreenshot(name);
  },

  async scrollToElement(elementId: string, direction: 'up' | 'down' = 'down') {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .whileElement(by.id('scroll-view'))
      .scroll(200, direction);
  },

  async waitFor(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  },

  // Network simulation
  async simulateNetworkError() {
    // This would require additional setup with network conditions
    console.log('Simulating network error');
  },

  // Performance helpers
  async measurePerformance(action: () => Promise<void>) {
    const start = Date.now();
    await action();
    const end = Date.now();
    return end - start;
  },
};