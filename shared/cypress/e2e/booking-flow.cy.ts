describe('Booking Flow E2E', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '**/api/devices/categories', { fixture: 'device-categories.json' }).as('getCategories');
    cy.intercept('GET', '**/api/devices/models**', { fixture: 'device-models.json' }).as('getModels');
    cy.intercept('GET', '**/api/availability**', { fixture: 'availability.json' }).as('getAvailability');
    cy.intercept('POST', '**/api/bookings', { fixture: 'booking-response.json' }).as('createBooking');
    cy.intercept('POST', '**/api/quotes', { fixture: 'quote-response.json' }).as('createQuote');
    
    // Mock geolocation for location-based features
    cy.mockGeolocation(51.5074, -0.1278); // London coordinates
  });

  describe('Guest Booking Flow', () => {
    it('completes full booking flow as guest user', () => {
      cy.visit('/book-repair');
      
      // Step 1: Device Selection
      cy.get('[data-testid="booking-step-device"]').should('be.visible');
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      
      // Verify device selection
      cy.get('[data-testid="selected-device"]').should('contain', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      
      // Step 2: Repair Details
      cy.get('[data-testid="booking-step-repair"]').should('be.visible');
      cy.get('textarea[name="issueDescription"]').type('Screen is cracked and touch is not working properly');
      
      // Select repair type
      cy.get('[data-testid="repair-type-screen"]').click();
      
      // Upload photos
      cy.get('input[type="file"]').selectFile('cypress/fixtures/device-photo.jpg', { force: true });
      cy.get('[data-testid="photo-preview"]').should('be.visible');
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Step 3: Service Options
      cy.get('[data-testid="booking-step-service"]').should('be.visible');
      
      // Select service type
      cy.get('[data-testid="service-in-store"]').click();
      
      // Select priority
      cy.get('[data-testid="priority-standard"]').should('be.checked');
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Step 4: Appointment Scheduling
      cy.get('[data-testid="booking-step-appointment"]').should('be.visible');
      cy.wait('@getAvailability');
      
      // Select date (next available date)
      cy.get('[data-testid="calendar-next-button"]').click();
      cy.get('[data-testid="available-date"]').first().click();
      
      // Select time slot
      cy.get('[data-testid="time-slot"]').contains('10:00 AM').click();
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Step 5: Contact Information
      cy.get('[data-testid="booking-step-contact"]').should('be.visible');
      
      cy.fillContactForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+44 7123 456789',
        address: '123 Test Street, London, UK'
      });
      
      // Agree to terms
      cy.get('input[name="agreeToTerms"]').check();
      cy.get('input[name="allowMarketing"]').check();
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Step 6: Confirmation
      cy.get('[data-testid="booking-step-confirmation"]').should('be.visible');
      
      // Review booking details
      cy.get('[data-testid="booking-summary"]').within(() => {
        cy.contains('iPhone 15 Pro Max');
        cy.contains('Screen Repair');
        cy.contains('In-Store Service');
        cy.contains('John Doe');
        cy.contains('john.doe@example.com');
      });
      
      // Confirm booking
      cy.get('[data-testid="confirm-booking-button"]').click();
      cy.wait('@createBooking');
      
      // Verify success
      cy.get('[data-testid="booking-success"]').should('be.visible');
      cy.get('[data-testid="booking-reference"]').should('contain', 'BK-');
      
      // Check for confirmation email prompt
      cy.get('[data-testid="email-confirmation"]').should('contain', 'confirmation email');
      
      // Verify tracking link
      cy.get('[data-testid="track-repair-link"]').should('be.visible').click();
      cy.url().should('include', '/track');
    });

    it('handles validation errors gracefully', () => {
      cy.visit('/book-repair');
      
      // Try to proceed without device selection
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="error-message"]').should('contain', 'Please select a device');
      
      // Select device and proceed to repair details
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      
      // Try to proceed without repair description
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="error-message"]').should('contain', 'Please describe the issue');
      
      // Fill repair details
      cy.get('textarea[name="issueDescription"]').type('Test issue');
      cy.get('[data-testid="repair-type-screen"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      // Skip to contact step
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      // Try to proceed with invalid email
      cy.fillContactForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+44 7123 456789'
      });
      
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email');
    });

    it('allows navigation between steps', () => {
      cy.visit('/book-repair');
      
      // Complete first step
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      
      // Go back to device selection
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="booking-step-device"]').should('be.visible');
      
      // Change device selection
      cy.selectDevice('android', 'Samsung', 'Galaxy S24 Ultra');
      cy.get('[data-testid="continue-button"]').click();
      
      // Verify new device is selected
      cy.get('[data-testid="selected-device"]').should('contain', 'Galaxy S24 Ultra');
    });
  });

  describe('Authenticated User Booking Flow', () => {
    beforeEach(() => {
      cy.login();
    });

    it('pre-fills user information for logged-in users', () => {
      cy.visit('/book-repair');
      
      // Complete device and repair steps quickly
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('textarea[name="issueDescription"]').type('Screen repair needed');
      cy.get('[data-testid="repair-type-screen"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      // Skip service options and appointment
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      // Contact information should be pre-filled
      cy.get('input[name="firstName"]').should('have.value', 'Test');
      cy.get('input[name="lastName"]').should('have.value', 'User');
      cy.get('input[name="email"]').should('have.value', 'test@example.com');
    });

    it('saves booking to user dashboard', () => {
      cy.visit('/book-repair');
      
      // Complete booking flow
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('textarea[name="issueDescription"]').type('Battery replacement needed');
      cy.get('[data-testid="repair-type-battery"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('[data-testid="confirm-booking-button"]').click();
      cy.wait('@createBooking');
      
      // Navigate to dashboard
      cy.visit('/dashboard');
      
      // Verify booking appears in recent bookings
      cy.get('[data-testid="recent-bookings"]').within(() => {
        cy.contains('iPhone 15 Pro Max');
        cy.contains('Battery replacement');
      });
    });
  });

  describe('Mobile Booking Flow', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('completes booking on mobile device', () => {
      cy.visit('/book-repair');
      
      // Mobile-specific interactions
      cy.get('[data-testid="mobile-device-selector"]').should('be.visible');
      
      // Swipe through device categories
      cy.get('[data-testid="device-category-slider"]').within(() => {
        cy.get('[data-testid="device-category-apple"]').click();
      });
      
      // Use mobile-optimized device picker
      cy.get('[data-testid="mobile-device-list"]').within(() => {
        cy.contains('iPhone 15 Pro Max').click();
      });
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Mobile repair form
      cy.get('textarea[name="issueDescription"]').type('Screen cracked');
      cy.get('[data-testid="repair-type-screen"]').click();
      
      // Test mobile photo upload
      cy.get('[data-testid="mobile-camera-button"]').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/device-photo.jpg', { force: true });
      
      cy.get('[data-testid="continue-button"]').click();
      
      // Complete flow
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      cy.fillContactForm({
        firstName: 'Mobile',
        lastName: 'User',
        email: 'mobile@example.com',
        phone: '+44 7123 456789'
      });
      
      cy.get('input[name="agreeToTerms"]').check();
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('[data-testid="confirm-booking-button"]').click();
      cy.wait('@createBooking');
      
      cy.get('[data-testid="booking-success"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('booking flow is accessible', () => {
      cy.visit('/book-repair');
      cy.checkAccessibility();
      
      // Check each step for accessibility
      cy.selectDevice('apple', 'Apple', 'iPhone 15 Pro Max');
      cy.get('[data-testid="continue-button"]').click();
      cy.checkAccessibility();
      
      cy.get('textarea[name="issueDescription"]').type('Screen repair');
      cy.get('[data-testid="repair-type-screen"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.checkAccessibility();
    });

    it('supports keyboard navigation', () => {
      cy.visit('/book-repair');
      
      // Navigate using keyboard
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'device-category-apple');
      
      cy.focused().type('{enter}');
      cy.get('[data-testid="device-brand-Apple"]').should('be.visible');
      
      // Continue keyboard navigation through form
      cy.get('body').tab();
      cy.focused().type('{enter}');
      
      cy.get('body').tab();
      cy.focused().should('contain', 'iPhone');
      cy.focused().type('{enter}');
    });
  });
});