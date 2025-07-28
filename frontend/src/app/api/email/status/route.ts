import { NextRequest, NextResponse } from 'next/server';

// Simple email status endpoint to test basic functionality
export async function GET(request: NextRequest) {
  try {
    // Basic environment check
    const status = {
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      smtpPort: process.env.SMTP_PORT || 'Not configured',
      smtpSecure: process.env.SMTP_SECURE || 'false',
      hasSmtpUser: !!process.env.SMTP_USER,
      hasSmtpPass: !!process.env.SMTP_PASS,
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'Not configured'
    };

    return NextResponse.json({
      success: true,
      message: 'Email configuration status',
      timestamp: new Date().toISOString(),
      environment: status
    });

  } catch (error) {
    console.error('Email status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get email status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}