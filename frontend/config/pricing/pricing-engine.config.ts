// Advanced pricing engine configuration for RevivaTech
// Handles dynamic pricing, rules-based calculations, and real-time quote generation

export interface PricingFactor {
  id: string;
  name: string;
  description: string;
  type: 'multiplier' | 'fixed_amount' | 'percentage' | 'tiered' | 'conditional';
  weight: number; // 0-1, how much this factor influences final price
  
  // Factor values
  values: Record<string, {
    value: number;
    label: string;
    description?: string;
    conditions?: Record<string, any>;
  }>;
  
  // Application rules
  appliesTo: {
    repairTypes?: string[];
    deviceTypes?: string[];
    brands?: string[];
    categories?: string[];
    all?: boolean;
  };
  
  // Constraints
  constraints: {
    minValue?: number;
    maxValue?: number;
    precision?: number; // decimal places
    currency?: string;
  };
  
  // Business rules
  businessRules: {
    stackable: boolean; // can be combined with other factors
    overrides?: string[]; // factor IDs this overrides
    requires?: string[]; // factor IDs this requires
    mutuallyExclusive?: string[]; // factor IDs this cannot combine with
  };
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  priority: number; // higher numbers execute first
  
  // Conditions for rule activation
  conditions: {
    deviceType?: string[];
    repairType?: string[];
    brand?: string[];
    timeOfDay?: { start: string; end: string; };
    dayOfWeek?: number[];
    season?: string[];
    customerType?: string[];
    orderValue?: { min?: number; max?: number; };
    urgency?: string[];
    complexity?: string[];
    condition?: string[];
  };
  
  // Rule effects
  effects: Array<{
    type: 'adjust_base_price' | 'apply_discount' | 'add_surcharge' | 'set_minimum' | 'set_maximum' | 'round_to';
    value: number;
    target?: 'labor' | 'parts' | 'total' | 'specific_component';
    message?: string;
    metadata?: Record<string, any>;
  }>;
  
  // Rule metadata
  enabled: boolean;
  validFrom?: string;
  validTo?: string;
  usageLimit?: number;
  usageCount?: number;
}

export interface PricingConfiguration {
  // Global settings
  currency: string;
  precision: number;
  roundingMethod: 'round' | 'ceil' | 'floor';
  taxRate: number;
  taxInclusive: boolean;
  
  // Base pricing structure
  basePricing: {
    minimumCharge: number;
    maximumCharge?: number;
    diagnosticFee: number;
    diagnosticWaived: boolean; // waived if repair is done
    emergencyFee: number;
    calloutFee: number;
    cancellationFee: number;
  };
  
  // Labor rates
  laborRates: {
    basic: number;      // per hour
    intermediate: number;
    advanced: number;
    expert: number;
    overtime: number;   // multiplier for after hours
    weekend: number;    // multiplier for weekends
    holiday: number;    // multiplier for holidays
  };
  
  // Parts pricing
  partsPricing: {
    markup: number;     // percentage markup on cost
    minimumMarkup: number; // minimum amount in currency
    premiumParts: number;  // multiplier for premium parts
    oem: number;        // multiplier for OEM parts
    refurbished: number; // multiplier for refurbished parts
    warranty: number;   // cost for extended warranty
  };
  
  // Dynamic pricing factors
  factors: PricingFactor[];
  
  // Business rules
  rules: PricingRule[];
  
  // Discount structure
  discounts: {
    student: number;      // percentage
    senior: number;
    bulk: Array<{ min: number; discount: number; }>; // quantity-based
    loyalty: Array<{ tier: string; discount: number; }>; // loyalty-based
    referral: number;
    firstTime: number;
    promotional: Array<{
      code: string;
      discount: number;
      validFrom: string;
      validTo: string;
      usageLimit?: number;
    }>;
  };
  
