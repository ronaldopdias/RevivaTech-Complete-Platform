import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '../../../../../generated/prisma';
import { emailService } from '@/lib/services/emailService.simple';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// POST /api/payments/stripe/webhooks
export async function POST(request: NextRequest) {
  try {
    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Log webhook event
    await prisma.paymentWebhookEvent.create({
      data: {
        gateway: 'stripe',
        eventType: event.type,
        eventId: event.id,
        payload: event as any,
        processed: false,
      },
    });

    // Process the event
    const processingResult = await processStripeEvent(event);

    if (processingResult.success) {
      // Mark webhook as processed
      await prisma.paymentWebhookEvent.updateMany({
        where: {
          gateway: 'stripe',
          eventId: event.id,
        },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } else {
      // Mark webhook as failed
      await prisma.paymentWebhookEvent.updateMany({
        where: {
          gateway: 'stripe',
          eventId: event.id,
        },
        data: {
          processed: false,
          errorMessage: processingResult.error,
          retryCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      received: true,
      eventType: event.type,
      processed: processingResult.success,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Process different Stripe event types
async function processStripeEvent(event: Stripe.Event): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);

      case 'payment_intent.payment_failed':
        return await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);

      case 'payment_intent.canceled':
        return await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);

      case 'payment_intent.processing':
        return await handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);

      case 'charge.dispute.created':
        return await handleChargeDispute(event.data.object as Stripe.Dispute);

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { success: true }; // Not an error, just unhandled
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment status
    const payment = await prisma.payment.update({
      where: { gatewayTransactionId: paymentIntent.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
        stripeMetadata: paymentIntent as any,
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
        notes: 'Payment completed successfully',
        createdBy: 'system',
      },
    });

    // Generate invoice
    const invoiceNumber = await generateInvoice(payment.id);

    // Send confirmation emails
    if (payment.booking.customer.email) {
      // Send payment confirmation email
      await emailService.queueEmail({
        to: payment.booking.customer.email,
        subject: 'Payment Confirmation - RevivaTech',
        template: 'payment-confirmation',
        data: {
          customerName: payment.booking.customer.name || 'Valued Customer',
          invoiceNumber: invoiceNumber || `INV-${payment.id.slice(-8).toUpperCase()}`,
          paymentMethod: 'Credit/Debit Card',
          paymentDate: new Date().toLocaleDateString('en-GB'),
          amount: payment.amount / 100, // Convert from cents
          bookingReference: payment.booking.reference || payment.booking.id.slice(-8).toUpperCase(),
          items: [{
            description: `${payment.booking.repairType || 'Repair Service'} - ${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
            amount: payment.amount / 100
          }],
          cardLast4: paymentIntent.payment_method_types.includes('card') ? '****' : undefined
        }
      });

      // Send booking confirmation email if this is the first payment
      if (payment.booking.status === 'CONFIRMED') {
        await emailService.queueEmail({
          to: payment.booking.customer.email,
          subject: 'Booking Confirmed - RevivaTech',
          template: 'booking-confirmation',
          data: {
            customerName: payment.booking.customer.name || 'Valued Customer',
            bookingReference: payment.booking.reference || payment.booking.id.slice(-8).toUpperCase(),
            device: {
              brand: payment.booking.deviceModel.brand.name,
              model: payment.booking.deviceModel.name,
              issues: payment.booking.issues || ['General Repair']
            },
            service: {
              type: payment.booking.serviceType || 'Standard Service',
              urgency: payment.booking.urgency || 'standard',
              estimatedCost: payment.amount / 100,
              estimatedDays: 5 // Default estimate
            },
            nextSteps: [
              'Pack your device securely with all accessories',
              'Print and include the booking reference with your device',
              'Ship to our repair center or drop off at our location',
              'Track your repair status online using your booking reference'
            ]
          }
        });
      }
    }

    console.log(`Payment succeeded and emails queued for booking ${payment.bookingId}`);

    return { success: true };
  } catch (error) {
    console.error('Error handling payment success:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  try {
    // Update payment status
    await prisma.payment.update({
      where: { gatewayTransactionId: paymentIntent.id },
      data: {
        status: 'FAILED',
        stripeMetadata: paymentIntent as any,
      },
    });

    // Get booking details for notification
    const payment = await prisma.payment.findUnique({
      where: { gatewayTransactionId: paymentIntent.id },
      include: {
        booking: {
          include: {
            customer: true
          }
        }
      }
    });

    if (payment && payment.booking.customer.email) {
      // Send payment failed notification email
      await emailService.queueEmail({
        to: payment.booking.customer.email,
        subject: 'Payment Failed - Action Required',
        template: 'repair-status-update',
        data: {
          customerName: payment.booking.customer.name || 'Valued Customer',
          bookingReference: payment.booking.reference || payment.booking.id.slice(-8).toUpperCase(),
          device: {
            brand: payment.booking.deviceModel.brand.name,
            model: payment.booking.deviceModel.name
          },
          previousStatus: 'pending-payment',
          newStatus: 'payment-failed',
          statusMessage: 'We were unable to process your payment. Please update your payment information to proceed with your repair.',
          actionRequired: {
            title: 'Update Payment Method',
            description: 'Your payment could not be processed. Please update your payment information to continue with your repair booking.',
            buttonText: 'Update Payment',
            buttonUrl: `https://revivatech.co.uk/booking/payment?ref=${payment.booking.reference || payment.booking.id}`
          }
        }
      });
      
      console.log(`Payment failed email queued for booking ${payment.bookingId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.payment.update({
      where: { gatewayTransactionId: paymentIntent.id },
      data: {
        status: 'CANCELLED',
        stripeMetadata: paymentIntent as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle processing payment
async function handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.payment.update({
      where: { gatewayTransactionId: paymentIntent.id },
      data: {
        status: 'PROCESSING',
        stripeMetadata: paymentIntent as any,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error handling payment processing:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Handle charge dispute
async function handleChargeDispute(dispute: Stripe.Dispute): Promise<{ success: boolean; error?: string }> {
  try {
    // Find payment by charge ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripeMetadata: {
          path: ['latest_charge'],
          equals: dispute.charge,
        },
      },
    });

    if (payment) {
      // Log dispute for manual review
      console.error(`Dispute created for payment ${payment.id}, charge ${dispute.charge}`);
      
      // Could create a dispute record here for tracking
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling charge dispute:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Generate invoice
async function generateInvoice(paymentId: string): Promise<string | null> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
        }
      }
    });

    if (!payment) return null;

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${payment.booking.id.slice(-6).toUpperCase()}`;

    // Create invoice record
    const invoice = await prisma.invoice.create({
      data: {
        paymentId,
        invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        description: `${payment.booking.repairType} for ${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
        status: 'SENT',
        sentTo: payment.booking.customer.email,
        sentAt: new Date(),
      },
    });

    // Send invoice email
    if (payment.booking.customer.email) {
      await emailService.queueEmail({
        to: payment.booking.customer.email,
        subject: `Invoice ${invoiceNumber} - RevivaTech`,
        template: 'invoice',
        data: {
          customerName: payment.booking.customer.name || 'Valued Customer',
          customerEmail: payment.booking.customer.email,
          invoiceNumber,
          invoiceDate: new Date().toLocaleDateString('en-GB'),
          bookingReference: payment.booking.reference || payment.booking.id.slice(-8).toUpperCase(),
          items: [{
            description: `${payment.booking.repairType || 'Repair Service'} - ${payment.booking.deviceModel.brand.name} ${payment.booking.deviceModel.name}`,
            quantity: 1,
            unitPrice: payment.amount / 100,
            total: payment.amount / 100
          }],
          subtotal: payment.amount / 100,
          tax: 0, // VAT calculation can be added later
          taxRate: 20,
          total: payment.amount / 100,
          paymentStatus: 'paid',
          paymentMethod: 'Credit/Debit Card'
        }
      });
    }

    console.log(`Invoice ${invoiceNumber} generated and email queued for payment ${paymentId}`);
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice:', error);
    return null;
  }
}