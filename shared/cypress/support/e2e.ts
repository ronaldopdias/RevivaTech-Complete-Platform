// Import commands
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Import utilities
import 'cypress-real-events/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that might occur during development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Custom commands for API mocking
Cypress.Commands.add('mockAPI', (method: string, url: string, response: any, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  });
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
});

Cypress.Commands.add('endPerformanceMeasure', (name: string) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = win.performance.getEntriesByName(name)[0];
    cy.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
  });
});

// Database utilities
beforeEach(() => {
  // Clear any existing auth tokens
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Reset API call counters
  cy.window().then((win) => {
    if (win.cypressApiCallCount) {
      win.cypressApiCallCount = {};
    }
  });
});

// Global test hooks
before(() => {
  // One-time setup
  cy.task('seedDatabase');
});

after(() => {
  // Cleanup after all tests
  cy.task('clearDatabase');
});

// Add global types
declare global {
  namespace Cypress {
    interface Chainable {
      mockAPI(method: string, url: string, response: any, statusCode?: number): Chainable<void>;
      measurePerformance(name: string): Chainable<void>;
      endPerformanceMeasure(name: string): Chainable<void>;
    }
  }
}