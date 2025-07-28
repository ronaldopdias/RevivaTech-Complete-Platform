// Seed pricing rules for testing
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Create some basic pricing rules for testing
    const pricingRules = [
      {
        repairType: 'SCREEN_REPAIR',
        basePrice: 120.00,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        marketDemand: 1.0,
        seasonalFactor: 1.0,
        isActive: true,
        validFrom: new Date(),
      },
      {
        repairType: 'BATTERY_REPLACEMENT',
        basePrice: 80.00,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        marketDemand: 1.0,
        seasonalFactor: 1.0,
        isActive: true,
        validFrom: new Date(),
      },
      {
        repairType: 'WATER_DAMAGE',
        basePrice: 150.00,
        urgencyMultiplier: 1.5,
        complexityMultiplier: 1.5,
        marketDemand: 1.2,
        seasonalFactor: 1.0,
        isActive: true,
        validFrom: new Date(),
      }
    ];

    // Delete existing rules first
    await prisma.pricingRule.deleteMany();

    // Create new rules
    const created = await prisma.pricingRule.createMany({
      data: pricingRules
    });

    // Get the created rules
    const rules = await prisma.pricingRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} pricing rules`,
      rules: rules,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Seeding failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}