  // Payment terms
  paymentTerms: {
    upfrontRequired: number;  // percentage
    depositRequired: boolean;
    depositAmount: number;    // or percentage
    paymentMethods: string[];
    latePaymentFee: number;
    refundPolicy: {
      fullRefund: number;     // days
      partialRefund: number;  // days
      noRefund: number;       // days
    };
  };
  
  // Competitive pricing
  competitive: {
    enabled: boolean;
    priceMatching: boolean;
    beatByPercentage: number;
    monitorCompetitors: string[];
    adjustmentFrequency: 'daily' | 'weekly' | 'monthly';
  };
  
  // Analytics and optimization
  analytics: {
    trackConversion: boolean;
    abtestEnabled: boolean;
    priceElasticity: boolean;
    demandForecasting: boolean;
    profitMargins: {
      target: number;
      minimum: number;
      alert: number;
    };
  };
}

// Pricing factors configuration
const pricingFactors: PricingFactor[] = [
  {
    id: 'device_age',
    name: 'Device Age',
    description: 'Pricing adjustment based on device age',
    type: 'multiplier',
    weight: 0.3,
    values: {
      'new': { value: 1.0, label: 'New (0-1 years)', description: 'Latest devices' },
      'recent': { value: 1.1, label: 'Recent (1-2 years)', description: 'Relatively new' },
      'standard': { value: 1.2, label: 'Standard (2-4 years)', description: 'Common age range' },
      'older': { value: 1.4, label: 'Older (4-6 years)', description: 'Harder to find parts' },
      'vintage': { value: 1.8, label: 'Vintage (6+ years)', description: 'Rare parts required' }
    },
    appliesTo: { all: true },
    constraints: {
      minValue: 1.0,
      maxValue: 2.0,
      precision: 2
    },
    businessRules: {
      stackable: true,
      overrides: [],
      requires: [],
      mutuallyExclusive: []
    }
  },
  
  {
    id: 'damage_severity',
    name: 'Damage Severity',
    description: 'Adjustment based on extent of damage',
    type: 'multiplier',
    weight: 0.4,
    values: {
      'minor': { value: 0.9, label: 'Minor Damage', description: 'Small cracks or scratches' },
      'moderate': { value: 1.0, label: 'Moderate Damage', description: 'Standard repair scope' },
      'severe': { value: 1.3, label: 'Severe Damage', description: 'Multiple issues or complications' },
      'extensive': { value: 1.6, label: 'Extensive Damage', description: 'Major reconstruction required' },
      'catastrophic': { value: 2.0, label: 'Catastrophic', description: 'Near total replacement needed' }
    },
    appliesTo: { all: true },
    constraints: {
      minValue: 0.8,
      maxValue: 2.5,
      precision: 2
    },
    businessRules: {
      stackable: true,
      overrides: [],
      requires: [],
      mutuallyExclusive: []
    }
  },
  
  {
    id: 'parts_availability',
    name: 'Parts Availability',
    description: 'Pricing based on parts availability and sourcing difficulty',
    type: 'multiplier',
    weight: 0.25,
    values: {
      'in_stock': { value: 1.0, label: 'In Stock', description: 'Parts readily available' },
      'next_day': { value: 1.1, label: 'Next Day Delivery', description: 'Parts available next day' },
      'week_lead': { value: 1.2, label: 'Week Lead Time', description: 'Parts available within a week' },
      'special_order': { value: 1.4, label: 'Special Order', description: 'Must be specially ordered' },
      'rare_parts': { value: 1.8, label: 'Rare/Discontinued', description: 'Difficult to source' }
    },
    appliesTo: { all: true },
    constraints: {
      minValue: 1.0,
      maxValue: 2.0,
      precision: 2
    },
    businessRules: {
      stackable: true,
      overrides: [],
      requires: [],
      mutuallyExclusive: []
    }
  },
  
  {
    id: 'service_urgency',
    name: 'Service Urgency',
    description: 'Surcharge for expedited service',
    type: 'multiplier',
    weight: 0.3,
    values: {
      'standard': { value: 1.0, label: 'Standard (3-5 days)', description: 'Normal service timeline' },
      'priority': { value: 1.25, label: 'Priority (1-2 days)', description: 'Expedited service' },
      'rush': { value: 1.5, label: 'Rush (same day)', description: 'Same day completion' },
      'emergency': { value: 2.0, label: 'Emergency (immediate)', description: 'Immediate attention required' }
    },
    appliesTo: { all: true },
    constraints: {
      minValue: 1.0,
      maxValue: 2.5,
      precision: 2
    },
    businessRules: {
      stackable: true,
      overrides: [],
      requires: [],
      mutuallyExclusive: []
    }
  },
  
  {
    id: 'brand_premium',
    name: 'Brand Premium',
    description: 'Pricing adjustment based on device brand',
    type: 'multiplier',
    weight: 0.2,
    values: {
      'apple': { value: 1.2, label: 'Apple', description: 'Premium brand with specialized tools' },
      'samsung': { value: 1.1, label: 'Samsung', description: 'Popular brand with good parts availability' },
      'google': { value: 1.1, label: 'Google Pixel', description: 'Specialized components' },
      'huawei': { value: 1.0, label: 'Huawei', description: 'Standard pricing' },
      'xiaomi': { value: 0.9, label: 'Xiaomi', description: 'Lower complexity' },
      'other': { value: 0.95, label: 'Other Brands', description: 'Generic pricing' }
    },
    appliesTo: { deviceTypes: ['smartphone', 'tablet', 'laptop'] },
    constraints: {
      minValue: 0.8,
      maxValue: 1.5,
      precision: 2
    },
    businessRules: {
      stackable: true,
      overrides: [],
      requires: [],
      mutuallyExclusive: []
    }
  }
];

