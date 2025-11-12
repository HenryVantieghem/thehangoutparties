/**
 * Jest Configuration for E2E Tests
 * 
 * Configuration specific to Detox end-to-end testing.
 */

module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js', '<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    ['detox/runners/jest/reporter', { outputDir: 'e2e/artifacts', outputFile: 'test-results.xml' }],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
};