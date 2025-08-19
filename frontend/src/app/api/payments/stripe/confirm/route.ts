import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '../../../../../generated/prisma';
import { z } from 'zod';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Validation schema
const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().startsWith('pi_'),
  paymentMethodId: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

// POST /api/payments/stripe/confirm
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = confirmPaymentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { paymentIntentId, paymentMethodId, returnUrl } = validation.data;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Check if payment needs confirmation
    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        success: true,
        status: 'succeeded',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        message: 'Payment already completed'
      });
    }

    // Confirm payment if it requires confirmation
    if (paymentIntent.status === 'requires_confirmation') {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
        return_url: returnUrl || `${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/booking/success`,
      });

      return NextResponse.json({
        success: true,
        status: confirmedPaymentIntent.status,
        paymentIntent: {
          id: confirmedPaymentIntent.id,
          status: confirmedPaymentIntent.status,
          amount: confirmedPaymentIntent.amount,
          currency: confirmedPaymentIntent.currency,
          client_secret: confirmedPaymentIntent.client_secret,
        },
        requiresAction: confirmedPaymentIntent.status === 'requires_action',
        nextAction: confirmedPaymentIntent.next_action,
      });
    }

    // Handle other statuses
    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
      message: `Payment in status: ${paymentIntent.status}`,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    });

  } catch (error) {
    console.error('Payment confirmation failed:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment service error',
          code: error.code,
          message: error.message,
          type: error.type
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/payments/stripe/confirm?payment_intent=pi_xxx - Check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID required' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Get local payment and booking details
    const localPayment = await prisma.payment.findUnique({
      where: { gatewayTransactionId: paymentIntentId },
      include: {
        booking: {
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
        },
        invoices: true,
      }
    });

    const result = {
      success: paymentIntent.status === 'succeeded',
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
      },
      booking: localPayment ? {
        id: localPayment.booking.id,
        repairType: localPayment.booking.repairType,
        status: localPayment.booking.status,
        deviceName: `${localPayment.booking.deviceModel.brand.name} ${localPayment.booking.deviceModel.name}`,
        customerEmail: localPayment.booking.customer.email,
        scheduledDate: localPayment.booking.scheduledDate,
        estimatedCompletion: localPayment.booking.estimatedCompletion,
      } : null,
      payment: localPayment ? {
        id: localPayment.id,
        status: localPayment.status,
        amount: localPayment.amount,
        currency: localPayment.currency,
        paidAt: localPayment.paidAt,
        invoices: localPayment.invoices.map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          pdfUrl: inv.pdfUrl,
        })),
      } : null,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Payment status retrieval failed:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment service error',
          code: error.code 
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}