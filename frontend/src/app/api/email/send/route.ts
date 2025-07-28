import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import type { EmailTemplate } from '@/lib/services/emailService';

// POST /api/email/send
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.to || !body.subject || !body.template || !body.data) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, template, data' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate template
    const validTemplates: EmailTemplate[] = [
      'booking-confirmation',
      'payment-confirmation',
      'repair-status-update',
      'password-reset',
      'invoice'
    ];
    
    if (!validTemplates.includes(body.template)) {
      return NextResponse.json(
        { error: 'Invalid email template' },
        { status: 400 }
      );
    }

    // Queue email for sending
    const emailId = await emailService.queueEmail({
      to: body.to,
      subject: body.subject,
      template: body.template,
      data: body.data
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Email queued for delivery'
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to queue email' },
      { status: 500 }
    );
  }
}

// GET /api/email/send - Get email queue status
export async function GET(request: NextRequest) {
  try {
    const status = emailService.getQueueStatus();
    
    return NextResponse.json({
      success: true,
      queue: status
    });
    
  } catch (error) {
    console.error('Email status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get email queue status' },
      { status: 500 }
    );
  }
}