import { NextRequest, NextResponse } from 'next/server';
import { emailConfigService, SMTPConfiguration } from '@/lib/services/emailConfigService';

// GET /api/admin/email/configure - Get current SMTP configuration
export async function GET(request: NextRequest) {
  try {
    const status = await emailConfigService.getStatus();
    
    // Get current environment configuration (without sensitive data)
    const currentConfig = {
      provider: process.env.SMTP_PROVIDER || 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      from: {
        email: process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@revivatech.co.uk',
        name: process.env.BUSINESS_NAME || 'RevivaTech'
      },
      enabled: process.env.ENABLE_EMAIL_SENDING === 'true'
    };
    
    return NextResponse.json({
      config: currentConfig,
      status
    });
  } catch (error) {
    console.error('Failed to get SMTP configuration:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve SMTP configuration' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email/configure - Update SMTP configuration
export async function POST(request: NextRequest) {
  try {
    const configData = await request.json() as SMTPConfiguration;
    
    // Validate configuration
    const validation = await emailConfigService.validateSMTPConfig(configData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Configuration validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    // Apply configuration
    const result = await emailConfigService.applySMTPConfig(configData, true);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Get updated status
    const status = await emailConfigService.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'SMTP configuration saved successfully',
      status
    });
  } catch (error) {
    console.error('Failed to save SMTP configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save SMTP configuration' },
      { status: 500 }
    );
  }
}