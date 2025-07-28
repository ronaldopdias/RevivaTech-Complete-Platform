/**
 * End-to-End Testing Suite for RevivaTech Payment Integration
 * Tests complete payment flow using Stripe test cards and scenarios
 */

import { test, expect, Page } from '@playwright/test';

interface PaymentTestData {
  successCard: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  failureCard: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  amount: number;
  currency: string;
  description: string;
}

const testPaymentData: PaymentTestData = {
  successCard: {
    number: '4242424242424242', // Stripe test card - always succeeds
    expiry: '12/34',
    cvv: '123',
    name: 'Test Customer'
  },
  failureCard: {
    number: '4000000000000002', // Stripe test card - always fails
    expiry: '12/34',
    cvv: '123',
    name: 'Test Customer'
  },
  amount: 299.99,
  currency: 'GBP',
  description: 'iPhone Screen Repair'
};

test.describe('Payment Integration Testing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Set up Stripe test environment
    await page.addInitScript(() => {
      window.STRIPE_TEST_MODE = true;
    });
  });

  test('Successful payment flow with Stripe', async () => {
    await test.step('Navigate to payment demo', async () => {
      await page.goto('http://localhost:3010/payment-demo');
      await expect(page.locator('h1')).toContainText('Payment Demo');
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    });

    await test.step('Fill payment details with valid card', async () => {
      // Fill amount and description
      await page.locator('[data-testid="amount-input"]').fill(testPaymentData.amount.toString());
      await page.locator('[data-testid="description-input"]').fill(testPaymentData.description);

      // Wait for Stripe Elements to load
      await page.waitForSelector('[data-testid="stripe-card-element"]');
      
      // Fill Stripe card element (using iframe)
      const stripeFrame = page.frameLocator('[name*="__privateStripeFrame"]').first();
      await stripeFrame.locator('[name="cardnumber"]').fill(testPaymentData.successCard.number);
      await stripeFrame.locator('[name="exp-date"]').fill(testPaymentData.successCard.expiry);
      await stripeFrame.locator('[name="cvc"]').fill(testPaymentData.successCard.cvv);

      // Fill cardholder name
      await page.locator('[data-testid="cardholder-name"]').fill(testPaymentData.successCard.name);
    });

    await test.step('Submit payment and verify success', async () => {
      // Submit payment
      await page.locator('[data-testid="submit-payment"]').click();

      // Wait for payment processing
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
      
      // Wait for success confirmation
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
      
      // Verify payment details
      const paymentId = await page.locator('[data-testid="payment-id"]').textContent();
      expect(paymentId).toMatch(/pi_[a-zA-Z0-9]+/); // Stripe payment intent ID format

      const paidAmount = await page.locator('[data-testid="paid-amount"]').textContent();
      expect(paidAmount).toContain(testPaymentData.amount.toString());
    });

    await test.step('Verify receipt generation', async () => {
      // Check receipt download link
      await expect(page.locator('[data-testid="download-receipt"]')).toBeVisible();
      
      // Verify receipt content
      await expect(page.locator('[data-testid="receipt-details"]')).toContainText(testPaymentData.description);
      await expect(page.locator('[data-testid="receipt-amount"]')).toContainText(testPaymentData.amount.toString());
      await expect(page.locator('[data-testid="receipt-date"]')).toBeVisible();
    });
  });

  test('Failed payment handling', async () => {
    await test.step('Attempt payment with declined card', async () => {
      await page.goto('http://localhost:3010/payment-demo');
      
      // Fill payment details with failing card
      await page.locator('[data-testid="amount-input"]').fill(testPaymentData.amount.toString());
      await page.locator('[data-testid="description-input"]').fill(testPaymentData.description);

      // Fill Stripe card element with failing card
      const stripeFrame = page.frameLocator('[name*="__privateStripeFrame"]').first();
      await stripeFrame.locator('[name="cardnumber"]').fill(testPaymentData.failureCard.number);
      await stripeFrame.locator('[name="exp-date"]').fill(testPaymentData.failureCard.expiry);
      await stripeFrame.locator('[name="cvc"]').fill(testPaymentData.failureCard.cvv);

      await page.locator('[data-testid="cardholder-name"]').fill(testPaymentData.failureCard.name);
    });

    await test.step('Verify error handling', async () => {
      // Submit payment
      await page.locator('[data-testid="submit-payment"]').click();

      // Wait for error message
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible({ timeout: 10000 });
      
      // Verify error message content
      const errorMessage = await page.locator('[data-testid="payment-error"]').textContent();
      expect(errorMessage).toContain('declined');
      
      // Verify form is still accessible for retry
      await expect(page.locator('[data-testid="submit-payment"]')).toBeEnabled();
    });
  });

  test('Multiple payment methods testing', async () => {
    const paymentMethods = [
      { id: 'card', name: 'Credit/Debit Card' },
      { id: 'paypal', name: 'PayPal' },
      { id: 'apple-pay', name: 'Apple Pay' },
      { id: 'google-pay', name: 'Google Pay' }
    ];

    for (const method of paymentMethods) {
      await test.step(`Test ${method.name} payment method`, async () => {
        await page.goto('http://localhost:3010/payment-demo');
        
        // Select payment method
        await page.locator(`[data-testid="payment-method-${method.id}"]`).click();
        
        // Verify method-specific form appears
        await expect(page.locator(`[data-testid="${method.id}-form"]`)).toBeVisible();
        
        if (method.id === 'card') {
          // Already tested above
          return;
        }
        
        // For other payment methods, verify they're properly configured
        const isEnabled = await page.locator(`[data-testid="submit-${method.id}"]`).isEnabled();
        expect(isEnabled).toBeTruthy();
      });
    }
  });

  test('Payment validation and security', async () => {
    await test.step('Test amount validation', async () => {
      await page.goto('http://localhost:3010/payment-demo');
      
      // Test negative amount
      await page.locator('[data-testid="amount-input"]').fill('-10.00');
      await page.locator('[data-testid="submit-payment"]').click();
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('must be positive');
      
      // Test zero amount
      await page.locator('[data-testid="amount-input"]').fill('0.00');
      await page.locator('[data-testid="submit-payment"]').click();
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('must be greater than zero');
      
      // Test excessive amount
      await page.locator('[data-testid="amount-input"]').fill('999999.99');
      await page.locator('[data-testid="submit-payment"]').click();
      await expect(page.locator('[data-testid="amount-error"]')).toContainText('exceeds maximum');
    });

    await test.step('Test card number validation', async () => {
      await page.locator('[data-testid="amount-input"]').fill('50.00');
      
      // Test invalid card number
      const stripeFrame = page.frameLocator('[name*="__privateStripeFrame"]').first();
      await stripeFrame.locator('[name="cardnumber"]').fill('1234567890123456');
      
      // Verify Stripe shows validation error
      await expect(stripeFrame.locator('.StripeElement--invalid')).toBeVisible();
    });

    await test.step('Verify SSL/HTTPS enforcement', async () => {
      // Verify page is served over HTTPS in production
      const url = page.url();
      if (url.includes('localhost') === false) {
        expect(url).toMatch(/^https:/);
      }
      
      // Verify Stripe Elements are loaded securely
      const stripeFrames = await page.locator('[name*="__privateStripeFrame"]').count();
      expect(stripeFrames).toBeGreaterThan(0);
    });
  });

  test('Invoice generation and management', async () => {
    await test.step('Generate invoice after successful payment', async () => {
      // Complete a successful payment first
      await page.goto('http://localhost:3010/payment-demo');
      
      await page.locator('[data-testid="amount-input"]').fill('150.00');
      await page.locator('[data-testid="description-input"]').fill('MacBook Screen Repair');
      
      const stripeFrame = page.frameLocator('[name*="__privateStripeFrame"]').first();
      await stripeFrame.locator('[name="cardnumber"]').fill(testPaymentData.successCard.number);
      await stripeFrame.locator('[name="exp-date"]').fill(testPaymentData.successCard.expiry);
      await stripeFrame.locator('[name="cvc"]').fill(testPaymentData.successCard.cvv);
      
      await page.locator('[data-testid="cardholder-name"]').fill(testPaymentData.successCard.name);
      await page.locator('[data-testid="submit-payment"]').click();
      
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify invoice details and download', async () => {
      // Verify invoice details
      await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-amount"]')).toContainText('150.00');
      
      // Test invoice download
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="download-invoice"]').click();
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/);
    });
  });

  test('Payment history and tracking', async () => {
    await test.step('Navigate to payment history', async () => {
      // Login first (assuming user has payment history)
      await page.goto('http://localhost:3010/login');
      await page.locator('[data-testid="email-input"]').fill('test.customer@example.com');
      await page.locator('[data-testid="password-input"]').fill('TestPassword123!');
      await page.locator('[data-testid="login-button"]').click();
      
      // Navigate to customer portal
      await page.goto('http://localhost:3010/customer-portal');
      await page.locator('[data-testid="payments-tab"]').click();
    });

    await test.step('Verify payment history display', async () => {
      // Verify payment history table
      await expect(page.locator('[data-testid="payment-history-table"]')).toBeVisible();
      
      // Check for payment entries
      const paymentRows = page.locator('[data-testid^="payment-row-"]');
      const rowCount = await paymentRows.count();
      
      if (rowCount > 0) {
        // Verify first payment row contains required information
        await expect(paymentRows.first().locator('[data-testid="payment-date"]')).toBeVisible();
        await expect(paymentRows.first().locator('[data-testid="payment-amount"]')).toBeVisible();
        await expect(paymentRows.first().locator('[data-testid="payment-status"]')).toBeVisible();
        await expect(paymentRows.first().locator('[data-testid="payment-description"]')).toBeVisible();
      }
    });

    await test.step('Test payment search and filtering', async () => {
      // Test date range filter
      await page.locator('[data-testid="date-from"]').fill('2024-01-01');
      await page.locator('[data-testid="date-to"]').fill('2024-12-31');
      await page.locator('[data-testid="filter-payments"]').click();
      
      // Test search by description
      await page.locator('[data-testid="payment-search"]').fill('Screen Repair');
      await page.locator('[data-testid="search-payments"]').click();
      
      // Verify filtered results
      const filteredRows = page.locator('[data-testid^="payment-row-"]');
      const filteredCount = await filteredRows.count();
      
      // Should have results or show "no payments found" message
      if (filteredCount === 0) {
        await expect(page.locator('[data-testid="no-payments-message"]')).toBeVisible();
      }
    });
  });

  test('Payment security and compliance', async () => {
    await test.step('Verify PCI compliance measures', async () => {
      await page.goto('http://localhost:3010/payment-demo');
      
      // Verify card details are handled by Stripe (not directly by our form)
      const cardInputs = await page.locator('input[name*="card"], input[type="text"][placeholder*="card"]').count();
      expect(cardInputs).toBe(0); // No direct card inputs in our DOM
      
      // Verify Stripe Elements are used
      await expect(page.locator('[data-testid="stripe-card-element"]')).toBeVisible();
      
      // Verify SSL indicators
      const securityIndicators = page.locator('[data-testid="ssl-indicator"], [data-testid="security-badge"]');
      if (await securityIndicators.count() > 0) {
        await expect(securityIndicators.first()).toBeVisible();
      }
    });

    await test.step('Test rate limiting and fraud protection', async () => {
      // Attempt multiple rapid payment submissions
      await page.locator('[data-testid="amount-input"]').fill('10.00');
      
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-testid="submit-payment"]').click();
        await page.waitForTimeout(100);
      }
      
      // Should show rate limiting or require additional verification
      const rateLimitMessage = page.locator('[data-testid="rate-limit-message"]');
      const additionalVerification = page.locator('[data-testid="additional-verification"]');
      
      const hasRateLimit = await rateLimitMessage.isVisible();
      const hasVerification = await additionalVerification.isVisible();
      
      // One of these security measures should be active
      expect(hasRateLimit || hasVerification).toBeTruthy();
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});

