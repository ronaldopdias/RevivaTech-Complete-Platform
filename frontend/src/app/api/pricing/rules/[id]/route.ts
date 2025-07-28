// Individual Pricing Rule Management API
// PUT and DELETE operations for specific pricing rules

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware } from '@/lib/api/middleware';
import { createPricingRuleRepository, createDeviceModelRepository } from '@/lib/database';
import { RepairType } from '@/generated/prisma';

// Validation schema for updating pricing rules
const updatePricingRuleSchema = z.object({
  deviceModelId: z.string().uuid().optional(),
  repairType: z.nativeEnum(RepairType).optional(),
  basePrice: z.number().positive().optional(),
  urgencyMultiplier: z.number().min(0.5).max(3.0).optional(),
  complexityMultiplier: z.number().min(0.5).max(3.0).optional(),
  marketDemand: z.number().min(0.5).max(2.0).optional(),
  seasonalFactor: z.number().min(0.5).max(2.0).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

// GET /api/pricing/rules/[id] - Get specific pricing rule
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const pricingRepo = createPricingRuleRepository();
    const { id } = params;

    try {
      // Validate UUID format
      if (!z.string().uuid().safeParse(id).success) {
        return ApiMiddleware.createErrorResponse('Invalid pricing rule ID format', 400);
      }

      const rule = await pricingRepo.findById(id, {
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

      if (!rule) {
        return ApiMiddleware.createErrorResponse('Pricing rule not found', 404);
      }

      return ApiMiddleware.createResponse(rule);
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// PUT /api/pricing/rules/[id] - Update specific pricing rule
export const PUT = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const pricingRepo = createPricingRuleRepository();
    const deviceRepo = createDeviceModelRepository();
    const { id } = params;

    try {
      // Validate UUID format
      if (!z.string().uuid().safeParse(id).success) {
        return ApiMiddleware.createErrorResponse('Invalid pricing rule ID format', 400);
      }

      const updateData = (request as any).validatedBody as z.infer<typeof updatePricingRuleSchema>;

      // Check if pricing rule exists
      const existingRule = await pricingRepo.findById(id);
      if (!existingRule) {
        return ApiMiddleware.createErrorResponse('Pricing rule not found', 404);
      }

      // Validate device model if being updated
      if (updateData.deviceModelId) {
        const deviceModel = await deviceRepo.findById(updateData.deviceModelId);
        if (!deviceModel) {
          return ApiMiddleware.createErrorResponse('Device model not found', 404);
        }
      }

      // Check for conflicts if device model or repair type is being changed
      if (updateData.deviceModelId || updateData.repairType) {
        const checkDeviceModelId = updateData.deviceModelId || existingRule.deviceModelId;
        const checkRepairType = updateData.repairType || existingRule.repairType;

        if (checkDeviceModelId) {
          const conflictingRule = await pricingRepo.findActivePricingRule(
            checkDeviceModelId,
            checkRepairType
          );

          if (conflictingRule && conflictingRule.id !== id) {
            return ApiMiddleware.createErrorResponse(
              'Another active pricing rule already exists for this device model and repair type',
              409
            );
          }
        } else {
          // Check for generic rule conflicts
          const conflictingGenericRule = await pricingRepo.findGenericPricingRule(checkRepairType);
          if (conflictingGenericRule && conflictingGenericRule.id !== id) {
            return ApiMiddleware.createErrorResponse(
              'Another generic pricing rule already exists for this repair type',
              409
            );
          }
        }
      }

      // Prepare update payload with date conversions
      const updatePayload = {
        ...updateData,
        validFrom: updateData.validFrom ? new Date(updateData.validFrom) : undefined,
        validUntil: updateData.validUntil ? new Date(updateData.validUntil) : undefined,
      };

      const updatedRule = await pricingRepo.updatePricingRule(id, updatePayload);

      // Fetch updated rule with device model details
      const ruleWithDetails = await pricingRepo.findById(updatedRule.id, {
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
        'Pricing rule updated successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    validateBody: updatePricingRuleSchema,
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);

// DELETE /api/pricing/rules/[id] - Deactivate specific pricing rule
export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const pricingRepo = createPricingRuleRepository();
    const { id } = params;

    try {
      // Validate UUID format
      if (!z.string().uuid().safeParse(id).success) {
        return ApiMiddleware.createErrorResponse('Invalid pricing rule ID format', 400);
      }

      // Check if pricing rule exists
      const existingRule = await pricingRepo.findById(id);
      if (!existingRule) {
        return ApiMiddleware.createErrorResponse('Pricing rule not found', 404);
      }

      // Check if rule is already inactive
      if (!existingRule.isActive) {
        return ApiMiddleware.createErrorResponse('Pricing rule is already inactive', 400);
      }

      // Soft delete by marking as inactive
      const deactivatedRule = await pricingRepo.updatePricingRule(id, {
        isActive: false,
        validUntil: new Date(), // Set end date to now
      });

      return ApiMiddleware.createResponse(
        {
          id: deactivatedRule.id,
          isActive: deactivatedRule.isActive,
          validUntil: deactivatedRule.validUntil,
        },
        'Pricing rule deactivated successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);

// PATCH /api/pricing/rules/[id]/activate - Reactivate a pricing rule
export const PATCH = ApiMiddleware.withMiddleware(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const pricingRepo = createPricingRuleRepository();
    const { id } = params;

    try {
      // Validate UUID format
      if (!z.string().uuid().safeParse(id).success) {
        return ApiMiddleware.createErrorResponse('Invalid pricing rule ID format', 400);
      }

      // Parse action from request body
      const body = await request.json();
      const action = body.action;

      if (action !== 'activate') {
        return ApiMiddleware.createErrorResponse('Invalid action. Only "activate" is supported.', 400);
      }

      // Check if pricing rule exists
      const existingRule = await pricingRepo.findById(id);
      if (!existingRule) {
        return ApiMiddleware.createErrorResponse('Pricing rule not found', 404);
      }

      // Check if rule is already active
      if (existingRule.isActive) {
        return ApiMiddleware.createErrorResponse('Pricing rule is already active', 400);
      }

      // Check for conflicts before reactivation
      if (existingRule.deviceModelId) {
        const conflictingRule = await pricingRepo.findActivePricingRule(
          existingRule.deviceModelId,
          existingRule.repairType
        );

        if (conflictingRule) {
          return ApiMiddleware.createErrorResponse(
            'Cannot activate: Another active pricing rule already exists for this device model and repair type',
            409
          );
        }
      } else {
        // Check for generic rule conflicts
        const conflictingGenericRule = await pricingRepo.findGenericPricingRule(existingRule.repairType);
        if (conflictingGenericRule) {
          return ApiMiddleware.createErrorResponse(
            'Cannot activate: Another generic pricing rule already exists for this repair type',
            409
          );
        }
      }

      // Reactivate the rule
      const reactivatedRule = await pricingRepo.updatePricingRule(id, {
        isActive: true,
        validUntil: null, // Remove end date
      });

      return ApiMiddleware.createResponse(
        {
          id: reactivatedRule.id,
          isActive: reactivatedRule.isActive,
          validUntil: reactivatedRule.validUntil,
        },
        'Pricing rule reactivated successfully'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: false, // Temporarily disabled for testing
    // roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);