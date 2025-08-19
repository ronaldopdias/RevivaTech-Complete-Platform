import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const createOrderSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive().max(50000), // Max £500 for security
  currency: z.string().length(3).default('GBP'),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// POST /api/payments/paypal/create-order
export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { bookingId, amount, currency, returnUrl, cancelUrl } = validation.data;

    // Verify booking exists and get details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify amount matches booking
    const bookingAmount = Number(booking.finalPrice) * 100; // Convert to pence
    if (Math.abs(amount - bookingAmount) > 1) { // Allow 1p variance for rounding
      return NextResponse.json(
        { error: 'Amount mismatch with booking' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: bookingId,
        amount: {
          currency_code: currency,
          value: (amount / 100).toFixed(2), // Convert pence to pounds
        },
        description: `${booking.repairType} for ${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
        custom_id: bookingId,
        invoice_id: `${bookingId}-${Date.now()}`,
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'RevivaTech',
            locale: 'en-GB',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: returnUrl || `${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/booking/success`,
            cancel_url: cancelUrl || `${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/booking/cancel`,
          },
        },
      },
      application_context: {
        brand_name: 'RevivaTech Computer Repair',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: returnUrl || `${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/booking/success`,
        cancel_url: cancelUrl || `${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/booking/cancel`,
      },
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${bookingId}-${Date.now()}`, // Idempotency key
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal order creation failed:', errorData);
      return NextResponse.json(
        { 
          error: 'PayPal order creation failed',
          details: errorData 
        },
        { status: 402 }
      );
    }

    const order = await orderResponse.json();

    // Store payment record in database
    await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount,
        currency: currency.toLowerCase(),
        paymentMethod: 'PAYPAL',
        status: 'PENDING',
        gatewayTransactionId: order.id,
        paypalMetadata: order as any,
      },
      update: {
        amount,
        gatewayTransactionId: order.id,
        status: 'PENDING',
        paypalMetadata: order as any,
      },
    });

    // Extract approval URL for frontend redirect
    const approvalUrl = order.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl,
      order,
      metadata: {
        bookingId,
        repairType: booking.repairType,
        deviceName: `${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
        amount: amount / 100,
        currency,
      }
    });

  } catch (error) {
    console.error('PayPal order creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PayPal service error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/paypal/create-order?order_id=xxx - Get order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      );
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal not configured' },
        { status: 503 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get order details from PayPal
    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      return NextResponse.json(
        { 
          error: 'PayPal order retrieval failed',
          details: errorData 
        },
        { status: 402 }
      );
    }

    const order = await orderResponse.json();

    // Get local payment record
    const localPayment = await prisma.payment.findUnique({
      where: { gatewayTransactionId: orderId },
      include: {
        booking: {
          include: {
            customer: true,
            deviceModel: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      order,
      localPayment: localPayment || null,
    });

  } catch (error) {
    console.error('PayPal order retrieval failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PayPal service error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}