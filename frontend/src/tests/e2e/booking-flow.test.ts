/**
 * End-to-End Testing Suite for RevivaTech Booking Flow
 * Tests complete customer journey from device selection to booking confirmation
 */

import { test, expect, Page } from '@playwright/test';

interface BookingTestData {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  };
  device: {
    category: string;
    brand: string;
    model: string;
  };
  repairType: string;
  serviceLevel: 'STANDARD' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  expectedPriceRange: [number, number];
}

const testBookingData: BookingTestData = {
  customer: {
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test.customer@example.com',
    phone: '+44123456789',
    address: '123 Test Street, London, UK'
  },
  device: {
    category: 'Laptops',
    brand: 'Apple',
    model: 'MacBook Pro 16"'
  },
  repairType: 'Screen Repair',
  serviceLevel: 'STANDARD',
  expectedPriceRange: [200, 500]
};

test.describe('Complete Booking Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3010');
  });

  test('Complete booking flow - Anonymous user', async () => {
    // Step 1: Navigate to booking wizard
    await test.step('Navigate to modern booking demo', async () => {
      await page.goto('http://localhost:3010/modern-booking-demo');
      await expect(page.locator('h1')).toContainText('Book Your Repair');
      await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
    });

    // Step 2: Device Selection
    await test.step('Select device category and model', async () => {
      // Select device category
      await page.locator(`[data-testid="category-${testBookingData.device.category}"]`).click();
      await expect(page.locator('[data-testid="device-list"]')).toBeVisible();

      // Search and select device model
      await page.locator('[data-testid="device-search"]').fill(testBookingData.device.model);
      await page.locator(`[data-testid="device-${testBookingData.device.model}"]`).click();
      
      // Proceed to next step
      await page.locator('[data-testid="next-button"]').click();
      await expect(page.locator('[data-testid="step-2"]')).toBeVisible();
    });

    // Step 3: Repair Type Selection
    await test.step('Select repair type and issue description', async () => {
      // Select repair type
      await page.locator(`[data-testid="repair-type-${testBookingData.repairType}"]`).click();
      
      // Add issue description
      await page.locator('[data-testid="issue-description"]').fill('Screen is cracked and not responding to touch');
      
      // Upload photos (optional)
      const fileInput = page.locator('[data-testid="photo-upload"]');
      await fileInput.setInputFiles([{
        name: 'device-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      }]);

      // Proceed to pricing
      await page.locator('[data-testid="next-button"]').click();
      await expect(page.locator('[data-testid="step-3"]')).toBeVisible();
    });

    // Step 4: Pricing and Quote
    await test.step('Review pricing and generate quote', async () => {
      // Wait for price calculation
      await expect(page.locator('[data-testid="price-calculator"]')).toBeVisible();
      await page.waitForSelector('[data-testid="calculated-price"]', { timeout: 10000 });

      // Verify price is within expected range
      const priceText = await page.locator('[data-testid="calculated-price"]').textContent();
      const price = parseFloat(priceText?.replace(/[£$€,]/g, '') || '0');
      expect(price).toBeGreaterThanOrEqual(testBookingData.expectedPriceRange[0]);
      expect(price).toBeLessThanOrEqual(testBookingData.expectedPriceRange[1]);

      // Select service level
      await page.locator(`[data-testid="service-level-${testBookingData.serviceLevel}"]`).click();

      // Verify quote details
      await expect(page.locator('[data-testid="quote-breakdown"]')).toBeVisible();
      await expect(page.locator('[data-testid="warranty-info"]')).toBeVisible();

      // Proceed to customer details
      await page.locator('[data-testid="proceed-to-booking"]').click();
      await expect(page.locator('[data-testid="step-4"]')).toBeVisible();
    });

    // Step 5: Customer Information
    await test.step('Fill customer information and confirm booking', async () => {
      // Fill customer details
      await page.locator('[data-testid="customer-firstName"]').fill(testBookingData.customer.firstName);
      await page.locator('[data-testid="customer-lastName"]').fill(testBookingData.customer.lastName);
      await page.locator('[data-testid="customer-email"]').fill(testBookingData.customer.email);
      await page.locator('[data-testid="customer-phone"]').fill(testBookingData.customer.phone);
      await page.locator('[data-testid="customer-address"]').fill(testBookingData.customer.address);

      // Select service type
      await page.locator('[data-testid="service-type-pickup"]').click();

      // Accept terms and conditions
      await page.locator('[data-testid="terms-checkbox"]').check();

      // Submit booking
      await page.locator('[data-testid="submit-booking"]').click();

      // Wait for confirmation
      await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible();
    });

    // Step 6: Verify booking creation
    await test.step('Verify booking was created successfully', async () => {
      const bookingReference = await page.locator('[data-testid="booking-reference"]').textContent();
      expect(bookingReference).toMatch(/REV-\d{10}/);

      // Verify confirmation email notification
      await expect(page.locator('[data-testid="email-confirmation"]')).toContainText(testBookingData.customer.email);

      // Verify next steps information
      await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-portal-link"]')).toBeVisible();
    });
  });

  test('Booking flow with registered user', async () => {
    // Step 1: Login first
    await test.step('Login with existing account', async () => {
      await page.goto('http://localhost:3010/login');
      await page.locator('[data-testid="email-input"]').fill('existing.customer@example.com');
      await page.locator('[data-testid="password-input"]').fill('TestPassword123!');
      await page.locator('[data-testid="login-button"]').click();
      
      // Verify successful login
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    // Step 2: Navigate to booking (should pre-fill customer data)
    await test.step('Start booking with pre-filled customer data', async () => {
      await page.goto('http://localhost:3010/modern-booking-demo');
      
      // Complete device and repair selection (simplified)
      await page.locator('[data-testid="category-Laptops"]').click();
      await page.locator('[data-testid="device-MacBook Pro 16\""]').click();
      await page.locator('[data-testid="next-button"]').click();
      
      await page.locator('[data-testid="repair-type-Screen Repair"]').click();
      await page.locator('[data-testid="next-button"]').click();
      
      // Skip to customer details to verify pre-fill
      await page.locator('[data-testid="proceed-to-booking"]').click();
      
      // Verify customer data is pre-filled
      const firstName = await page.locator('[data-testid="customer-firstName"]').inputValue();
      const email = await page.locator('[data-testid="customer-email"]').inputValue();
      
      expect(firstName).not.toBe('');
      expect(email).toContain('@');
    });
  });

  test('Price calculation accuracy', async () => {
    await test.step('Test price calculation for different scenarios', async () => {
      const testScenarios = [
        {
          device: 'iPhone 15 Pro',
          repairType: 'Screen Repair',
          serviceLevel: 'STANDARD',
          expectedRange: [150, 300]
        },
        {
          device: 'MacBook Pro 16"',
          repairType: 'Logic Board Repair',
          serviceLevel: 'URGENT',
          expectedRange: [400, 800]
        },
        {
          device: 'Samsung Galaxy S24',
          repairType: 'Battery Replacement',
          serviceLevel: 'HIGH',
          expectedRange: [80, 150]
        }
      ];

      for (const scenario of testScenarios) {
        await page.goto('http://localhost:3010/modern-booking-demo');
        
        // Select device
        await page.locator('[data-testid="device-search"]').fill(scenario.device);
        await page.locator(`[data-testid="device-${scenario.device}"]`).click();
        await page.locator('[data-testid="next-button"]').click();
        
        // Select repair type
        await page.locator(`[data-testid="repair-type-${scenario.repairType}"]`).click();
        await page.locator('[data-testid="next-button"]').click();
        
        // Check pricing
        await page.locator(`[data-testid="service-level-${scenario.serviceLevel}"]`).click();
        await page.waitForSelector('[data-testid="calculated-price"]');
        
        const priceText = await page.locator('[data-testid="calculated-price"]').textContent();
        const price = parseFloat(priceText?.replace(/[£$€,]/g, '') || '0');
        
        expect(price).toBeGreaterThanOrEqual(scenario.expectedRange[0]);
        expect(price).toBeLessThanOrEqual(scenario.expectedRange[1]);
      }
    });
  });

  test('Error handling and validation', async () => {
    await test.step('Test form validation and error handling', async () => {
      await page.goto('http://localhost:3010/modern-booking-demo');
      
      // Test proceeding without device selection
      await page.locator('[data-testid="next-button"]').click();
      await expect(page.locator('[data-testid="device-error"]')).toBeVisible();
      
      // Select device and proceed
      await page.locator('[data-testid="category-Laptops"]').click();
      await page.locator('[data-testid="device-MacBook Pro 16\""]').click();
      await page.locator('[data-testid="next-button"]').click();
      
      // Test proceeding without repair type selection
      await page.locator('[data-testid="next-button"]').click();
      await expect(page.locator('[data-testid="repair-type-error"]')).toBeVisible();
      
      // Complete flow to customer details
      await page.locator('[data-testid="repair-type-Screen Repair"]').click();
      await page.locator('[data-testid="next-button"]').click();
      await page.locator('[data-testid="proceed-to-booking"]').click();
      
      // Test invalid email validation
      await page.locator('[data-testid="customer-email"]').fill('invalid-email');
      await page.locator('[data-testid="submit-booking"]').click();
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      
      // Test phone number validation
      await page.locator('[data-testid="customer-phone"]').fill('123');
      await page.locator('[data-testid="submit-booking"]').click();
      await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
    });
  });

  test('Mobile responsiveness', async () => {
    await test.step('Test booking flow on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('http://localhost:3010/modern-booking-demo');
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="step-indicator"]')).toBeVisible();
      
      // Test mobile device selection
      await page.locator('[data-testid="category-Laptops"]').click();
      await expect(page.locator('[data-testid="device-list"]')).toBeVisible();
      
      // Verify mobile-optimized grid
      const deviceCards = page.locator('[data-testid^="device-"]');
      const firstCard = deviceCards.first();
      const boundingBox = await firstCard.boundingBox();
      
      // Device cards should be full width on mobile
      expect(boundingBox?.width).toBeGreaterThan(300);
    });
  });

  test.afterEach(async () => {
    await page.close();
  });
});

test.describe('Performance Testing', () => {
  test('Page load performance', async ({ page }) => {
    await test.step('Measure page load times', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:3010/modern-booking-demo');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test('API response times', async ({ page }) => {
    await test.step('Measure API response times', async () => {
      // Monitor network requests
      const responses: any[] = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          responses.push({
            url: response.url(),
            status: response.status(),
            timing: response.timing()
          });
        }
      });

      await page.goto('http://localhost:3010/modern-booking-demo');
      
      // Trigger API calls
      await page.locator('[data-testid="category-Laptops"]').click();
      await page.waitForResponse(response => response.url().includes('/api/devices'));
      
      // Verify API response times
      const apiResponses = responses.filter(r => r.url.includes('/api/devices'));
      expect(apiResponses.length).toBeGreaterThan(0);
      
      apiResponses.forEach(response => {
        expect(response.status).toBe(200);
        // API should respond within 500ms
        expect(response.timing).toBeLessThan(500);
      });
    });
  });
});