/**
 * Payment Integration Tests
 * Tests the complete payment flow for both Stripe and PayPal
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to payment test page
    await page.goto('/payment-test');
  });

  test('Payment Gateway loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Payment Gateway Test');
    await expect(page.locator('[data-testid="payment-gateway"]')).toBeVisible();
  });

  test('Stripe payment method is available', async ({ page }) => {
    // Check if Stripe payment method is visible
    await expect(page.locator('text=Credit/Debit Card')).toBeVisible();
    await expect(page.locator('text=Visa, Mastercard, American Express')).toBeVisible();
  });

  test('PayPal payment method is available', async ({ page }) => {
    // Check if PayPal payment method is visible
    await expect(page.locator('text=PayPal')).toBeVisible();
    await expect(page.locator('text=Pay with your PayPal account')).toBeVisible();
  });

  test('Amount configuration works', async ({ page }) => {
    // Change amount
    await page.fill('input[type="number"]', '200.00');
    await expect(page.locator('text=£200.00')).toBeVisible();
  });

  test('Currency selection works', async ({ page }) => {
    // Change currency
    await page.selectOption('select', 'USD');
    await expect(page.locator('text=USD')).toBeVisible();
  });

  test('Payment method selection works', async ({ page }) => {
    // Select Stripe only
    await page.selectOption('[data-testid="payment-method-select"]', 'stripe');
    await expect(page.locator('text=PayPal')).not.toBeVisible();
    
    // Select PayPal only
    await page.selectOption('[data-testid="payment-method-select"]', 'paypal');
    await expect(page.locator('text=Credit/Debit Card')).not.toBeVisible();
  });

  test('Environment variables check', async ({ page }) => {
    // Check if environment variables section is visible
    await expect(page.locator('text=Environment Variables Required')).toBeVisible();
    await expect(page.locator('text=NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')).toBeVisible();
    await expect(page.locator('text=NEXT_PUBLIC_PAYPAL_CLIENT_ID')).toBeVisible();
  });

  test('API endpoints documentation', async ({ page }) => {
    // Check if API endpoints are documented
    await expect(page.locator('text=API Endpoints')).toBeVisible();
    await expect(page.locator('text=/api/payments/stripe/payment-intent')).toBeVisible();
    await expect(page.locator('text=/api/payments/paypal/create-order')).toBeVisible();
  });

  test('Payment form validation', async ({ page }) => {
    // Try to submit with invalid amount
    await page.fill('input[type="number"]', '0');
    await expect(page.locator('text=Invalid amount')).toBeVisible();
    
    // Try to submit with negative amount
    await page.fill('input[type="number"]', '-10');
    await expect(page.locator('text=Invalid amount')).toBeVisible();
  });

  test('Mock payment works', async ({ page }) => {
    // With real payments disabled, should show mock payment
    await page.evaluate(() => {
      process.env.ENABLE_REAL_PAYMENTS = 'false';
    });
    
    await page.reload();
    await expect(page.locator('text=Demo Mode')).toBeVisible();
    await expect(page.locator('text=mock payment gateway')).toBeVisible();
  });

  test('Real payment mode shows actual forms', async ({ page }) => {
    // With real payments enabled, should show actual payment forms
    await page.evaluate(() => {
      process.env.ENABLE_REAL_PAYMENTS = 'true';
    });
    
    await page.reload();
    await expect(page.locator('text=Demo Mode')).not.toBeVisible();
    
    // Should show Stripe Elements or PayPal buttons
    await expect(page.locator('.StripeElement, .paypal-buttons')).toBeVisible();
  });

  test('Payment error handling', async ({ page }) => {
    // Test error handling for invalid payment
    await page.fill('input[type="number"]', '999999'); // Very large amount
    
    // Should show error message
    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
  });

  test('Payment success handling', async ({ page }) => {
    // Test successful payment flow (mocked)
    await page.fill('input[type="number"]', '50.00');
    await page.click('[data-testid="pay-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });

  test('Booking integration', async ({ page }) => {
    // Test that payment is linked to booking
    const bookingId = await page.locator('[data-testid="booking-id"]').textContent();
    expect(bookingId).toMatch(/booking_test_\d+/);
    
    // Payment should reference the booking
    await expect(page.locator(`text=${bookingId}`)).toBeVisible();
  });
});

test.describe('Stripe Payment Tests', () => {
  test('Stripe form loads correctly', async ({ page }) => {
    await page.goto('/payment-test');
    
    // Select Stripe payment method
    await page.click('text=Credit/Debit Card');
    
    // Check if Stripe Elements load
    await expect(page.locator('#stripe-payment-element')).toBeVisible();
    await expect(page.locator('text=Card number')).toBeVisible();
  });

  test('Stripe test card validation', async ({ page }) => {
    await page.goto('/payment-test');
    await page.click('text=Credit/Debit Card');
    
    // Enter test card details
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/25');
    await page.fill('[data-testid="card-cvc"]', '123');
    
    // Should not show validation errors
    await expect(page.locator('[data-testid="card-error"]')).not.toBeVisible();
  });
});

test.describe('PayPal Payment Tests', () => {
  test('PayPal buttons load correctly', async ({ page }) => {
    await page.goto('/payment-test');
    
    // Select PayPal payment method
    await page.click('text=PayPal');
    
    // Check if PayPal buttons load
    await expect(page.locator('.paypal-buttons')).toBeVisible();
    await expect(page.locator('[data-testid="paypal-button"]')).toBeVisible();
  });

  test('PayPal sandbox environment', async ({ page }) => {
    await page.goto('/payment-test');
    await page.click('text=PayPal');
    
    // Should use sandbox environment
    await expect(page.locator('text=sandbox')).toBeVisible();
  });
});

test.describe('Mobile Payment Tests', () => {
  test('Payment gateway is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/payment-test');
    
    // Check if payment gateway is still usable on mobile
    await expect(page.locator('[data-testid="payment-gateway"]')).toBeVisible();
    await expect(page.locator('text=Credit/Debit Card')).toBeVisible();
    await expect(page.locator('text=PayPal')).toBeVisible();
  });

  test('Payment buttons are touch-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/payment-test');
    
    const payButton = page.locator('[data-testid="pay-button"]');
    const buttonHeight = await payButton.evaluate(el => el.clientHeight);
    
    // Should be at least 44px tall (iOS guideline)
    expect(buttonHeight).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Security Tests', () => {
  test('Payment form uses HTTPS', async ({ page }) => {
    await page.goto('/payment-test');
    
    // Check if page uses HTTPS (in production)
    const url = page.url();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Skip HTTPS check for localhost
      return;
    }
    
    expect(url).toMatch(/^https:/);
  });

  test('Sensitive data is not exposed', async ({ page }) => {
    await page.goto('/payment-test');
    
    // Check that secret keys are not exposed in client-side code
    const content = await page.content();
    expect(content).not.toContain('sk_test_');
    expect(content).not.toContain('sk_live_');
    expect(content).not.toContain('whsec_');
  });

  test('Payment form has proper validation', async ({ page }) => {
    await page.goto('/payment-test');
    
    // Test amount validation
    await page.fill('input[type="number"]', '-100');
    await expect(page.locator('text=Invalid amount')).toBeVisible();
    
    // Test currency validation
    await page.selectOption('select', 'INVALID');
    await expect(page.locator('text=Invalid currency')).toBeVisible();
  });
});