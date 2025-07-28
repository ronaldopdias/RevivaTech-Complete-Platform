import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for RevivaTech E2E Testing
 * Comprehensive testing setup for all platforms and scenarios
 */

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3010',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
    
    // Default timeout for actions
    actionTimeout: 10000,
    
    // Default timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet testing
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
    
    // Different viewport sizes
    {
      name: 'desktop-large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    
    {
      name: 'desktop-small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
    
    // Performance testing with slow connection
    {
      name: 'slow-connection',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--throttling=true',
            '--slow-connection=true'
          ]
        }
      },
    },
    
    // High DPI testing
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
      },
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./src/tests/setup/global-setup.ts'),
  globalTeardown: require.resolve('./src/tests/setup/global-teardown.ts'),
  
  // Run your local dev server before starting the tests
  webServer: [
    {
      command: 'npm run dev',
      port: 3010,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run start:backend',
      port: 3011,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    }
  ],
  
  // Test timeouts
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  
  // Output directories
  outputDir: 'test-results',
  
  // Test patterns
  testMatch: [
    '**/e2e/**/*.test.ts',
    '**/e2e/**/*.spec.ts'
  ],
  
  // Global test settings
  globalTimeout: 30 * 60 * 1000, // 30 minutes for entire test suite
  
  // Metadata for test reports
  metadata: {
    application: 'RevivaTech',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    testType: 'End-to-End',
  },
});