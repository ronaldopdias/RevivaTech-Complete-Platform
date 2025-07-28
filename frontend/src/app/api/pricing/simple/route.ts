// Simple pricing rules API using direct Prisma
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RepairType } from '../../../../generated/prisma';
import { ApiMiddleware } from '../../../../lib/api/middleware';

const prisma = new PrismaClient();

// GET handler with authentication
const getHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const query = searchParams.get('query') || '';
    const repairType = searchParams.get('repairType') as RepairType | null;
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (repairType) {
      where.repairType = repairType;
    }
    
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Get rules with pagination
    const [rules, total] = await Promise.all([
      prisma.pricingRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pricingRule.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      rules: rules,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Simple pricing API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
};

export const GET = ApiMiddleware.withMiddleware(getHandler, {
  requireAuth: true,
  roles: ['ADMIN', 'SUPER_ADMIN'],
  rateLimit: { windowMs: 60000, maxRequests: 100 }
});

// POST handler with authentication
const postHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();

    const rule = await prisma.pricingRule.create({
      data: {
        repairType: body.repairType,
        basePrice: body.basePrice,
        urgencyMultiplier: body.urgencyMultiplier || 1.0,
        complexityMultiplier: body.complexityMultiplier || 1.0,
        marketDemand: body.marketDemand || 1.0,
        seasonalFactor: body.seasonalFactor || 1.0,
        isActive: body.isActive !== false,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        deviceModelId: body.deviceModelId || null,
      }
    });

    return NextResponse.json({
      success: true,
      rule,
      message: 'Pricing rule created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create pricing rule error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
};

export const POST = ApiMiddleware.withMiddleware(postHandler, {
  requireAuth: true,
  roles: ['ADMIN', 'SUPER_ADMIN'],
  rateLimit: { windowMs: 60000, maxRequests: 50 }
});