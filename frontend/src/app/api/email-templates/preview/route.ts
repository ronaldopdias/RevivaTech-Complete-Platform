import { NextRequest, NextResponse } from 'next/server';

// Import template renderers
import { render as renderBookingConfirmation } from '@/lib/services/emailTemplates/booking-confirmation';
import { render as renderRepairStatusUpdate } from '@/lib/services/emailTemplates/repair-status-update';
import { render as renderPaymentConfirmation } from '@/lib/services/emailTemplates/payment-confirmation';
import { render as renderInvoice } from '@/lib/services/emailTemplates/invoice';
import { render as renderPasswordReset } from '@/lib/services/emailTemplates/password-reset';
import { render as renderEmailVerification } from '@/lib/services/emailTemplates/email-verification';

// Sample data for previewing templates
const sampleData: Record<string, any> = {
  'booking-confirmation': {
    customerName: 'John Doe',
    bookingReference: 'REV-2025-001234',
    device: {
      brand: 'Apple',
      model: 'iPhone 14 Pro',
      issues: ['Cracked Screen', 'Battery Drain']
    },
    service: {
      type: 'Screen Replacement',
      urgency: 'Standard',
      estimatedCost: 149.99,
      estimatedDays: 2
    },
    appointment: {
      date: 'February 1, 2025',
      time: '2:00 PM',
      type: 'Drop-off'
    },
    nextSteps: [
      'Bring your device to our store at the scheduled time',
      'Our technician will assess the device and confirm the repair cost',
      'You\'ll receive SMS updates throughout the repair process',
      'Pick up your device once the repair is complete'
    ]
  },
  'repair-status-update': {
    customerName: 'Jane Smith',
    bookingReference: 'REV-2025-001235',
    currentStatus: {
      status: 'In Progress',
      timestamp: new Date().toISOString(),
      message: 'Our technician is currently working on your device'
    },
    previousStatus: {
      status: 'Diagnostics Complete',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      message: 'Issue confirmed, parts ordered'
    },
    statusHistory: [
      {
        status: 'Received',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        message: 'Device received at repair center'
      },
      {
        status: 'Diagnostics Complete',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        message: 'Issue confirmed, parts ordered'
      }
    ],
    device: {
      brand: 'Samsung',
      model: 'Galaxy S23',
      serialNumber: 'XXXX1234'
    },
    estimatedCompletion: '2 days',
    message: 'Your screen replacement is progressing well. The new display has been installed and we\'re currently running quality tests.',
    nextSteps: 'We\'ll notify you once the repair is complete and ready for collection.'
  },
  'payment-confirmation': {
    customerName: 'Mike Johnson',
    paymentReference: 'PAY-2025-567890',
    amount: 149.99,
    paymentMethod: {
      type: 'Credit Card',
      last4: '4242'
    },
    device: {
      brand: 'Apple',
      model: 'MacBook Pro 14"'
    },
    service: {
      type: 'Battery Replacement',
      warranty: '90 days'
    },
    breakdown: [
      { item: 'Battery Replacement', price: 129.99 },
      { item: 'Labor', price: 20.00 }
    ]
  },
  'invoice': {
    invoiceNumber: 'INV-2025-001',
    invoiceDate: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 2592000000).toLocaleDateString(), // 30 days
    customerInfo: {
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+44 7700 900123',
      address: '123 High Street, London, SW1A 1AA'
    },
    items: [
      {
        description: 'iPhone 14 Screen Replacement',
        quantity: 1,
        unitPrice: 149.99,
        total: 149.99
      },
      {
        description: 'Protective Case',
        quantity: 1,
        unitPrice: 29.99,
        total: 29.99
      }
    ],
    subtotal: 179.98,
    tax: 36.00,
    total: 215.98,
    paymentTerms: 'Payment due within 30 days'
  },
  'password-reset': {
    customerName: 'David Brown',
    resetLink: 'https://revivatech.co.uk/auth/reset-password?token=sample-token-123',
    expirationTime: '24 hours'
  },
  'email-verification': {
    customerName: 'Emma Davis',
    verificationLink: 'https://revivatech.co.uk/auth/verify-email?token=verify-token-456',
    expirationTime: '48 hours'
  }
};

export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json({
        success: false,
        error: 'Template ID is required'
      }, { status: 400 });
    }

    let html = '';
    const data = sampleData[templateId];

    if (!data) {
      // Return a placeholder for templates without sample data
      html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #666;">
          <h2>Template Preview Not Available</h2>
          <p>This template is planned for future implementation.</p>
          <p style="margin-top: 20px; font-size: 14px;">Template ID: ${templateId}</p>
        </div>
      `;
    } else {
      // Render the appropriate template
      switch (templateId) {
        case 'booking-confirmation':
          html = renderBookingConfirmation(data);
          break;
        case 'repair-status-update':
          html = renderRepairStatusUpdate(data);
          break;
        case 'payment-confirmation':
          html = renderPaymentConfirmation(data);
          break;
        case 'invoice':
          html = renderInvoice(data);
          break;
        case 'password-reset':
          html = renderPasswordReset(data);
          break;
        case 'email-verification':
          html = renderEmailVerification(data);
          break;
        default:
          html = `
            <div style="font-family: Arial, sans-serif; padding: 40px; text-align: center; color: #666;">
              <h2>Template Not Found</h2>
              <p>The requested template could not be rendered.</p>
            </div>
          `;
      }
    }

    // Return the HTML with proper headers for iframe display
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN', // Allow iframe from same origin
      }
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate template preview'
    }, { status: 500 });
  }
}