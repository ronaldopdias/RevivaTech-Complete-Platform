// Pricing Calculation API
// Dynamic pricing with market factors and real-time calculations

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware } from '@/lib/api/middleware';
import { createPricingRuleRepository, createDeviceModelRepository } from '@/lib/database';
import { RepairType, UrgencyLevel } from '@/generated/prisma';

// Validation schema
const priceCalculationSchema = z.object({
  deviceModelId: z.string().uuid(),
  repairType: z.nativeEnum(RepairType),
  urgencyLevel: z.nativeEnum(UrgencyLevel).optional(),
  complexityFactor: z.number().min(0.5).max(3.0).optional(),
  marketDemandFactor: z.number().min(0.5).max(2.0).optional(),
  seasonalFactor: z.number().min(0.8).max(1.5).optional(),
  quantity: z.number().min(1).max(10).optional(), // For bulk discounts
});

// POST /api/pricing/calculate - Calculate price for repair
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const pricingRepo = createPricingRuleRepository();
    const deviceRepo = createDeviceModelRepository();
    
    const calculationData = (request as any).validatedBody as z.infer<typeof priceCalculationSchema>;

    try {
      // Validate device model exists
      const deviceModel = await deviceRepo.findModelWithBrandAndCategory(calculationData.deviceModelId);
      if (!deviceModel) {
        return ApiMiddleware.createErrorResponse('Device model not found', 404);
      }

      // Calculate base pricing
      const priceCalculation = await pricingRepo.calculatePrice(
        calculationData.deviceModelId,
        calculationData.repairType,
        {
          urgencyLevel: calculationData.urgencyLevel || 'STANDARD',
          complexityFactor: calculationData.complexityFactor,
          marketDemandFactor: calculationData.marketDemandFactor,
          seasonalFactor: calculationData.seasonalFactor,
        }
      );

      // Apply quantity discounts if applicable
      let finalPrice = priceCalculation.finalPrice;
      let quantityDiscount = 0;
      
      if (calculationData.quantity && calculationData.quantity > 1) {
        // Apply bulk discount: 5% for 2+ items, 10% for 5+ items
        if (calculationData.quantity >= 5) {
          quantityDiscount = 0.10;
        } else if (calculationData.quantity >= 2) {
          quantityDiscount = 0.05;
        }
        
        const discountAmount = finalPrice * quantityDiscount;
        finalPrice = Math.round((finalPrice - discountAmount) * calculationData.quantity);
      }

      // Calculate price validity (24 hours for standard, 2 hours for urgent)
      const validityHours = calculationData.urgencyLevel === 'URGENT' || 
                           calculationData.urgencyLevel === 'EMERGENCY' ? 2 : 24;
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + validityHours);

      // Get market context for transparency
      const marketContext = {
        deviceAge: new Date().getFullYear() - deviceModel.year,
        deviceCategory: deviceModel.brand.category.name,
        popularityScore: await getDevicePopularityScore(calculationData.deviceModelId),
        seasonality: getCurrentSeasonalityFactor(calculationData.repairType),
      };

      const response = {
        deviceInfo: {
          id: deviceModel.id,
          name: `${deviceModel.brand.name} ${deviceModel.name}`,
          year: deviceModel.year,
          category: deviceModel.brand.category.name,
        },
        pricing: {
          basePrice: priceCalculation.basePrice,
          finalPrice: calculationData.quantity ? finalPrice : priceCalculation.finalPrice,
          breakdown: {
            ...priceCalculation.breakdown,
            quantityDiscount: quantityDiscount,
            quantity: calculationData.quantity || 1,
          },
          rule: priceCalculation.rule ? {
            id: priceCalculation.rule.id,
            validFrom: priceCalculation.rule.validFrom,
            validUntil: priceCalculation.rule.validUntil,
          } : null,
        },
        validity: {
          validUntil: validUntil.toISOString(),
          validityHours,
        },
        marketContext,
        disclaimers: [
          'Price is subject to physical inspection of the device',
          'Additional charges may apply for complex repairs',
          'Quote valid for the specified time period only',
          calculationData.quantity && calculationData.quantity > 1 
            ? `Bulk discount of ${quantityDiscount * 100}% applied for ${calculationData.quantity} items`
            : null,
        ].filter(Boolean),
      };

      return ApiMiddleware.createResponse(
        response,
        'Price calculated successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    validateBody: priceCalculationSchema,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// Helper function to get device popularity score
async function getDevicePopularityScore(deviceModelId: string): Promise<number> {
  // This would typically query booking statistics
  // For now, return a mock score between 0.5 and 1.5
  return Math.round((0.5 + Math.random()) * 100) / 100;
}

// Helper function to get current seasonality factor
function getCurrentSeasonalityFactor(repairType: RepairType): number {
  const month = new Date().getMonth(); // 0-11
  
  // Seasonal adjustments based on repair type
  const seasonalFactors: Record<RepairType, number[]> = {
    [RepairType.SCREEN_REPAIR]: [1.0, 1.0, 1.1, 1.2, 1.1, 1.0, 0.9, 0.9, 1.0, 1.1, 1.2, 1.1], // Higher in spring/fall
    [RepairType.BATTERY_REPLACEMENT]: [1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2], // Higher in winter
    [RepairType.WATER_DAMAGE]: [0.8, 0.8, 0.9, 1.0, 1.2, 1.3, 1.3, 1.2, 1.0, 0.9, 0.8, 0.8], // Higher in summer
    [RepairType.DATA_RECOVERY]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0], // Stable year-round
    [RepairType.SOFTWARE_ISSUE]: [1.1, 1.0, 1.0, 1.0, 1.0, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 1.1], // Higher after holidays
    [RepairType.HARDWARE_DIAGNOSTIC]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [RepairType.MOTHERBOARD_REPAIR]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [RepairType.CAMERA_REPAIR]: [0.9, 0.9, 1.0, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 1.0, 0.9, 0.9], // Higher in travel season
    [RepairType.SPEAKER_REPAIR]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [RepairType.CHARGING_PORT]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [RepairType.BUTTON_REPAIR]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    [RepairType.CUSTOM_REPAIR]: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  };

  return seasonalFactors[repairType][month];
}