// Pricing rules configuration
const pricingRules: PricingRule[] = [
  {
    id: 'minimum_viable_repair',
    name: 'Minimum Viable Repair Cost',
    description: 'Ensure all repairs meet minimum viable cost',
    priority: 100,
    conditions: {},
    effects: [
      {
        type: 'set_minimum',
        value: 35,
        target: 'total',
        message: 'Minimum repair charge applied'
      }
    ],
    enabled: true
  },
  
  {
    id: 'water_damage_diagnostic',
    name: 'Water Damage Diagnostic Fee',
    description: 'Special diagnostic fee for water damaged devices',
    priority: 90,
    conditions: {
      repairType: ['water-damage-assessment']
    },
    effects: [
      {
        type: 'add_surcharge',
        value: 25,
        target: 'total',
        message: 'Water damage diagnostic fee'
      }
    ],
    enabled: true
  },
  
  {
    id: 'weekend_premium',
    name: 'Weekend Service Premium',
    description: '15% surcharge for weekend appointments',
    priority: 80,
    conditions: {
      dayOfWeek: [0, 6] // Sunday and Saturday
    },
    effects: [
      {
        type: 'apply_discount',
        value: -15, // negative for surcharge
        target: 'total',
        message: 'Weekend service premium (15%)'
      }
    ],
    enabled: true
  },
  
  {
    id: 'bulk_device_discount',
    name: 'Bulk Device Discount',
    description: 'Discount for multiple device repairs',
    priority: 70,
    conditions: {
      orderValue: { min: 200 }
    },
    effects: [
      {
        type: 'apply_discount',
        value: 10,
        target: 'total',
        message: 'Bulk repair discount (10%)'
      }
    ],
    enabled: true
  },
  
  {
    id: 'student_discount',
    name: 'Student Discount',
    description: '15% discount for students with valid ID',
    priority: 60,
    conditions: {
      customerType: ['student']
    },
    effects: [
      {
        type: 'apply_discount',
        value: 15,
        target: 'total',
        message: 'Student discount (15%)'
      }
    ],
    enabled: true
  },
  
  {
    id: 'round_to_nearest_five',
    name: 'Round to Nearest £5',
    description: 'Round final price to nearest £5 for clean pricing',
    priority: 10,
    conditions: {},
    effects: [
      {
        type: 'round_to',
        value: 5,
        target: 'total',
        message: 'Rounded to nearest £5'
      }
    ],
    enabled: true
  }
];

