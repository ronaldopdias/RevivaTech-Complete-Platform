// Basic Appointment Scheduling System
// Handles available time slots, booking preferences, and schedule management

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  available: boolean;
  capacity: number;
  booked: number;
  type: 'standard' | 'priority' | 'express';
  estimatedDuration: number; // minutes
}

export interface AppointmentPreference {
  preferredDate?: Date;
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  urgency: 'standard' | 'urgent' | 'emergency';
  dropOffMethod: 'bring-in' | 'collection' | 'post';
  notes?: string;
  contactPreference: 'email' | 'phone' | 'sms';
  availableDays: string[]; // ['monday', 'tuesday', etc.]
}

export interface ScheduleOptions {
  businessHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  workingDays: number[]; // 0-6, where 0 = Sunday
  slotDuration: number; // minutes
  advanceBookingDays: number; // how many days in advance to show
  bufferTime: number; // minutes between appointments
}

// Default schedule configuration
export const DEFAULT_SCHEDULE: ScheduleOptions = {
  businessHours: {
    start: '09:00',
    end: '17:00'
  },
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  slotDuration: 120, // 2 hours per slot
  advanceBookingDays: 14,
  bufferTime: 30
};

// Service complexity mapping for duration estimation
const SERVICE_COMPLEXITY: Record<string, number> = {
  // Band A services (basic) - shorter duration
  'a1': 30,  // Virus Removal
  'a2': 30,  // Internet Issues
  'a3': 120, // OS Reinstallation
  'a4': 60,  // Data Backup
  'a5': 15,  // Password Removal
  'a6': 90,  // Hard Drive Replacement
  'a7': 30,  // Webcam
  'a8': 30,  // Sound Issues
  'a9': 30,  // Touchpad
  'a10': 90, // Screen Repair
  'a11': 60, // Hardware Upgrades
  'a12': 45, // Battery Replacement
  
  // Band B services (intermediate) - medium duration
  'b1': 90,  // Beeping on Startup
  'b2': 60,  // Keyboard Replacement
  'b3': 180, // GPU Reflow
  'b4': 90,  // Windows Software Issues
  'b5': 120, // Startup Issues
  'b6': 150, // BSOD
  'b7': 120, // Broken Hinge
  'b8': 90,  // Full Clean & Service
  
  // Band C services (complex) - longer duration
  'c1': 240, // Motherboard Repair
  'c2': 90,  // BIOS Password Reset
  'c3': 300, // Dropped/Smashed Laptop
  'c4': 180, // Custom PC Build
  'c5': 240, // Liquid Spillage
  'c6': 150, // USB Port Repairs
  'c7': 90,  // Audio Jack Repair
  'c8': 120, // Power Socket Repair
  'c9': 120, // Display Issues
  'c10': 180, // Power Issues
  'c11': 180, // Multiple Broken Hinges
};

/**
 * Estimates total repair time based on selected services
 */
export function estimateRepairDuration(serviceIds: string[]): number {
  if (serviceIds.length === 0) return 60; // Default 1 hour minimum
  
  const totalMinutes = serviceIds.reduce((total, serviceId) => {
    return total + (SERVICE_COMPLEXITY[serviceId] || 60);
  }, 0);
  
  // Add buffer time for multiple services
  const bufferMultiplier = serviceIds.length > 1 ? 1.2 : 1;
  
  return Math.max(60, Math.round(totalMinutes * bufferMultiplier));
}

/**
 * Determines appointment type based on services and urgency
 */
export function determineAppointmentType(
  serviceIds: string[],
  urgency: AppointmentPreference['urgency']
): TimeSlot['type'] {
  if (urgency === 'emergency') return 'express';
  
  const hasComplexServices = serviceIds.some(id => 
    id.startsWith('c') || ['b3', 'b6', 'b5'].includes(id)
  );
  
  if (urgency === 'urgent' || hasComplexServices) return 'priority';
  
  return 'standard';
}

/**
 * Generates available time slots for the next N days
 */
export function generateAvailableSlots(
  days: number = DEFAULT_SCHEDULE.advanceBookingDays,
  scheduleOptions: ScheduleOptions = DEFAULT_SCHEDULE
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const today = new Date();
  
  for (let dayOffset = 1; dayOffset <= days; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    
    // Skip non-working days
    if (!scheduleOptions.workingDays.includes(date.getDay())) {
      continue;
    }
    
    // Generate slots for this day
    const daySlots = generateDaySlots(date, scheduleOptions);
    slots.push(...daySlots);
  }
  
  return slots;
}

/**
 * Generates time slots for a specific day
 */
function generateDaySlots(
  date: Date,
  scheduleOptions: ScheduleOptions
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = scheduleOptions.businessHours.start.split(':').map(Number);
  const [endHour, endMinute] = scheduleOptions.businessHours.end.split(':').map(Number);
  
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);
  
  let currentSlotStart = new Date(startTime);
  
  while (currentSlotStart < endTime) {
    const slotEnd = new Date(currentSlotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + scheduleOptions.slotDuration);
    
    if (slotEnd <= endTime) {
      // Simulate availability (in real app, this would check actual bookings)
      const availability = generateSlotAvailability(currentSlotStart);
      
      slots.push({
        id: `slot_${date.toISOString().split('T')[0]}_${currentSlotStart.getHours()}_${currentSlotStart.getMinutes()}`,
        date: new Date(date),
        startTime: formatTime(currentSlotStart),
        endTime: formatTime(slotEnd),
        available: availability.available,
        capacity: availability.capacity,
        booked: availability.booked,
        type: 'standard',
        estimatedDuration: scheduleOptions.slotDuration
      });
    }
    
    // Move to next slot
    currentSlotStart.setMinutes(
      currentSlotStart.getMinutes() + scheduleOptions.slotDuration + scheduleOptions.bufferTime
    );
  }
  
  return slots;
}

