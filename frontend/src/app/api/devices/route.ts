// Device Catalog API
// Comprehensive device management with search and filtering

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import devicesConfig from '../../../../config/devices';

const prisma = new PrismaClient();

// Helper function to seed database with config data
async function seedDevicesFromConfig() {
  try {
    // Check if we have any devices in the database
    const deviceCount = await prisma.deviceModel.count();
    if (deviceCount > 0) {
      return; // Already seeded
    }

    console.log('Seeding device database from configuration...');

    // Seed categories first
    for (const category of devicesConfig.categories) {
      await prisma.deviceCategory.upsert({
        where: { slug: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
          slug: category.id,
          description: category.description,
          iconName: category.icon,
          isActive: true
        }
      });
    }

    // Seed brands and devices
    for (const device of devicesConfig.devices) {
      // Create or get brand
      const brand = await prisma.deviceBrand.upsert({
        where: {
          categoryId_slug: {
            categoryId: device.categoryId,
            slug: device.brand.toLowerCase().replace(/\s+/g, '-')
          }
        },
        update: {},
        create: {
          categoryId: device.categoryId,
          name: device.brand,
          slug: device.brand.toLowerCase().replace(/\s+/g, '-'),
          isActive: true
        }
      });

      // Create device
      await prisma.deviceModel.create({
        data: {
          id: device.id,
          brandId: brand.id,
          name: device.name,
          slug: device.id,
          year: device.year,
          screenSize: device.specifications?.screen?.size ? 
            parseFloat(device.specifications.screen.size.replace('"', '')) : null,
          specs: device.specifications || {},
          imageUrl: device.imageUrl,
          isActive: true
        }
      });
    }

    console.log('Device database seeded successfully');
  } catch (error) {
    console.error('Error seeding device database:', error);
  }
}

// GET /api/devices - Get all devices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    // Ensure database is seeded
    await seedDevicesFromConfig();

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const year = searchParams.get('year');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'year';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = { isActive: true };

    if (category) {
      where.brand = {
        category: {
          slug: category
        }
      };
    }

    if (brand) {
      where.brand = {
        ...where.brand,
        slug: brand
      };
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (minYear && maxYear) {
      where.year = {
        gte: parseInt(minYear),
        lte: parseInt(maxYear)
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
        { brand: { category: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get devices from database
    const [devices, totalCount] = await Promise.all([
      prisma.deviceModel.findMany({
        where,
        include: {
          brand: {
            include: {
              category: true
            }
          },
          pricingRules: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.deviceModel.count({ where })
    ]);

    // Transform database devices to match expected format
    const transformedDevices = devices.map(device => ({
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
      screenSize: device.screenSize
    }));

    // Handle popular devices filter
    let resultDevices = transformedDevices;
    if (popular) {
      const currentYear = new Date().getFullYear();
      resultDevices = transformedDevices
        .filter(device => 
          device.year >= currentYear - 3 && 
          device.averageRepairCost <= 300
        )
        .sort((a, b) => b.year - a.year)
        .slice(0, 12);
    }

    return NextResponse.json({
      devices: resultDevices,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    );
  }
}

// POST /api/devices - Create new device (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandId,
      name,
      slug,
      year,
      screenSize,
      specs,
      imageUrl
    } = body;

    // Validate required fields
    if (!brandId || !name || !year) {
      return NextResponse.json(
        { error: 'Brand ID, name, and year are required' },
        { status: 400 }
      );
    }

    // Check if device already exists
    const existingDevice = await prisma.deviceModel.findFirst({
      where: {
        brandId,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-')
      }
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device with this name already exists for this brand' },
        { status: 409 }
      );
    }

    // Create device
    const device = await prisma.deviceModel.create({
      data: {
        brandId,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        year,
        screenSize: screenSize ? parseFloat(screenSize) : null,
        specs: specs || {},
        imageUrl,
        isActive: true
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
      message: 'Device created successfully',
      device
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    );
  }
}