// Main pricing configuration
export const pricingEngineConfig: PricingConfiguration = {
  currency: 'GBP',
  precision: 2,
  roundingMethod: 'round',
  taxRate: 20, // 20% VAT
  taxInclusive: true,
  
  basePricing: {
    minimumCharge: 35,
    maximumCharge: 800,
    diagnosticFee: 25,
    diagnosticWaived: true,
    emergencyFee: 50,
    calloutFee: 25,
    cancellationFee: 15
  },
  
  laborRates: {
    basic: 35,       // £35/hour
    intermediate: 45, // £45/hour
    advanced: 60,    // £60/hour
    expert: 80,      // £80/hour
    overtime: 1.5,   // 1.5x multiplier
    weekend: 1.25,   // 1.25x multiplier
    holiday: 1.5     // 1.5x multiplier
  },
  
  partsPricing: {
    markup: 40,         // 40% markup
    minimumMarkup: 10,  // minimum £10 markup
    premiumParts: 1.2,  // 20% more for premium
    oem: 1.3,          // 30% more for OEM
    refurbished: 0.7,   // 30% less for refurbished
    warranty: 15        // £15 for extended warranty
  },
  
  factors: pricingFactors,
  rules: pricingRules,
  
  discounts: {
    student: 15,        // 15% student discount
    senior: 10,         // 10% senior discount
    bulk: [
      { min: 2, discount: 5 },   // 5% for 2+ devices
      { min: 5, discount: 10 },  // 10% for 5+ devices
      { min: 10, discount: 15 }  // 15% for 10+ devices
    ],
    loyalty: [
      { tier: 'bronze', discount: 5 },
      { tier: 'silver', discount: 10 },
      { tier: 'gold', discount: 15 },
      { tier: 'platinum', discount: 20 }
    ],
    referral: 10,       // 10% referral discount
    firstTime: 5,       // 5% first-time customer
    promotional: [
      {
        code: 'SUMMER2024',
        discount: 20,
        validFrom: '2024-06-01',
        validTo: '2024-08-31',
        usageLimit: 1000
      }
    ]
  },
  
  paymentTerms: {
    upfrontRequired: 50,    // 50% upfront
    depositRequired: true,
    depositAmount: 25,      // £25 or 50% if less
    paymentMethods: ['card', 'cash', 'bank_transfer', 'paypal'],
    latePaymentFee: 15,
    refundPolicy: {
      fullRefund: 7,      // 7 days full refund
      partialRefund: 14,  // 14 days partial refund
      noRefund: 30        // 30 days no refund
    }
  },
  
  competitive: {
    enabled: true,
    priceMatching: true,
    beatByPercentage: 5,    // beat competitor by 5%
    monitorCompetitors: ['iphone-repairs-london', 'phone-fix-uk', 'repair-cafe'],
    adjustmentFrequency: 'weekly'
  },
  
  analytics: {
    trackConversion: true,
    abtestEnabled: true,
    priceElasticity: true,
    demandForecasting: true,
    profitMargins: {
      target: 65,         // target 65% margin
      minimum: 40,        // minimum 40% margin
      alert: 45           // alert if below 45%
    }
  }
};

// Pricing calculation engine
export class PricingEngine {
  
