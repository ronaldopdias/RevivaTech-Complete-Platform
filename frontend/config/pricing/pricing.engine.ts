import { DeviceModel } from '@/lib/services/types';

// Pricing configuration interface
export interface PricingRule {
  id: string;
  name: string;
  description: string;
  condition: (device: DeviceModel, repairType: string, options: RepairOptions) => boolean;
  modifier: (basePrice: number, device: DeviceModel, options: RepairOptions) => number;
  priority: number;
}

export interface RepairType {
  id: string;
  name: string;
  description: string;
  category: string;
  basePriceRange: {
    min: number;
    max: number;
  };
  laborHours: number;
  partsRequired: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  warranty: number; // warranty period in days
}

export interface RepairOptions {
  express?: boolean;
  premiumParts?: boolean;
  dataRecovery?: boolean;
  warranty?: 'standard' | 'extended' | 'premium';
  pickupDelivery?: boolean;
}

export interface PriceEstimate {
  basePrice: number;
  laborCost: number;
  partsCost: number;
  serviceFee: number;
  options: {
    name: string;
    cost: number;
  }[];
  total: number;
  warranty: number;
  estimatedTime: string;
  confidence: 'high' | 'medium' | 'low';
}

// Repair types configuration
export const repairTypes: RepairType[] = [
  // Screen Repairs
  {
    id: 'screen_repair',
    name: 'Screen Repair',
    description: 'LCD/OLED screen replacement',
    category: 'display',
    basePriceRange: { min: 80, max: 400 },
    laborHours: 1.5,
    partsRequired: ['screen', 'adhesive'],
    complexity: 'moderate',
    warranty: 90
  },
  {
    id: 'screen_glass_only',
    name: 'Screen Glass Replacement',
    description: 'Glass panel replacement (digitizer intact)',
    category: 'display',
    basePriceRange: { min: 60, max: 200 },
    laborHours: 1,
    partsRequired: ['glass', 'adhesive'],
    complexity: 'simple',
    warranty: 90
  },

  // Battery Repairs
  {
    id: 'battery_replacement',
    name: 'Battery Replacement',
    description: 'Battery replacement and calibration',
    category: 'power',
    basePriceRange: { min: 50, max: 180 },
    laborHours: 0.5,
    partsRequired: ['battery'],
    complexity: 'simple',
    warranty: 90
  },

  // Keyboard Repairs
  {
    id: 'keyboard_repair',
    name: 'Keyboard Repair',
    description: 'Keyboard replacement or key repair',
    category: 'input',
    basePriceRange: { min: 60, max: 200 },
    laborHours: 1,
    partsRequired: ['keyboard'],
    complexity: 'moderate',
    warranty: 90
  },
  {
    id: 'individual_key',
    name: 'Individual Key Replacement',
    description: 'Single key replacement',
    category: 'input',
    basePriceRange: { min: 15, max: 40 },
    laborHours: 0.25,
    partsRequired: ['key', 'mechanism'],
    complexity: 'simple',
    warranty: 30
  },

  // Logic Board Repairs
  {
    id: 'logic_board_repair',
    name: 'Logic Board Repair',
    description: 'Component-level logic board repair',
    category: 'motherboard',
    basePriceRange: { min: 150, max: 500 },
    laborHours: 3,
    partsRequired: ['components'],
    complexity: 'expert',
    warranty: 90
  },
  {
    id: 'liquid_damage_repair',
    name: 'Liquid Damage Repair',
    description: 'Liquid damage assessment and repair',
    category: 'motherboard',
    basePriceRange: { min: 100, max: 350 },
    laborHours: 2,
    partsRequired: ['cleaning', 'components'],
    complexity: 'complex',
    warranty: 60
  },

  // Port Repairs
  {
    id: 'charging_port_repair',
    name: 'Charging Port Repair',
    description: 'Charging port replacement',
    category: 'ports',
    basePriceRange: { min: 80, max: 150 },
    laborHours: 1,
    partsRequired: ['port', 'flex_cable'],
    complexity: 'moderate',
    warranty: 90
  },
  {
    id: 'usb_port_repair',
    name: 'USB Port Repair',
    description: 'USB port replacement',
    category: 'ports',
    basePriceRange: { min: 70, max: 140 },
    laborHours: 1,
    partsRequired: ['port'],
    complexity: 'moderate',
    warranty: 90
  },

  // Data Recovery
  {
    id: 'data_recovery_basic',
    name: 'Basic Data Recovery',
    description: 'Software-based data recovery',
    category: 'data',
    basePriceRange: { min: 50, max: 150 },
    laborHours: 2,
    partsRequired: [],
    complexity: 'moderate',
    warranty: 0
  },
  {
    id: 'data_recovery_advanced',
    name: 'Advanced Data Recovery',
    description: 'Hardware-level data recovery',
    category: 'data',
    basePriceRange: { min: 200, max: 600 },
    laborHours: 4,
    partsRequired: ['donor_parts'],
    complexity: 'expert',
    warranty: 0
  },

  // Software Services
  {
    id: 'virus_removal',
    name: 'Virus & Malware Removal',
    description: 'Complete system cleaning and optimization',
    category: 'software',
    basePriceRange: { min: 40, max: 80 },
    laborHours: 1.5,
    partsRequired: [],
    complexity: 'simple',
    warranty: 30
  },
  {
    id: 'os_installation',
    name: 'Operating System Installation',
    description: 'Fresh OS installation and setup',
    category: 'software',
    basePriceRange: { min: 50, max: 100 },
    laborHours: 2,
    partsRequired: [],
    complexity: 'simple',
    warranty: 30
  }
];

