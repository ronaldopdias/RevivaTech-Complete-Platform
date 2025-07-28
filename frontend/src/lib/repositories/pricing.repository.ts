// Pricing Repository
// Repository for dynamic pricing rules and calculations

import { 
  PricingRule, 
  RepairType 
} from '@/generated/prisma';
import { BaseRepository, PaginationOptions, PaginatedResult } from '../database/repository.base';

export interface CreatePricingRuleData {
  deviceModelId?: string;
  repairType: RepairType;
  basePrice: number;
  urgencyMultiplier?: number;
  complexityMultiplier?: number;
  marketDemand?: number;
  seasonalFactor?: number;
  validFrom?: Date;
  validUntil?: Date;
}

export interface PricingSearchFilters {
  deviceModelId?: string;
  repairType?: RepairType;
  isActive?: boolean;
  priceMin?: number;
  priceMax?: number;
  validAt?: Date;
}

export interface PriceCalculationOptions {
  urgencyLevel?: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  complexityFactor?: number;
  marketDemandFactor?: number;
  seasonalFactor?: number;
}

export class PricingRuleRepository extends BaseRepository<PricingRule> {
  protected readonly modelName = 'pricingRule';

  async createPricingRule(data: CreatePricingRuleData): Promise<PricingRule> {
    return await this.create({
      ...data,
      urgencyMultiplier: data.urgencyMultiplier || 1.0,
      complexityMultiplier: data.complexityMultiplier || 1.0,
      marketDemand: data.marketDemand || 1.0,
      seasonalFactor: data.seasonalFactor || 1.0,
      validFrom: data.validFrom || new Date(),
    });
  }

  async findActivePricingRule(
    deviceModelId: string,
    repairType: RepairType,
    validAt: Date = new Date()
  ): Promise<PricingRule | null> {
    return await this.findFirst({
      deviceModelId,
      repairType,
      isActive: true,
      validFrom: { lte: validAt },
      OR: [
        { validUntil: null },
        { validUntil: { gte: validAt } },
      ],
    });
  }

  async findGenericPricingRule(
    repairType: RepairType,
    validAt: Date = new Date()
  ): Promise<PricingRule | null> {
    return await this.findFirst({
      deviceModelId: null,
      repairType,
      isActive: true,
      validFrom: { lte: validAt },
      OR: [
        { validUntil: null },
        { validUntil: { gte: validAt } },
      ],
    });
  }

  async calculatePrice(
    deviceModelId: string,
    repairType: RepairType,
    options?: PriceCalculationOptions
  ): Promise<{
    basePrice: number;
    finalPrice: number;
    breakdown: {
      base: number;
      urgencyMultiplier: number;
      complexityMultiplier: number;
      marketDemand: number;
      seasonalFactor: number;
    };
    rule: PricingRule | null;
  }> {
    // Try to find device-specific rule first
    let rule = await this.findActivePricingRule(deviceModelId, repairType);
    
    // Fall back to generic rule if no device-specific rule found
    if (!rule) {
      rule = await this.findGenericPricingRule(repairType);
    }

    if (!rule) {
      throw new Error(`No pricing rule found for repair type: ${repairType}`);
    }

    const basePrice = Number(rule.basePrice);
    
    // Apply urgency multiplier based on level
    let urgencyMultiplier = Number(rule.urgencyMultiplier);
    if (options?.urgencyLevel) {
      const urgencyMultipliers = {
        LOW: 0.9,
        STANDARD: 1.0,
        HIGH: 1.2,
        URGENT: 1.5,
        EMERGENCY: 2.0,
      };
      urgencyMultiplier = urgencyMultipliers[options.urgencyLevel];
    }

    const complexityMultiplier = options?.complexityFactor || Number(rule.complexityMultiplier);
    const marketDemand = options?.marketDemandFactor || rule.marketDemand;
    const seasonalFactor = options?.seasonalFactor || rule.seasonalFactor;

    const finalPrice = Math.round(
      basePrice * 
      urgencyMultiplier * 
      complexityMultiplier * 
      marketDemand * 
      seasonalFactor
    );

    return {
      basePrice,
      finalPrice,
      breakdown: {
        base: basePrice,
        urgencyMultiplier,
        complexityMultiplier,
        marketDemand,
        seasonalFactor,
      },
      rule,
    };
  }

  async findPricingRulesByDevice(deviceModelId: string): Promise<PricingRule[]> {
    return await this.findMany({
      where: { deviceModelId, isActive: true },
      orderBy: [{ field: 'repairType', direction: 'asc' }],
    });
  }

