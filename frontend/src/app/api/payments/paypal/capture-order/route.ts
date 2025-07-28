import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema
const captureOrderSchema = z.object({
  orderId: z.string().min(1),
  payerId: z.string().optional(),
  paymentId: z.string().optional(),
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

// POST /api/payments/paypal/capture-order
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
    const validation = captureOrderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { orderId, payerId, paymentId } = validation.data;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${orderId}-capture-${Date.now()}`, // Idempotency key
      },
      body: JSON.stringify({}),
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal capture failed:', errorData);
      
      // Update payment status to failed
      await prisma.payment.updateMany({
        where: { gatewayTransactionId: orderId },
        data: {
          status: 'FAILED',
          paypalMetadata: errorData as any,
        },
      });

      return NextResponse.json(
        { 
          error: 'PayPal capture failed',
          details: errorData 
        },
        { status: 402 }
      );
    }

    const captureData = await captureResponse.json();

    // Update payment record in database
    const payment = await prisma.payment.update({
      where: { gatewayTransactionId: orderId },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
        paypalMetadata: captureData as any,
        gatewayPaymentMethodId: payerId || paymentId,
      },
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

    // Update booking status
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: 'CONFIRMED',
      },
    });

    // Create booking status history
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        status: 'CONFIRMED',
        notes: 'Payment completed successfully via PayPal',
        createdBy: 'system',
      },
    });

    // Generate invoice (placeholder implementation)
    const invoiceNumber = `INV-${Date.now()}-${payment.booking.id.slice(-6).toUpperCase()}`;
    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        description: `${payment.booking.repairType} for ${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
        status: 'SENT',
        sentTo: payment.booking.customer.email,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      captureId: captureData.id,
      status: captureData.status,
      captureData,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        repairType: payment.booking.repairType,
        deviceName: `${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
      },
      invoice: {
        number: invoiceNumber,
        amount: payment.amount / 100,
        currency: payment.currency.toUpperCase(),
      },
    });

  } catch (error) {
    console.error('PayPal capture failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PayPal service error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/paypal/capture-order?order_id=xxx - Get capture status
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

    // Get local payment record
    const payment = await prisma.payment.findUnique({
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
        },
        invoices: true,
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        paypalMetadata: payment.paypalMetadata,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        repairType: payment.booking.repairType,
        deviceName: `${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
        customerEmail: payment.booking.customer.email,
        scheduledDate: payment.booking.scheduledDate,
        estimatedCompletion: payment.booking.estimatedCompletion,
      },
      invoices: payment.invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        pdfUrl: inv.pdfUrl,
        amount: inv.amount / 100,
        currency: inv.currency.toUpperCase(),
      })),
    });

  } catch (error) {
    console.error('PayPal capture status retrieval failed:', error);
    
    return NextResponse.json(
      { 
        error: 'PayPal service error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}