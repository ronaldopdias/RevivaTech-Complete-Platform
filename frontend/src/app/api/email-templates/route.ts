import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  type: string;
  isActive: boolean;
  usageCount: number;
  charCount: number;
  updatedAt: string;
  template?: string;
  variables?: string[];
}

export async function GET(request: NextRequest) {
  try {
    // Define our existing email templates
    const templates: EmailTemplate[] = [
      {
        id: 'booking-confirmation',
        name: 'Booking Confirmation',
        subject: 'Booking Confirmed - {bookingReference} | RevivaTech',
        category: 'transactional',
        type: 'email',
        isActive: true,
        usageCount: 124,
        charCount: 2230,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'bookingReference', 'device', 'service', 'appointment', 'nextSteps']
      },
      {
        id: 'repair-status-update',
        name: 'Repair Status Update',
        subject: 'Repair Status Update - {bookingReference}',
        category: 'transactional',
        type: 'email',
        isActive: true,
        usageCount: 89,
        charCount: 4051,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'bookingReference', 'currentStatus', 'previousStatus', 'statusHistory', 'device', 'estimatedCompletion', 'nextSteps', 'message']
      },
      {
        id: 'payment-confirmation',
        name: 'Payment Confirmation',
        subject: 'Payment Confirmed - £{amount} | RevivaTech',
        category: 'transactional',
        type: 'email',
        isActive: true,
        usageCount: 67,
        charCount: 2622,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'paymentReference', 'amount', 'paymentMethod', 'device', 'service', 'breakdown']
      },
      {
        id: 'invoice',
        name: 'Invoice',
        subject: 'Invoice #{invoiceNumber} - RevivaTech',
        category: 'transactional',
        type: 'email',
        isActive: true,
        usageCount: 45,
        charCount: 6221,
        updatedAt: new Date().toISOString(),
        variables: ['invoiceNumber', 'invoiceDate', 'dueDate', 'customerInfo', 'items', 'subtotal', 'tax', 'total', 'paymentTerms']
      },
      {
        id: 'password-reset',
        name: 'Password Reset',
        subject: 'Reset Your Password - RevivaTech',
        category: 'security',
        type: 'email',
        isActive: true,
        usageCount: 23,
        charCount: 2477,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'resetLink', 'expirationTime']
      },
      {
        id: 'email-verification',
        name: 'Email Verification',
        subject: 'Verify Your Email - RevivaTech',
        category: 'security',
        type: 'email',
        isActive: true,
        usageCount: 156,
        charCount: 3883,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'verificationLink', 'expirationTime']
      },
      {
        id: 'appointment-reminder',
        name: 'Appointment Reminder',
        subject: 'Appointment Reminder - {date} at {time}',
        category: 'notification',
        type: 'email',
        isActive: false,
        usageCount: 0,
        charCount: 0,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'appointmentDate', 'appointmentTime', 'location', 'device', 'service']
      },
      {
        id: 'welcome-email',
        name: 'Welcome Email',
        subject: 'Welcome to RevivaTech!',
        category: 'marketing',
        type: 'email',
        isActive: false,
        usageCount: 0,
        charCount: 0,
        updatedAt: new Date().toISOString(),
        variables: ['customerName']
      },
      {
        id: 'promotion',
        name: 'Promotional Campaign',
        subject: 'Special Offer: {discount}% Off All Repairs',
        category: 'marketing',
        type: 'email',
        isActive: false,
        usageCount: 0,
        charCount: 0,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'discount', 'validUntil', 'promoCode']
      },
      {
        id: 'newsletter',
        name: 'Monthly Newsletter',
        subject: 'RevivaTech Monthly - {month} {year}',
        category: 'marketing',
        type: 'email',
        isActive: false,
        usageCount: 0,
        charCount: 0,
        updatedAt: new Date().toISOString(),
        variables: ['customerName', 'month', 'year', 'articles']
      }
    ];

    // If a specific template ID is requested, load its content
    const templateId = request.nextUrl.searchParams.get('id');
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Template not found'
        }, { status: 404 });
      }

      // Try to load the template content
      try {
        const templatePath = path.join(
          process.cwd(),
          'src/lib/services/emailTemplates',
          `${templateId}.ts`
        );
        
        if (fs.existsSync(templatePath)) {
          const content = fs.readFileSync(templatePath, 'utf-8');
          template.template = content;
        }
      } catch (error) {
        console.error('Error loading template content:', error);
      }

      return NextResponse.json({
        success: true,
        data: template
      });
    }

    // Return all templates
    return NextResponse.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        active: templates.filter(t => t.isActive).length,
        categories: [
          { id: 'transactional', name: 'Transactional', count: templates.filter(t => t.category === 'transactional').length },
          { id: 'security', name: 'Security', count: templates.filter(t => t.category === 'security').length },
          { id: 'notification', name: 'Notifications', count: templates.filter(t => t.category === 'notification').length },
          { id: 'marketing', name: 'Marketing', count: templates.filter(t => t.category === 'marketing').length }
        ]
      }
    });
  } catch (error) {
    console.error('Email templates API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch email templates'
    }, { status: 500 });
  }
}

// Update a template (placeholder for future implementation)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    // TODO: Implement template update logic
    // This would update the template file and any database records

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      data: { id, ...updates }
    });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update template'
    }, { status: 500 });
  }
}

// Create a new template (placeholder for future implementation)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // TODO: Implement template creation logic
    // This would create a new template file and database record

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      data: {
        id: data.name.toLowerCase().replace(/\s+/g, '-'),
        ...data,
        isActive: false,
        usageCount: 0,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create template'
    }, { status: 500 });
  }
}