import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import devicesConfig from '../../../../../config/devices';

const prisma = new PrismaClient();


// GET /api/devices/[id] - Get specific device by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Try to get from database first
    const device = await prisma.deviceModel.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        brand: {
          include: {
            category: true
          }
        },
        pricingRules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (device) {
      // Transform database device to match expected format
      const transformedDevice = {
        id: device.id,
        categoryId: device.brand.category.slug,
        category: device.brand.category.name,
        brand: device.brand.name,
        name: device.name,
        year: device.year,
        imageUrl: device.imageUrl,
        specifications: device.specs,
        commonIssues: devicesConfig.devices.find(d => d.id === device.id)?.commonIssues || [],
        averageRepairCost: device.pricingRules[0]?.basePrice ? 
          parseFloat(device.pricingRules[0].basePrice.toString()) : 
          devicesConfig.devices.find(d => d.id === device.id)?.averageRepairCost || 0,
        screenSize: device.screenSize,
        pricingRules: device.pricingRules.map(rule => ({
          id: rule.id,
          repairType: rule.repairType,
          basePrice: parseFloat(rule.basePrice.toString()),
          urgencyMultiplier: parseFloat(rule.urgencyMultiplier.toString()),
          complexityMultiplier: parseFloat(rule.complexityMultiplier.toString()),
          marketDemand: rule.marketDemand,
          seasonalFactor: rule.seasonalFactor,
          validFrom: rule.validFrom,
          validUntil: rule.validUntil
        }))
      };

      return NextResponse.json({
        device: transformedDevice,
        source: 'database'
      });
    }

    // Fallback to config data
    const configDevice = devicesConfig.utils.getDeviceById(id);
    if (!configDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      device: configDevice,
      source: 'config'
    });

  } catch (error) {
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device' },
      { status: 500 }
    );
  }
}

// PUT /api/devices/[id] - Update device (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      year,
      screenSize,
      specs,
      imageUrl,
      isActive
    } = body;

    // Check if device exists
    const existingDevice = await prisma.deviceModel.findFirst({
      where: { id }
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Update device
    const updatedDevice = await prisma.deviceModel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(year && { year }),
        ...(screenSize !== undefined && { screenSize: screenSize ? parseFloat(screenSize) : null }),
        ...(specs && { specs }),
        ...(imageUrl && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        brand: {
          include: {
            category: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Device updated successfully',
      device: updatedDevice
    });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

// DELETE /api/devices/[id] - Delete device (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if device exists
    const existingDevice = await prisma.deviceModel.findFirst({
      where: { id }
    });

    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.deviceModel.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Device deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    );
  }
}