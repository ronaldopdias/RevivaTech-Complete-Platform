import { NextRequest, NextResponse } from 'next/server';

// Mock Stripe configuration
const STRIPE_CONFIG = {
  public_key: 'pk_test_51234567890abcdef',
  webhook_secret: 'whsec_test_abcdef123456',
  enabled: false
};

// Mock payment data
const mockPayments = [
  {
    id: 'pay_1234567890',
    amount: 12500, // £125.00 in pence
    currency: 'gbp',
    status: 'succeeded',
    customer: {
      id: 'cus_customer1',
      name: 'Sarah Johnson',
      email: 'sarah@email.com'
    },
    description: 'MacBook Screen Repair - REP-2025-001',
    repair_id: 'REP-2025-001',
    created: '2025-07-20T14:30:00Z',
    method: 'card',
    card_last4: '4242',
    card_brand: 'visa'
  },
  {
    id: 'pay_0987654321',
    amount: 8500, // £85.00 in pence
    currency: 'gbp',
    status: 'succeeded',
    customer: {
      id: 'cus_customer2',
      name: 'Michael Chen',
      email: 'michael.chen@company.com'
    },
    description: 'iPhone Battery Replacement - REP-2025-003',
    repair_id: 'REP-2025-003',
    created: '2025-07-20T10:15:00Z',
    method: 'card',
    card_last4: '5555',
    card_brand: 'mastercard'
  },
  {
    id: 'pay_1122334455',
    amount: 25000, // £250.00 in pence
    currency: 'gbp',
    status: 'pending',
    customer: {
      id: 'cus_customer3',
      name: 'Emma Wilson',
      email: 'emma.wilson@gmail.com'
    },
    description: 'Gaming PC Motherboard Repair - REP-2025-004',
    repair_id: 'REP-2025-004',
    created: '2025-07-20T16:45:00Z',
    method: 'card',
    card_last4: '4444',
    card_brand: 'visa'
  },
  {
    id: 'pay_6677889900',
    amount: 15000, // £150.00 in pence
    currency: 'gbp',
    status: 'failed',
    customer: {
      id: 'cus_customer4',
      name: 'David Brown',
      email: 'david.brown@outlook.com'
    },
    description: 'iPad Screen Replacement - REP-2025-005',
    repair_id: 'REP-2025-005',
    created: '2025-07-20T12:20:00Z',
    method: 'card',
    card_last4: '1234',
    card_brand: 'amex',
    failure_reason: 'insufficient_funds'
  }
];

// Mock refunds
const mockRefunds = [
  {
    id: 'ref_1234567890',
    payment_id: 'pay_1234567890',
    amount: 2500, // £25.00 partial refund
    status: 'succeeded',
    reason: 'requested_by_customer',
    created: '2025-07-20T15:00:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (action === 'config') {
      return NextResponse.json({
        success: true,
        data: {
          enabled: STRIPE_CONFIG.enabled,
          public_key: STRIPE_CONFIG.public_key,
          webhook_configured: !!STRIPE_CONFIG.webhook_secret
        }
      });
    }

    if (action === 'stats') {
      const totalRevenue = mockPayments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0);

      const todayRevenue = mockPayments
        .filter(p => p.status === 'succeeded' && p.created.startsWith('2025-07-20'))
        .reduce((sum, p) => sum + p.amount, 0);

      return NextResponse.json({
        success: true,
        data: {
          total_revenue: totalRevenue,
          today_revenue: todayRevenue,
          total_transactions: mockPayments.length,
          success_rate: Math.round((mockPayments.filter(p => p.status === 'succeeded').length / mockPayments.length) * 100),
          pending_count: mockPayments.filter(p => p.status === 'pending').length,
          failed_count: mockPayments.filter(p => p.status === 'failed').length
        }
      });
    }

    // Get payments with filters
    let filteredPayments = [...mockPayments];

    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = filteredPayments.filter(payment => 
        payment.customer.name.toLowerCase().includes(searchLower) ||
        payment.customer.email.toLowerCase().includes(searchLower) ||
        payment.description.toLowerCase().includes(searchLower) ||
        payment.repair_id.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created date (newest first)
    filteredPayments.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json({
      success: true,
      data: {
        payments: filteredPayments,
        refunds: mockRefunds,
        config: {
          enabled: STRIPE_CONFIG.enabled,
          public_key: STRIPE_CONFIG.public_key
        }
      }
    });
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create_payment_intent') {
      // Mock payment intent creation
      const { amount, currency = 'gbp', description, customer_id, repair_id } = data;

      return NextResponse.json({
        success: true,
        data: {
          client_secret: 'pi_test_1234567890_secret_abcdef',
          payment_intent_id: 'pi_test_1234567890',
          amount,
          currency,
          status: 'requires_payment_method'
        }
      });
    }

    if (action === 'process_refund') {
      // Mock refund processing
      const { payment_id, amount, reason } = data;

      return NextResponse.json({
        success: true,
        data: {
          refund_id: 'ref_' + Date.now(),
          payment_id,
          amount,
          status: 'succeeded',
          reason,
          created: new Date().toISOString()
        },
        message: 'Refund processed successfully'
      });
    }

    if (action === 'update_config') {
      // Mock config update
      const { enabled, public_key, webhook_secret } = data;

      return NextResponse.json({
        success: true,
        message: 'Stripe configuration updated successfully',
        data: { enabled, public_key: public_key?.substring(0, 12) + '...' }
      });
    }

    if (action === 'test_connection') {
      // Mock connection test
      return NextResponse.json({
        success: true,
        message: 'Stripe connection test successful',
        data: {
          account_id: 'acct_test123456',
          account_name: 'RevivaTech Test Account',
          country: 'GB',
          currency: 'gbp'
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stripe POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payment_id, ...data } = body;

    if (action === 'capture_payment') {
      // Mock payment capture
      return NextResponse.json({
        success: true,
        message: 'Payment captured successfully',
        data: {
          payment_id,
          status: 'succeeded',
          captured_at: new Date().toISOString()
        }
      });
    }

    if (action === 'cancel_payment') {
      // Mock payment cancellation
      return NextResponse.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          payment_id,
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stripe PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}