/**
 * Unit Tests for Pricing API Functions
 * Tests pricing calculations, API calls, and data transformations
 */

import { calculatePrice, getPriceBreakdown, validatePriceQuote } from '@/lib/api/pricing';

// Mock fetch before importing modules
global.fetch = jest.fn();

describe('Pricing API Functions', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('calculatePrice', () => {
    test('calculates price for basic repair', async () => {
      const mockPriceResponse = {
        basePrice: 150.00,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.2,
        totalPrice: 180.00,
        currency: 'GBP',
        quoteId: 'quote-123',
        validUntil: '2024-12-31T23:59:59Z'
      };

      global.TestUtils.mockFetchResponse(mockPriceResponse);

      const priceRequest = {
        deviceType: 'iPhone 15 Pro',
        repairType: 'Screen Repair',
        urgencyLevel: 'STANDARD',
        serviceLocation: 'IN_STORE'
      };

      const result = await calculatePrice(priceRequest);

      expect(result.totalPrice).toBeValidPrice();
      expect(result.totalPrice).toBe(180.00);
      expect(result.currency).toBe('GBP');
      expect(result.quoteId).toBeTruthy();

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/pricing/calculate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(priceRequest)
        })
      );
    });

    test('applies urgency multipliers correctly', async () => {
      const testScenarios = [
        { urgency: 'STANDARD', expectedMultiplier: 1.0 },
        { urgency: 'HIGH', expectedMultiplier: 1.2 },
        { urgency: 'URGENT', expectedMultiplier: 1.5 },
        { urgency: 'EMERGENCY', expectedMultiplier: 2.0 }
      ];

      for (const scenario of testScenarios) {
        const mockResponse = {
          basePrice: 100.00,
          urgencyMultiplier: scenario.expectedMultiplier,
          totalPrice: 100.00 * scenario.expectedMultiplier,
          currency: 'GBP'
        };

        global.TestUtils.mockFetchResponse(mockResponse);

        const result = await calculatePrice({
          deviceType: 'MacBook Pro',
          repairType: 'Logic Board Repair',
          urgencyLevel: scenario.urgency as any
        });

        expect(result.urgencyMultiplier).toBe(scenario.expectedMultiplier);
        expect(result.totalPrice).toBe(100.00 * scenario.expectedMultiplier);
      }
    });

    test('handles different device types with appropriate pricing', async () => {
      const devicePricing = [
        { device: 'iPhone 15 Pro', basePrice: 299.99 },
        { device: 'MacBook Pro 16"', basePrice: 599.99 },
        { device: 'iPad Pro', basePrice: 399.99 },
        { device: 'Samsung Galaxy S24', basePrice: 279.99 }
      ];

      for (const { device, basePrice } of devicePricing) {
        global.TestUtils.mockFetchResponse({
          basePrice,
          urgencyMultiplier: 1.0,
          complexityMultiplier: 1.0,
          totalPrice: basePrice,
          currency: 'GBP'
        });

        const result = await calculatePrice({
          deviceType: device,
          repairType: 'Screen Repair',
          urgencyLevel: 'STANDARD'
        });

        expect(result.basePrice).toBe(basePrice);
        expect(result.totalPrice).toBeValidPrice();
      }
    });

    test('handles API errors gracefully', async () => {
      global.TestUtils.mockFetchResponse(
        { error: 'Device not supported' },
        false,
        400
      );

      await expect(
        calculatePrice({
          deviceType: 'Unknown Device',
          repairType: 'Screen Repair',
          urgencyLevel: 'STANDARD'
        })
      ).rejects.toThrow('Device not supported');
    });

    test('handles network errors', async () => {
      global.TestUtils.mockFetchError('Network error');

      await expect(
        calculatePrice({
          deviceType: 'iPhone 15 Pro',
          repairType: 'Screen Repair',
          urgencyLevel: 'STANDARD'
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getPriceBreakdown', () => {
    test('returns detailed price breakdown', async () => {
      const mockBreakdown = {
        basePrice: 200.00,
        parts: {
          screen: 120.00,
          labor: 80.00
        },
        multipliers: {
          urgency: { factor: 1.2, amount: 40.00 },
          complexity: { factor: 1.1, amount: 20.00 }
        },
        taxes: {
          vat: { rate: 0.20, amount: 52.00 }
        },
        discount: {
          type: 'LOYALTY',
          amount: -25.00
        },
        totalPrice: 287.00,
        currency: 'GBP'
      };

      global.TestUtils.mockFetchResponse(mockBreakdown);

      const result = await getPriceBreakdown('quote-123');

      expect(result.totalPrice).toBeValidPrice();
      expect(result.parts.screen).toBe(120.00);
      expect(result.parts.labor).toBe(80.00);
      expect(result.multipliers.urgency.factor).toBe(1.2);
      expect(result.taxes.vat.rate).toBe(0.20);
      expect(result.discount.amount).toBe(-25.00);

      // Verify calculation
      const expectedTotal = 
        (200.00 * 1.2 * 1.1) + // base * multipliers
        52.00 + // taxes
        (-25.00); // discount
      
      expect(result.totalPrice).toBeCloseTo(expectedTotal, 2);
    });

    test('handles quotes without discounts', async () => {
      const mockBreakdown = {
        basePrice: 150.00,
        parts: { screen: 100.00, labor: 50.00 },
        multipliers: { urgency: { factor: 1.0, amount: 0 } },
        taxes: { vat: { rate: 0.20, amount: 30.00 } },
        totalPrice: 180.00,
        currency: 'GBP'
      };

      global.TestUtils.mockFetchResponse(mockBreakdown);

      const result = await getPriceBreakdown('quote-456');

      expect(result.discount).toBeUndefined();
      expect(result.totalPrice).toBe(180.00);
    });

    test('handles invalid quote IDs', async () => {
      global.TestUtils.mockFetchResponse(
        { error: 'Quote not found' },
        false,
        404
      );

      await expect(
        getPriceBreakdown('invalid-quote')
      ).rejects.toThrow('Quote not found');
    });
  });

  describe('validatePriceQuote', () => {
    test('validates active quote successfully', async () => {
      const mockValidation = {
        isValid: true,
        quoteId: 'quote-789',
        validUntil: '2024-12-31T23:59:59Z',
        priceChanged: false,
        currentPrice: 250.00,
        originalPrice: 250.00,
        currency: 'GBP'
      };

      global.TestUtils.mockFetchResponse(mockValidation);

      const result = await validatePriceQuote('quote-789');

      expect(result.isValid).toBe(true);
      expect(result.priceChanged).toBe(false);
      expect(result.currentPrice).toBe(result.originalPrice);
    });

    test('detects when price has changed', async () => {
      const mockValidation = {
        isValid: true,
        quoteId: 'quote-101',
        validUntil: '2024-12-31T23:59:59Z',
        priceChanged: true,
        currentPrice: 275.00,
        originalPrice: 250.00,
        priceChangeReason: 'Parts cost increase',
        currency: 'GBP'
      };

      global.TestUtils.mockFetchResponse(mockValidation);

      const result = await validatePriceQuote('quote-101');

      expect(result.isValid).toBe(true);
      expect(result.priceChanged).toBe(true);
      expect(result.currentPrice).toBeGreaterThan(result.originalPrice);
      expect(result.priceChangeReason).toBeTruthy();
    });

    test('identifies expired quotes', async () => {
      const mockValidation = {
        isValid: false,
        quoteId: 'quote-expired',
        validUntil: '2024-01-01T00:00:00Z',
        expired: true,
        currentPrice: 250.00,
        originalPrice: 250.00,
        currency: 'GBP'
      };

      global.TestUtils.mockFetchResponse(mockValidation);

      const result = await validatePriceQuote('quote-expired');

      expect(result.isValid).toBe(false);
      expect(result.expired).toBe(true);
    });
  });

  describe('Price Calculation Edge Cases', () => {
    test('handles zero-cost repairs', async () => {
      global.TestUtils.mockFetchResponse({
        basePrice: 0.00,
        urgencyMultiplier: 1.0,
        totalPrice: 0.00,
        currency: 'GBP',
        reason: 'Warranty repair'
      });

      const result = await calculatePrice({
        deviceType: 'iPhone 15 Pro',
        repairType: 'Warranty Replacement',
        urgencyLevel: 'STANDARD',
        warrantyCode: 'WTY-123456'
      });

      expect(result.totalPrice).toBe(0.00);
      expect(result.reason).toBe('Warranty repair');
    });

    test('applies maximum price caps', async () => {
      global.TestUtils.mockFetchResponse({
        basePrice: 2000.00,
        urgencyMultiplier: 2.0,
        totalPrice: 1500.00, // Capped
        currency: 'GBP',
        cappedAt: 1500.00,
        note: 'Price capped at device replacement value'
      });

      const result = await calculatePrice({
        deviceType: 'Old MacBook',
        repairType: 'Logic Board Repair',
        urgencyLevel: 'EMERGENCY'
      });

      expect(result.totalPrice).toBe(1500.00);
      expect(result.cappedAt).toBe(1500.00);
      expect(result.note).toContain('capped');
    });

    test('handles bulk repair discounts', async () => {
      global.TestUtils.mockFetchResponse({
        basePrice: 500.00,
        bulkDiscount: {
          threshold: 3,
          discountPercent: 15,
          discountAmount: 75.00
        },
        totalPrice: 425.00,
        currency: 'GBP'
      });

      const result = await calculatePrice({
        deviceType: 'iPhone 15 Pro',
        repairType: 'Screen Repair',
        urgencyLevel: 'STANDARD',
        quantity: 5
      });

      expect(result.totalPrice).toBe(425.00);
      expect(result.bulkDiscount).toBeTruthy();
      expect(result.bulkDiscount.discountAmount).toBe(75.00);
    });
  });

  describe('Currency and Localization', () => {
    test('handles different currencies', async () => {
      const currencies = ['GBP', 'EUR', 'USD'];
      
      for (const currency of currencies) {
        global.TestUtils.mockFetchResponse({
          basePrice: 200.00,
          totalPrice: 200.00,
          currency
        });

        const result = await calculatePrice({
          deviceType: 'iPhone 15 Pro',
          repairType: 'Screen Repair',
          urgencyLevel: 'STANDARD',
          currency
        });

        expect(result.currency).toBe(currency);
      }
    });

    test('applies regional pricing adjustments', async () => {
      global.TestUtils.mockFetchResponse({
        basePrice: 200.00,
        regionalMultiplier: 1.15,
        totalPrice: 230.00,
        currency: 'GBP',
        region: 'LONDON'
      });

      const result = await calculatePrice({
        deviceType: 'iPhone 15 Pro',
        repairType: 'Screen Repair',
        urgencyLevel: 'STANDARD',
        serviceLocation: 'LONDON'
      });

      expect(result.totalPrice).toBe(230.00);
      expect(result.regionalMultiplier).toBe(1.15);
    });
  });

  describe('Performance and Caching', () => {
    test('caches similar price requests', async () => {
      const priceRequest = {
        deviceType: 'iPhone 15 Pro',
        repairType: 'Screen Repair',
        urgencyLevel: 'STANDARD' as const
      };

      global.TestUtils.mockFetchResponse({
        basePrice: 200.00,
        totalPrice: 200.00,
        currency: 'GBP',
        cached: false
      });

      // First request
      await calculatePrice(priceRequest);

      // Second identical request
      global.TestUtils.mockFetchResponse({
        basePrice: 200.00,
        totalPrice: 200.00,
        currency: 'GBP',
        cached: true
      });

      const result = await calculatePrice(priceRequest);

      expect(result.cached).toBe(true);
    });

    test('handles concurrent price requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        deviceType: `Device ${i}`,
        repairType: 'Screen Repair',
        urgencyLevel: 'STANDARD' as const
      }));

      // Mock responses for all requests
      requests.forEach((_, i) => {
        global.TestUtils.mockFetchResponse({
          basePrice: 100.00 + i * 50,
          totalPrice: 100.00 + i * 50,
          currency: 'GBP'
        });
      });

      const results = await Promise.all(
        requests.map(req => calculatePrice(req))
      );

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.basePrice).toBe(100.00 + i * 50);
      });
    });
  });
});