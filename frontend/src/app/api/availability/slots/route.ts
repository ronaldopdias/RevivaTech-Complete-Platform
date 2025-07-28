// Availability slots API endpoint for RevivaTech booking system
// Provides real-time slot availability with business rules and pricing

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AvailabilityService, availabilityConfig } from '../../../../../config/scheduling/availability.config';

// Availability request schema
const AvailabilityRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  repairType: z.string().min(1, 'Repair type is required'),
  duration: z.number().min(15).max(480).optional(), // 15 minutes to 8 hours
  technicianId: z.string().optional(),
  urgency: z.enum(['standard', 'priority', 'emergency']).default('standard'),
  serviceType: z.enum(['drop_off', 'collection', 'postal']).default('drop_off')
});

const SlotReservationSchema = z.object({
  slotId: z.string().min(1),
  duration: z.number().min(5).max(60).default(15), // Reserve for 5-60 minutes
  customerInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }).optional()
});

export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
  capacity: number;
  bookingCount: number;
  technicianIds: string[];
  pricing: {
    basePrice: number;
    surcharges: Array<{
      name: string;
      amount: number;
      percentage: number;
      reason: string;
    }>;
    totalPrice: number;
  };
  businessRules: {
    canBook: boolean;
    restrictions: string[];
    warnings: string[];
  };
  metadata: {
    estimatedDuration: number;
    skillLevel: string;
    popularity: number;
    lastUpdated: string;
  };
}

// In-memory slot reservations (in production, use Redis)
const slotReservations = new Map<string, {
  reservedAt: number;
  expiresAt: number;
  customerInfo?: any;
}>();

// Rate limiting for availability checks
const availabilityLimits = new Map<string, { count: number; resetTime: number }>();

function checkAvailabilityRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = availabilityLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    availabilityLimits.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 50) { // 50 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Clean up expired reservations
function cleanupExpiredReservations(): void {
  const now = Date.now();
  for (const [slotId, reservation] of slotReservations.entries()) {
    if (now > reservation.expiresAt) {
      slotReservations.delete(slotId);
    }
  }
}

// Check if slot is temporarily reserved
function isSlotReserved(slotId: string): boolean {
  cleanupExpiredReservations();
  return slotReservations.has(slotId);
}

// Calculate pricing for a slot
function calculateSlotPricing(
  basePrice: number,
  date: Date,
  time: string,
  repairType: string,
  urgency: string
): {
  basePrice: number;
  surcharges: Array<{ name: string; amount: number; percentage: number; reason: string }>;
  totalPrice: number;
} {
  const pricingResult = AvailabilityService.calculatePricingAdjustments(
    date,
    time,
    repairType,
    basePrice
  );
  
  const surcharges = pricingResult.surcharges.map(surcharge => ({
    name: surcharge.name,
    amount: surcharge.amount,
    percentage: surcharge.percentage,
    reason: `${surcharge.name} pricing adjustment`
  }));
  
  // Add urgency surcharge
  if (urgency === 'priority') {
    const urgencyAmount = basePrice * 0.25;
    surcharges.push({
      name: 'Priority Service',
      amount: urgencyAmount,
      percentage: 25,
      reason: 'Expedited service within 1-2 business days'
    });
  } else if (urgency === 'emergency') {
    const urgencyAmount = basePrice * 0.5;
    surcharges.push({
      name: 'Emergency Service',
      amount: urgencyAmount,
      percentage: 50,
      reason: 'Same-day service (subject to availability)'
    });
  }
  
  return {
    basePrice,
    surcharges,
    totalPrice: pricingResult.adjustedPrice + surcharges.reduce((sum, s) => sum + s.amount, 0)
  };
}

// Apply business rules to slots
function applyBusinessRules(
  slot: any,
  repairType: string,
  date: Date,
  urgency: string
): {
  canBook: boolean;
  restrictions: string[];
  warnings: string[];
} {
  const restrictions: string[] = [];
  const warnings: string[] = [];
  let canBook = true;
  
  // Check minimum notice period
  const now = new Date();
  const hoursUntilSlot = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  const minNoticeHours = availabilityConfig.scheduling.minimumNoticeHours;
  
  if (hoursUntilSlot < minNoticeHours) {
    restrictions.push(`Minimum ${minNoticeHours} hours notice required`);
    canBook = false;
  }
  
  // Check maximum advance booking
  const daysUntilSlot = hoursUntilSlot / 24;
  const maxAdvanceDays = availabilityConfig.scheduling.advanceBookingDays;
  
  if (daysUntilSlot > maxAdvanceDays) {
    restrictions.push(`Bookings cannot be made more than ${maxAdvanceDays} days in advance`);
    canBook = false;
  }
  
  // Check repair type capacity limits
  const repairCapacity = availabilityConfig.capacity.repairTypeCapacity[repairType];
  if (repairCapacity && slot.bookingCount >= repairCapacity) {
    restrictions.push(`Daily capacity limit reached for ${repairType}`);
    canBook = false;
  }
  
  // Check if slot is reserved
  if (isSlotReserved(slot.id)) {
    restrictions.push('Slot is temporarily reserved by another customer');
    canBook = false;
  }
  
  // Add warnings for special conditions
  if (urgency === 'emergency' && hoursUntilSlot > 8) {
    warnings.push('Emergency service is typically for same-day bookings');
  }
  
  const dayOfWeek = date.getDay();
  if ([0, 6].includes(dayOfWeek)) {
    warnings.push('Weekend appointments include additional surcharges');
  }
  
  // Check holiday dates
  const dateString = date.toISOString().split('T')[0];
  const holiday = availabilityConfig.holidays.find(h => h.date === dateString);
  if (holiday) {
    if (holiday.type === 'full_closure') {
      restrictions.push(`Closed on ${holiday.name}`);
      canBook = false;
    } else {
      warnings.push(`Limited hours on ${holiday.name}`);
    }
  }
  
  return { canBook, restrictions, warnings };
}

// GET /api/availability/slots
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkAvailabilityRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      date: searchParams.get('date'),
      repairType: searchParams.get('repairType'),
      duration: searchParams.get('duration') ? parseInt(searchParams.get('duration')!) : undefined,
      technicianId: searchParams.get('technicianId'),
      urgency: searchParams.get('urgency') || 'standard',
      serviceType: searchParams.get('serviceType') || 'drop_off'
    };
    
    const validation = AvailabilityRequestSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid availability request',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const { date, repairType, duration, technicianId, urgency, serviceType } = validation.data;
    
    // Parse date
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Get available slots from configuration service
    const availableSlots = AvailabilityService.getAvailableSlots(
      requestDate,
      repairType,
      duration
    );
    
    // Filter by technician if specified
    const filteredSlots = technicianId 
      ? availableSlots.filter(slot => slot.technicianIds?.includes(technicianId))
      : availableSlots;
    
    // Transform slots to include pricing and business rules
    const enhancedSlots: AvailabilitySlot[] = filteredSlots.map(slot => {
      const basePrice = 89; // Would get from repair configuration
      const pricing = calculateSlotPricing(basePrice, requestDate, slot.time, repairType, urgency);
      const businessRules = applyBusinessRules(slot, repairType, requestDate, urgency);
      
      return {
        id: slot.id,
        date: date,
        time: slot.time,
        duration: slot.duration,
        available: slot.available && businessRules.canBook && !isSlotReserved(slot.id),
        capacity: slot.capacity,
        bookingCount: slot.bookingCount,
        technicianIds: slot.technicianIds || [],
        pricing,
        businessRules,
        metadata: {
          estimatedDuration: duration || slot.duration,
          skillLevel: slot.skillLevel,
          popularity: Math.floor(Math.random() * 100), // Would calculate from booking data
          lastUpdated: new Date().toISOString()
        }
      };
    });
    
    // Sort by time
    enhancedSlots.sort((a, b) => a.time.localeCompare(b.time));
    
    // Get availability summary
    const summary = {
      totalSlots: enhancedSlots.length,
      availableSlots: enhancedSlots.filter(s => s.available).length,
      reservedSlots: enhancedSlots.filter(s => isSlotReserved(s.id)).length,
      fullyBookedSlots: enhancedSlots.filter(s => s.bookingCount >= s.capacity).length,
      averagePrice: enhancedSlots.reduce((sum, s) => sum + s.pricing.totalPrice, 0) / enhancedSlots.length || 0,
      earliestAvailable: enhancedSlots.find(s => s.available)?.time,
      latestAvailable: [...enhancedSlots].reverse().find(s => s.available)?.time
    };
    
    return NextResponse.json({
      slots: enhancedSlots,
      summary,
      requestInfo: {
        date,
        repairType,
        duration,
        urgency,
        serviceType,
        technicianId
      },
      businessHours: availabilityConfig.standardHours.find(h => h.dayOfWeek === requestDate.getDay()),
      holidays: availabilityConfig.holidays.filter(h => h.date === date)
    });
    
  } catch (error) {
    console.error('Availability slots error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get availability',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/availability/slots (for slot reservation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = SlotReservationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid reservation request',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const { slotId, duration, customerInfo } = validation.data;
    
    // Check if slot is already reserved
    if (isSlotReserved(slotId)) {
      return NextResponse.json(
        { error: 'Slot is already reserved' },
        { status: 409 }
      );
    }
    
    // Parse slot ID to validate format
    const slotParts = slotId.split('-');
    if (slotParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid slot ID format' },
        { status: 400 }
      );
    }
    
    const [datePart, timePart] = slotParts;
    const slotDate = new Date(datePart);
    
    if (isNaN(slotDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid slot date' },
        { status: 400 }
      );
    }
    
    // Check if slot is still available
    const isAvailable = AvailabilityService.isSlotAvailable(
      slotDate,
      timePart,
      'screen-replacement-basic' // Would get from request
    );
    
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Slot is no longer available' },
        { status: 409 }
      );
    }
    
    // Create reservation
    const now = Date.now();
    const expiresAt = now + (duration * 60 * 1000);
    
    slotReservations.set(slotId, {
      reservedAt: now,
      expiresAt,
      customerInfo
    });
    
    return NextResponse.json({
      success: true,
      slotId,
      reserved: true,
      reservedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      duration: duration,
      message: `Slot reserved for ${duration} minutes`
    });
    
  } catch (error) {
    console.error('Slot reservation error:', error);
    
    return NextResponse.json(
      { error: 'Reservation failed', message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/availability/slots (for extending reservation)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, additionalTime } = body;
    
    if (!slotId || !additionalTime) {
      return NextResponse.json(
        { error: 'Slot ID and additional time are required' },
        { status: 400 }
      );
    }
    
    const reservation = slotReservations.get(slotId);
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }
    
    // Check if reservation has expired
    const now = Date.now();
    if (now > reservation.expiresAt) {
      slotReservations.delete(slotId);
      return NextResponse.json(
        { error: 'Reservation has expired' },
        { status: 409 }
      );
    }
    
    // Extend reservation
    const newExpiresAt = Math.min(
      reservation.expiresAt + (additionalTime * 60 * 1000),
      now + (60 * 60 * 1000) // Maximum 1 hour total
    );
    
    reservation.expiresAt = newExpiresAt;
    
    return NextResponse.json({
      success: true,
      slotId,
      expiresAt: new Date(newExpiresAt).toISOString(),
      message: 'Reservation extended'
    });
    
  } catch (error) {
    console.error('Reservation extension error:', error);
    
    return NextResponse.json(
      { error: 'Failed to extend reservation' },
      { status: 500 }
    );
  }
}

// DELETE /api/availability/slots (for canceling reservation)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    
    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = slotReservations.delete(slotId);
    
    return NextResponse.json({
      success: true,
      slotId,
      cancelled: deleted,
      message: deleted ? 'Reservation cancelled' : 'Reservation not found'
    });
    
  } catch (error) {
    console.error('Reservation cancellation error:', error);
    
    return NextResponse.json(
      { error: 'Failed to cancel reservation' },
      { status: 500 }
    );
  }
}