/**
 * Simulates slot availability (replace with real data in production)
 */
function generateSlotAvailability(slotTime: Date): {
  available: boolean;
  capacity: number;
  booked: number;
} {
  const hour = slotTime.getHours();
  const dayOfWeek = slotTime.getDay();
  
  // Morning slots (9-12) tend to be busier
  const baseDemand = hour >= 9 && hour < 12 ? 0.7 : 0.4;
  
  // Mid-week is busier
  const weekDemand = [2, 3, 4].includes(dayOfWeek) ? 1.2 : 0.8;
  
  const finalDemand = baseDemand * weekDemand;
  const capacity = 3; // 3 appointments per slot
  const booked = Math.floor(capacity * finalDemand * Math.random());
  
  return {
    available: booked < capacity,
    capacity,
    booked
  };
}

/**
 * Formats time to HH:mm string
 */
function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

/**
 * Gets available slots filtered by preferences
 */
export function getFilteredSlots(
  preferences: Partial<AppointmentPreference>,
  serviceIds: string[] = [],
  scheduleOptions: ScheduleOptions = DEFAULT_SCHEDULE
): TimeSlot[] {
  const allSlots = generateAvailableSlots(scheduleOptions.advanceBookingDays, scheduleOptions);
  const estimatedDuration = estimateRepairDuration(serviceIds);
  
  return allSlots.filter(slot => {
    // Filter by availability
    if (!slot.available) return false;
    
    // Filter by preferred date
    if (preferences.preferredDate) {
      const slotDate = slot.date.toDateString();
      const prefDate = preferences.preferredDate.toDateString();
      if (slotDate !== prefDate) return false;
    }
    
    // Filter by preferred time
    if (preferences.preferredTime && preferences.preferredTime !== 'flexible') {
      const hour = parseInt(slot.startTime.split(':')[0]);
      
      switch (preferences.preferredTime) {
        case 'morning':
          if (hour < 9 || hour >= 12) return false;
          break;
        case 'afternoon':
          if (hour < 12 || hour >= 16) return false;
          break;
        case 'evening':
          if (hour < 16) return false;
          break;
      }
    }
    
    // Filter by available days
    if (preferences.availableDays && preferences.availableDays.length > 0) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const slotDay = dayNames[slot.date.getDay()];
      if (!preferences.availableDays.includes(slotDay)) return false;
    }
    
    // Check if slot duration can accommodate the estimated repair time
    if (estimatedDuration > slot.estimatedDuration * 1.5) {
      return false; // Need significantly more time than slot allows
    }
    
    return true;
  });
}

/**
 * Groups slots by date for easier display
 */
export function groupSlotsByDate(slots: TimeSlot[]): Record<string, TimeSlot[]> {
  return slots.reduce((groups, slot) => {
    const dateKey = slot.date.toISOString().split('T')[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);
}

/**
 * Gets next available slot based on preferences
 */
export function getNextAvailableSlot(
  preferences: Partial<AppointmentPreference> = {},
  serviceIds: string[] = []
): TimeSlot | null {
  const filteredSlots = getFilteredSlots(preferences, serviceIds);
  
  if (filteredSlots.length === 0) {
    // Fallback to any available slot
    const allSlots = generateAvailableSlots();
    return allSlots.find(slot => slot.available) || null;
  }
  
  // Return earliest available slot
  return filteredSlots.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    return a.startTime.localeCompare(b.startTime);
  })[0];
}

/**
 * Validates if a time slot can accommodate the selected services
 */
export function validateSlotForServices(
  slot: TimeSlot,
  serviceIds: string[]
): {
  valid: boolean;
  reason?: string;
  suggestedDuration?: number;
} {
  const estimatedDuration = estimateRepairDuration(serviceIds);
  
  if (!slot.available) {
    return {
      valid: false,
      reason: 'Time slot is no longer available'
    };
  }
  
  if (estimatedDuration > slot.estimatedDuration * 1.5) {
    return {
      valid: false,
      reason: 'Selected services require more time than this slot allows',
      suggestedDuration: estimatedDuration
    };
  }
  
  return { valid: true };
}

/**
 * Formats slot time range for display
 */
export function formatSlotTime(slot: TimeSlot): string {
  return `${slot.startTime} - ${slot.endTime}`;
}

/**
 * Gets availability summary for a date
 */
export function getDateAvailability(
  date: Date,
  scheduleOptions: ScheduleOptions = DEFAULT_SCHEDULE
): {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  availabilityPercentage: number;
} {
  const daySlots = generateDaySlots(date, scheduleOptions);
  const availableSlots = daySlots.filter(slot => slot.available).length;
  const bookedSlots = daySlots.length - availableSlots;
  
  return {
    totalSlots: daySlots.length,
    availableSlots,
    bookedSlots,
    availabilityPercentage: daySlots.length > 0 ? (availableSlots / daySlots.length) * 100 : 0
  };
}