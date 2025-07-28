/**
 * Integration Tests for Booking Flow API
 * Tests complete booking flow from device selection to payment confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { createMocks } from 'node-mocks-http';

// Mock Prisma client
jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    device: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    repairType: {
      findMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock Next.js server functions
global.fetch = jest.fn();

describe('Booking Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Device Selection API', () => {
    test('GET /api/devices - returns device catalog', async () => {
      const mockDevices = [
        {
          id: 1,
          name: 'iPhone 15 Pro',
          category: 'smartphone',
          brand: 'Apple',
          model: 'iPhone 15 Pro',
          year: 2023,
          specifications: {
            screenSize: '6.1"',
            storage: ['128GB', '256GB', '512GB', '1TB'],
            colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium']
          },
          repairTypes: ['Screen Repair', 'Battery Replacement', 'Camera Repair'],
          imageUrl: '/images/devices/iphone-15-pro.jpg',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'MacBook Pro 16" M4',
          category: 'laptop',
          brand: 'Apple',
          model: 'MacBook Pro 16"',
          year: 2024,
          specifications: {
            screenSize: '16"',
            processor: 'M4',
            ram: ['16GB', '32GB', '64GB', '128GB'],
            storage: ['512GB', '1TB', '2TB', '4TB', '8TB']
          },
          repairTypes: ['Screen Repair', 'Keyboard Repair', 'Logic Board Repair', 'Battery Replacement'],
          imageUrl: '/images/devices/macbook-pro-16-m4.jpg',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (prisma.device.findMany as jest.Mock).mockResolvedValue(mockDevices);

      const response = await fetch('/api/devices');
      const data = await response.json();

      expect(prisma.device.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          repairTypes: true,
          pricingRules: true
        },
        orderBy: [{ brand: 'asc' }, { name: 'asc' }]
      });
      expect(data.success).toBe(true);
      expect(data.devices).toEqual(mockDevices);
      expect(data.total).toBe(2);
    });

    test('GET /api/devices/:id - returns specific device', async () => {
      const mockDevice = {
        id: 1,
        name: 'iPhone 15 Pro',
        category: 'smartphone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        year: 2023,
        specifications: {
          screenSize: '6.1"',
          storage: ['128GB', '256GB', '512GB', '1TB']
        },
        repairTypes: [
          { id: 1, name: 'Screen Repair', category: 'HARDWARE', estimatedTime: 60 },
          { id: 2, name: 'Battery Replacement', category: 'HARDWARE', estimatedTime: 45 }
        ],
        pricingRules: [
          { id: 1, repairTypeId: 1, basePrice: 299.99, urgencyMultiplier: 1.5 },
          { id: 2, repairTypeId: 2, basePrice: 149.99, urgencyMultiplier: 1.3 }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.device.findUnique as jest.Mock).mockResolvedValue(mockDevice);

      const response = await fetch('/api/devices/1');
      const data = await response.json();

      expect(prisma.device.findUnique).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
        include: {
          repairTypes: true,
          pricingRules: true
        }
      });
      expect(data.success).toBe(true);
      expect(data.device).toEqual(mockDevice);
    });

    test('GET /api/devices/:id - returns 404 for non-existent device', async () => {
      (prisma.device.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await fetch('/api/devices/999');
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Device not found');
    });
  });

  describe('Pricing Calculation API', () => {
    test('POST /api/pricing/calculate - calculates repair price', async () => {
      const mockPricingData = {
        deviceId: 1,
        repairTypeId: 1,
        serviceLevel: 'STANDARD',
        urgency: 'NORMAL',
        marketFactors: {
          demandMultiplier: 1.1,
          seasonalityMultiplier: 1.0,
          competitionMultiplier: 0.95
        }
      };

      const mockDevice = {
        id: 1,
        name: 'iPhone 15 Pro',
        pricingRules: [
          { id: 1, repairTypeId: 1, basePrice: 299.99, urgencyMultiplier: 1.5 }
        ]
      };

      const mockRepairType = {
        id: 1,
        name: 'Screen Repair',
        category: 'HARDWARE',
        estimatedTime: 60
      };

      (prisma.device.findUnique as jest.Mock).mockResolvedValue(mockDevice);
      (prisma.repairType.findUnique as jest.Mock).mockResolvedValue(mockRepairType);

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPricingData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.pricing).toEqual({
        basePrice: 299.99,
        adjustedPrice: expect.any(Number),
        totalPrice: expect.any(Number),
        breakdown: {
          basePrice: 299.99,
          urgencyMultiplier: 1.0, // NORMAL urgency
          demandAdjustment: expect.any(Number),
          seasonalAdjustment: expect.any(Number),
          competitionAdjustment: expect.any(Number)
        },
        currency: 'GBP',
        estimatedTime: 60,
        validUntil: expect.any(String)
      });
    });

    test('POST /api/pricing/calculate - handles urgent repairs', async () => {
      const mockPricingData = {
        deviceId: 1,
        repairTypeId: 1,
        serviceLevel: 'URGENT',
        urgency: 'URGENT'
      };

      const mockDevice = {
        id: 1,
        name: 'iPhone 15 Pro',
        pricingRules: [
          { id: 1, repairTypeId: 1, basePrice: 299.99, urgencyMultiplier: 1.5 }
        ]
      };

      (prisma.device.findUnique as jest.Mock).mockResolvedValue(mockDevice);
      (prisma.repairType.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Screen Repair',
        estimatedTime: 60
      });

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockPricingData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.pricing.breakdown.urgencyMultiplier).toBe(1.5);
      expect(data.pricing.totalPrice).toBeGreaterThan(299.99);
    });

    test('POST /api/pricing/calculate - validates required fields', async () => {
      const invalidData = {
        deviceId: 1,
        // Missing repairTypeId
        serviceLevel: 'STANDARD'
      };

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('repairTypeId');
    });
  });

  describe('Booking Creation API', () => {
    test('POST /api/bookings - creates new booking', async () => {
      const mockBookingData = {
        deviceId: 1,
        repairTypeId: 1,
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+44123456789',
          address: '123 Test Street, London, UK'
        },
        issueDescription: 'Screen is cracked and not responding to touch',
        serviceLevel: 'STANDARD',
        urgency: 'NORMAL',
        estimatedPrice: 299.99,
        serviceType: 'PICKUP',
        images: ['image1.jpg', 'image2.jpg']
      };

      const mockUser = {
        id: 'user-123',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+44123456789',
        address: '123 Test Street, London, UK'
      };

      const mockBooking = {
        id: 'booking-456',
        reference: 'REV-1234567890',
        deviceId: 1,
        repairTypeId: 1,
        customerId: 'user-123',
        issueDescription: 'Screen is cracked and not responding to touch',
        serviceLevel: 'STANDARD',
        urgency: 'NORMAL',
        estimatedPrice: 299.99,
        status: 'PENDING',
        serviceType: 'PICKUP',
        images: ['image1.jpg', 'image2.jpg'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          booking: { create: jest.fn().mockResolvedValue(mockBooking) }
        });
      });

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockBookingData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.booking.reference).toMatch(/^REV-\d{10}$/);
      expect(data.booking.status).toBe('PENDING');
      expect(data.booking.customerId).toBe('user-123');
      expect(data.user).toEqual(mockUser);
    });

    test('POST /api/bookings - handles existing user', async () => {
      const mockBookingData = {
        deviceId: 1,
        repairTypeId: 1,
        customerInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com',
          phone: '+44123456789'
        },
        issueDescription: 'Battery draining quickly',
        serviceLevel: 'HIGH',
        estimatedPrice: 149.99
      };

      const mockExistingUser = {
        id: 'existing-user-123',
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockBooking = {
        id: 'booking-789',
        reference: 'REV-9876543210',
        customerId: 'existing-user-123',
        status: 'PENDING',
        estimatedPrice: 149.99
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser);
      (prisma.booking.create as jest.Mock).mockResolvedValue(mockBooking);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockBookingData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.booking.customerId).toBe('existing-user-123');
      expect(data.user).toEqual(mockExistingUser);
    });

    test('POST /api/bookings - validates required fields', async () => {
      const invalidData = {
        deviceId: 1,
        // Missing repairTypeId and customerInfo
        issueDescription: 'Test issue'
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('Booking Status API', () => {
    test('GET /api/bookings/:id - returns booking details', async () => {
      const mockBooking = {
        id: 'booking-123',
        reference: 'REV-1234567890',
        status: 'IN_PROGRESS',
        device: {
          id: 1,
          name: 'iPhone 15 Pro',
          model: 'iPhone 15 Pro'
        },
        repairType: {
          id: 1,
          name: 'Screen Repair',
          estimatedTime: 60
        },
        customer: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        },
        statusHistory: [
          { status: 'PENDING', timestamp: new Date('2024-01-01T10:00:00Z') },
          { status: 'CONFIRMED', timestamp: new Date('2024-01-01T11:00:00Z') },
          { status: 'IN_PROGRESS', timestamp: new Date('2024-01-01T12:00:00Z') }
        ],
        estimatedPrice: 299.99,
        actualPrice: null,
        estimatedCompletion: new Date('2024-01-02T14:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      const response = await fetch('/api/bookings/booking-123');
      const data = await response.json();

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        include: {
          device: true,
          repairType: true,
          customer: true,
          statusHistory: true,
          payments: true,
          images: true
        }
      });
      expect(data.success).toBe(true);
      expect(data.booking).toEqual(mockBooking);
    });

    test('PATCH /api/bookings/:id - updates booking status', async () => {
      const statusUpdate = {
        status: 'COMPLETED',
        actualPrice: 299.99,
        technicianNotes: 'Screen replacement completed successfully',
        completedAt: new Date().toISOString()
      };

      const mockUpdatedBooking = {
        id: 'booking-123',
        reference: 'REV-1234567890',
        status: 'COMPLETED',
        actualPrice: 299.99,
        technicianNotes: 'Screen replacement completed successfully',
        completedAt: new Date()
      };

      (prisma.booking.update as jest.Mock).mockResolvedValue(mockUpdatedBooking);

      const response = await fetch('/api/bookings/booking-123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusUpdate)
      });
      const data = await response.json();

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'COMPLETED',
          actualPrice: 299.99,
          technicianNotes: 'Screen replacement completed successfully',
          completedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        include: {
          device: true,
          repairType: true,
          customer: true,
          statusHistory: true
        }
      });
      expect(data.success).toBe(true);
      expect(data.booking.status).toBe('COMPLETED');
    });
  });

  describe('Payment Integration API', () => {
    test('POST /api/payments/stripe/payment-intent - creates payment intent', async () => {
      const paymentData = {
        bookingId: 'booking-123',
        amount: 29999, // £299.99 in pence
        currency: 'gbp',
        paymentMethodId: 'pm_test_card'
      };

      const mockBooking = {
        id: 'booking-123',
        reference: 'REV-1234567890',
        estimatedPrice: 299.99,
        status: 'CONFIRMED',
        customer: {
          id: 'user-123',
          email: 'john.doe@example.com'
        }
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 29999,
        currency: 'gbp',
        status: 'succeeded',
        client_secret: 'pi_test_123_secret'
      };

      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPaymentIntent
      });

      const response = await fetch('/api/payments/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.paymentIntent.id).toBe('pi_test_123');
      expect(data.paymentIntent.amount).toBe(29999);
      expect(data.paymentIntent.currency).toBe('gbp');
    });

    test('POST /api/payments/stripe/confirm - confirms payment', async () => {
      const confirmationData = {
        bookingId: 'booking-123',
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_card'
      };

      const mockPayment = {
        id: 'payment-456',
        bookingId: 'booking-123',
        amount: 299.99,
        currency: 'GBP',
        status: 'COMPLETED',
        stripePaymentIntentId: 'pi_test_123',
        paymentMethod: 'STRIPE_CARD',
        createdAt: new Date()
      };

      (prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.booking.update as jest.Mock).mockResolvedValue({
        id: 'booking-123',
        status: 'CONFIRMED',
        paidAt: new Date()
      });

      const response = await fetch('/api/payments/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmationData)
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.payment.status).toBe('COMPLETED');
      expect(data.booking.status).toBe('CONFIRMED');
    });
  });

  describe('Error Handling', () => {
    test('handles database connection errors', async () => {
      (prisma.device.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await fetch('/api/devices');
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    test('handles invalid JSON requests', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json{'
      });
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    test('handles missing required headers', async () => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Content-Type');
    });
  });

  describe('Rate Limiting', () => {
    test('enforces rate limits on booking creation', async () => {
      // Mock multiple rapid requests
      const requests = Array.from({ length: 10 }, () => 
        fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: 1, repairTypeId: 1 })
        })
      );

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map(r => r.json()));

      // Should have at least one rate limited response
      const rateLimitedResponses = results.filter(r => r.error?.includes('rate limit'));
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
