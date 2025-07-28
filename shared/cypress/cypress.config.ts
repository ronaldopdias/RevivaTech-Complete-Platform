import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    experimentalSessionAndOrigin: true,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      // Task for seeding test data
      on('task', {
        seedDatabase() {
          // Seed database with test data
          return null;
        },
        clearDatabase() {
          // Clear test database
          return null;
        },
        getTestUser(email: string) {
          // Get test user data
          return {
            id: '1',
            email,
            name: 'Test User',
            role: 'customer'
          };
        },
        log(message: string) {
          console.log(message);
          return null;
        }
      });

      // Browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-web-security');
          launchOptions.args.push('--allow-running-insecure-content');
        }
        return launchOptions;
      });

      return config;
    },
    env: {
      // Environment variables for testing
      apiUrl: 'http://localhost:3001/api',
      testUserEmail: 'test@example.com',
      testUserPassword: 'password123',
      adminEmail: 'admin@example.com',
      adminPassword: 'admin123',
      coverage: false
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  }
});