// Pricing rules configuration
export const pricingRules: PricingRule[] = [
  // Device age multipliers
  {
    id: 'device_age_new',
    name: 'New Device Premium',
    description: 'Higher cost for devices less than 1 year old',
    condition: (device) => device.year >= new Date().getFullYear(),
    modifier: (basePrice) => basePrice * 1.2,
    priority: 1
  },
  {
    id: 'device_age_old',
    name: 'Older Device Discount',
    description: 'Reduced cost for devices older than 5 years',
    condition: (device) => device.year <= new Date().getFullYear() - 5,
    modifier: (basePrice) => basePrice * 0.8,
    priority: 1
  },

  // Brand-specific modifiers
  {
    id: 'apple_premium',
    name: 'Apple Device Premium',
    description: 'Premium pricing for Apple devices',
    condition: (device) => device.brand.toLowerCase() === 'apple',
    modifier: (basePrice) => basePrice * 1.15,
    priority: 2
  },

  // Repair complexity modifiers
  {
    id: 'macbook_butterfly_keyboard',
    name: 'MacBook Butterfly Keyboard',
    description: 'Additional cost for butterfly keyboard mechanism',
    condition: (device, repairType) => 
      device.brand.toLowerCase() === 'apple' && 
      device.name.toLowerCase().includes('macbook') &&
      device.year >= 2016 && device.year <= 2019 &&
      repairType === 'keyboard_repair',
    modifier: (basePrice) => basePrice * 1.3,
    priority: 3
  },

  // Express service
  {
    id: 'express_service',
    name: 'Express Service',
    description: '50% surcharge for same-day service',
    condition: (device, repairType, options) => options.express === true,
    modifier: (basePrice) => basePrice * 1.5,
    priority: 10
  },

  // Premium parts
  {
    id: 'premium_parts',
    name: 'Premium Parts',
    description: '25% surcharge for premium parts',
    condition: (device, repairType, options) => options.premiumParts === true,
    modifier: (basePrice) => basePrice * 1.25,
    priority: 5
  },

  // Data recovery addon
  {
    id: 'data_recovery_addon',
    name: 'Data Recovery Add-on',
    description: 'Additional cost for data recovery service',
    condition: (device, repairType, options) => options.dataRecovery === true,
    modifier: (basePrice) => basePrice + 80,
    priority: 8
  },

  // Extended warranty
  {
    id: 'extended_warranty',
    name: 'Extended Warranty',
    description: 'Additional cost for extended warranty',
    condition: (device, repairType, options) => options.warranty === 'extended',
    modifier: (basePrice) => basePrice + 30,
    priority: 9
  },
  {
    id: 'premium_warranty',
    name: 'Premium Warranty',
    description: 'Additional cost for premium warranty',
    condition: (device, repairType, options) => options.warranty === 'premium',
    modifier: (basePrice) => basePrice + 60,
    priority: 9
  },

  // Pickup and delivery
  {
    id: 'pickup_delivery',
    name: 'Pickup & Delivery',
    description: 'Pickup and delivery service',
    condition: (device, repairType, options) => options.pickupDelivery === true,
    modifier: (basePrice) => basePrice + 25,
    priority: 7
  }
];

