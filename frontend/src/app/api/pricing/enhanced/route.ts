// Enhanced pricing calculation API with configuration-driven engine
// Integrates with RevivaTech pricing configuration system for advanced quotes

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PricingEngine, pricingEngineConfig } from '../../../../../config/pricing/pricing-engine.config';
import { RepairConfigurationService } from '../../../../../config/repairs/repair-types.config';
import { AvailabilityService } from '../../../../../config/scheduling/availability.config';

// Enhanced pricing calculation schema
const EnhancedPricingSchema = z.object({
  // Device information
  device: z.object({
    id: z.string().min(1, 'Device ID is required'),
    type: z.string().min(1, 'Device type is required'),
    brand: z.string().min(1, 'Device brand is required'),
    year: z.number().min(2010).max(2025),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']),
    specifications: z.record(z.any()).optional(),
  }),
  
  // Repair information
  repairs: z.object({
    primaryRepairs: z.array(z.string()).min(1, 'At least one repair must be selected'),
    complexity: z.enum(['simple', 'standard', 'complex', 'extreme']).default('standard'),
    partsRequired: z.array(z.string()).optional(),
    estimatedHours: z.number().positive().optional(),
  }),
  
  // Service preferences
  service: z.object({
    urgency: z.enum(['standard', 'priority', 'emergency']).default('standard'),
    type: z.enum(['drop_off', 'collection', 'postal']).default('drop_off'),
    appointmentDate: z.string().datetime().optional(),
    appointmentTime: z.string().optional(),
  }),
  
  // Customer information
  customer: z.object({
    type: z.enum(['individual', 'business', 'student', 'senior']).default('individual'),
    loyaltyTier: z.enum(['none', 'bronze', 'silver', 'gold', 'platinum']).default('none'),
    isFirstTime: z.boolean().default(false),
    hasReferral: z.boolean().default(false),
    quantity: z.number().min(1).default(1),
  }).optional(),
  
  // Pricing options
  options: z.object({
    promotionalCode: z.string().optional(),
    includeWarranty: z.boolean().default(true),
    premiumParts: z.boolean().default(false),
    expressService: z.boolean().default(false),
    includePickup: z.boolean().default(false),
  }).optional(),
  
  // Market context
  context: z.object({
    competitorPrice: z.number().positive().optional(),
    marketDemand: z.number().min(0.5).max(2.0).default(1.0),
    locationSurcharge: z.number().min(0).default(0),
  }).optional(),
});

// Rate limiting for enhanced pricing calculations
const enhancedPricingLimits = new Map<string, { count: number; resetTime: number }>();

function checkEnhancedPricingRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = enhancedPricingLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    enhancedPricingLimits.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 15) { // 15 enhanced calculations per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Calculate comprehensive pricing with all features
async function calculateEnhancedPricing(request: z.infer<typeof EnhancedPricingSchema>): Promise<any> {
  const { device, repairs, service, customer, options, context } = request;
  
  // Get repair types and validate compatibility
  const compatibleRepairs = RepairConfigurationService.getCompatibleRepairs(
    device.type,
    device.brand,
    device.year
  );
  
  const requestedRepairs = repairs.primaryRepairs.filter(repairId =>
    compatibleRepairs.some(r => r.id === repairId)
  );
  
  if (requestedRepairs.length === 0) {
    throw new Error('No compatible repairs found for this device');
  }
  
  // Calculate pricing for each repair using our enhanced engine
  const repairCalculations = requestedRepairs.map(repairId => {
    return PricingEngine.calculateRepairPrice({
      repairType: repairId,
      deviceType: device.type,
      brand: device.brand,
      deviceAge: getDeviceAgeCategory(device.year),
      damageSeverity: repairs.complexity,
      urgency: service.urgency,
      partsAvailability: determinePartsAvailability(device, repairId),
      customerType: customer?.type,
      quantity: customer?.quantity || 1,
      promotionalCode: options?.promotionalCode,
      appointmentDate: service.appointmentDate ? new Date(service.appointmentDate) : undefined,
    });
  });
  
  // Combine all repair calculations with intelligent bundling
  const bundledCalculation = calculateBundledPricing(repairCalculations, requestedRepairs);
  
  // Apply service options and enhancements
  const serviceEnhancements = calculateServiceEnhancements(bundledCalculation, options, service);
  
  // Calculate appointment-specific surcharges
  const appointmentAdjustments = await calculateAppointmentAdjustments(
    service,
    bundledCalculation.subtotal,
    requestedRepairs[0]
  );
  
  // Apply customer-specific discounts and loyalty benefits
  const customerAdjustments = calculateCustomerAdjustments(bundledCalculation, customer);
  
  // Calculate final total with all adjustments
  const finalTotal = Math.max(
    bundledCalculation.total + 
    serviceEnhancements.total + 
    appointmentAdjustments.total + 
    customerAdjustments.total,
    pricingEngineConfig.basePricing.minimumCharge
  );
  
  // Generate detailed breakdown
  const detailedBreakdown = {
    repairs: bundledCalculation,
    serviceEnhancements,
    appointmentAdjustments,
    customerAdjustments,
    minimumChargeApplied: finalTotal === pricingEngineConfig.basePricing.minimumCharge,
    finalTotal,
    currency: pricingEngineConfig.currency,
    taxInclusive: pricingEngineConfig.taxInclusive,
    confidence: calculatePricingConfidence(requestedRepairs, device, service),
  };
  
  // Generate timeline estimates
  const timelineEstimates = calculateTimelineEstimates(requestedRepairs, service, repairs.complexity);
  
  // Generate alternative pricing options
  const alternatives = generateComprehensiveAlternatives(request, detailedBreakdown);
  
  // Get warranty information
  const warrantyInfo = getWarrantyInformation(requestedRepairs, options);
  
  // Generate business context
  const businessContext = generateBusinessContext(device, requestedRepairs, context);
  
  return {
    quoteId: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pricing: detailedBreakdown,
    repairDetails: await getDetailedRepairInformation(requestedRepairs, compatibleRepairs),
    timeline: timelineEstimates,
    warranty: warrantyInfo,
    alternatives,
    businessContext,
    terms: generateTermsAndConditions(detailedBreakdown, service),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    generatedAt: new Date().toISOString(),
  };
}

function getDeviceAgeCategory(year: number): 'new' | 'recent' | 'standard' | 'older' | 'vintage' {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age <= 1) return 'new';
  if (age <= 2) return 'recent';
  if (age <= 4) return 'standard';
  if (age <= 6) return 'older';
  return 'vintage';
}

function determinePartsAvailability(device: any, repairId: string): 'in_stock' | 'next_day' | 'week_lead' | 'special_order' | 'rare_parts' {
  const deviceAge = new Date().getFullYear() - device.year;
  const commonRepairs = ['screen-replacement-basic', 'battery-replacement-phone'];
  
  if (commonRepairs.includes(repairId) && deviceAge <= 3) {
    return 'in_stock';
  } else if (deviceAge <= 5) {
    return 'next_day';
  } else if (deviceAge <= 7) {
    return 'week_lead';
  } else if (deviceAge <= 10) {
    return 'special_order';
  } else {
    return 'rare_parts';
  }
}

function calculateBundledPricing(calculations: any[], repairIds: string[]): any {
  const total = calculations.reduce((sum, calc) => ({
    basePrice: sum.basePrice + calc.breakdown.basePrice,
    laborCost: sum.laborCost + calc.breakdown.laborCost,
    factorAdjustments: sum.factorAdjustments + calc.breakdown.factorAdjustments,
    subtotal: sum.subtotal + calc.breakdown.subtotal,
    discountTotal: sum.discountTotal + calc.breakdown.discountTotal,
    taxAmount: sum.taxAmount + calc.breakdown.taxAmount,
    total: sum.total + calc.breakdown.total,
  }), {
    basePrice: 0,
    laborCost: 0,
    factorAdjustments: 0,
    subtotal: 0,
    discountTotal: 0,
    taxAmount: 0,
    total: 0,
  });
  
  // Apply bundle discount for multiple repairs
  if (repairIds.length > 1) {
    const bundleDiscount = total.subtotal * getBundleDiscountRate(repairIds.length);
    total.discountTotal += bundleDiscount;
    total.total -= bundleDiscount;
    
    total.bundleDiscount = {
      applied: true,
      rate: getBundleDiscountRate(repairIds.length),
      amount: bundleDiscount,
      reason: `${repairIds.length} repairs bundled together`,
    };
  }
  
  return total;
}

function getBundleDiscountRate(repairCount: number): number {
  if (repairCount >= 4) return 0.15; // 15% for 4+ repairs
  if (repairCount >= 3) return 0.12; // 12% for 3 repairs
  if (repairCount >= 2) return 0.08; // 8% for 2 repairs
  return 0;
}

