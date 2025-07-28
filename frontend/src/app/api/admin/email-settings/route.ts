import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'resend';
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
}

// GET /api/admin/email-settings - Get current email settings
export async function GET(request: NextRequest) {
  try {
    // Return current environment-based settings
    const settings: EmailSettings = {
      provider: 'smtp',
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: process.env.SMTP_PORT || '587',
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'hello@revivatech.co.uk',
      fromName: process.env.BUSINESS_NAME || 'RevivaTech',
      enabled: process.env.ENABLE_EMAIL_SENDING === 'true',
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Failed to get email settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve email settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-settings - Update email settings
export async function POST(request: NextRequest) {
  try {
    const settings: EmailSettings = await request.json();

    // Validate required fields
    if (!settings.fromEmail || !settings.fromName) {
      return NextResponse.json(
        { error: 'From email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.fromEmail)) {
      return NextResponse.json(
        { error: 'Invalid from email address' },
        { status: 400 }
      );
    }

    // For SMTP provider, validate SMTP settings
    if (settings.provider === 'smtp' && settings.enabled) {
      if (!settings.smtpHost || !settings.smtpPort) {
        return NextResponse.json(
          { error: 'SMTP host and port are required' },
          { status: 400 }
        );
      }

      if (!settings.smtpUser || !settings.smtpPass) {
        return NextResponse.json(
          { error: 'SMTP username and password are required for production use' },
          { status: 400 }
        );
      }
    }

    // In a production environment, you would store these settings in a database
    // For this demo, we'll log the settings and return success
    console.log('📧 Email settings updated:', {
      provider: settings.provider,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpSecure: settings.smtpSecure,
      smtpUser: settings.smtpUser ? '***configured***' : 'not set',
      smtpPass: settings.smtpPass ? '***configured***' : 'not set',
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      enabled: settings.enabled,
    });

    // Note: In production, you would need to restart the service or 
    // update the email service configuration dynamically
    console.log('⚠️ Note: In production, restart the service to apply SMTP changes');

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully',
      note: 'In production, restart the service to apply SMTP changes'
    });

  } catch (error) {
    console.error('Failed to save email settings:', error);
    return NextResponse.json(
      { error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
}