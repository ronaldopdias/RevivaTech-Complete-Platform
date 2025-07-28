import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

interface PaymentIntentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const {
      amount,
      currency = 'gbp',
      description,
      metadata = {},
      customer
    }: PaymentIntentRequest = req.body;

    // Validate required fields
    if (!amount || amount < 50) { // Stripe minimum is 50p for GBP
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be at least 50p (50 pence)'
      });
    }

    if (!description) {
      return res.status(400).json({
        error: 'Missing description',
        message: 'Payment description is required'
      });
    }

    // Create or retrieve customer if provided
    let customerId: string | undefined;
    if (customer?.email) {
      try {
        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
          email: customer.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        } else {
          // Create new customer
          const newCustomer = await stripe.customers.create({
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            metadata: {
              created_via: 'revivatech_payment_form',
              created_at: new Date().toISOString(),
            },
          });
          customerId = newCustomer.id;
        }
      } catch (customerError) {
        console.warn('Customer creation failed:', customerError);
        // Continue without customer - not critical for payment
      }
    }

    // Enhanced metadata with system information
    const enhancedMetadata = {
      ...metadata,
      system: 'revivatech',
      created_via: 'payment_form',
      created_at: new Date().toISOString(),
      customer_email: customer?.email || 'unknown',
      customer_name: customer?.name || 'unknown',
    };

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      description,
      metadata: enhancedMetadata,
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable common payment method types
      payment_method_types: [
        'card',
        'apple_pay',
        'google_pay',
      ],
      // Setup for future payments if customer provided
      setup_future_usage: customerId ? 'off_session' : undefined,
      // Enhanced receipt email
      receipt_email: customer?.email,
      // Statement descriptor (appears on customer's card statement)
      statement_descriptor: 'REVIVATECH',
      statement_descriptor_suffix: description.substring(0, 22),
      // Shipping (if needed for physical items)
      shipping: customer ? {
        name: customer.name,
        phone: customer.phone,
        address: {
          // These would come from a full address form
          line1: 'TBD',
          city: 'London',
          country: 'GB',
        },
      } : undefined,
    });

    // Log successful creation for monitoring
    console.log(`Payment Intent created: ${paymentIntent.id} for ${amount/100} ${currency.toUpperCase()}`);

    // Return client secret and metadata
    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      customer_id: customerId,
      metadata: {
        description,
        amount_display: `£${(amount / 100).toFixed(2)}`,
        created_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Stripe Payment Intent creation failed:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: error.type,
        message: error.message,
        code: error.code,
        doc_url: error.doc_url,
      });
    }

    // Handle general errors
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create payment intent',
      timestamp: new Date().toISOString(),
    });
  }
}

// Export configuration for API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};