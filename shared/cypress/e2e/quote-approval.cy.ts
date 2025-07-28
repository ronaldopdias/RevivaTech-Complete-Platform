describe('Quote Approval E2E', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '**/api/quotes/**', { fixture: 'quote-details.json' }).as('getQuoteDetails');
    cy.intercept('POST', '**/api/quotes/*/approve', { fixture: 'quote-approval.json' }).as('approveQuote');
    cy.intercept('POST', '**/api/quotes/*/reject', { fixture: 'quote-rejection.json' }).as('rejectQuote');
    cy.intercept('POST', '**/api/quotes/*/negotiate', { fixture: 'negotiation-response.json' }).as('negotiateQuote');
    cy.intercept('GET', '**/api/quotes/*/alternatives', { fixture: 'quote-alternatives.json' }).as('getAlternatives');
    cy.intercept('POST', '**/api/payments/process', { fixture: 'payment-response.json' }).as('processPayment');
  });

  describe('Guest Quote Approval', () => {
    it('allows guests to approve quote via email link', () => {
      // Simulate email link with token
      cy.visit('/quotes/approve/QT-2024-001?token=abc123&email=customer@example.com');
      cy.wait('@getQuoteDetails');
      
      // Verify quote details
      cy.get('[data-testid="quote-header"]').within(() => {
        cy.contains('Quote #QT-2024-001');
        cy.contains('iPhone 15 Pro Max');
        cy.contains('Screen Repair');
      });
      
      // Check quote breakdown
      cy.get('[data-testid="quote-breakdown"]').within(() => {
        cy.contains('Parts');
        cy.contains('£80.00');
        cy.contains('Labor');
        cy.contains('£70.00');
        cy.contains('Total');
        cy.contains('£150.00');
      });
      
      // Verify warranty information
      cy.get('[data-testid="warranty-info"]').should('contain', '6 months warranty');
      
      // Check estimated completion time
      cy.get('[data-testid="completion-estimate"]').should('contain', '2-3 business days');
      
      // Approve quote
      cy.get('[data-testid="approve-quote-button"]').click();
      
      // Confirmation modal
      cy.get('[data-testid="approval-modal"]').within(() => {
        cy.contains('Approve Quote');
        cy.contains('£150.00');
        cy.contains('This action will authorize the repair');
        
        // Payment method selection
        cy.get('[data-testid="payment-method"]').select('card');
        
        // Enter payment details
        cy.get('input[name="cardNumber"]').type('4242424242424242');
        cy.get('input[name="expiryDate"]').type('12/25');
        cy.get('input[name="cvv"]').type('123');
        cy.get('input[name="cardholderName"]').type('John Doe');
        
        cy.get('[data-testid="confirm-approval-button"]').click();
      });
      
      cy.wait('@processPayment');
      cy.wait('@approveQuote');
      
      // Success confirmation
      cy.get('[data-testid="approval-success"]').should('be.visible');
      cy.get('[data-testid="approval-success"]').should('contain', 'Quote approved successfully');
      cy.get('[data-testid="repair-tracking-link"]').should('be.visible');
    });

    it('allows quote rejection with reason', () => {
      cy.visit('/quotes/approve/QT-2024-001?token=abc123&email=customer@example.com');
      cy.wait('@getQuoteDetails');
      
      // Reject quote
      cy.get('[data-testid="reject-quote-button"]').click();
      
      // Rejection modal
      cy.get('[data-testid="rejection-modal"]').within(() => {
        cy.contains('Reject Quote');
        
        // Select rejection reason
        cy.get('select[name="rejectionReason"]').select('too-expensive');
        
        // Add optional comment
        cy.get('textarea[name="rejectionComment"]').type('The price is higher than expected. Could you provide a more affordable option?');
        
        cy.get('[data-testid="confirm-rejection-button"]').click();
      });
      
      cy.wait('@rejectQuote');
      
      // Rejection confirmation
      cy.get('[data-testid="rejection-success"]').should('be.visible');
      cy.get('[data-testid="rejection-success"]').should('contain', 'Quote rejected');
      
      // Should show next steps
      cy.get('[data-testid="next-steps"]').should('contain', 'Our team will review your feedback');
    });

    it('handles expired quote links', () => {
      cy.intercept('GET', '**/api/quotes/QT-EXPIRED-001**', { 
        statusCode: 410, 
        body: { error: 'Quote has expired' }
      }).as('getExpiredQuote');
      
      cy.visit('/quotes/approve/QT-EXPIRED-001?token=expired123&email=customer@example.com');
      cy.wait('@getExpiredQuote');
      
      cy.get('[data-testid="error-message"]').should('contain', 'quote has expired');
      cy.get('[data-testid="contact-support-button"]').should('be.visible');
      cy.get('[data-testid="new-quote-button"]').should('be.visible');
    });
  });

  describe('Authenticated User Quote Management', () => {
    beforeEach(() => {
      cy.login();
    });

    it('displays all pending quotes in dashboard', () => {
      cy.intercept('GET', '**/api/user/quotes', { fixture: 'user-quotes.json' }).as('getUserQuotes');
      
      cy.visit('/dashboard/quotes');
      cy.wait('@getUserQuotes');
      
      // Verify quotes list
      cy.get('[data-testid="quote-card"]').should('have.length.at.least', 2);
      
      cy.get('[data-testid="quote-card"]').first().within(() => {
        cy.contains('QT-2024-001');
        cy.contains('iPhone 15 Pro Max');
        cy.contains('Pending');
        cy.contains('£150.00');
        cy.get('[data-testid="view-quote-button"]').click();
      });
      
      cy.url().should('include', '/dashboard/quotes/QT-2024-001');
    });

    it('supports quote negotiation', () => {
      cy.visit('/dashboard/quotes/QT-2024-001');
      cy.wait('@getQuoteDetails');
      
      // Initiate negotiation
      cy.get('[data-testid="negotiate-button"]').click();
      
      cy.get('[data-testid="negotiation-modal"]').within(() => {
        cy.contains('Negotiate Quote');
        
        // Suggest alternative price
        cy.get('input[name="proposedPrice"]').clear().type('120');
        
        // Explain reason
        cy.get('textarea[name="negotiationReason"]').type('I found similar repairs elsewhere for £120. Can you match this price?');
        
        // Request alternative options
        cy.get('input[name="requestAlternatives"]').check();
        
        cy.get('[data-testid="submit-negotiation-button"]').click();
      });
      
      cy.wait('@negotiateQuote');
      
      // Success message
      cy.get('[data-testid="negotiation-submitted"]').should('be.visible');
      cy.get('[data-testid="negotiation-submitted"]').should('contain', 'negotiation request submitted');
      
      // Quote status should update
      cy.get('[data-testid="quote-status"]').should('contain', 'Under Review');
    });

    it('shows alternative repair options', () => {
      cy.visit('/dashboard/quotes/QT-2024-001');
      cy.wait('@getQuoteDetails');
      
      // Request alternatives
      cy.get('[data-testid="view-alternatives-button"]').click();
      cy.wait('@getAlternatives');
      
      cy.get('[data-testid="alternatives-section"]').within(() => {
        cy.contains('Alternative Options');
        
        // Budget option
        cy.get('[data-testid="alternative-budget"]').within(() => {
          cy.contains('Budget Repair');
          cy.contains('£100.00');
          cy.contains('3 months warranty');
          cy.get('[data-testid="select-alternative-button"]').should('be.visible');
        });
        
        // Premium option
        cy.get('[data-testid="alternative-premium"]').within(() => {
          cy.contains('Premium Repair');
          cy.contains('£200.00');
          cy.contains('12 months warranty');
          cy.contains('Original parts only');
        });
      });
      
      // Select budget option
      cy.get('[data-testid="alternative-budget"] [data-testid="select-alternative-button"]').click();
      
      // Confirmation
      cy.get('[data-testid="alternative-confirmation"]').within(() => {
        cy.contains('Select Budget Repair');
        cy.contains('£100.00');
        cy.get('[data-testid="confirm-alternative-button"]').click();
      });
      
      // Should create new quote
      cy.get('[data-testid="new-quote-created"]').should('be.visible');
    });

    it('handles partial payments', () => {
      // Mock quote that supports payment plans
      cy.intercept('GET', '**/api/quotes/QT-2024-002', { 
        fixture: 'quote-with-payment-plan.json' 
      }).as('getPaymentPlanQuote');
      
      cy.visit('/dashboard/quotes/QT-2024-002');
      cy.wait('@getPaymentPlanQuote');
      
      // Verify payment plan options
      cy.get('[data-testid="payment-options"]').within(() => {
        cy.contains('Payment Options');
        
        // Full payment
        cy.get('[data-testid="payment-full"]').within(() => {
          cy.contains('Pay in Full');
          cy.contains('£300.00');
        });
        
        // Payment plan
        cy.get('[data-testid="payment-plan"]').within(() => {
          cy.contains('3 Monthly Payments');
          cy.contains('£100.00 x 3');
          cy.get('input[type="radio"]').check();
        });
      });
      
      // Approve with payment plan
      cy.get('[data-testid="approve-quote-button"]').click();
      
      cy.get('[data-testid="approval-modal"]').within(() => {
        cy.contains('Payment Plan Selected');
        cy.contains('First payment: £100.00');
        cy.contains('Remaining payments will be automatically charged');
        
        // Setup payment method
        cy.get('input[name="cardNumber"]').type('4242424242424242');
        cy.get('input[name="expiryDate"]').type('12/25');
        cy.get('input[name="cvv"]').type('123');
        
        cy.get('[data-testid="confirm-approval-button"]').click();
      });
      
      cy.wait('@processPayment');
      cy.wait('@approveQuote');
      
      // Payment plan confirmation
      cy.get('[data-testid="payment-plan-success"]').should('be.visible');
      cy.get('[data-testid="payment-schedule"]').should('be.visible');
    });
  });

  describe('Mobile Quote Approval', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
    });

    it('provides mobile-optimized quote interface', () => {
      cy.visit('/quotes/approve/QT-2024-001?token=abc123&email=customer@example.com');
      cy.wait('@getQuoteDetails');
      
      // Mobile-friendly layout
      cy.get('[data-testid="mobile-quote-card"]').should('be.visible');
      
      // Swipeable quote details
      cy.get('[data-testid="quote-details-carousel"]').should('be.visible');
      
      // Mobile payment form
      cy.get('[data-testid="approve-quote-button"]').click();
      
      cy.get('[data-testid="mobile-payment-form"]').within(() => {
        cy.get('input[name="cardNumber"]').should('have.attr', 'inputmode', 'numeric');
        cy.get('input[name="expiryDate"]').should('have.attr', 'pattern', '[0-9]*');
      });
    });

    it('supports mobile payment methods', () => {
      cy.visit('/quotes/approve/QT-2024-001?token=abc123&email=customer@example.com');
      cy.wait('@getQuoteDetails');
      
      cy.get('[data-testid="approve-quote-button"]').click();
      
      // Mobile payment options
      cy.get('[data-testid="mobile-payment-methods"]').within(() => {
        cy.get('[data-testid="apple-pay-button"]').should('be.visible');
        cy.get('[data-testid="google-pay-button"]').should('be.visible');
        cy.get('[data-testid="card-payment-button"]').should('be.visible');
      });
      
      // Test Apple Pay (if available)
      cy.window().then((win) => {
        if (win.ApplePaySession?.canMakePayments()) {
          cy.get('[data-testid="apple-pay-button"]').click();
          // Apple Pay flow would be handled by the browser
        }
      });
    });
  });

  describe('Quote Comparison', () => {
    it('allows comparison with competitor quotes', () => {
      cy.visit('/dashboard/quotes/QT-2024-001');
      cy.wait('@getQuoteDetails');
      
      cy.get('[data-testid="compare-quotes-button"]').click();
      
      cy.get('[data-testid="comparison-tool"]').within(() => {
        cy.contains('Compare Quotes');
        
        // Add competitor quote
        cy.get('[data-testid="add-competitor-quote"]').click();
        cy.get('input[name="competitorPrice"]').type('140');
        cy.get('input[name="competitorWarranty"]').type('3 months');
        cy.get('[data-testid="add-quote-button"]').click();
        
        // Comparison table
        cy.get('[data-testid="comparison-table"]').within(() => {
          cy.contains('Our Quote');
          cy.contains('£150.00');
          cy.contains('6 months');
          
          cy.contains('Competitor');
          cy.contains('£140.00');
          cy.contains('3 months');
        });
        
        // Value proposition
        cy.get('[data-testid="value-proposition"]').should('contain', 'Our advantages');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles payment failures gracefully', () => {
      cy.visit('/quotes/approve/QT-2024-001?token=abc123&email=customer@example.com');
      cy.wait('@getQuoteDetails');
      
      cy.get('[data-testid="approve-quote-button"]').click();
      
      // Mock payment failure
      cy.intercept('POST', '**/api/payments/process', { 
        statusCode: 400, 
        body: { error: 'Payment declined' }
      }).as('paymentFailure');
      
      cy.get('[data-testid="approval-modal"]').within(() => {
        cy.get('input[name="cardNumber"]').type('4000000000000002'); // Declined card
        cy.get('input[name="expiryDate"]').type('12/25');
        cy.get('input[name="cvv"]').type('123');
        cy.get('input[name="cardholderName"]').type('John Doe');
        
        cy.get('[data-testid="confirm-approval-button"]').click();
      });
      
      cy.wait('@paymentFailure');
      
      // Error handling
      cy.get('[data-testid="payment-error"]').should('contain', 'Payment declined');
      cy.get('[data-testid="retry-payment-button"]').should('be.visible');
      cy.get('[data-testid="different-card-button"]').should('be.visible');
    });

    it('validates quote approval conditions', () => {
      // Mock quote with special conditions
      cy.intercept('GET', '**/api/quotes/QT-CONDITIONAL-001**', { 
        fixture: 'quote-with-conditions.json' 
      }).as('getConditionalQuote');
      
      cy.visit('/quotes/approve/QT-CONDITIONAL-001?token=abc123&email=customer@example.com');
      cy.wait('@getConditionalQuote');
      
      // Special conditions should be displayed
      cy.get('[data-testid="quote-conditions"]').within(() => {
        cy.contains('Special Conditions');
        cy.contains('Device must be brought in within 48 hours');
        cy.contains('Additional diagnostic may be required');
      });
      
      // Approval should require acknowledgment
      cy.get('[data-testid="approve-quote-button"]').click();
      
      cy.get('[data-testid="conditions-acknowledgment"]').within(() => {
        cy.get('input[name="acknowledgeConditions"]').check();
        cy.get('input[name="agreeToAdditionalCosts"]').check();
      });
    });
  });
});