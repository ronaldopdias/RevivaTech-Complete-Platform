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
const paymentIntentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive().max(50000), // Max £500 for security
  currency: z.string().length(3).default('gbp'),
  metadata: z.object({
    deviceModel: z.string().optional(),
    repairType: z.string().optional(),
    customerEmail: z.string().email().optional(),
  }).optional(),
});

// POST /api/payments/stripe/payment-intent
export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validation = paymentIntentSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { bookingId, amount, currency, metadata } = validation.data;

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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId,
        customerEmail: booking.customer.email,
        deviceModel: `${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
        repairType: booking.repairType,
        environment: process.env.NODE_ENV || 'development',
        ...metadata,
      },
      description: `${booking.repairType} for ${booking.deviceModel.brand.name} ${booking.deviceModel.name}`,
      receipt_email: booking.customer.email,
    });

    // Store payment record in database
    await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount,
        currency,
        paymentMethod: 'STRIPE_CARD',
        status: 'PENDING',
        gatewayTransactionId: paymentIntent.id,
      },
      update: {
        amount,
        gatewayTransactionId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      metadata: {
        bookingId,
        repairType: booking.repairType,
        deviceName: `${booking.deviceModel.brand.name} ${booking.deviceModel.name}`
      }
    });

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment service error',
          code: error.code,
          message: error.message 
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

// GET /api/payments/stripe/payment-intent?payment_intent_id=pi_xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

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

    // Get local payment record
    const localPayment = await prisma.payment.findUnique({
      where: { gatewayTransactionId: paymentIntentId },
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
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      },
      localPayment: localPayment || null
    });

  } catch (error) {
    console.error('Payment intent retrieval failed:', error);
    
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