import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

// POST /api/notifications/email/payment-receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['to', 'paymentData'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate payment data structure
    const { paymentData } = body;
    if (!paymentData.customerName || !paymentData.paymentReference || !paymentData.amount) {
      return NextResponse.json(
        { error: 'Invalid payment data structure' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending payment receipt email to: ${body.to} for payment: ${paymentData.paymentReference}`);

    // Queue email for sending
    const emailId = await emailService.queueEmail({
      to: body.to,
      subject: `Payment Confirmation - ${paymentData.paymentReference}`,
      template: 'payment-confirmation',
      data: paymentData
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Payment receipt email queued for delivery',
      paymentReference: paymentData.paymentReference
    });

  } catch (error) {
    console.error('Payment receipt email API error:', error);
    return NextResponse.json(
      { error: 'Failed to queue payment receipt email' },
      { status: 500 }
    );
  }
}

// Example of expected request body:
/*
{
  "to": "customer@example.com",
  "paymentData": {
    "customerName": "John Smith",
    "paymentReference": "PAY-2025-001234",
    "bookingReference": "RT-2025-001234",
    "amount": 449.99,
    "currency": "GBP",
    "method": "Credit Card",
    "transactionId": "stripe_1234567890",
    "date": "2025-07-15T14:30:00Z",
    "service": {
      "description": "Screen Replacement + Battery Replacement",
      "device": "Apple MacBook Pro 2023"
    },
    "invoice": {
      "number": "INV-2025-001234",
      "dueDate": null,
      "paidDate": "2025-07-15T14:30:00Z"
    }
  }
}
*/