  /**
   * Calculate complete pricing for a repair
   */
  static calculateRepairPrice(params: {
    repairType: string;
    deviceType: string;
    brand: string;
    deviceAge: string;
    damageSeverity: string;
    urgency: string;
    partsAvailability: string;
    customerType?: string;
    quantity?: number;
    promotionalCode?: string;
    appointmentDate?: Date;
  }): {
    breakdown: PriceBreakdown;
    total: number;
    messages: string[];
    factors: AppliedFactor[];
    discounts: AppliedDiscount[];
  } {
    
    const config = pricingEngineConfig;
    const messages: string[] = [];
    const appliedFactors: AppliedFactor[] = [];
    const appliedDiscounts: AppliedDiscount[] = [];
    
    // Get base pricing for repair type
    let basePrice = this.getBasePriceForRepair(params.repairType);
    let laborCost = this.getLaborCostForRepair(params.repairType);
    
    // Apply pricing factors
    let factorMultiplier = 1.0;
    
    // Device age factor
    const ageFactor = pricingFactors.find(f => f.id === 'device_age');
    if (ageFactor && ageFactor.values[params.deviceAge]) {
      const ageValue = ageFactor.values[params.deviceAge];
      factorMultiplier *= ageValue.value;
      appliedFactors.push({
        id: ageFactor.id,
        name: ageFactor.name,
        value: ageValue.value,
        label: ageValue.label,
        impact: (ageValue.value - 1) * 100
      });
    }
    
    // Damage severity factor
    const severityFactor = pricingFactors.find(f => f.id === 'damage_severity');
    if (severityFactor && severityFactor.values[params.damageSeverity]) {
      const severityValue = severityFactor.values[params.damageSeverity];
      factorMultiplier *= severityValue.value;
      appliedFactors.push({
        id: severityFactor.id,
        name: severityFactor.name,
        value: severityValue.value,
        label: severityValue.label,
        impact: (severityValue.value - 1) * 100
      });
    }
    
    // Urgency factor
    const urgencyFactor = pricingFactors.find(f => f.id === 'service_urgency');
    if (urgencyFactor && urgencyFactor.values[params.urgency]) {
      const urgencyValue = urgencyFactor.values[params.urgency];
      factorMultiplier *= urgencyValue.value;
      appliedFactors.push({
        id: urgencyFactor.id,
        name: urgencyFactor.name,
        value: urgencyValue.value,
        label: urgencyValue.label,
        impact: (urgencyValue.value - 1) * 100
      });
    }
    
    // Brand premium factor
    const brandFactor = pricingFactors.find(f => f.id === 'brand_premium');
    if (brandFactor && brandFactor.values[params.brand.toLowerCase()]) {
      const brandValue = brandFactor.values[params.brand.toLowerCase()];
      factorMultiplier *= brandValue.value;
      appliedFactors.push({
        id: brandFactor.id,
        name: brandFactor.name,
        value: brandValue.value,
        label: brandValue.label,
        impact: (brandValue.value - 1) * 100
      });
    }
    
    // Apply factors to pricing
    const adjustedBasePrice = basePrice * factorMultiplier;
    const adjustedLaborCost = laborCost * factorMultiplier;
    let subtotal = adjustedBasePrice + adjustedLaborCost;
    
    // Apply business rules
    const applicableRules = this.getApplicableRules(params);
    for (const rule of applicableRules) {
      for (const effect of rule.effects) {
        switch (effect.type) {
          case 'set_minimum':
            if (subtotal < effect.value) {
              subtotal = effect.value;
              messages.push(effect.message || `Minimum charge of £${effect.value} applied`);
            }
            break;
            
          case 'apply_discount':
            const discountAmount = subtotal * (Math.abs(effect.value) / 100);
            if (effect.value > 0) {
              subtotal -= discountAmount;
              appliedDiscounts.push({
                id: rule.id,
                name: rule.name,
                percentage: effect.value,
                amount: discountAmount,
                message: effect.message || `${effect.value}% discount applied`
              });
            } else {
              subtotal += discountAmount;
              messages.push(effect.message || `${Math.abs(effect.value)}% surcharge applied`);
            }
            break;
            
          case 'add_surcharge':
            subtotal += effect.value;
            messages.push(effect.message || `£${effect.value} surcharge added`);
            break;
            
          case 'round_to':
            subtotal = Math.round(subtotal / effect.value) * effect.value;
            break;
        }
      }
    }
    
    // Apply discounts
    if (params.customerType === 'student') {
      const studentDiscount = subtotal * (config.discounts.student / 100);
      subtotal -= studentDiscount;
      appliedDiscounts.push({
        id: 'student_discount',
        name: 'Student Discount',
        percentage: config.discounts.student,
        amount: studentDiscount,
        message: `${config.discounts.student}% student discount`
      });
    }
    
    // Calculate final total
    let total = subtotal;
    
    // Add tax if not inclusive
    let taxAmount = 0;
    if (!config.taxInclusive) {
      taxAmount = total * (config.taxRate / 100);
      total += taxAmount;
    } else {
      taxAmount = total - (total / (1 + config.taxRate / 100));
    }
    
    const breakdown: PriceBreakdown = {
      basePrice: basePrice,
      laborCost: laborCost,
      factorAdjustments: adjustedBasePrice + adjustedLaborCost - basePrice - laborCost,
      subtotal: subtotal,
      discountTotal: appliedDiscounts.reduce((sum, d) => sum + d.amount, 0),
      taxAmount: taxAmount,
      total: Math.round(total * 100) / 100
    };
    
    return {
      breakdown,
      total: breakdown.total,
      messages,
      factors: appliedFactors,
      discounts: appliedDiscounts
    };
  }
  