function calculateServiceEnhancements(baseline: any, options: any, service: any): any {
  const enhancements = [];
  let total = 0;
  
  if (options?.premiumParts) {
    const cost = baseline.basePrice * 0.3;
    enhancements.push({
      name: 'Premium OEM Parts',
      cost,
      description: 'Original manufacturer parts with extended warranty',
      benefits: ['Perfect compatibility', '18-month warranty', 'Original quality'],
    });
    total += cost;
  }
  
  if (options?.expressService) {
    const cost = baseline.laborCost * 0.5;
    enhancements.push({
      name: 'Express Service',
      cost,
      description: 'Priority handling and faster completion',
      benefits: ['Reduced turnaround time', 'Priority queue', 'Dedicated technician'],
    });
    total += cost;
  }
  
  if (options?.includePickup && service.type === 'collection') {
    const cost = 25;
    enhancements.push({
      name: 'Collection & Delivery',
      cost,
      description: 'Convenient pickup and drop-off service',
      benefits: ['Saves travel time', 'Fully insured transport', 'Flexible scheduling'],
    });
    total += cost;
  }
  
  if (options?.includeWarranty) {
    const cost = baseline.subtotal * 0.08;
    enhancements.push({
      name: 'Extended Warranty',
      cost,
      description: 'Additional 6-month warranty coverage',
      benefits: ['12-month total warranty', 'Covers parts and labor', 'Peace of mind'],
    });
    total += cost;
  }
  
  return { enhancements, total };
}

async function calculateAppointmentAdjustments(service: any, basePrice: number, primaryRepairId: string): Promise<any> {
  const adjustments = [];
  let total = 0;
  
  if (service.appointmentDate && service.appointmentTime) {
    const appointmentDate = new Date(service.appointmentDate);
    const pricingAdjustments = AvailabilityService.calculatePricingAdjustments(
      appointmentDate,
      service.appointmentTime,
      primaryRepairId,
      basePrice
    );
    
    pricingAdjustments.surcharges.forEach(surcharge => {
      adjustments.push({
        name: surcharge.name,
        cost: surcharge.amount,
        percentage: surcharge.percentage,
        description: `${surcharge.name} appointment surcharge`,
      });
      total += surcharge.amount;
    });
  }
  
  return { adjustments, total };
}

function calculateCustomerAdjustments(baseline: any, customer: any): any {
  const adjustments = [];
  let total = 0;
  
  if (customer?.type === 'student') {
    const discount = baseline.subtotal * 0.15;
    adjustments.push({
      name: 'Student Discount',
      cost: -discount,
      description: '15% discount for students with valid ID',
      type: 'discount',
    });
    total -= discount;
  }
  
  if (customer?.type === 'senior') {
    const discount = baseline.subtotal * 0.10;
    adjustments.push({
      name: 'Senior Discount',
      cost: -discount,
      description: '10% discount for senior citizens',
      type: 'discount',
    });
    total -= discount;
  }
  
  if (customer?.loyaltyTier && customer.loyaltyTier !== 'none') {
    const loyaltyDiscounts = {
      bronze: 0.05,
      silver: 0.10,
      gold: 0.15,
      platinum: 0.20,
    };
    const discount = baseline.subtotal * loyaltyDiscounts[customer.loyaltyTier];
    adjustments.push({
      name: `${customer.loyaltyTier.charAt(0).toUpperCase() + customer.loyaltyTier.slice(1)} Loyalty Discount`,
      cost: -discount,
      description: `${loyaltyDiscounts[customer.loyaltyTier] * 100}% loyalty member discount`,
      type: 'discount',
    });
    total -= discount;
  }
  
  if (customer?.isFirstTime) {
    const discount = baseline.subtotal * 0.05;
    adjustments.push({
      name: 'First-Time Customer Discount',
      cost: -discount,
      description: '5% welcome discount for new customers',
      type: 'discount',
    });
    total -= discount;
  }
  
  if (customer?.hasReferral) {
    const discount = baseline.subtotal * 0.10;
    adjustments.push({
      name: 'Referral Discount',
      cost: -discount,
      description: '10% discount for customer referral',
      type: 'discount',
    });
    total -= discount;
  }
  
  return { adjustments, total };
}