test.describe('Payment Integration Performance', () => {
  test('Payment processing speed', async ({ page }) => {
    await test.step('Measure payment processing time', async () => {
      await page.goto('http://localhost:3010/payment-demo');
      
      // Fill payment form
      await page.locator('[data-testid="amount-input"]').fill('50.00');
      await page.locator('[data-testid="description-input"]').fill('Test Payment');
      
      const stripeFrame = page.frameLocator('[name*="__privateStripeFrame"]').first();
      await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242');
      await stripeFrame.locator('[name="exp-date"]').fill('12/34');
      await stripeFrame.locator('[name="cvc"]').fill('123');
      
      await page.locator('[data-testid="cardholder-name"]').fill('Test Customer');
      
      // Measure processing time
      const startTime = Date.now();
      await page.locator('[data-testid="submit-payment"]').click();
      
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 15000 });
      const processingTime = Date.now() - startTime;
      
      // Payment should process within 10 seconds
      expect(processingTime).toBeLessThan(10000);
      console.log(`Payment processing time: ${processingTime}ms`);
    });
  });

  test('Stripe Elements loading performance', async ({ page }) => {
    await test.step('Measure Stripe Elements initialization time', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:3010/payment-demo');
      
      // Wait for Stripe Elements to be ready
      await page.waitForSelector('[data-testid="stripe-card-element"]');
      await page.waitForFunction(() => {
        const element = document.querySelector('[data-testid="stripe-card-element"]');
        return element && element.querySelector('iframe');
      });
      
      const loadTime = Date.now() - startTime;
      
      // Stripe Elements should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      console.log(`Stripe Elements load time: ${loadTime}ms`);
    });
  });
});