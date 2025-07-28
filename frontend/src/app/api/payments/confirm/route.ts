import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for payment confirmation
const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  provider: z.enum(['stripe', 'paypal']),
  confirmationData: z.record(z.any()).optional()
});

/**
 * POST /api/payments/confirm
 * Unified payment confirmation endpoint that routes to appropriate provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = confirmPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid confirmation request',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { paymentId, provider, confirmationData } = validation.data;

    // Route to appropriate payment provider for confirmation
    let providerResponse;
    
    if (provider === 'stripe') {
      // Confirm Stripe Payment Intent
      const stripeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/payments/stripe/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentId,
          ...confirmationData
        })
      });
      
      providerResponse = await stripeResponse.json();
      
      if (providerResponse.success) {
        const paymentIntent = providerResponse.paymentIntent;
        
        return NextResponse.json({
          success: true,
          provider: 'stripe',
          paymentId: paymentIntent.id,
          transactionId: paymentIntent.charges?.data[0]?.id,
          status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'processing',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          paidAt: paymentIntent.charges?.data[0]?.created 
            ? new Date(paymentIntent.charges.data[0].created * 1000).toISOString()
            : new Date().toISOString(),
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
          metadata: paymentIntent.metadata
        });
      }
      
    } else if (provider === 'paypal') {
      // Capture PayPal Order
      const paypalResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/payments/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentId,
          ...confirmationData
        })
      });
      
      providerResponse = await paypalResponse.json();
      
      if (providerResponse.success) {
        const order = providerResponse.order;
        const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
        
        return NextResponse.json({
          success: true,
          provider: 'paypal',
          paymentId: order.id,
          transactionId: capture?.id,
          status: order.status === 'COMPLETED' ? 'succeeded' : 'processing',
          amount: Math.round(parseFloat(order.purchase_units?.[0]?.amount?.value || '0') * 100),
          currency: order.purchase_units?.[0]?.amount?.currency_code,
          paidAt: new Date().toISOString(),
          receiptUrl: capture?.links?.find((link: any) => link.rel === 'up')?.href,
          metadata: order.custom_id ? { bookingId: order.custom_id } : undefined
        });
      }
    }

    // If we get here, payment confirmation failed
    return NextResponse.json({
      success: false,
      provider,
      error: providerResponse?.error || 'Payment confirmation failed'
    }, { status: 400 });

  } catch (error) {
    console.error('Unified payment confirmation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/payments/confirm
 * Get payment status by ID and provider
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const provider = searchParams.get('provider') as 'stripe' | 'paypal';
    
    if (!paymentId || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Payment ID and provider are required'
      }, { status: 400 });
    }

    // Route to appropriate payment provider for status check
    let statusResponse;
    
    if (provider === 'stripe') {
      // Check Stripe Payment Intent status
      // Note: This would require a dedicated status endpoint for Stripe
      statusResponse = {
        success: true,
        status: 'pending' // Placeholder
      };
      
    } else if (provider === 'paypal') {
      // Check PayPal Order status
      // Note: This would require a dedicated status endpoint for PayPal
      statusResponse = {
        success: true,
        status: 'pending' // Placeholder
      };
    }

    return NextResponse.json({
      success: true,
      paymentId,
      provider,
      status: statusResponse?.status || 'unknown'
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}