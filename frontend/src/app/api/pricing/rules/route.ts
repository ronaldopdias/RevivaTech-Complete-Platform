// Pricing Rules Management API
// Admin interface for managing dynamic pricing rules

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware, commonSchemas } from '@/lib/api/middleware';
import { createPricingRuleRepository, createDeviceModelRepository } from '@/lib/database';
import { RepairType } from '@/generated/prisma';

// Validation schemas
const createPricingRuleSchema = z.object({
  deviceModelId: z.string().uuid().optional(),
  repairType: z.nativeEnum(RepairType),
  basePrice: z.number().positive(),
  urgencyMultiplier: z.number().min(0.5).max(3.0).optional(),
  complexityMultiplier: z.number().min(0.5).max(3.0).optional(),
  marketDemand: z.number().min(0.5).max(2.0).optional(),
  seasonalFactor: z.number().min(0.5).max(2.0).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

const updatePricingRuleSchema = createPricingRuleSchema.partial();

const pricingRuleSearchSchema = z.object({
  ...commonSchemas.search.shape,
  ...commonSchemas.pagination.shape,
  deviceModelId: z.string().uuid().optional(),
  repairType: z.nativeEnum(RepairType).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  priceMin: z.string().transform(val => parseFloat(val)).optional(),
  priceMax: z.string().transform(val => parseFloat(val)).optional(),
  validAt: z.string().datetime().optional(),
});

// GET /api/pricing/rules - Search and list pricing rules
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const pricingRepo = createPricingRuleRepository();
    const searchParams = (request as any).validatedQuery as z.infer<typeof pricingRuleSearchSchema>;

    const {
      query = '',
      deviceModelId,
      repairType,
      isActive,
      priceMin,
      priceMax,
      validAt,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchParams;

    try {
      const filters = {
        deviceModelId,
        repairType,
        isActive,
        priceMin,
        priceMax,
        validAt: validAt ? new Date(validAt) : undefined,
      };

      const pagination = { page, limit };

      const result = await pricingRepo.searchPricingRules(query, filters, pagination);

      if ('data' in result) {
        return ApiMiddleware.createResponse({
          rules: result.data,
          pagination: result.pagination,
        });
      } else {
        return ApiMiddleware.createResponse({
          rules: result,
          pagination: {
            page: 1,
            limit: result.length,
            total: result.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    validateQuery: pricingRuleSearchSchema,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// POST /api/pricing/rules - Create new pricing rule
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const pricingRepo = createPricingRuleRepository();
    const deviceRepo = createDeviceModelRepository();
    
    const ruleData = (request as any).validatedBody as z.infer<typeof createPricingRuleSchema>;

    try {
      // Validate device model if specified
      if (ruleData.deviceModelId) {
        const deviceModel = await deviceRepo.findById(ruleData.deviceModelId);
        if (!deviceModel) {
          return ApiMiddleware.createErrorResponse('Device model not found', 404);
        }
      }

      // Check for existing rule conflicts
      if (ruleData.deviceModelId) {
        const existingRule = await pricingRepo.findActivePricingRule(
          ruleData.deviceModelId,
          ruleData.repairType
        );
        
        if (existingRule) {
          return ApiMiddleware.createErrorResponse(
            'An active pricing rule already exists for this device model and repair type',
            409
          );
        }
      } else {
        // Check for generic rule conflicts
        const existingGenericRule = await pricingRepo.findGenericPricingRule(ruleData.repairType);
        if (existingGenericRule) {
          return ApiMiddleware.createErrorResponse(
            'A generic pricing rule already exists for this repair type',
            409
          );
        }
      }

      const createRulePayload = {
        ...ruleData,
        validFrom: ruleData.validFrom ? new Date(ruleData.validFrom) : undefined,
        validUntil: ruleData.validUntil ? new Date(ruleData.validUntil) : undefined,
      };

      const rule = await pricingRepo.createPricingRule(createRulePayload);

      // Fetch rule with device model details for response
      const ruleWithDetails = await pricingRepo.findById(rule.id, {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      });

      return ApiMiddleware.createResponse(
        ruleWithDetails,
        'Pricing rule created successfully',
        201
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    validateBody: createPricingRuleSchema,
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);

// PUT /api/pricing/rules/bulk-update - Bulk update pricing rules
export const PUT = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const pricingRepo = createPricingRuleRepository();
    
    const bulkUpdateSchema = z.object({
      updates: z.array(z.object({
        id: z.string().uuid(),
        basePrice: z.number().positive().optional(),
        urgencyMultiplier: z.number().min(0.5).max(3.0).optional(),
        complexityMultiplier: z.number().min(0.5).max(3.0).optional(),
        marketDemand: z.number().min(0.5).max(2.0).optional(),
        seasonalFactor: z.number().min(0.5).max(2.0).optional(),
        isActive: z.boolean().optional(),
      })).min(1).max(50),
    });

    const { updates } = (request as any).validatedBody as z.infer<typeof bulkUpdateSchema>;

    try {
      // Validate all rules exist
      const ruleIds = updates.map(u => u.id);
      const existingRules = await Promise.all(
        ruleIds.map(id => pricingRepo.findById(id))
      );

      const missingRules = ruleIds.filter((id, index) => !existingRules[index]);
      if (missingRules.length > 0) {
        return ApiMiddleware.createErrorResponse(
          `Pricing rules not found: ${missingRules.join(', ')}`,
          404
        );
      }

      // Perform bulk update
      const updatedRules = await pricingRepo.bulkUpdatePrices(
        updates.map(({ id, ...data }) => ({ id, ...data }))
      );

      return ApiMiddleware.createResponse(
        { 
          updatedRules,
          updateCount: updatedRules.length,
        },
        `Successfully updated ${updatedRules.length} pricing rules`
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 10 },
  }
);