function calculatePricingConfidence(repairIds: string[], device: any, service: any): number {
  let confidence = 85; // Base confidence
  
  // Device age factor
  const deviceAge = new Date().getFullYear() - device.year;
  if (deviceAge <= 2) confidence += 10;
  else if (deviceAge > 5) confidence -= 15;
  
  // Repair complexity
  if (repairIds.length === 1) confidence += 10;
  else if (repairIds.length > 3) confidence -= 10;
  
  // Brand familiarity
  if (['apple', 'samsung', 'google'].includes(device.brand.toLowerCase())) {
    confidence += 5;
  }
  
  // Service type
  if (service.urgency === 'emergency') confidence -= 5;
  
  return Math.max(60, Math.min(95, confidence));
}

function calculateTimelineEstimates(repairIds: string[], service: any, complexity: string): any {
  const estimates = repairIds.map(repairId => {
    return RepairConfigurationService.getEstimatedCompletion(
      repairId,
      complexity as any,
      service.urgency as any
    );
  });
  
  const totalHours = estimates.reduce((sum, est) => sum + est.hours, 0);
  const maxBusinessDays = Math.max(...estimates.map(est => est.businessDays));
  
  return {
    estimatedHours: totalHours,
    businessDays: maxBusinessDays,
    urgencyLevel: service.urgency,
    canExpedite: service.urgency !== 'emergency',
    breakdown: repairIds.map((repairId, index) => ({
      repairId,
      hours: estimates[index].hours,
      businessDays: estimates[index].businessDays,
    })),
  };
}

function generateComprehensiveAlternatives(request: any, baseline: any): any[] {
  const alternatives = [];
  
  // Standard service alternative
  if (request.service.urgency !== 'standard') {
    alternatives.push({
      name: 'Standard Service',
      description: '3-5 business days completion',
      priceAdjustment: -(baseline.finalTotal * 0.25),
      timeline: '3-5 business days',
      benefits: ['Lower cost', 'Same quality guarantee', 'Standard warranty'],
      limitations: ['Longer wait time'],
    });
  }
  
  // Priority service alternative
  if (request.service.urgency === 'standard') {
    alternatives.push({
      name: 'Priority Service',
      description: '1-2 business days completion',
      priceAdjustment: baseline.finalTotal * 0.25,
      timeline: '1-2 business days',
      benefits: ['Faster turnaround', 'Priority handling', 'Express warranty'],
      limitations: ['Higher cost'],
    });
  }
  
  // OEM parts alternative
  if (!request.options?.premiumParts) {
    alternatives.push({
      name: 'Premium OEM Parts',
      description: 'Original manufacturer components',
      priceAdjustment: baseline.repairs.basePrice * 0.3,
      timeline: 'Same completion time',
      benefits: ['Perfect compatibility', '18-month warranty', 'Original quality'],
      limitations: ['Higher cost'],
    });
  }
  
  // Basic service alternative
  alternatives.push({
    name: 'Essential Service',
    description: 'Core repair without extras',
    priceAdjustment: -(baseline.serviceEnhancements.total + baseline.customerAdjustments.total),
    timeline: 'Standard timeline',
    benefits: ['Lowest cost option', 'Essential repair only'],
    limitations: ['No premium features', 'Standard warranty only'],
  });
  
  return alternatives;
}

async function getDetailedRepairInformation(repairIds: string[], compatibleRepairs: any[]): Promise<any[]> {
  return repairIds.map(repairId => {
    const repairConfig = compatibleRepairs.find(r => r.id === repairId);
    if (!repairConfig) return null;
    
    return {
      id: repairId,
      name: repairConfig.name,
      description: repairConfig.description,
      category: repairConfig.category,
      pricing: {
        basePrice: repairConfig.pricing.basePrice,
        laborHours: repairConfig.pricing.laborHours,
      },
      technical: {
        skillLevel: repairConfig.technical.skillLevel,
        estimatedDuration: repairConfig.technical.estimatedDuration,
        riskLevel: repairConfig.technical.riskLevel,
        successRate: repairConfig.technical.successRate,
      },
      service: {
        warranty: repairConfig.service.warranty,
        diagnosticRequired: repairConfig.service.diagnosticRequired,
        testingRequired: repairConfig.service.testingRequired,
      },
      presentation: {
        shortDescription: repairConfig.presentation.shortDescription,
        processSteps: repairConfig.presentation.processSteps,
        commonCauses: repairConfig.presentation.commonCauses,
      },
    };
  }).filter(Boolean);
}

