/**
 * Admin Technicians API - Technician Management
 * Provides CRUD operations for technician data and scheduling
 */

import { NextRequest, NextResponse } from 'next/server';

// Technician interface
interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: 'Available' | 'Busy' | 'Off Duty' | 'On Break';
  currentRepair?: string;
  todaySchedule: number;
  weeklyHours: number;
  hourlyRate?: number;
  startDate?: string;
  certifications?: string[];
  notes?: string;
}

// Mock technician data
const mockTechnicians: Technician[] = [
  {
    id: 'TECH-001',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@revivatech.co.uk',
    phone: '+44 7700 900200',
    specializations: ['iPhone Repair', 'iPad Repair', 'MacBook Repair'],
    status: 'Available',
    todaySchedule: 6,
    weeklyHours: 38,
    hourlyRate: 25,
    startDate: '2022-03-15',
    certifications: ['Apple Certified Technician', 'CompTIA A+'],
    notes: 'Senior technician with 5+ years experience'
  },
  {
    id: 'TECH-002',
    name: 'James Carter',
    email: 'james.carter@revivatech.co.uk',
    phone: '+44 7700 900201',
    specializations: ['Android Repair', 'Samsung Repair', 'PC Repair'],
    status: 'Busy',
    currentRepair: 'Samsung Galaxy S24 Screen',
    todaySchedule: 8,
    weeklyHours: 42,
    hourlyRate: 22,
    startDate: '2021-08-20',
    certifications: ['Samsung Certified', 'Android Technician'],
    notes: 'Specializes in Android devices and PC repairs'
  },
  {
    id: 'TECH-003',
    name: 'Emily Davis',
    email: 'emily.davis@revivatech.co.uk',
    phone: '+44 7700 900202',
    specializations: ['Data Recovery', 'Logic Board Repair', 'Diagnostic'],
    status: 'Available',
    todaySchedule: 4,
    weeklyHours: 35,
    hourlyRate: 30,
    startDate: '2020-11-10',
    certifications: ['Data Recovery Specialist', 'Micro-soldering Certified'],
    notes: 'Expert in complex repairs and data recovery'
  },
  {
    id: 'TECH-004',
    name: 'Michael Thompson',
    email: 'michael.thompson@revivatech.co.uk',
    phone: '+44 7700 900203',
    specializations: ['MacBook Repair', 'iMac Repair', 'Hardware Upgrade'],
    status: 'On Break',
    todaySchedule: 5,
    weeklyHours: 40,
    hourlyRate: 27,
    startDate: '2023-01-05',
    certifications: ['Apple Certified Technician', 'Hardware Specialist'],
    notes: 'Newest team member, excellent with Mac repairs'
  }
];

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const TECHNICIANS_RATE_LIMIT = 100;
const RATE_LIMIT_WINDOW = 3600000;

function checkTechniciansRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `technicians_${identifier}`;

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

  if (limit.count >= TECHNICIANS_RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

// GET /api/admin/technicians - Get all technicians
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkTechniciansRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const specialization = searchParams.get('specialization');
    const availability = searchParams.get('availability');

    // Filter technicians
    let filteredTechnicians = [...mockTechnicians];

    if (status && status !== 'all') {
      filteredTechnicians = filteredTechnicians.filter(tech => tech.status === status);
    }

    if (specialization && specialization !== 'all') {
      filteredTechnicians = filteredTechnicians.filter(tech => 
        tech.specializations.some(spec => 
          spec.toLowerCase().includes(specialization.toLowerCase())
        )
      );
    }

    if (availability === 'available') {
      filteredTechnicians = filteredTechnicians.filter(tech => 
        tech.status === 'Available' || tech.status === 'On Break'
      );
    }

    // Calculate summary statistics
    const totalTechnicians = filteredTechnicians.length;
    const availableTechnicians = filteredTechnicians.filter(t => t.status === 'Available').length;
    const busyTechnicians = filteredTechnicians.filter(t => t.status === 'Busy').length;
    const offDutyTechnicians = filteredTechnicians.filter(t => t.status === 'Off Duty').length;
    const onBreakTechnicians = filteredTechnicians.filter(t => t.status === 'On Break').length;

    const totalScheduledToday = filteredTechnicians.reduce((sum, t) => sum + t.todaySchedule, 0);
    const totalWeeklyHours = filteredTechnicians.reduce((sum, t) => sum + t.weeklyHours, 0);
    const averageHours = totalTechnicians > 0 ? Math.round(totalWeeklyHours / totalTechnicians) : 0;

    return NextResponse.json({
      success: true,
      data: filteredTechnicians,
      summary: {
        totalTechnicians,
        availableTechnicians,
        busyTechnicians,
        offDutyTechnicians,
        onBreakTechnicians,
        totalScheduledToday,
        totalWeeklyHours,
        averageHours,
        utilizationRate: totalTechnicians > 0 ? Math.round((busyTechnicians / totalTechnicians) * 100) : 0
      },
      filters: {
        statuses: ['Available', 'Busy', 'Off Duty', 'On Break'],
        specializations: [...new Set(mockTechnicians.flatMap(t => t.specializations))]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Technicians API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch technicians',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/technicians - Add new technician
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkTechniciansRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'specializations'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingTech = mockTechnicians.find(t => t.email === body.email);
    if (existingTech) {
      return NextResponse.json(
        { error: 'Technician with this email already exists' },
        { status: 409 }
      );
    }

    // Create new technician
    const newTechnician: Technician = {
      id: `TECH-${String(mockTechnicians.length + 1).padStart(3, '0')}`,
      name: body.name,
      email: body.email,
      phone: body.phone,
      specializations: Array.isArray(body.specializations) ? body.specializations : [body.specializations],
      status: body.status || 'Available',
      todaySchedule: 0,
      weeklyHours: 0,
      hourlyRate: body.hourlyRate || 20,
      startDate: new Date().toISOString().split('T')[0],
      certifications: body.certifications || [],
      notes: body.notes || ''
    };

    // In production, this would save to database
    mockTechnicians.push(newTechnician);

    return NextResponse.json({
      success: true,
      data: newTechnician,
      message: 'Technician created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create technician error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create technician',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/technicians - Update technician status
export async function PATCH(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkTechniciansRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { id, status, currentRepair } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing technician id or status' },
        { status: 400 }
      );
    }

    const technicianIndex = mockTechnicians.findIndex(t => t.id === id);
    if (technicianIndex === -1) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      );
    }

    // Update technician status
    mockTechnicians[technicianIndex].status = status;
    if (currentRepair !== undefined) {
      mockTechnicians[technicianIndex].currentRepair = currentRepair;
    }

    return NextResponse.json({
      success: true,
      data: mockTechnicians[technicianIndex],
      message: 'Technician status updated successfully'
    });

  } catch (error) {
    console.error('Update technician error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update technician',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}