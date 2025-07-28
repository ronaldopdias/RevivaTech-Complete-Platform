// Availability checking and scheduling configuration system for RevivaTech
// Handles appointment scheduling, capacity management, and business rules

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
  breakStart?: string; // "12:00" (optional lunch break)
  breakEnd?: string; // "13:00"
  notes?: string;
}

export interface TimeSlot {
  id: string;
  time: string; // "09:00"
  duration: number; // minutes
  capacity: number; // max concurrent bookings
  available: boolean;
  bookingCount: number;
  repairTypes: string[]; // compatible repair type IDs
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  technicianIds?: string[];
}

export interface AvailabilityRule {
  id: string;
  name: string;
  description: string;
  type: 'blackout' | 'capacity' | 'repair_specific' | 'technician' | 'seasonal' | 'custom';
  priority: number; // higher numbers take precedence
  
  // Date/time conditions
  dateRange?: {
    start: string; // ISO date
    end: string;
  };
  timeRange?: {
    start: string; // "09:00"
    end: string; // "17:00"
  };
  daysOfWeek?: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  
  // Specific conditions
  repairTypes?: string[];
  technicianIds?: string[];
  deviceTypes?: string[];
  brands?: string[];
  
  // Rule effects
  effect: {
    action: 'block' | 'limit' | 'surcharge' | 'require_approval' | 'redirect';
    value?: number; // capacity limit or surcharge percentage
    message?: string;
    redirectTo?: string;
    metadata?: Record<string, any>;
  };
  
  // Rule metadata
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  expiresAt?: string;
}

export interface TechnicianSchedule {
  technicianId: string;
  name: string;
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  specializations: string[]; // repair type IDs they specialize in
  
  // Availability
  regularHours: BusinessHours[];
  exceptions: Array<{
    date: string;
    hours?: BusinessHours;
    unavailable?: boolean;
    reason?: string;
  }>;
  
  // Capacity
  maxConcurrentJobs: number;
  maxDailyJobs: number;
  breakDuration: number; // minutes between jobs
  
  // Performance metrics
  averageJobTime: Record<string, number>; // repair type ID -> minutes
  qualityScore: number; // 1-10
  customerRating: number; // 1-5
}

export interface AvailabilityConfiguration {
  // Global settings
  businessName: string;
  timezone: string;
  
  // Scheduling settings
  scheduling: {
    advanceBookingDays: number; // max days in advance
    minimumNoticeHours: number; // minimum hours notice required
    slotDuration: number; // default slot duration in minutes
    bufferTime: number; // buffer between appointments in minutes
    autoConfirm: boolean;
    overbookingAllowed: boolean;
    overbookingPercentage: number; // 10 = 10% overbooking
  };
  
  // Business hours
  standardHours: BusinessHours[];
  
  // Holiday and exception dates
  holidays: Array<{
    date: string;
    name: string;
    type: 'full_closure' | 'reduced_hours' | 'no_emergency';
    alternateHours?: BusinessHours[];
  }>;
  
  // Capacity management
  capacity: {
    defaultSlotCapacity: number;
    rushHourMultiplier: number; // capacity multiplier for busy periods
    seasonalAdjustments: Record<string, number>; // month -> multiplier
    repairTypeCapacity: Record<string, number>; // repair type -> max daily count
  };
  
  // Service-specific rules
  serviceRules: {
    walkInPercentage: number; // % of capacity reserved for walk-ins
    emergencySlots: number; // number of slots reserved for emergencies per day
    priorityBookingHours: number; // hours in advance for priority bookings
    maxConsecutiveJobs: number; // max consecutive jobs of same type
  };
  
  // Pricing modifiers
  pricing: {
    peakHourSurcharge: number; // % surcharge for peak hours
    weekendSurcharge: number; // % surcharge for weekends
    holidaySurcharge: number; // % surcharge for holidays
    shortNoticeSurcharge: number; // % surcharge for short notice bookings
    
    // Time-based pricing
    timeBands: Array<{
      name: string;
      start: string;
      end: string;
      modifier: number; // pricing multiplier
      daysOfWeek: number[];
    }>;
  };
  
