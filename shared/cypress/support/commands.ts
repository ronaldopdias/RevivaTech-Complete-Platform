/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;
      selectDevice(category: string, brand: string, model: string): Chainable<void>;
      fillContactForm(data: ContactFormData): Chainable<void>;
      waitForAPI(alias: string): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      mockGeolocation(latitude: number, longitude: number): Chainable<void>;
    }
  }
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
}

// Login command
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Device selection command
Cypress.Commands.add('selectDevice', (category: string, brand: string, model: string) => {
  cy.get(`[data-testid="device-category-${category}"]`).click();
  cy.get(`[data-testid="device-brand-${brand}"]`).click();
  cy.get(`[data-testid="device-model"]`).contains(model).click();
});

// Contact form filling command
Cypress.Commands.add('fillContactForm', (data: ContactFormData) => {
  cy.get('input[name="firstName"]').type(data.firstName);
  cy.get('input[name="lastName"]').type(data.lastName);
  cy.get('input[name="email"]').type(data.email);
  cy.get('input[name="phone"]').type(data.phone);
  if (data.address) {
    cy.get('input[name="address"]').type(data.address);
  }
});

// Wait for API with better error handling
Cypress.Commands.add('waitForAPI', (alias: string) => {
  cy.intercept('GET', '**/api/**').as('apiCall');
  cy.wait(`@${alias}`, { timeout: 10000 }).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Accessibility check command
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(undefined, {
    rules: {
      'color-contrast': { enabled: false }, // Disable for theme testing
    },
  });
});

// Mock geolocation
Cypress.Commands.add('mockGeolocation', (latitude: number, longitude: number) => {
  cy.window().then((win) => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((cb) => {
      cb({
        coords: {
          latitude,
          longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
  });
});

export {};