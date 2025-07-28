/**
 * Admin Appointments API - Appointment Scheduling Management
 * Provides CRUD operations for appointment scheduling and management
 */

import { NextRequest, NextResponse } from 'next/server';

// Appointment interface
interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  technicianId: string;
  technicianName: string;
  serviceType: string;
  deviceType: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  location: 'Workshop' | 'Customer Location' | 'Remote';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

// Mock appointment data
const mockAppointments: Appointment[] = [
  {
    id: 'APT-001',
    customerId: 'CUST-001',
    customerName: 'Sarah Thompson',
    customerPhone: '+44 7700 900123',
    customerEmail: 'sarah.thompson@email.com',
    technicianId: 'TECH-001',
    technicianName: 'Sarah Mitchell',
    serviceType: 'Screen Repair',
    deviceType: 'iPhone 15 Pro',
    scheduledTime: new Date().toISOString().replace(/T.*/, 'T09:00:00'),
    duration: 120,
    status: 'Scheduled',
    location: 'Workshop',
    priority: 'Medium',
    notes: 'Customer prefers morning appointments',
    cost: 299,
    createdAt: '2025-07-19T10:00:00.000Z',
    updatedAt: '2025-07-19T10:00:00.000Z'
  },
  {
    id: 'APT-002',
    customerId: 'CUST-002',
    customerName: 'James Rodriguez',
    customerPhone: '+44 7700 900124',
    customerEmail: 'james.rodriguez@email.com',
    technicianId: 'TECH-002',
    technicianName: 'James Carter',
    serviceType: 'Battery Replacement',
    deviceType: 'Samsung Galaxy S24',
    scheduledTime: new Date().toISOString().replace(/T.*/, 'T10:30:00'),
    duration: 90,
    status: 'In Progress',
    location: 'Workshop',
    priority: 'High',
    notes: 'Express service requested',
    estimatedCompletion: new Date().toISOString().replace(/T.*/, 'T12:00:00'),
    cost: 89,
    createdAt: '2025-07-19T08:30:00.000Z',
    updatedAt: '2025-07-20T10:30:00.000Z'
  },
  {
    id: 'APT-003',
    customerId: 'CUST-003',
    customerName: 'Emily Chen',
    customerPhone: '+44 7700 900125',
    customerEmail: 'emily.chen@email.com',
    technicianId: 'TECH-003',
    technicianName: 'Emily Davis',
    serviceType: 'Data Recovery',
    deviceType: 'MacBook Pro 16"',
    scheduledTime: new Date().toISOString().replace(/T.*/, 'T14:00:00'),
    duration: 180,
    status: 'Scheduled',
    location: 'Workshop',
    priority: 'Urgent',
    notes: 'Important business data - handle with care',
    cost: 299,
    createdAt: '2025-07-18T16:20:00.000Z',
    updatedAt: '2025-07-18T16:20:00.000Z'
  },
  {
    id: 'APT-004',
    customerId: 'CUST-004',
    customerName: 'David Wilson',
    customerPhone: '+44 7700 900126',
    customerEmail: 'david.wilson@email.com',
    technicianId: 'TECH-004',
    technicianName: 'Michael Thompson',
    serviceType: 'Diagnostic',
    deviceType: 'iMac 27"',
    scheduledTime: new Date().toISOString().replace(/T.*/, 'T16:00:00'),
    duration: 60,
    status: 'Scheduled',
    location: 'Customer Location',
    priority: 'Low',
    notes: 'On-site visit required',
    cost: 59,
    createdAt: '2025-07-20T09:15:00.000Z',
    updatedAt: '2025-07-20T09:15:00.000Z'
  },
  {
    id: 'APT-005',
    customerId: 'CUST-005',
    customerName: 'Maria Garcia',
    customerPhone: '+44 7700 900127',
    customerEmail: 'maria.garcia@email.com',
    technicianId: 'TECH-001',
    technicianName: 'Sarah Mitchell',
    serviceType: 'Screen Repair',
    deviceType: 'iPad Air 5',
    scheduledTime: new Date(Date.now() + 24*60*60*1000).toISOString().replace(/T.*/, 'T11:00:00'),
    duration: 90,
    status: 'Scheduled',
    location: 'Workshop',
    priority: 'Medium',
    notes: 'Customer bringing device tomorrow',
    cost: 199,
    createdAt: '2025-07-20T14:30:00.000Z',
    updatedAt: '2025-07-20T14:30:00.000Z'
  },
  {
    id: 'APT-006',
    customerId: 'CUST-001',
    customerName: 'Sarah Thompson',
    customerPhone: '+44 7700 900123',
    customerEmail: 'sarah.thompson@email.com',
    technicianId: 'TECH-002',
    technicianName: 'James Carter',
    serviceType: 'Software Update',
    deviceType: 'MacBook Air M2',
    scheduledTime: new Date(Date.now() - 24*60*60*1000).toISOString().replace(/T.*/, 'T15:00:00'),
    duration: 45,
    status: 'Completed',
    location: 'Workshop',
    priority: 'Low',
    notes: 'Regular maintenance service',
    actualCompletion: new Date(Date.now() - 24*60*60*1000 + 40*60*1000).toISOString(),
    cost: 45,
    createdAt: '2025-07-18T12:00:00.000Z',
    updatedAt: '2025-07-19T15:40:00.000Z'
  }
];

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const APPOINTMENTS_RATE_LIMIT = 150;
const RATE_LIMIT_WINDOW = 3600000;

function checkAppointmentsRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `appointments_${identifier}`;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimitMap.get(key)!;

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }

  if (limit.count >= APPOINTMENTS_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

// GET /api/admin/appointments - Get appointments with filtering
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkAppointmentsRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const technicianId = searchParams.get('technicianId');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const priority = searchParams.get('priority');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter appointments
    let filteredAppointments = [...mockAppointments];

    if (date) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.scheduledTime.startsWith(date)
      );
    }

    if (technicianId && technicianId !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.technicianId === technicianId
      );
    }

    if (status && status !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.status === status
      );
    }

    if (customerId) {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.customerId === customerId
      );
    }

    if (priority && priority !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.priority === priority
      );
    }

    if (location && location !== 'all') {
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.location === location
      );
    }

    // Sort by scheduled time
    filteredAppointments.sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    // Apply pagination
    const totalAppointments = filteredAppointments.length;
    const paginatedAppointments = filteredAppointments.slice(offset, offset + limit);

    // Calculate summary statistics
    const scheduled = filteredAppointments.filter(a => a.status === 'Scheduled').length;
    const inProgress = filteredAppointments.filter(a => a.status === 'In Progress').length;
    const completed = filteredAppointments.filter(a => a.status === 'Completed').length;
    const cancelled = filteredAppointments.filter(a => a.status === 'Cancelled').length;
    const noShow = filteredAppointments.filter(a => a.status === 'No Show').length;

    const totalRevenue = filteredAppointments
      .filter(a => a.status === 'Completed')
      .reduce((sum, a) => sum + (a.cost || 0), 0);

    const averageDuration = filteredAppointments.length > 0 
      ? Math.round(filteredAppointments.reduce((sum, a) => sum + a.duration, 0) / filteredAppointments.length)
      : 0;

    // Today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = mockAppointments.filter(a => 
      a.scheduledTime.startsWith(today)
    ).length;

    return NextResponse.json({
      success: true,
      data: paginatedAppointments,
      pagination: {
        total: totalAppointments,
        offset,
        limit,
        hasMore: offset + limit < totalAppointments
      },
      summary: {
        totalAppointments,
        scheduled,
        inProgress,
        completed,
        cancelled,
        noShow,
        todayAppointments,
        totalRevenue: Math.round(totalRevenue),
        averageDuration,
        completionRate: totalAppointments > 0 
          ? Math.round((completed / totalAppointments) * 100) 
          : 0
      },
      filters: {
        statuses: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
        priorities: ['Low', 'Medium', 'High', 'Urgent'],
        locations: ['Workshop', 'Customer Location', 'Remote'],
        serviceTypes: [...new Set(mockAppointments.map(a => a.serviceType))]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Appointments API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch appointments',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkAppointmentsRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['customerId', 'customerName', 'customerPhone', 'technicianId', 'serviceType', 'deviceType', 'scheduledTime'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check for scheduling conflicts
    const conflictingAppointment = mockAppointments.find(apt => {
      if (apt.technicianId !== body.technicianId) return false;
      
      const existingStart = new Date(apt.scheduledTime);
      const existingEnd = new Date(existingStart.getTime() + apt.duration * 60000);
      const newStart = new Date(body.scheduledTime);
      const newEnd = new Date(newStart.getTime() + (body.duration || 60) * 60000);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing appointment', conflict: conflictingAppointment },
        { status: 409 }
      );
    }

    // Create new appointment
    const newAppointment: Appointment = {
      id: `APT-${String(mockAppointments.length + 1).padStart(3, '0')}`,
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      technicianId: body.technicianId,
      technicianName: body.technicianName || 'TBD',
      serviceType: body.serviceType,
      deviceType: body.deviceType,
      scheduledTime: body.scheduledTime,
      duration: body.duration || 60,
      status: 'Scheduled',
      location: body.location || 'Workshop',
      priority: body.priority || 'Medium',
      notes: body.notes || '',
      cost: body.cost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In production, this would save to database
    mockAppointments.push(newAppointment);

    return NextResponse.json({
      success: true,
      data: newAppointment,
      message: 'Appointment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create appointment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/appointments - Update appointment status
export async function PATCH(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkAppointmentsRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { id, status, notes, actualCompletion, cost } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing appointment id' },
        { status: 400 }
      );
    }

    const appointmentIndex = mockAppointments.findIndex(a => a.id === id);
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment
    if (status) mockAppointments[appointmentIndex].status = status;
    if (notes !== undefined) mockAppointments[appointmentIndex].notes = notes;
    if (actualCompletion) mockAppointments[appointmentIndex].actualCompletion = actualCompletion;
    if (cost !== undefined) mockAppointments[appointmentIndex].cost = cost;
    
    mockAppointments[appointmentIndex].updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: mockAppointments[appointmentIndex],
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update appointment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}