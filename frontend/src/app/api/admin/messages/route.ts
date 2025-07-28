import { NextRequest, NextResponse } from 'next/server';

// Mock data for messages
const mockMessages = [
  {
    id: 1,
    type: 'support_ticket',
    subject: 'MacBook Screen Repair Update',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+44 20 1234 5678'
    },
    status: 'open',
    priority: 'high',
    assigned_to: 'John Smith',
    created_at: '2025-07-20T08:30:00Z',
    updated_at: '2025-07-20T14:15:00Z',
    message_count: 5,
    last_message: 'Could you provide an update on the repair timeline?',
    repair_id: 'REP-2025-001'
  },
  {
    id: 2,
    type: 'general_inquiry',
    subject: 'Data Recovery Service Inquiry',
    customer: {
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      phone: '+44 20 9876 5432'
    },
    status: 'pending',
    priority: 'medium',
    assigned_to: null,
    created_at: '2025-07-20T10:45:00Z',
    updated_at: '2025-07-20T10:45:00Z',
    message_count: 1,
    last_message: 'I need help recovering data from a damaged SSD drive.',
    repair_id: null
  },
  {
    id: 3,
    type: 'complaint',
    subject: 'Delayed iPhone Repair',
    customer: {
      name: 'Emma Wilson',
      email: 'emma.wilson@gmail.com',
      phone: '+44 20 5555 1234'
    },
    status: 'resolved',
    priority: 'high',
    assigned_to: 'Lisa Davis',
    created_at: '2025-07-19T16:20:00Z',
    updated_at: '2025-07-20T09:30:00Z',
    message_count: 8,
    last_message: 'Thank you for resolving this quickly!',
    repair_id: 'REP-2025-003'
  },
  {
    id: 4,
    type: 'feedback',
    subject: 'Excellent Service Experience',
    customer: {
      name: 'David Brown',
      email: 'david.brown@outlook.com',
      phone: '+44 20 7777 8888'
    },
    status: 'closed',
    priority: 'low',
    assigned_to: 'John Smith',
    created_at: '2025-07-19T12:00:00Z',
    updated_at: '2025-07-19T12:30:00Z',
    message_count: 2,
    last_message: 'Outstanding service quality and quick turnaround time!',
    repair_id: 'REP-2025-002'
  },
  {
    id: 5,
    type: 'quote_request',
    subject: 'Gaming PC Repair Quote',
    customer: {
      name: 'Alex Thompson',
      email: 'alex.t@techgaming.com',
      phone: '+44 20 3333 4444'
    },
    status: 'open',
    priority: 'medium',
    assigned_to: 'Mark Rodriguez',
    created_at: '2025-07-20T11:15:00Z',
    updated_at: '2025-07-20T13:45:00Z',
    message_count: 3,
    last_message: 'The graphics card is making unusual noises and not displaying properly.',
    repair_id: null
  },
  {
    id: 6,
    type: 'support_ticket',
    subject: 'iPad Battery Replacement Status',
    customer: {
      name: 'Jennifer Lee',
      email: 'jen.lee@company.org',
      phone: '+44 20 6666 7777'
    },
    status: 'pending',
    priority: 'low',
    assigned_to: 'Lisa Davis',
    created_at: '2025-07-20T09:00:00Z',
    updated_at: '2025-07-20T12:00:00Z',
    message_count: 2,
    last_message: 'When will the replacement battery arrive?',
    repair_id: 'REP-2025-004'
  }
];

// Mock staff for assignment
const mockStaff = [
  { id: 1, name: 'John Smith', role: 'Senior Technician', active: true },
  { id: 2, name: 'Lisa Davis', role: 'Customer Service Manager', active: true },
  { id: 3, name: 'Mark Rodriguez', role: 'Lead Technician', active: true },
  { id: 4, name: 'Sarah Palmer', role: 'Support Specialist', active: true }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    let filteredMessages = [...mockMessages];

    // Apply filters
    if (type && type !== 'all') {
      filteredMessages = filteredMessages.filter(message => message.type === type);
    }

    if (status && status !== 'all') {
      filteredMessages = filteredMessages.filter(message => message.status === status);
    }

    if (priority && priority !== 'all') {
      filteredMessages = filteredMessages.filter(message => message.priority === priority);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredMessages = filteredMessages.filter(message => 
        message.subject.toLowerCase().includes(searchLower) ||
        message.customer.name.toLowerCase().includes(searchLower) ||
        message.customer.email.toLowerCase().includes(searchLower) ||
        message.last_message.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at (newest first)
    filteredMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      data: {
        messages: filteredMessages,
        stats: {
          total: mockMessages.length,
          open: mockMessages.filter(m => m.status === 'open').length,
          pending: mockMessages.filter(m => m.status === 'pending').length,
          resolved: mockMessages.filter(m => m.status === 'resolved').length,
          closed: mockMessages.filter(m => m.status === 'closed').length,
          high_priority: mockMessages.filter(m => m.priority === 'high').length
        },
        staff: mockStaff
      }
    });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, messageId, assignTo, status, priority } = body;

    if (action === 'assign') {
      // Mock assignment logic
      return NextResponse.json({
        success: true,
        message: `Message assigned to ${assignTo}`,
        data: { messageId, assignTo }
      });
    }

    if (action === 'update_status') {
      // Mock status update logic
      return NextResponse.json({
        success: true,
        message: `Message status updated to ${status}`,
        data: { messageId, status }
      });
    }

    if (action === 'update_priority') {
      // Mock priority update logic
      return NextResponse.json({
        success: true,
        message: `Message priority updated to ${priority}`,
        data: { messageId, priority }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Messages POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}