  /**
   * Get applicable pricing rules for parameters
   */
  private static getApplicableRules(params: any): PricingRule[] {
    return pricingEngineConfig.rules
      .filter(rule => rule.enabled)
      .filter(rule => {
        // Check repair type
        if (rule.conditions.repairType && !rule.conditions.repairType.includes(params.repairType)) {
          return false;
        }
        
        // Check device type
        if (rule.conditions.deviceType && !rule.conditions.deviceType.includes(params.deviceType)) {
          return false;
        }
        
        // Check customer type
        if (rule.conditions.customerType && params.customerType && 
            !rule.conditions.customerType.includes(params.customerType)) {
          return false;
        }
        
        // Check appointment date for day of week
        if (rule.conditions.dayOfWeek && params.appointmentDate) {
          const dayOfWeek = params.appointmentDate.getDay();
          if (!rule.conditions.dayOfWeek.includes(dayOfWeek)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get base price for repair type
   */
  private static getBasePriceForRepair(repairType: string): number {
    // This would typically fetch from repair configuration
    const basePrices: Record<string, number> = {
      'screen-replacement-basic': 89,
      'battery-replacement-phone': 65,
      'water-damage-assessment': 45,
      'motherboard-repair': 150
    };
    
    return basePrices[repairType] || pricingEngineConfig.basePricing.minimumCharge;
  }
  
  /**
   * Get labor cost for repair type
   */
  private static getLaborCostForRepair(repairType: string): number {
    // This would typically fetch from repair configuration
    const laborTimes: Record<string, { hours: number; skillLevel: keyof typeof pricingEngineConfig.laborRates }> = {
      'screen-replacement-basic': { hours: 1.5, skillLevel: 'intermediate' },
      'battery-replacement-phone': { hours: 1.0, skillLevel: 'basic' },
      'water-damage-assessment': { hours: 2.0, skillLevel: 'expert' },
      'motherboard-repair': { hours: 4.0, skillLevel: 'expert' }
    };
    
    const laborInfo = laborTimes[repairType] || { hours: 1, skillLevel: 'intermediate' as const };
    const hourlyRate = pricingEngineConfig.laborRates[laborInfo.skillLevel];
    
    return laborInfo.hours * hourlyRate;
  }
}

// Supporting interfaces
interface PriceBreakdown {
  basePrice: number;
  laborCost: number;
  factorAdjustments: number;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  total: number;
}

interface AppliedFactor {
  id: string;
  name: string;
  value: number;
  label: string;
  impact: number; // percentage impact
}

interface AppliedDiscount {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  message: string;
}

export default {
  pricingEngineConfig,
  PricingEngine,
  pricingFactors,
  pricingRules
};