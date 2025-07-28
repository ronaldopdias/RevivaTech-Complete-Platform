describe('Repair Tracking E2E', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '**/api/repairs/**', { fixture: 'repair-details.json' }).as('getRepairDetails');
    cy.intercept('GET', '**/api/repairs/*/timeline', { fixture: 'repair-timeline.json' }).as('getTimeline');
    cy.intercept('POST', '**/api/repairs/*/approve-quote', { fixture: 'quote-approval.json' }).as('approveQuote');
    cy.intercept('POST', '**/api/repairs/*/messages', { fixture: 'message-response.json' }).as('sendMessage');
    cy.intercept('GET', '**/api/repairs/*/messages', { fixture: 'repair-messages.json' }).as('getMessages');
    cy.intercept('PUT', '**/api/repairs/*/status', { fixture: 'status-update.json' }).as('updateStatus');
  });

  describe('Guest Tracking', () => {
    it('allows guests to track repair with reference number', () => {
      cy.visit('/track');
      
      // Enter repair reference
      cy.get('input[name="repairReference"]').type('REP-2024-001');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      cy.wait('@getRepairDetails');
      
      // Verify repair details are displayed
      cy.get('[data-testid="repair-details"]').within(() => {
        cy.contains('REP-2024-001');
        cy.contains('iPhone 15 Pro Max');
        cy.contains('Screen Repair');
        cy.contains('In Progress');
      });
      
      // Check timeline
      cy.get('[data-testid="repair-timeline"]').should('be.visible');
      cy.wait('@getTimeline');
      
      cy.get('[data-testid="timeline-step"]').should('have.length.at.least', 3);
      cy.get('[data-testid="timeline-step-completed"]').should('exist');
      cy.get('[data-testid="timeline-step-current"]').should('exist');
    });

    it('handles invalid repair reference', () => {
      cy.visit('/track');
      
      cy.get('input[name="repairReference"]').type('INVALID-REF');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      // Mock API error response
      cy.intercept('GET', '**/api/repairs/INVALID-REF', { 
        statusCode: 404, 
        body: { error: 'Repair not found' }
      }).as('getInvalidRepair');
      
      cy.wait('@getInvalidRepair');
      cy.get('[data-testid="error-message"]').should('contain', 'Repair not found');
    });

    it('displays estimated completion date', () => {
      cy.visit('/track/REP-2024-001?email=customer@example.com');
      cy.wait('@getRepairDetails');
      
      cy.get('[data-testid="estimated-completion"]').should('be.visible');
      cy.get('[data-testid="estimated-completion"]').should('contain', 'Estimated completion');
      
      // Check if estimate is realistic (within 30 days)
      cy.get('[data-testid="completion-date"]').invoke('text').then((dateText) => {
        const completionDate = new Date(dateText);
        const today = new Date();
        const daysDiff = Math.ceil((completionDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        expect(daysDiff).to.be.greaterThan(0);
        expect(daysDiff).to.be.lessThan(31);
      });
    });
  });

  describe('Authenticated User Tracking', () => {
    beforeEach(() => {
      cy.login();
    });

    it('displays all user repairs in dashboard', () => {
      cy.visit('/dashboard/repairs');
      
      // Intercept user repairs
      cy.intercept('GET', '**/api/user/repairs', { fixture: 'user-repairs.json' }).as('getUserRepairs');
      cy.wait('@getUserRepairs');
      
      // Verify repairs list
      cy.get('[data-testid="repair-card"]').should('have.length.at.least', 2);
      
      cy.get('[data-testid="repair-card"]').first().within(() => {
        cy.contains('REP-2024-001');
        cy.contains('iPhone 15 Pro Max');
        cy.contains('In Progress');
        cy.get('[data-testid="view-details-button"]').click();
      });
      
      // Should navigate to detailed view
      cy.url().should('include', '/dashboard/repairs/REP-2024-001');
    });

    it('allows communication with technician', () => {
      cy.visit('/dashboard/repairs/REP-2024-001');
      cy.wait('@getRepairDetails');
      cy.wait('@getMessages');
      
      // Open chat section
      cy.get('[data-testid="chat-section"]').should('be.visible');
      
      // Check existing messages
      cy.get('[data-testid="message-list"]').within(() => {
        cy.get('[data-testid="message"]').should('have.length.at.least', 1);
      });
      
      // Send new message
      cy.get('textarea[name="message"]').type('When will the repair be completed?');
      cy.get('[data-testid="send-message-button"]').click();
      
      cy.wait('@sendMessage');
      
      // Verify message appears
      cy.get('[data-testid="message-list"]').should('contain', 'When will the repair be completed?');
      
      // Check message status
      cy.get('[data-testid="message"]').last().within(() => {
        cy.get('[data-testid="message-status"]').should('contain', 'Sent');
      });
    });

    it('handles quote approval workflow', () => {
      // Mock repair with pending quote
      cy.intercept('GET', '**/api/repairs/REP-2024-002', { 
        fixture: 'repair-with-quote.json' 
      }).as('getRepairWithQuote');
      
      cy.visit('/dashboard/repairs/REP-2024-002');
      cy.wait('@getRepairWithQuote');
      
      // Verify quote details
      cy.get('[data-testid="quote-section"]').within(() => {
        cy.contains('Quote Pending Approval');
        cy.contains('£150.00');
        cy.contains('Screen replacement');
        cy.contains('Parts: £80.00');
        cy.contains('Labor: £70.00');
      });
      
      // Approve quote
      cy.get('[data-testid="approve-quote-button"]').click();
      
      // Confirmation modal
      cy.get('[data-testid="quote-approval-modal"]').within(() => {
        cy.contains('Approve Quote');
        cy.contains('£150.00');
        cy.get('[data-testid="confirm-approval-button"]').click();
      });
      
      cy.wait('@approveQuote');
      
      // Verify status update
      cy.get('[data-testid="quote-section"]').should('contain', 'Quote Approved');
      cy.get('[data-testid="repair-status"]').should('contain', 'Approved - Repair in Progress');
    });

    it('shows real-time status updates', () => {
      cy.visit('/dashboard/repairs/REP-2024-001');
      cy.wait('@getRepairDetails');
      
      // Mock WebSocket connection for real-time updates
      cy.window().then((win) => {
        // Simulate WebSocket message
        const mockEvent = {
          type: 'repair_status_update',
          data: {
            repairId: 'REP-2024-001',
            status: 'Parts Ordered',
            timestamp: new Date().toISOString(),
            message: 'Required parts have been ordered and will arrive tomorrow'
          }
        };
        
        // Trigger the event handler
        win.dispatchEvent(new CustomEvent('websocket-message', { detail: mockEvent }));
      });
      
      // Verify real-time update
      cy.get('[data-testid="status-notification"]').should('be.visible');
      cy.get('[data-testid="status-notification"]').should('contain', 'Parts Ordered');
      
      // Check timeline update
      cy.get('[data-testid="timeline-step"]').should('contain', 'Parts Ordered');
    });
  });

  describe('Mobile Tracking Experience', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('provides mobile-optimized tracking interface', () => {
      cy.visit('/track');
      
      // Mobile-friendly tracking form
      cy.get('[data-testid="mobile-track-form"]').should('be.visible');
      
      cy.get('input[name="repairReference"]').type('REP-2024-001');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      cy.wait('@getRepairDetails');
      
      // Mobile timeline view
      cy.get('[data-testid="mobile-timeline"]').should('be.visible');
      
      // Swipeable timeline steps
      cy.get('[data-testid="timeline-step"]').should('be.visible');
      
      // Mobile-optimized chat
      cy.get('[data-testid="mobile-chat-toggle"]').click();
      cy.get('[data-testid="mobile-chat-drawer"]').should('be.visible');
    });

    it('supports offline status checking', () => {
      cy.visit('/track/REP-2024-001?email=customer@example.com');
      cy.wait('@getRepairDetails');
      
      // Simulate offline mode
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        });
        
        win.dispatchEvent(new Event('offline'));
      });
      
      // Verify offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      
      // Cached data should still be available
      cy.get('[data-testid="repair-details"]').should('be.visible');
      
      // Online actions should be disabled
      cy.get('[data-testid="send-message-button"]').should('be.disabled');
    });
  });

  describe('Performance and Loading States', () => {
    it('shows loading states during data fetch', () => {
      // Slow down API response
      cy.intercept('GET', '**/api/repairs/**', { 
        fixture: 'repair-details.json',
        delay: 2000 
      }).as('getSlowRepairDetails');
      
      cy.visit('/track');
      cy.get('input[name="repairReference"]').type('REP-2024-001');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      // Verify loading state
      cy.get('[data-testid="loading-spinner"]').should('be.visible');
      cy.get('[data-testid="loading-message"]').should('contain', 'Loading repair details');
      
      cy.wait('@getSlowRepairDetails');
      
      // Loading should disappear
      cy.get('[data-testid="loading-spinner"]').should('not.exist');
      cy.get('[data-testid="repair-details"]').should('be.visible');
    });

    it('handles large timeline efficiently', () => {
      // Mock repair with many timeline events
      cy.intercept('GET', '**/api/repairs/REP-2024-003', { 
        fixture: 'repair-large-timeline.json' 
      }).as('getLargeTimeline');
      
      cy.visit('/track/REP-2024-003?email=customer@example.com');
      cy.wait('@getLargeTimeline');
      
      // Should implement virtualization for large lists
      cy.get('[data-testid="timeline-container"]').should('be.visible');
      
      // Only visible timeline items should be rendered
      cy.get('[data-testid="timeline-step"]').should('have.length.lessThan', 20);
      
      // Scroll to load more
      cy.get('[data-testid="timeline-container"]').scrollTo('bottom');
      cy.get('[data-testid="load-more-timeline"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      cy.visit('/track');
      
      // Mock network error
      cy.intercept('GET', '**/api/repairs/**', { forceNetworkError: true }).as('getNetworkError');
      
      cy.get('input[name="repairReference"]').type('REP-2024-001');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      cy.wait('@getNetworkError');
      
      // Error message should be displayed
      cy.get('[data-testid="error-message"]').should('contain', 'Network error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
      
      // Retry functionality
      cy.intercept('GET', '**/api/repairs/**', { fixture: 'repair-details.json' }).as('getRetrySuccess');
      cy.get('[data-testid="retry-button"]').click();
      
      cy.wait('@getRetrySuccess');
      cy.get('[data-testid="repair-details"]').should('be.visible');
    });

    it('handles expired repair references', () => {
      cy.visit('/track');
      
      cy.intercept('GET', '**/api/repairs/REP-OLD-001', { 
        statusCode: 410, 
        body: { error: 'Repair record expired' }
      }).as('getExpiredRepair');
      
      cy.get('input[name="repairReference"]').type('REP-OLD-001');
      cy.get('input[name="email"]').type('customer@example.com');
      cy.get('[data-testid="track-button"]').click();
      
      cy.wait('@getExpiredRepair');
      
      cy.get('[data-testid="error-message"]').should('contain', 'repair record has expired');
      cy.get('[data-testid="contact-support-link"]').should('be.visible');
    });
  });
});