// Main pricing engine class
export class PricingEngine {
  private rules: PricingRule[];
  private repairTypes: RepairType[];

  constructor(rules: PricingRule[] = pricingRules, repairs: RepairType[] = repairTypes) {
    this.rules = rules.sort((a, b) => a.priority - b.priority);
    this.repairTypes = repairs;
  }

  /**
   * Calculate price estimate for a device repair
   */
  calculatePrice(
    device: DeviceModel,
    repairTypeId: string,
    options: RepairOptions = {}
  ): PriceEstimate {
    const repairType = this.repairTypes.find(r => r.id === repairTypeId);
    if (!repairType) {
      throw new Error(`Repair type not found: ${repairTypeId}`);
    }

    // Calculate base price based on device and repair type
    let basePrice = this.calculateBasePrice(device, repairType);
    
    // Apply pricing rules
    const applicableRules = this.rules.filter(rule => 
      rule.condition(device, repairTypeId, options)
    );

    let modifiedPrice = basePrice;
    const appliedOptions: { name: string; cost: number }[] = [];

    for (const rule of applicableRules) {
      const originalPrice = modifiedPrice;
      modifiedPrice = rule.modifier(modifiedPrice, device, options);
      
      // Track option costs
      if (modifiedPrice !== originalPrice) {
        appliedOptions.push({
          name: rule.name,
          cost: modifiedPrice - originalPrice
        });
      }
    }

    // Calculate labor cost
    const laborCost = repairType.laborHours * this.getLaborRate(repairType.complexity);
    
    // Calculate parts cost (simplified for now)
    const partsCost = basePrice * 0.6; // Assume 60% of base price is parts
    
    // Service fee
    const serviceFee = 15; // Fixed service fee

    const total = Math.round(modifiedPrice + serviceFee);
    
    // Estimate repair time
    const estimatedTime = this.calculateEstimatedTime(repairType, options.express);
    
    // Calculate warranty period
    let warranty = repairType.warranty;
    if (options.warranty === 'extended') warranty = warranty * 1.5;
    if (options.warranty === 'premium') warranty = warranty * 2;

    // Determine confidence level
    const confidence = this.calculateConfidence(device, repairType);

    return {
      basePrice: Math.round(basePrice),
      laborCost: Math.round(laborCost),
      partsCost: Math.round(partsCost),
      serviceFee,
      options: appliedOptions,
      total,
      warranty: Math.round(warranty),
      estimatedTime,
      confidence
    };
  }

  /**
   * Calculate base price for device and repair type
   */
  private calculateBasePrice(device: DeviceModel, repairType: RepairType): number {
    // Use device's average repair cost as starting point
    const deviceBaseCost = device.averageRepairCost || 100;
    
    // Adjust based on repair type complexity
    const complexityMultiplier = {
      simple: 0.7,
      moderate: 1.0,
      complex: 1.4,
      expert: 1.8
    }[repairType.complexity];

    // Calculate within repair type range
    const { min, max } = repairType.basePriceRange;
    const rangePosition = Math.min(deviceBaseCost / 300, 1); // Normalize to 0-1
    const priceInRange = min + (max - min) * rangePosition;

    return Math.round(priceInRange * complexityMultiplier);
  }

