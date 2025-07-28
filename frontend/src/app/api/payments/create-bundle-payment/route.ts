import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-09-30.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'gbp',
      services,
      bundles,
      originalAmount,
      bundleSavings,
      discounts,
      metadata = {}
    } = body;

    // Validate required fields
    if (!amount || amount < 50) { // Minimum 50p
      return NextResponse.json(
        { error: 'Invalid amount. Minimum payment is £0.50' },
        { status: 400 }
      );
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'At least one service must be selected' },
        { status: 400 }
      );
    }

    // Enhanced metadata for bundle payments
    const enhancedMetadata = {
      ...metadata,
      payment_type: 'service_bundle',
      services: services.join(','),
      bundles: bundles ? bundles.join(',') : '',
      original_amount: originalAmount?.toString() || amount.toString(),
      bundle_savings: bundleSavings?.toString() || '0',
      student_discount: discounts?.student ? 'true' : 'false',
      blue_light_discount: discounts?.blueLightCard ? 'true' : 'false',
      created_at: new Date().toISOString()
    };

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: enhancedMetadata,
      description: `RevivaTech Laptop Repair - ${services.length} service${services.length !== 1 ? 's' : ''}${bundles && bundles.length > 0 ? ` (${bundles.length} bundle${bundles.length !== 1 ? 's' : ''})` : ''}`,
      statement_descriptor: 'REVIVATECH REPAIR',
    });

    // Log the bundle payment creation for analytics
    console.log('Bundle payment intent created:', {
      paymentIntentId: paymentIntent.id,
      amount: amount / 100, // Convert back to pounds for logging
      serviceCount: services.length,
      bundleCount: bundles?.length || 0,
      totalSavings: bundleSavings ? bundleSavings / 100 : 0,
      hasStudentDiscount: discounts?.student || false,
      hasBlueLightDiscount: discounts?.blueLightCard || false
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: enhancedMetadata
    });

  } catch (error) {
    console.error('Error creating bundle payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      }
    });

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}