function getWarrantyInformation(repairIds: string[], options: any): any {
  const baseWarranty = 6; // months
  const extendedWarranty = options?.includeWarranty ? 6 : 0;
  const totalWarranty = baseWarranty + extendedWarranty;
  
  return {
    duration: totalWarranty,
    coverage: [
      'Workmanship guarantee',
      'Replacement parts warranty',
      'No-quibble return policy',
    ],
    terms: [
      'Warranty covers parts and labor for the specific repair',
      'Does not cover accidental damage or misuse',
      'Requires proof of purchase and service',
    ],
    extended: !!options?.includeWarranty,
  };
}

function generateBusinessContext(device: any, repairIds: string[], context: any): any {
  const seasonalDemand = AvailabilityService.getSeasonalDemand(repairIds[0]);
  
  return {
    devicePopularity: calculateDevicePopularity(device),
    repairDemand: seasonalDemand,
    marketPosition: context?.competitorPrice ? 'competitive' : 'market-leading',
    recommendations: generatePricingRecommendations(device, repairIds, context),
  };
}

function calculateDevicePopularity(device: any): 'low' | 'medium' | 'high' {
  const popularBrands = ['apple', 'samsung', 'google'];
  const deviceAge = new Date().getFullYear() - device.year;
  
  if (popularBrands.includes(device.brand.toLowerCase()) && deviceAge <= 3) {
    return 'high';
  } else if (deviceAge <= 5) {
    return 'medium';
  } else {
    return 'low';
  }
}

function generatePricingRecommendations(device: any, repairIds: string[], context: any): string[] {
  const recommendations = [];
  
  if (repairIds.length > 1) {
    recommendations.push('Bundle discount applied - significant savings on multiple repairs');
  }
  
  const deviceAge = new Date().getFullYear() - device.year;
  if (deviceAge > 5) {
    recommendations.push('Consider upgrade evaluation - repair cost vs. device value analysis available');
  }
  
  if (context?.competitorPrice && context.competitorPrice > 0) {
    recommendations.push('Price-matched against competitor quotes - best value guaranteed');
  }
  
  return recommendations;
}

function generateTermsAndConditions(pricing: any, service: any): any {
  return {
    priceGuarantee: '7 days from quote generation',
    noFixNoFee: 'No charge if repair cannot be completed',
    freeEstimate: 'Diagnostic fee waived if repair proceeds',
    dataProtection: 'We cannot guarantee data safety - backup recommended',
    paymentTerms: {
      deposit: '50% deposit required for repairs over £100',
      balance: 'Balance due on completion',
      methods: ['Card', 'Cash', 'Bank Transfer'],
    },
    cancellation: {
      beforeWork: 'Free cancellation before work begins',
      afterWork: 'Cancellation fee may apply after work starts',
      parts: 'Custom-ordered parts are non-refundable',
    },
  };
}

// POST /api/pricing/enhanced
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkEnhancedPricingRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = EnhancedPricingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid enhanced pricing request',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }
    
    const pricingRequest = validation.data;
    
    // Calculate enhanced pricing
    const result = await calculateEnhancedPricing(pricingRequest);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Enhanced pricing calculation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Enhanced pricing calculation failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET /api/pricing/enhanced (for quick quotes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      repairType: searchParams.get('repairType'),
      deviceType: searchParams.get('deviceType'),
      brand: searchParams.get('brand'),
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear(),
      urgency: searchParams.get('urgency') || 'standard',
      condition: searchParams.get('condition') || 'good',
    };
    
    if (!params.repairType || !params.deviceType || !params.brand) {
      return NextResponse.json(
        { error: 'Missing required parameters: repairType, deviceType, brand' },
        { status: 400 }
      );
    }
    
    // Simple quick quote
    const quickPrice = RepairConfigurationService.calculatePrice(
      params.repairType,
      'standard' as any,
      params.urgency as any,
      params.condition as any
    );
    
    return NextResponse.json({
      quickQuote: true,
      repairType: params.repairType,
      device: `${params.brand} ${params.deviceType} (${params.year})`,
      pricing: {
        basePrice: quickPrice.basePrice,
        totalPrice: quickPrice.totalPrice,
        breakdown: quickPrice.breakdown,
      },
      estimatedTime: '2-4 hours',
      warranty: '6 months',
      currency: 'GBP',
      note: 'This is a quick estimate. Contact us for a detailed quote.',
    });
    
  } catch (error) {
    console.error('Quick quote error:', error);
    
    return NextResponse.json(
      { error: 'Quick quote failed' },
      { status: 500 }
    );
  }
}