// Simple individual pricing rule API
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';
import { ApiMiddleware } from '../../../../../lib/api/middleware';

const prisma = new PrismaClient();

// GET handler with authentication
const getHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    const rule = await prisma.pricingRule.findUnique({
      where: { id }
    });

    if (!rule) {
      return NextResponse.json({
        success: false,
        error: 'Pricing rule not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      rule
    });

  } catch (error) {
    console.error('Get pricing rule error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
};

export const GET = ApiMiddleware.withMiddleware(getHandler, {
  requireAuth: true,
  roles: ['ADMIN', 'SUPER_ADMIN'],
  rateLimit: { windowMs: 60000, maxRequests: 100 }
});

// PUT handler with authentication
const putHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;
    const body = await request.json();

    const updatedRule = await prisma.pricingRule.update({
      where: { id },
      data: {
        repairType: body.repairType,
        basePrice: body.basePrice,
        urgencyMultiplier: body.urgencyMultiplier,
        complexityMultiplier: body.complexityMultiplier,
        marketDemand: body.marketDemand,
        seasonalFactor: body.seasonalFactor,
        isActive: body.isActive,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        deviceModelId: body.deviceModelId || null,
      }
    });

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Pricing rule updated successfully'
    });

  } catch (error) {
    console.error('Update pricing rule error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
};

export const PUT = ApiMiddleware.withMiddleware(putHandler, {
  requireAuth: true,
  roles: ['ADMIN', 'SUPER_ADMIN'],
  rateLimit: { windowMs: 60000, maxRequests: 50 }
});

// DELETE handler with authentication
const deleteHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const { id } = params;

    // Soft delete by marking as inactive
    const deactivatedRule = await prisma.pricingRule.update({
      where: { id },
      data: {
        isActive: false,
        validUntil: new Date(), // Set end date to now
      }
    });

    return NextResponse.json({
      success: true,
      rule: {
        id: deactivatedRule.id,
        isActive: deactivatedRule.isActive,
        validUntil: deactivatedRule.validUntil,
      },
      message: 'Pricing rule deactivated successfully'
    });

  } catch (error) {
    console.error('Delete pricing rule error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
};

export const DELETE = ApiMiddleware.withMiddleware(deleteHandler, {
  requireAuth: true,
  roles: ['ADMIN', 'SUPER_ADMIN'],
  rateLimit: { windowMs: 60000, maxRequests: 30 }
});