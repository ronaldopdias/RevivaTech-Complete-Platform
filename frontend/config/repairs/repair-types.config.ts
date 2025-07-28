// Repair type configuration system for RevivaTech
// Defines all available repair services with pricing, complexity, and requirements

export interface RepairCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  estimatedTimeRange: [number, number]; // [min, max] in hours
  popularityScore: number; // 1-100 for sorting
}

export interface RepairType {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Pricing structure
  pricing: {
    basePrice: number;
    currency: 'GBP' | 'EUR' | 'USD';
    laborHours: number;
    hourlyRate: number;
    
    // Dynamic pricing factors
    complexityMultipliers: {
      simple: number;    // 0.8 - easier than expected
      standard: number;  // 1.0 - as expected
      complex: number;   // 1.3 - more complex
      extreme: number;   // 1.8 - very complex
    };
    
    urgencyMultipliers: {
      standard: number;   // 1.0 - 3-5 days
      priority: number;   // 1.25 - 1-2 days
      emergency: number;  // 1.5 - same day
    };
    
    conditionMultipliers: {
      excellent: number;  // 1.0 - minor issues
      good: number;      // 1.1 - some wear
      fair: number;      // 1.2 - multiple issues
      poor: number;      // 1.3 - extensive damage
    };
  };
  
  // Technical requirements
  technical: {
    skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    estimatedDuration: number; // hours
    requiredTools: string[];
    requiredParts: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    dataRisk: 'none' | 'low' | 'medium' | 'high';
    successRate: number; // percentage 0-100
  };
  
  // Service details
  service: {
    warranty: number; // months
    diagnosticRequired: boolean;
    testingRequired: boolean;
    calibrationRequired: boolean;
    softwareUpdateIncluded: boolean;
    dataBackupRecommended: boolean;
    customerPresenceRequired: boolean;
  };
  
  // Device compatibility
  compatibility: {
    deviceTypes: string[]; // 'smartphone', 'tablet', 'laptop', etc.
    brands: string[]; // 'apple', 'samsung', 'google', etc.
    excludedModels: string[]; // specific models not supported
    minYear: number; // minimum device year supported
    maxYear: number; // maximum device year (for legacy support)
  };
  
  // Presentation
  presentation: {
    shortDescription: string;
    longDescription: string;
    beforeAfterImages: string[];
    processSteps: string[];
    commonCauses: string[];
    preventionTips: string[];
    faqItems: Array<{ question: string; answer: string; }>;
  };
  
  // Analytics and business
  analytics: {
    popularityRank: number;
    conversionRate: number;
    customerSatisfaction: number;
    repeatBookingRate: number;
    seasonalTrends: Record<string, number>; // month -> demand multiplier
  };
  
  // Availability and scheduling
  availability: {
    enabled: boolean;
    requiresAppointment: boolean;
    walkInAccepted: boolean;
    advanceNoticeHours: number;
    maxBookingsPerDay: number;
    blockedDates: string[];
    seasonalAvailability: Record<string, boolean>;
  };
}

// Repair categories configuration
export const repairCategories: RepairCategory[] = [
  {
    id: 'screen-display',
    name: 'Screen & Display',
    description: 'Screen replacements, display issues, touch problems',
    icon: 'monitor',
    color: 'blue',
    priority: 1,
    estimatedTimeRange: [1, 4],
    popularityScore: 95
  },
  {
    id: 'battery-power',
    name: 'Battery & Power',
    description: 'Battery replacement, charging issues, power problems',
    icon: 'battery',
    color: 'green',
    priority: 2,
    estimatedTimeRange: [1, 3],
    popularityScore: 88
  },
  {
    id: 'hardware-repair',
    name: 'Hardware Repair',
    description: 'Internal component repair and replacement',
    icon: 'cpu',
    color: 'purple',
    priority: 3,
    estimatedTimeRange: [2, 8],
    popularityScore: 72
  },
  {
    id: 'water-damage',
    name: 'Water Damage',
    description: 'Liquid damage assessment and repair',
    icon: 'droplets',
    color: 'red',
    priority: 4,
    estimatedTimeRange: [4, 12],
    popularityScore: 45
  },
  {
    id: 'software-repair',
    name: 'Software Repair',
    description: 'Software issues, OS problems, performance optimization',
    icon: 'settings',
    color: 'orange',
    priority: 5,
    estimatedTimeRange: [1, 6],
    popularityScore: 78
  },
  {
    id: 'data-recovery',
    name: 'Data Recovery',
    description: 'Data recovery, file restoration, backup services',
    icon: 'hard-drive',
    color: 'yellow',
    priority: 6,
    estimatedTimeRange: [2, 24],
    popularityScore: 35
  }
];