  /**
   * Get labor rate based on complexity
   */
  private getLaborRate(complexity: string): number {
    const rates = {
      simple: 35,    // £35/hour
      moderate: 45,  // £45/hour
      complex: 60,   // £60/hour
      expert: 80     // £80/hour
    };
    return rates[complexity as keyof typeof rates] || 45;
  }

  /**
   * Calculate estimated repair time
   */
  private calculateEstimatedTime(repairType: RepairType, express?: boolean): string {
    const baseHours = repairType.laborHours;
    
    if (express) {
      return baseHours <= 2 ? 'Same day' : '24 hours';
    }
    
    if (baseHours <= 1) return '2-4 hours';
    if (baseHours <= 2) return '4-8 hours';
    if (baseHours <= 4) return '1-2 days';
    return '2-3 days';
  }

  /**
   * Calculate confidence level based on device and repair type
   */
  private calculateConfidence(device: DeviceModel, repairType: RepairType): 'high' | 'medium' | 'low' {
    // Higher confidence for newer devices and simpler repairs
    const deviceAge = new Date().getFullYear() - device.year;
    const isSimpleRepair = repairType.complexity === 'simple' || repairType.complexity === 'moderate';
    
    if (deviceAge <= 2 && isSimpleRepair) return 'high';
    if (deviceAge <= 5 && repairType.complexity !== 'expert') return 'medium';
    return 'low';
  }

  /**
   * Get all available repair types for a device
   */
  getAvailableRepairs(device: DeviceModel): RepairType[] {
    // Filter repairs based on device type and common issues
    return this.repairTypes.filter(repair => {
      // Check if repair type is relevant to device category
      const categoryMapping = {
        'macbook': ['display', 'power', 'input', 'motherboard', 'ports', 'data', 'software'],
        'imac': ['display', 'power', 'motherboard', 'ports', 'data', 'software'],
        'iphone': ['display', 'power', 'motherboard', 'ports', 'data'],
        'ipad': ['display', 'power', 'motherboard', 'ports', 'data'],
        'laptop': ['display', 'power', 'input', 'motherboard', 'ports', 'data', 'software'],
        'desktop': ['power', 'motherboard', 'ports', 'data', 'software']
      };

      const deviceCategory = device.categoryId;
      const allowedCategories = categoryMapping[deviceCategory as keyof typeof categoryMapping] || [];
      
      return allowedCategories.includes(repair.category);
    });
  }

  /**
   * Get repair recommendations based on common issues
   */
  getRecommendedRepairs(device: DeviceModel): RepairType[] {
    const commonIssues = device.commonIssues || [];
    const available = this.getAvailableRepairs(device);
    
    // Map common issues to repair types
    const issueMapping: Record<string, string[]> = {
      'screen': ['screen_repair', 'screen_glass_only'],
      'battery': ['battery_replacement'],
      'keyboard': ['keyboard_repair', 'individual_key'],
      'charging': ['charging_port_repair'],
      'liquid': ['liquid_damage_repair'],
      'virus': ['virus_removal'],
      'data': ['data_recovery_basic']
    };

    const recommended = new Set<string>();
    
    for (const issue of commonIssues) {
      const issueLower = issue.toLowerCase();
      for (const [key, repairIds] of Object.entries(issueMapping)) {
        if (issueLower.includes(key)) {
          repairIds.forEach(id => recommended.add(id));
        }
      }
    }

    return available.filter(repair => recommended.has(repair.id));
  }
}

// Export default instance
export const pricingEngine = new PricingEngine();

// Export utility functions
export const getRepairTypeById = (id: string): RepairType | undefined => {
  return repairTypes.find(r => r.id === id);
};

export const getRepairTypesByCategory = (category: string): RepairType[] => {
  return repairTypes.filter(r => r.category === category);
};

export const getAllRepairTypes = (): RepairType[] => {
  return [...repairTypes];
};

export default {
  PricingEngine,
  pricingEngine,
  repairTypes,
  pricingRules,
  getRepairTypeById,
  getRepairTypesByCategory,
  getAllRepairTypes
};