  // Rules engine
  rules: AvailabilityRule[];
  
  // Technician management
  technicians: TechnicianSchedule[];
  
  // Integration settings
  integrations: {
    calendarSync: {
      enabled: boolean;
      provider: 'google' | 'outlook' | 'ical';
      syncInterval: number; // minutes
    };
    notifications: {
      enabled: boolean;
      reminderHours: number[];
      channels: string[];
    };
  };
}

// Default business hours configuration
const defaultBusinessHours: BusinessHours[] = [
  { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:30", breakEnd: "13:30" }, // Monday
  { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:30", breakEnd: "13:30" }, // Tuesday
  { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:30", breakEnd: "13:30" }, // Wednesday
  { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:30", breakEnd: "13:30" }, // Thursday
  { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "18:00", breakStart: "12:30", breakEnd: "13:30" }, // Friday
  { dayOfWeek: 6, isOpen: true, openTime: "10:00", closeTime: "16:00" }, // Saturday
  { dayOfWeek: 0, isOpen: false, openTime: "", closeTime: "", notes: "Closed on Sundays" }, // Sunday
];

// Sample availability rules
const sampleRules: AvailabilityRule[] = [
  {
    id: 'holiday-closure-christmas',
    name: 'Christmas Day Closure',
    description: 'Closed on Christmas Day',
    type: 'blackout',
    priority: 100,
    dateRange: {
      start: '2024-12-25',
      end: '2024-12-25'
    },
    effect: {
      action: 'block',
      message: 'We are closed on Christmas Day. Please choose another date.'
    },
    enabled: true,
    createdBy: 'system',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z'
  },
  
  {
    id: 'water-damage-capacity-limit',
    name: 'Water Damage Daily Limit',
    description: 'Limit water damage repairs to 3 per day',
    type: 'repair_specific',
    priority: 50,
    repairTypes: ['water-damage-assessment'],
    effect: {
      action: 'limit',
      value: 3,
      message: 'We are at capacity for water damage repairs today. Please choose tomorrow or later.'
    },
    enabled: true,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z'
  },
  
  {
    id: 'weekend-surcharge',
    name: 'Weekend Service Surcharge',
    description: '15% surcharge for weekend appointments',
    type: 'seasonal',
    priority: 30,
    daysOfWeek: [0, 6], // Sunday and Saturday
    effect: {
      action: 'surcharge',
      value: 15,
      message: 'Weekend appointments include a 15% service surcharge.'
    },
    enabled: true,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z'
  },
  
  {
    id: 'short-notice-surcharge',
    name: 'Short Notice Booking Fee',
    description: '25% surcharge for bookings within 24 hours',
    type: 'custom',
    priority: 40,
    effect: {
      action: 'surcharge',
      value: 25,
      message: 'Bookings made within 24 hours include a 25% rush service fee.'
    },
    enabled: true,
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z'
  }
];

// Sample technician schedules
const sampleTechnicians: TechnicianSchedule[] = [
  {
    technicianId: 'tech-001',
    name: 'Alex Thompson',
    skillLevel: 'expert',
    specializations: ['motherboard-repair', 'water-damage-assessment', 'screen-replacement-basic'],
    regularHours: [
      { dayOfWeek: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "09:00", closeTime: "17:00" },
      { dayOfWeek: 6, isOpen: false, openTime: "", closeTime: "" },
      { dayOfWeek: 0, isOpen: false, openTime: "", closeTime: "" },
    ],
    exceptions: [],
    maxConcurrentJobs: 2,
    maxDailyJobs: 8,
    breakDuration: 15,
    averageJobTime: {
      'screen-replacement-basic': 90,
      'motherboard-repair': 240,
      'water-damage-assessment': 180
    },
    qualityScore: 9.5,
    customerRating: 4.9
  },
  
  {
    technicianId: 'tech-002',
    name: 'Sarah Chen',
    skillLevel: 'advanced',
    specializations: ['battery-replacement-phone', 'screen-replacement-basic', 'software-repair'],
    regularHours: [
      { dayOfWeek: 1, isOpen: true, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "10:00", closeTime: "18:00" },
      { dayOfWeek: 6, isOpen: true, openTime: "10:00", closeTime: "15:00" },
      { dayOfWeek: 0, isOpen: false, openTime: "", closeTime: "" },
    ],
    exceptions: [],
    maxConcurrentJobs: 3,
    maxDailyJobs: 12,
    breakDuration: 10,
    averageJobTime: {
      'battery-replacement-phone': 60,
      'screen-replacement-basic': 75,
      'software-repair': 120
    },
    qualityScore: 9.2,
    customerRating: 4.8
  }
];

// Main availability configuration
export const availabilityConfig: AvailabilityConfiguration = {
  businessName: 'RevivaTech Repair Services',
  timezone: 'Europe/London',
  
  scheduling: {
    advanceBookingDays: 30,
    minimumNoticeHours: 2,
    slotDuration: 30,
    bufferTime: 15,
    autoConfirm: false,
    overbookingAllowed: true,
    overbookingPercentage: 10
  },
  
  standardHours: defaultBusinessHours,
  
  holidays: [
    {
      date: '2024-12-25',
      name: 'Christmas Day',
      type: 'full_closure'
    },
    {
      date: '2024-12-26',
      name: 'Boxing Day',
      type: 'full_closure'
    },
    {
      date: '2024-01-01',
      name: 'New Year\'s Day',
      type: 'reduced_hours',
      alternateHours: [
        { dayOfWeek: 1, isOpen: true, openTime: "12:00", closeTime: "16:00" }
      ]
    },
    {
      date: '2024-12-24',
      name: 'Christmas Eve',
      type: 'reduced_hours',
      alternateHours: [
        { dayOfWeek: 2, isOpen: true, openTime: "09:00", closeTime: "14:00" }
      ]
    }
  ],
  
  capacity: {
    defaultSlotCapacity: 3,
    rushHourMultiplier: 1.5,
    seasonalAdjustments: {
      'january': 0.8,
      'february': 0.9,
      'march': 1.0,
      'april': 1.1,
      'may': 1.0,
      'june': 0.9,
      'july': 0.8,
      'august': 0.9,
      'september': 1.2,
      'october': 1.3,
      'november': 1.4,
      'december': 1.6
    },
    repairTypeCapacity: {
      'water-damage-assessment': 3,
      'motherboard-repair': 2,
      'screen-replacement-basic': 15,
      'battery-replacement-phone': 20
    }
  },
  
  serviceRules: {
    walkInPercentage: 25,
    emergencySlots: 2,
    priorityBookingHours: 48,
    maxConsecutiveJobs: 3
  },
  
  pricing: {
    peakHourSurcharge: 15,
    weekendSurcharge: 15,
    holidaySurcharge: 25,
    shortNoticeSurcharge: 25,
    
    timeBands: [
      {
        name: 'Peak Hours',
        start: '10:00',
        end: '14:00',
        modifier: 1.15,
        daysOfWeek: [1, 2, 3, 4, 5]
      },
      {
        name: 'Weekend Premium',
        start: '10:00',
        end: '16:00',
        modifier: 1.15,
        daysOfWeek: [6]
      }
    ]
  },
  
  rules: sampleRules,
  technicians: sampleTechnicians,
  
  integrations: {
    calendarSync: {
      enabled: true,
      provider: 'google',
      syncInterval: 15
    },
    notifications: {
      enabled: true,
      reminderHours: [24, 2],
      channels: ['email', 'sms']
    }
  }
};

// Availability checking service
export class AvailabilityService {
  
  /**
   * Check if a specific time slot is available
   */
  static isSlotAvailable(
    date: Date,
    time: string,
    repairType: string,
    technicianId?: string
  ): boolean {
    const dayOfWeek = date.getDay();
    const dateString = date.toISOString().split('T')[0];
    
    // Check business hours
    const businessHour = availabilityConfig.standardHours.find(h => h.dayOfWeek === dayOfWeek);
    if (!businessHour || !businessHour.isOpen) return false;
    
    // Check if time is within business hours
    if (time < businessHour.openTime || time >= businessHour.closeTime) return false;
    
    // Check break time
    if (businessHour.breakStart && businessHour.breakEnd) {
      if (time >= businessHour.breakStart && time < businessHour.breakEnd) return false;
    }
    
    // Check holidays
    const holiday = availabilityConfig.holidays.find(h => h.date === dateString);
    if (holiday) {
      if (holiday.type === 'full_closure') return false;
      if (holiday.type === 'no_emergency' && repairType.includes('emergency')) return false;
    }
    
    // Check availability rules
    const applicableRules = this.getApplicableRules(date, time, repairType, technicianId);
    for (const rule of applicableRules) {
      if (rule.effect.action === 'block') return false;
    }
    
    // Check technician availability
    if (technicianId) {
      const technician = availabilityConfig.technicians.find(t => t.technicianId === technicianId);
      if (!technician) return false;
      
      const techHour = technician.regularHours.find(h => h.dayOfWeek === dayOfWeek);
      if (!techHour || !techHour.isOpen) return false;
      if (time < techHour.openTime || time >= techHour.closeTime) return false;
      
      // Check technician exceptions
      const exception = technician.exceptions.find(e => e.date === dateString);
      if (exception && exception.unavailable) return false;
    }
    
    return true;
  }
  
  /**
   * Get available time slots for a specific date and repair type
   */
  static getAvailableSlots(
    date: Date,
    repairType: string,
    duration?: number
  ): TimeSlot[] {
    const dayOfWeek = date.getDay();
    const businessHour = availabilityConfig.standardHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!businessHour || !businessHour.isOpen) return [];
    
    const slots: TimeSlot[] = [];
    const slotDuration = duration || availabilityConfig.scheduling.slotDuration;
    const bufferTime = availabilityConfig.scheduling.bufferTime;
    
    // Generate slots from opening to closing time
    let currentTime = this.parseTime(businessHour.openTime);
    const closeTime = this.parseTime(businessHour.closeTime);
    
    while (currentTime < closeTime) {
      const timeString = this.formatTime(currentTime);
      
      if (this.isSlotAvailable(date, timeString, repairType)) {
        // Get compatible technicians
        const compatibleTechnicians = this.getCompatibleTechnicians(repairType);
        
        slots.push({
          id: `${date.toISOString().split('T')[0]}-${timeString}`,
          time: timeString,
          duration: slotDuration,
          capacity: availabilityConfig.capacity.defaultSlotCapacity,
          available: true,
          bookingCount: 0, // Would be fetched from booking system
          repairTypes: [repairType],
          skillLevel: this.getRequiredSkillLevel(repairType),
          technicianIds: compatibleTechnicians.map(t => t.technicianId)
        });
      }
      
      currentTime += slotDuration + bufferTime;
    }
    
    // Skip lunch break if configured
    if (businessHour.breakStart && businessHour.breakEnd) {
      const breakStart = this.parseTime(businessHour.breakStart);
      const breakEnd = this.parseTime(businessHour.breakEnd);
      
      return slots.filter(slot => {
        const slotTime = this.parseTime(slot.time);
        return slotTime < breakStart || slotTime >= breakEnd;
      });
    }
    
    return slots;
  }
  
  /**
   * Calculate pricing adjustments based on availability rules
   */
  static calculatePricingAdjustments(
    date: Date,
    time: string,
    repairType: string,
    basePrice: number
  ): { adjustedPrice: number; surcharges: Array<{ name: string; percentage: number; amount: number }> } {
    const surcharges: Array<{ name: string; percentage: number; amount: number }> = [];
    let totalMultiplier = 1.0;
    
    const dayOfWeek = date.getDay();
    const now = new Date();
    const hoursUntilAppointment = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Check for weekend surcharge
    if ([0, 6].includes(dayOfWeek)) {
      const percentage = availabilityConfig.pricing.weekendSurcharge;
      surcharges.push({
        name: 'Weekend Service',
        percentage,
        amount: basePrice * (percentage / 100)
      });
      totalMultiplier *= (1 + percentage / 100);
    }
    
    // Check for short notice surcharge
    if (hoursUntilAppointment < 24) {
      const percentage = availabilityConfig.pricing.shortNoticeSurcharge;
      surcharges.push({
        name: 'Short Notice',
        percentage,
        amount: basePrice * (percentage / 100)
      });
      totalMultiplier *= (1 + percentage / 100);
    }
    
    // Check for peak hour surcharge
    const timeBand = availabilityConfig.pricing.timeBands.find(band => 
      band.daysOfWeek.includes(dayOfWeek) &&
      time >= band.start &&
      time <= band.end
    );
    
    if (timeBand && timeBand.modifier > 1) {
      const percentage = (timeBand.modifier - 1) * 100;
      surcharges.push({
        name: timeBand.name,
        percentage,
        amount: basePrice * (percentage / 100)
      });
      totalMultiplier *= timeBand.modifier;
    }
    
    // Check for holiday surcharge
    const dateString = date.toISOString().split('T')[0];
    const holiday = availabilityConfig.holidays.find(h => h.date === dateString);
    if (holiday) {
      const percentage = availabilityConfig.pricing.holidaySurcharge;
      surcharges.push({
        name: `Holiday (${holiday.name})`,
        percentage,
        amount: basePrice * (percentage / 100)
      });
      totalMultiplier *= (1 + percentage / 100);
    }
    
    const adjustedPrice = Math.round(basePrice * totalMultiplier * 100) / 100;
    
    return { adjustedPrice, surcharges };
  }
  
  /**
   * Get applicable availability rules for a specific booking
   */
  private static getApplicableRules(
    date: Date,
    time: string,
    repairType: string,
    technicianId?: string
  ): AvailabilityRule[] {
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    return availabilityConfig.rules
      .filter(rule => rule.enabled)
      .filter(rule => {
        // Check date range
        if (rule.dateRange) {
          if (dateString < rule.dateRange.start || dateString > rule.dateRange.end) {
            return false;
          }
        }
        
        // Check time range
        if (rule.timeRange) {
          if (time < rule.timeRange.start || time > rule.timeRange.end) {
            return false;
          }
        }
        
        // Check days of week
        if (rule.daysOfWeek && !rule.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
        
        // Check repair types
        if (rule.repairTypes && !rule.repairTypes.includes(repairType)) {
          return false;
        }
        
        // Check technician
        if (rule.technicianIds && technicianId && !rule.technicianIds.includes(technicianId)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get technicians compatible with a repair type
   */
  private static getCompatibleTechnicians(repairType: string): TechnicianSchedule[] {
    return availabilityConfig.technicians.filter(tech => 
      tech.specializations.includes(repairType)
    );
  }
  
  /**
   * Get required skill level for a repair type
   */
  private static getRequiredSkillLevel(repairType: string): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    // This would typically be fetched from repair configuration
    const skillMap: Record<string, 'basic' | 'intermediate' | 'advanced' | 'expert'> = {
      'screen-replacement-basic': 'intermediate',
      'battery-replacement-phone': 'basic',
      'water-damage-assessment': 'expert',
      'motherboard-repair': 'expert'
    };
    
    return skillMap[repairType] || 'intermediate';
  }
  
  /**
   * Utility function to parse time string to minutes
   */
  private static parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Utility function to format minutes to time string
   */
  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get availability summary for a date range
   */
  static getAvailabilitySummary(
    startDate: Date,
    endDate: Date,
    repairType: string
  ): Array<{ date: string; availableSlots: number; totalSlots: number; utilization: number }> {
    const summary: Array<{ date: string; availableSlots: number; totalSlots: number; utilization: number }> = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const slots = this.getAvailableSlots(currentDate, repairType);
      const availableSlots = slots.filter(slot => slot.available).length;
      const totalSlots = slots.length;
      const utilization = totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0;
      
      summary.push({
        date: currentDate.toISOString().split('T')[0],
        availableSlots,
        totalSlots,
        utilization: Math.round(utilization * 100) / 100
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return summary;
  }
}

export default {
  availabilityConfig,
  AvailabilityService
};