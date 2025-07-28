import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Disable body parser for webhook
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      console.error('Missing Stripe signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log(`Received webhook: ${event.type} - ${event.id}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    res.status(200).json({ 
      received: true,
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ 
      error: 'Webhook handler failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  
  try {
    const { metadata } = paymentIntent;
    const amount = paymentIntent.amount / 100; // Convert back to pounds
    
    // Log payment details
    console.log('Payment Details:', {
      id: paymentIntent.id,
      amount: `£${amount.toFixed(2)}`,
      currency: paymentIntent.currency.toUpperCase(),
      customer: paymentIntent.customer,
      description: paymentIntent.description,
      metadata: metadata,
    });

    // Here you would typically:
    // 1. Update your database with payment confirmation
    // 2. Update repair status to "paid"
    // 3. Send confirmation email to customer
    // 4. Trigger any other business logic
    
    // Example: Update repair status in database
    if (metadata.repair_id) {
      await updateRepairPaymentStatus(metadata.repair_id, 'paid', {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paid_at: new Date().toISOString(),
      });
    }

    // Send confirmation email
    if (paymentIntent.receipt_email || metadata.customer_email) {
      await sendPaymentConfirmationEmail({
        email: paymentIntent.receipt_email || metadata.customer_email,
        paymentIntent,
        repairDetails: metadata,
      });
    }

    // Log for analytics
    await logPaymentEvent('payment_succeeded', {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_id: paymentIntent.customer,
      metadata: metadata,
    });

  } catch (error) {
    console.error('Error handling payment success:', error);
    // Don't throw - webhook should still acknowledge receipt
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  
  try {
    const { metadata } = paymentIntent;
    const lastPaymentError = paymentIntent.last_payment_error;
    
    console.log('Payment Failure Details:', {
      id: paymentIntent.id,
      amount: `£${(paymentIntent.amount / 100).toFixed(2)}`,
      error_code: lastPaymentError?.code,
      error_message: lastPaymentError?.message,
      error_type: lastPaymentError?.type,
      metadata: metadata,
    });

    // Update repair status
    if (metadata.repair_id) {
      await updateRepairPaymentStatus(metadata.repair_id, 'payment_failed', {
        payment_intent_id: paymentIntent.id,
        error_code: lastPaymentError?.code,
        error_message: lastPaymentError?.message,
        failed_at: new Date().toISOString(),
      });
    }

    // Send failure notification email
    if (paymentIntent.receipt_email || metadata.customer_email) {
      await sendPaymentFailureEmail({
        email: paymentIntent.receipt_email || metadata.customer_email,
        paymentIntent,
        errorDetails: lastPaymentError,
      });
    }

    // Log for analytics
    await logPaymentEvent('payment_failed', {
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      error_code: lastPaymentError?.code,
      error_message: lastPaymentError?.message,
      metadata: metadata,
    });

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

/**
 * Handle payment requiring additional action (3D Secure, etc.)
 */
async function handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment requires action: ${paymentIntent.id}`);
  
  // Update status to indicate authentication required
  if (paymentIntent.metadata.repair_id) {
    await updateRepairPaymentStatus(paymentIntent.metadata.repair_id, 'authentication_required', {
      payment_intent_id: paymentIntent.id,
      requires_action_at: new Date().toISOString(),
    });
  }
}

/**
 * Handle payment method attached to customer
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`Payment method attached: ${paymentMethod.id} to customer ${paymentMethod.customer}`);
  
  // Store payment method for future use
  // This is useful for subscription billing or repeat customers
}

/**
 * Handle new customer creation
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log(`New customer created: ${customer.id} - ${customer.email}`);
  
  // You might want to sync this with your user database
  // or trigger a welcome email sequence
}

/**
 * Handle invoice payment success
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Invoice payment succeeded: ${invoice.id}`);
  
  // Handle subscription payments or invoice-based billing
}

/**
 * Handle invoice payment failure
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice payment failed: ${invoice.id}`);
  
  // Handle subscription payment failures
  // Might need to suspend service or send dunning emails
}

/**
 * Mock function to update repair payment status
 * Replace with actual database calls
 */
async function updateRepairPaymentStatus(
  repairId: string, 
  status: string, 
  paymentData: Record<string, any>
) {
  console.log(`Updating repair ${repairId} payment status to: ${status}`, paymentData);
  
  // Example implementation:
  // const repair = await prisma.repair.update({
  //   where: { id: repairId },
  //   data: {
  //     payment_status: status,
  //     payment_data: paymentData,
  //     updated_at: new Date(),
  //   },
  // });
}

/**
 * Mock function to send payment confirmation email
 */
async function sendPaymentConfirmationEmail(params: {
  email: string;
  paymentIntent: Stripe.PaymentIntent;
  repairDetails: Record<string, any>;
}) {
  console.log(`Sending payment confirmation email to: ${params.email}`);
  
  // Example implementation:
  // await emailService.send({
  //   to: params.email,
  //   template: 'payment-confirmation',
  //   data: {
  //     amount: `£${(params.paymentIntent.amount / 100).toFixed(2)}`,
  //     transaction_id: params.paymentIntent.id,
  //     repair_details: params.repairDetails,
  //   },
  // });
}

/**
 * Mock function to send payment failure email
 */
async function sendPaymentFailureEmail(params: {
  email: string;
  paymentIntent: Stripe.PaymentIntent;
  errorDetails: Stripe.PaymentIntent.LastPaymentError | null;
}) {
  console.log(`Sending payment failure email to: ${params.email}`);
  
  // Implementation would send failure notification with retry instructions
}

/**
 * Mock function to log payment events for analytics
 */
async function logPaymentEvent(eventType: string, data: Record<string, any>) {
  console.log(`Logging payment event: ${eventType}`, data);
  
  // Example implementation:
  // await analytics.track({
  //   event: eventType,
  //   properties: data,
  //   timestamp: new Date(),
  // });
}