// Comprehensive repair types configuration
export const repairTypes: RepairType[] = [
  // Screen & Display Repairs
  {
    id: 'screen-replacement-basic',
    name: 'Screen Replacement (Standard)',
    description: 'Standard LCD/OLED screen replacement for phones and tablets',
    category: 'screen-display',
    
    pricing: {
      basePrice: 89,
      currency: 'GBP',
      laborHours: 1.5,
      hourlyRate: 45,
      complexityMultipliers: {
        simple: 0.8,
        standard: 1.0,
        complex: 1.3,
        extreme: 1.8
      },
      urgencyMultipliers: {
        standard: 1.0,
        priority: 1.25,
        emergency: 1.5
      },
      conditionMultipliers: {
        excellent: 1.0,
        good: 1.1,
        fair: 1.2,
        poor: 1.3
      }
    },
    
    technical: {
      skillLevel: 'intermediate',
      estimatedDuration: 1.5,
      requiredTools: ['screwdrivers', 'spudgers', 'heat-gun', 'adhesive'],
      requiredParts: ['screen-assembly', 'adhesive-strips'],
      riskLevel: 'medium',
      dataRisk: 'low',
      successRate: 98
    },
    
    service: {
      warranty: 6,
      diagnosticRequired: true,
      testingRequired: true,
      calibrationRequired: true,
      softwareUpdateIncluded: false,
      dataBackupRecommended: true,
      customerPresenceRequired: false
    },
    
    compatibility: {
      deviceTypes: ['smartphone', 'tablet'],
      brands: ['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus'],
      excludedModels: [],
      minYear: 2016,
      maxYear: 2025
    },
    
    presentation: {
      shortDescription: 'Professional screen replacement with 6-month warranty',
      longDescription: 'Complete screen assembly replacement including touch digitizer, LCD/OLED panel, and front glass. All repairs include thorough testing and calibration.',
      beforeAfterImages: ['/images/repairs/screen-before-1.jpg', '/images/repairs/screen-after-1.jpg'],
      processSteps: [
        'Device inspection and damage assessment',
        'Careful disassembly and component removal',
        'Installation of new screen assembly',
        'Calibration and touch sensitivity testing',
        'Quality assurance and final inspection'
      ],
      commonCauses: [
        'Accidental drops and impacts',
        'Pressure damage from tight pockets',
        'Manufacturing defects over time',
        'Extreme temperature exposure'
      ],
      preventionTips: [
        'Use a quality screen protector',
        'Invest in a protective case',
        'Avoid extreme temperatures',
        'Handle device with care'
      ],
      faqItems: [
        {
          question: 'Will my data be safe during screen replacement?',
          answer: 'Yes, screen replacement typically doesn\'t affect your data. However, we always recommend backing up important data before any repair.'
        },
        {
          question: 'How long does the warranty last?',
          answer: 'All screen replacements come with a 6-month warranty covering the replaced screen and our workmanship.'
        }
      ]
    },
    
    analytics: {
      popularityRank: 1,
      conversionRate: 85,
      customerSatisfaction: 4.8,
      repeatBookingRate: 12,
      seasonalTrends: {
        'january': 1.2, 'february': 1.0, 'march': 1.1,
        'april': 1.0, 'may': 0.9, 'june': 0.8,
        'july': 0.9, 'august': 1.0, 'september': 1.3,
        'october': 1.1, 'november': 1.4, 'december': 1.6
      }
    },
    
    availability: {
      enabled: true,
      requiresAppointment: false,
      walkInAccepted: true,
      advanceNoticeHours: 2,
      maxBookingsPerDay: 15,
      blockedDates: [],
      seasonalAvailability: {
        'winter': true, 'spring': true, 'summer': true, 'autumn': true
      }
    }
  },
  
  {
    id: 'battery-replacement-phone',
    name: 'Phone Battery Replacement',
    description: 'Professional battery replacement for smartphones',
    category: 'battery-power',
    
    pricing: {
      basePrice: 65,
      currency: 'GBP',
      laborHours: 1.0,
      hourlyRate: 45,
      complexityMultipliers: {
        simple: 0.9,
        standard: 1.0,
        complex: 1.2,
        extreme: 1.5
      },
      urgencyMultipliers: {
        standard: 1.0,
        priority: 1.25,
        emergency: 1.5
      },
      conditionMultipliers: {
        excellent: 1.0,
        good: 1.0,
        fair: 1.1,
        poor: 1.2
      }
    },
    
    technical: {
      skillLevel: 'intermediate',
      estimatedDuration: 1.0,
      requiredTools: ['screwdrivers', 'spudgers', 'battery-adhesive-remover'],
      requiredParts: ['battery', 'adhesive-strips'],
      riskLevel: 'low',
      dataRisk: 'none',
      successRate: 99
    },
    
    service: {
      warranty: 12,
      diagnosticRequired: true,
      testingRequired: true,
      calibrationRequired: true,
      softwareUpdateIncluded: false,
      dataBackupRecommended: false,
      customerPresenceRequired: false
    },
    
    compatibility: {
      deviceTypes: ['smartphone'],
      brands: ['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus', 'sony'],
      excludedModels: [],
      minYear: 2015,
      maxYear: 2025
    },
    
    presentation: {
      shortDescription: 'High-quality battery replacement with 12-month warranty',
      longDescription: 'Professional battery replacement using genuine or premium aftermarket batteries. Includes battery calibration and health optimization.',
      beforeAfterImages: ['/images/repairs/battery-before-1.jpg', '/images/repairs/battery-after-1.jpg'],
      processSteps: [
        'Battery health diagnostic test',
        'Careful device disassembly',
        'Safe removal of old battery',
        'Installation of new battery',
        'Calibration and performance testing'
      ],
      commonCauses: [
        'Natural battery degradation over time',
        'Extreme temperature exposure',
        'Overcharging or deep discharge cycles',
        'Manufacturing defects'
      ],
      preventionTips: [
        'Avoid extreme temperatures',
        'Don\'t let battery drain completely',
        'Use original chargers when possible',
        'Avoid overnight charging regularly'
      ],
      faqItems: [
        {
          question: 'How long will the new battery last?',
          answer: 'A new battery should provide 2-3 years of normal use, depending on usage patterns and care.'
        },
        {
          question: 'Is it safe to replace the battery?',
          answer: 'Yes, our technicians are trained in safe battery handling and disposal. We follow all safety protocols.'
        }
      ]
    },
    
    analytics: {
      popularityRank: 2,
      conversionRate: 90,
      customerSatisfaction: 4.9,
      repeatBookingRate: 8,
      seasonalTrends: {
        'january': 1.3, 'february': 1.2, 'march': 1.0,
        'april': 0.9, 'may': 0.8, 'june': 0.7,
        'july': 0.8, 'august': 0.9, 'september': 1.1,
        'october': 1.2, 'november': 1.4, 'december': 1.5
      }
    },
    
    availability: {
      enabled: true,
      requiresAppointment: false,
      walkInAccepted: true,
      advanceNoticeHours: 1,
      maxBookingsPerDay: 20,
      blockedDates: [],
      seasonalAvailability: {
        'winter': true, 'spring': true, 'summer': true, 'autumn': true
      }
    }
  },
  
  {
    id: 'water-damage-assessment',
    name: 'Water Damage Assessment & Repair',
    description: 'Comprehensive liquid damage evaluation and restoration',
    category: 'water-damage',
    
    pricing: {
      basePrice: 45, // Assessment fee, repair priced separately
      currency: 'GBP',
      laborHours: 2.0,
      hourlyRate: 55,
      complexityMultipliers: {
        simple: 1.0,
        standard: 1.5,
        complex: 2.5,
        extreme: 4.0
      },
      urgencyMultipliers: {
        standard: 1.0,
        priority: 1.3,
        emergency: 1.8
      },
      conditionMultipliers: {
        excellent: 1.0,
        good: 1.2,
        fair: 1.8,
        poor: 3.0
      }
    },
    
    technical: {
      skillLevel: 'expert',
      estimatedDuration: 4.0,
      requiredTools: ['ultrasonic-cleaner', 'isopropyl-alcohol', 'microscope', 'multimeter'],
      requiredParts: ['various-components'],
      riskLevel: 'critical',
      dataRisk: 'high',
      successRate: 65
    },
    
    service: {
      warranty: 3,
      diagnosticRequired: true,
      testingRequired: true,
      calibrationRequired: true,
      softwareUpdateIncluded: false,
      dataBackupRecommended: true,
      customerPresenceRequired: false
    },
    
    compatibility: {
      deviceTypes: ['smartphone', 'tablet', 'laptop', 'watch'],
      brands: ['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'sony', 'lg'],
      excludedModels: [],
      minYear: 2010,
      maxYear: 2025
    },
    
    presentation: {
      shortDescription: 'Professional liquid damage assessment with potential restoration',
      longDescription: 'Comprehensive evaluation of liquid-damaged devices with professional cleaning, component testing, and repair where possible. No fix, no fee policy for irreparable devices.',
      beforeAfterImages: ['/images/repairs/water-before-1.jpg', '/images/repairs/water-after-1.jpg'],
      processSteps: [
        'Immediate triage and damage assessment',
        'Complete disassembly and component inspection',
        'Ultrasonic cleaning and corrosion removal',
        'Component testing and replacement',
        'Reassembly and functionality testing'
      ],
      commonCauses: [
        'Accidental water immersion',
        'Liquid spills (coffee, soda, etc.)',
        'High humidity exposure',
        'Rain or weather exposure'
      ],
      preventionTips: [
        'Use waterproof cases near water',
        'Keep devices away from liquids',
        'Act immediately if liquid exposure occurs',
        'Don\'t charge wet devices'
      ],
      faqItems: [
        {
          question: 'What should I do immediately after water damage?',
          answer: 'Turn off the device immediately, remove the battery if possible, and bring it to us as soon as possible. Don\'t try to turn it on or charge it.'
        },
        {
          question: 'What are the chances of recovery?',
          answer: 'Success rates vary greatly depending on the type of liquid, exposure time, and device type. We provide honest assessments and no-fix-no-fee policies.'
        }
      ]
    },
    
    analytics: {
      popularityRank: 8,
      conversionRate: 45,
      customerSatisfaction: 4.2,
      repeatBookingRate: 25,
      seasonalTrends: {
        'january': 0.8, 'february': 0.7, 'march': 0.9,
        'april': 1.0, 'may': 1.2, 'june': 1.5,
        'july': 1.8, 'august': 1.6, 'september': 1.1,
        'october': 0.9, 'november': 0.8, 'december': 1.0
      }
    },
    
    availability: {
      enabled: true,
      requiresAppointment: true,
      walkInAccepted: false,
      advanceNoticeHours: 24,
      maxBookingsPerDay: 3,
      blockedDates: [],
      seasonalAvailability: {
        'winter': true, 'spring': true, 'summer': true, 'autumn': true
      }
    }
  },
  
  {
    id: 'motherboard-repair',
    name: 'Motherboard/Logic Board Repair',
    description: 'Advanced component-level motherboard repair',
    category: 'hardware-repair',
    
    pricing: {
      basePrice: 150,
      currency: 'GBP',
      laborHours: 4.0,
      hourlyRate: 75,
      complexityMultipliers: {
        simple: 1.0,
        standard: 1.5,
        complex: 2.2,
        extreme: 3.5
      },
      urgencyMultipliers: {
        standard: 1.0,
        priority: 1.4,
        emergency: 2.0
      },
      conditionMultipliers: {
        excellent: 1.0,
        good: 1.2,
        fair: 1.6,
        poor: 2.5
      }
    },
    
    technical: {
      skillLevel: 'expert',
      estimatedDuration: 6.0,
      requiredTools: ['soldering-station', 'hot-air-rework', 'microscope', 'multimeter', 'oscilloscope'],
      requiredParts: ['various-ic-components'],
      riskLevel: 'critical',
      dataRisk: 'high',
      successRate: 75
    },
    
    service: {
      warranty: 6,
      diagnosticRequired: true,
      testingRequired: true,
      calibrationRequired: true,
      softwareUpdateIncluded: false,
      dataBackupRecommended: true,
      customerPresenceRequired: false
    },
    
    compatibility: {
      deviceTypes: ['smartphone', 'tablet', 'laptop'],
      brands: ['apple', 'samsung', 'google', 'huawei'],
      excludedModels: ['very-old-models'],
      minYear: 2018,
      maxYear: 2025
    },
    
    presentation: {
      shortDescription: 'Expert-level motherboard repair for complex hardware issues',
      longDescription: 'Advanced component-level repair for motherboard issues including IC replacement, trace repair, and power management problems. Performed by certified micro-soldering specialists.',
      beforeAfterImages: ['/images/repairs/motherboard-before-1.jpg', '/images/repairs/motherboard-after-1.jpg'],
      processSteps: [
        'Detailed diagnostic testing',
        'Component-level fault isolation',
        'Micro-soldering and IC replacement',
        'Circuit testing and validation',
        'Full system integration testing'
      ],
      commonCauses: [
        'Water damage and corrosion',
        'Physical impact damage',
        'Electrical surge damage',
        'Component aging and failure'
      ],
      preventionTips: [
        'Protect from physical impacts',
        'Avoid liquid exposure',
        'Use surge protectors',
        'Regular maintenance checks'
      ],
      faqItems: [
        {
          question: 'Is motherboard repair worth it?',
          answer: 'For newer devices, motherboard repair can be cost-effective compared to replacement. We provide detailed cost-benefit analysis.'
        },
        {
          question: 'How long does motherboard repair take?',
          answer: 'Complex motherboard repairs typically take 3-7 business days depending on the specific issues and parts availability.'
        }
      ]
    },
    
    analytics: {
      popularityRank: 12,
      conversionRate: 35,
      customerSatisfaction: 4.6,
      repeatBookingRate: 5,
      seasonalTrends: {
        'january': 1.1, 'february': 1.0, 'march': 1.0,
        'april': 0.9, 'may': 0.9, 'june': 0.8,
        'july': 0.8, 'august': 0.9, 'september': 1.1,
        'october': 1.2, 'november': 1.3, 'december': 1.4
      }
    },
    
    availability: {
      enabled: true,
      requiresAppointment: true,
      walkInAccepted: false,
      advanceNoticeHours: 48,
      maxBookingsPerDay: 2,
      blockedDates: [],
      seasonalAvailability: {
        'winter': true, 'spring': true, 'summer': true, 'autumn': true
      }
    }
  }
];

// Utility functions for repair configuration
export class RepairConfigurationService {
  /**
   * Get repair types by category
   */
  static getRepairsByCategory(categoryId: string): RepairType[] {
    return repairTypes.filter(repair => repair.category === categoryId);
  }
  
  /**
   * Get compatible repairs for a device
   */
  static getCompatibleRepairs(deviceType: string, brand: string, year: number): RepairType[] {
    return repairTypes.filter(repair => {
      const isDeviceTypeCompatible = repair.compatibility.deviceTypes.includes(deviceType);
      const isBrandCompatible = repair.compatibility.brands.includes(brand.toLowerCase());
      const isYearCompatible = year >= repair.compatibility.minYear && year <= repair.compatibility.maxYear;
      
      return isDeviceTypeCompatible && isBrandCompatible && isYearCompatible && repair.availability.enabled;
    });
  }
  
  /**
   * Calculate dynamic pricing for a repair
   */
  static calculatePrice(
    repairId: string,
    complexity: 'simple' | 'standard' | 'complex' | 'extreme',
    urgency: 'standard' | 'priority' | 'emergency',
    condition: 'excellent' | 'good' | 'fair' | 'poor'
  ): { basePrice: number; laborCost: number; totalPrice: number; breakdown: any } {
    const repair = repairTypes.find(r => r.id === repairId);
    if (!repair) throw new Error(`Repair type ${repairId} not found`);
    
    const { pricing } = repair;
    const complexityMultiplier = pricing.complexityMultipliers[complexity];
    const urgencyMultiplier = pricing.urgencyMultipliers[urgency];
    const conditionMultiplier = pricing.conditionMultipliers[condition];
    
    const basePrice = pricing.basePrice;
    const laborCost = pricing.laborHours * pricing.hourlyRate;
    const subtotal = basePrice + laborCost;
    
    const finalMultiplier = complexityMultiplier * urgencyMultiplier * conditionMultiplier;
    const totalPrice = Math.round(subtotal * finalMultiplier * 100) / 100;
    
    return {
      basePrice,
      laborCost,
      totalPrice,
      breakdown: {
        partsPrice: basePrice,
        laborPrice: laborCost,
        complexityAdjustment: (complexityMultiplier - 1) * 100,
        urgencyAdjustment: (urgencyMultiplier - 1) * 100,
        conditionAdjustment: (conditionMultiplier - 1) * 100,
        finalMultiplier
      }
    };
  }
  
  /**
   * Get popular repairs by analytics data
   */
  static getPopularRepairs(limit: number = 10): RepairType[] {
    return repairTypes
      .filter(repair => repair.availability.enabled)
      .sort((a, b) => b.analytics.popularityRank - a.analytics.popularityRank)
      .slice(0, limit);
  }
  
  /**
   * Get seasonal demand multiplier for current date
   */
  static getSeasonalDemand(repairId: string, date: Date = new Date()): number {
    const repair = repairTypes.find(r => r.id === repairId);
    if (!repair) return 1.0;
    
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const currentMonth = monthNames[date.getMonth()];
    return repair.analytics.seasonalTrends[currentMonth] || 1.0;
  }
  
  /**
   * Validate repair availability for specific date
   */
  static isRepairAvailable(repairId: string, date: Date): boolean {
    const repair = repairTypes.find(r => r.id === repairId);
    if (!repair || !repair.availability.enabled) return false;
    
    const dateString = date.toISOString().split('T')[0];
    return !repair.availability.blockedDates.includes(dateString);
  }
  
  /**
   * Get estimated completion time
   */
  static getEstimatedCompletion(
    repairId: string,
    complexity: 'simple' | 'standard' | 'complex' | 'extreme',
    urgency: 'standard' | 'priority' | 'emergency'
  ): { hours: number; businessDays: number } {
    const repair = repairTypes.find(r => r.id === repairId);
    if (!repair) throw new Error(`Repair type ${repairId} not found`);
    
    let baseHours = repair.technical.estimatedDuration;
    
    // Adjust for complexity
    const complexityMultipliers = { simple: 0.8, standard: 1.0, complex: 1.4, extreme: 2.0 };
    baseHours *= complexityMultipliers[complexity];
    
    // Adjust for urgency (affects scheduling priority, not duration)
    const hours = Math.ceil(baseHours);
    
    // Convert to business days (8-hour workdays)
    let businessDays = Math.ceil(hours / 8);
    
    // Urgency affects turnaround time
    if (urgency === 'priority') businessDays = Math.max(1, Math.ceil(businessDays / 2));
    if (urgency === 'emergency') businessDays = 1;
    
    return { hours, businessDays };
  }
}

export default {
  repairCategories,
  repairTypes,
  RepairConfigurationService
};