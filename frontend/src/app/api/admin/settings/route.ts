import { NextRequest, NextResponse } from 'next/server';

// Mock settings data
const mockSettings = {
  general: {
    business_name: 'RevivaTech Computer Repairs',
    business_email: 'info@revivatech.co.uk',
    business_phone: '+44 20 1234 5678',
    business_address: '123 Tech Street, London, UK',
    website_url: 'https://revivatech.co.uk',
    timezone: 'Europe/London',
    currency: 'GBP',
    date_format: 'DD/MM/YYYY',
    language: 'en-GB'
  },
  notifications: {
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_frequency: 'immediate',
    repair_status_updates: true,
    customer_messages: true,
    inventory_alerts: true,
    low_stock_threshold: 5,
    appointment_reminders: true,
    reminder_hours_before: 24
  },
  security: {
    two_factor_auth: false,
    session_timeout: 480, // minutes
    password_policy: 'medium',
    failed_login_attempts: 5,
    account_lockout_duration: 30, // minutes
    require_password_change: false,
    password_change_interval: 90, // days
    audit_logging: true,
    ip_restriction: false,
    allowed_ips: []
  },
  backup: {
    auto_backup: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    backup_retention: 30, // days
    include_customer_data: true,
    include_repair_history: true,
    include_financial_data: true,
    cloud_backup_enabled: false,
    last_backup: '2025-07-20T02:00:00Z',
    backup_size: '2.4 GB'
  },
  integrations: {
    stripe_enabled: false,
    stripe_public_key: '',
    stripe_webhook_url: '',
    mailgun_enabled: false,
    mailgun_domain: '',
    sms_provider: 'none',
    google_analytics: false,
    google_analytics_id: '',
    crm_integration: false,
    crm_endpoint: '',
    inventory_sync: false
  },
  business_hours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  },
  pricing: {
    diagnostic_fee: 25.00,
    hourly_rate: 75.00,
    rush_service_multiplier: 1.5,
    warranty_period: 90, // days
    tax_rate: 20.0, // percentage
    currency_symbol: '£',
    show_prices_with_tax: true,
    minimum_charge: 15.00
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section && section !== 'all') {
      const sectionData = mockSettings[section as keyof typeof mockSettings];
      if (!sectionData) {
        return NextResponse.json(
          { success: false, error: 'Invalid section' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { [section]: sectionData }
      });
    }

    return NextResponse.json({
      success: true,
      data: mockSettings
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, settings } = body;

    if (!section || !settings) {
      return NextResponse.json(
        { success: false, error: 'Section and settings are required' },
        { status: 400 }
      );
    }

    // Mock save logic
    console.log(`Saving settings for section: ${section}`, settings);

    return NextResponse.json({
      success: true,
      message: `Settings for ${section} updated successfully`,
      data: { section, settings }
    });
  } catch (error) {
    console.error('Settings POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'test_email') {
      // Mock email test
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully'
      });
    }

    if (action === 'test_sms') {
      // Mock SMS test
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully'
      });
    }

    if (action === 'backup_now') {
      // Mock backup trigger
      return NextResponse.json({
        success: true,
        message: 'Backup started successfully',
        data: {
          backup_id: 'BKP_' + Date.now(),
          estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }
      });
    }

    if (action === 'verify_stripe') {
      // Mock Stripe verification
      return NextResponse.json({
        success: true,
        message: 'Stripe configuration verified',
        data: {
          account_id: 'acct_test123',
          status: 'active'
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Settings PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}