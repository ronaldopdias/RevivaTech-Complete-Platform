import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for unified payment creation
const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive').max(50000, 'Amount too large'),
  currency: z.enum(['GBP', 'USD', 'EUR']).default('GBP'),
  provider: z.enum(['stripe', 'paypal']).optional(),
  description: z.string().optional(),
  customerInfo: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * POST /api/payments/create
 * Unified payment creation endpoint that routes to appropriate provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment request',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { 
      bookingId, 
      amount, 
      currency, 
      provider, 
      description,
      customerInfo,
      metadata 
    } = validation.data;

    // Determine payment provider
    let selectedProvider = provider;
    
    if (!selectedProvider) {
      // Auto-select provider based on availability and preferences
      const stripeAvailable = !!process.env.STRIPE_SECRET_KEY;
      const paypalAvailable = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
      
      if (stripeAvailable) {
        selectedProvider = 'stripe'; // Prefer Stripe for better UX
      } else if (paypalAvailable) {
        selectedProvider = 'paypal';
      } else {
        return NextResponse.json({
          success: false,
          error: 'No payment providers configured',
          availableProviders: []
        }, { status: 503 });
      }
    }

    // Route to appropriate payment provider
    let providerResponse;
    
    if (selectedProvider === 'stripe') {
      // Create Stripe Payment Intent
      const stripeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/payments/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency: currency.toLowerCase(),
          metadata: {
            ...metadata,
            description,
            customerEmail: customerInfo?.email,
            customerName: customerInfo?.name,
            customerPhone: customerInfo?.phone
          }
        })
      });
      
      providerResponse = await stripeResponse.json();
      
      if (providerResponse.success) {
        return NextResponse.json({
          success: true,
          provider: 'stripe',
          paymentId: providerResponse.paymentIntent.id,
          clientSecret: providerResponse.paymentIntent.client_secret,
          status: 'pending',
          metadata: providerResponse.paymentIntent.metadata,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        });
      }
      
    } else if (selectedProvider === 'paypal') {
      // Create PayPal Order
      const paypalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/payments/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
          currency,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/payment/success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/payment/cancel`
        })
      });
      
      providerResponse = await paypalResponse.json();
      
      if (providerResponse.success) {
        return NextResponse.json({
          success: true,
          provider: 'paypal',
          paymentId: providerResponse.orderId,
          approvalUrl: providerResponse.approvalUrl,
          status: 'pending',
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
        });
      }
    }

    // If we get here, payment creation failed
    return NextResponse.json({
      success: false,
      provider: selectedProvider,
      error: providerResponse?.error || 'Payment creation failed'
    }, { status: 400 });

  } catch (error) {
    console.error('Unified payment creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/payments/create
 * Get available payment providers and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const stripeAvailable = !!process.env.STRIPE_SECRET_KEY;
    const paypalAvailable = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
    
    const providers = [];
    
    if (stripeAvailable) {
      providers.push({
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your credit or debit card',
        icon: 'credit-card',
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        testMode: process.env.NODE_ENV !== 'production'
      });
    }
    
    if (paypalAvailable) {
      providers.push({
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        testMode: process.env.NODE_ENV !== 'production'
      });
    }
    
    return NextResponse.json({
      success: true,
      providers,
      defaultProvider: providers.length > 0 ? providers[0].id : null,
      supportedCurrencies: ['GBP', 'USD', 'EUR'],
      maxAmount: 50000, // £500 in pence
      testMode: process.env.NODE_ENV !== 'production'
    });
    
  } catch (error) {
    console.error('Payment providers configuration error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get payment configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}