  async findPricingRulesByRepairType(repairType: RepairType): Promise<PricingRule[]> {
    return await this.findMany({
      where: { repairType, isActive: true },
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'basePrice', direction: 'asc' }],
    });
  }

  async searchPricingRules(
    query: string,
    filters?: PricingSearchFilters,
    pagination?: PaginationOptions
  ): Promise<PricingRule[] | PaginatedResult<PricingRule>> {
    const whereConditions: any = {};

    if (filters?.deviceModelId) whereConditions.deviceModelId = filters.deviceModelId;
    if (filters?.repairType) whereConditions.repairType = filters.repairType;
    if (filters?.isActive !== undefined) whereConditions.isActive = filters.isActive;

    if (filters?.priceMin || filters?.priceMax) {
      whereConditions.basePrice = {};
      if (filters.priceMin) whereConditions.basePrice.gte = filters.priceMin;
      if (filters.priceMax) whereConditions.basePrice.lte = filters.priceMax;
    }

    if (filters?.validAt) {
      whereConditions.validFrom = { lte: filters.validAt };
      whereConditions.OR = [
        { validUntil: null },
        { validUntil: { gte: filters.validAt } },
      ];
    }

    const searchOptions = {
      where: whereConditions,
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'basePrice', direction: 'asc' as const }],
      pagination,
    };

    // For pricing rules, we search in related device model names
    return await this.search(query, [], searchOptions);
  }

  async updateMarketDemand(
    repairType: RepairType,
    demandFactor: number
  ): Promise<{ count: number }> {
    return await this.updateMany(
      { repairType, isActive: true },
      { marketDemand: demandFactor }
    );
  }

  async updateSeasonalFactors(
    seasonalAdjustments: Array<{ repairType: RepairType; factor: number }>
  ): Promise<void> {
    await this.transaction(async (tx) => {
      for (const adjustment of seasonalAdjustments) {
        await tx.pricingRule.updateMany({
          where: { 
            repairType: adjustment.repairType,
            isActive: true,
          },
          data: { seasonalFactor: adjustment.factor },
        });
      }
    });
  }

  async getAveragePriceByRepairType(): Promise<Record<RepairType, number>> {
    const result = await this.rawQuery(`
      SELECT 
        repair_type,
        AVG(base_price)::float as average_price
      FROM pricing_rules
      WHERE is_active = true
      GROUP BY repair_type
    `);

    const averages: Record<RepairType, number> = {} as any;
    result.forEach((row: any) => {
      averages[row.repair_type as RepairType] = row.average_price;
    });

    return averages;
  }

  async getPriceRangeByRepairType(): Promise<Record<RepairType, { min: number; max: number }>> {
    const result = await this.rawQuery(`
      SELECT 
        repair_type,
        MIN(base_price)::float as min_price,
        MAX(base_price)::float as max_price
      FROM pricing_rules
      WHERE is_active = true
      GROUP BY repair_type
    `);

    const ranges: Record<RepairType, { min: number; max: number }> = {} as any;
    result.forEach((row: any) => {
      ranges[row.repair_type as RepairType] = {
        min: row.min_price,
        max: row.max_price,
      };
    });

    return ranges;
  }

  async findExpiredRules(): Promise<PricingRule[]> {
    const now = new Date();
    
    return await this.findMany({
      where: {
        validUntil: { lt: now },
        isActive: true,
      },
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async deactivateExpiredRules(): Promise<{ count: number }> {
    const now = new Date();
    
    return await this.updateMany(
      {
        validUntil: { lt: now },
        isActive: true,
      },
      { isActive: false }
    );
  }

  async bulkUpdatePrices(
    updates: Array<{
      id: string;
      basePrice?: number;
      urgencyMultiplier?: number;
      complexityMultiplier?: number;
      marketDemand?: number;
      seasonalFactor?: number;
    }>
  ): Promise<PricingRule[]> {
    return await this.batchUpdate(updates);
  }

  async clonePricingRule(
    id: string,
    overrides?: Partial<CreatePricingRuleData>
  ): Promise<PricingRule> {
    const originalRule = await this.findById(id);
    if (!originalRule) {
      throw new Error('Pricing rule not found');
    }

    const newRuleData: CreatePricingRuleData = {
      deviceModelId: originalRule.deviceModelId,
      repairType: originalRule.repairType,
      basePrice: Number(originalRule.basePrice),
      urgencyMultiplier: Number(originalRule.urgencyMultiplier),
      complexityMultiplier: Number(originalRule.complexityMultiplier),
      marketDemand: originalRule.marketDemand,
      seasonalFactor: originalRule.seasonalFactor,
      validFrom: new Date(),
      ...overrides,
    };

    return await this.createPricingRule(newRuleData);
  }

  async getPricingTrends(
    repairType: RepairType,
    days: number = 30
  ): Promise<Array<{ date: string; averagePrice: number; bookingCount: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.rawQuery(`
      SELECT 
        DATE(b.created_at) as date,
        AVG(b.final_price)::float as average_price,
        COUNT(b.id)::int as booking_count
      FROM bookings b
      WHERE b.repair_type = ? 
        AND b.created_at >= ?
      GROUP BY DATE(b.created_at)
      ORDER BY date
    `, repairType, startDate);
  }
}