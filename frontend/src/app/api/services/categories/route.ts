import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, RepairType } from '../../../../generated/prisma';

const prisma = new PrismaClient();

// Service categories configuration
const serviceCategories = [
  {
    id: 'essential-repairs',
    name: 'Essential Repairs',
    description: 'Common repairs for everyday device issues',
    icon: 'wrench',
    services: [
      {
        type: RepairType.SCREEN_REPAIR,
        name: 'Screen Repair & Replacement',
        description: 'Cracked, broken, or unresponsive screen repair',
        estimatedTime: '1-2 hours',
        urgencySupported: true,
        popularFor: ['iPhone', 'Samsung Galaxy', 'MacBook', 'iPad'],
        basePrice: 150
      },
      {
        type: RepairType.BATTERY_REPLACEMENT,
        name: 'Battery Replacement',
        description: 'Battery draining quickly or not charging properly',
        estimatedTime: '30-60 minutes',
        urgencySupported: true,
        popularFor: ['iPhone', 'MacBook', 'Android phones'],
        basePrice: 80
      },
      {
        type: RepairType.CHARGING_PORT,
        name: 'Charging Port Repair',
        description: 'Device not charging or loose charging connection',
        estimatedTime: '45-90 minutes',
        urgencySupported: true,
        popularFor: ['iPhone', 'Android phones', 'Tablets'],
        basePrice: 100
      }
    ]
  },
  {
    id: 'hardware-repairs',
    name: 'Hardware Repairs',
    description: 'Complex hardware component repairs',
    icon: 'cpu',
    services: [
      {
        type: RepairType.MOTHERBOARD_REPAIR,
        name: 'Motherboard Repair',
        description: 'Logic board issues, micro-soldering, component replacement',
        estimatedTime: '2-5 days',
        urgencySupported: false,
        popularFor: ['MacBook', 'iPhone', 'Gaming consoles'],
        basePrice: 400
      },
      {
        type: RepairType.CAMERA_REPAIR,
        name: 'Camera Repair',
        description: 'Front or rear camera issues, focus problems',
        estimatedTime: '1-3 hours',
        urgencySupported: true,
        popularFor: ['iPhone', 'Samsung Galaxy', 'Android phones'],
        basePrice: 120
      },
      {
        type: RepairType.SPEAKER_REPAIR,
        name: 'Speaker & Audio Repair',
        description: 'No sound, distorted audio, microphone issues',
        estimatedTime: '1-2 hours',
        urgencySupported: true,
        popularFor: ['iPhone', 'Android phones', 'MacBook'],
        basePrice: 90
      },
      {
        type: RepairType.BUTTON_REPAIR,
        name: 'Button Repair',
        description: 'Home button, volume buttons, power button issues',
        estimatedTime: '45-90 minutes',
        urgencySupported: true,
        popularFor: ['iPhone', 'Samsung Galaxy', 'Gaming consoles'],
        basePrice: 70
      }
    ]
  },
  {
    id: 'software-services',
    name: 'Software Services',
    description: 'Software troubleshooting and optimization',
    icon: 'code',
    services: [
      {
        type: RepairType.SOFTWARE_ISSUE,
        name: 'Software Troubleshooting',
        description: 'OS issues, app crashes, performance optimization',
        estimatedTime: '1-3 hours',
        urgencySupported: true,
        popularFor: ['MacBook', 'PC', 'Android phones'],
        basePrice: 60
      },
      {
        type: RepairType.HARDWARE_DIAGNOSTIC,
        name: 'Hardware Diagnostic',
        description: 'Complete device analysis and issue identification',
        estimatedTime: '30-60 minutes',
        urgencySupported: true,
        popularFor: ['All devices'],
        basePrice: 40
      }
    ]
  },
  {
    id: 'specialized-services',
    name: 'Specialized Services',
    description: 'Advanced and specialized repair services',
    icon: 'shield',
    services: [
      {
        type: RepairType.WATER_DAMAGE,
        name: 'Water Damage Recovery',
        description: 'Liquid damage assessment and recovery',
        estimatedTime: '1-3 days',
        urgencySupported: true,
        popularFor: ['iPhone', 'MacBook', 'Android phones'],
        basePrice: 200
      },
      {
        type: RepairType.DATA_RECOVERY,
        name: 'Data Recovery',
        description: 'Recover lost files and data from damaged devices',
        estimatedTime: '1-5 days',
        urgencySupported: false,
        popularFor: ['MacBook', 'PC', 'Hard drives'],
        basePrice: 300
      },
      {
        type: RepairType.CUSTOM_REPAIR,
        name: 'Custom Repair Services',
        description: 'Specialized repairs not covered by standard services',
        estimatedTime: 'Variable',
        urgencySupported: false,
        popularFor: ['Gaming consoles', 'Vintage devices'],
        basePrice: 100
      }
    ]
  }
];

// GET /api/services/categories - Get all service categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDevices = searchParams.get('includeDevices') === 'true';
    const includePricing = searchParams.get('includePricing') === 'true';
    const categoryFilter = searchParams.get('category');

    let responseData = [...serviceCategories];

    // Filter by specific category if requested
    if (categoryFilter) {
      responseData = responseData.filter(cat => cat.id === categoryFilter);
    }

    // Include device compatibility if requested
    if (includeDevices) {
      const deviceCategories = await prisma.deviceCategory.findMany({
        include: {
          brands: {
            include: {
              models: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  screenSize: true
                }
              }
            }
          }
        }
      });

      responseData = responseData.map(category => ({
        ...category,
        compatibleDevices: deviceCategories.map(deviceCat => ({
          categoryId: deviceCat.slug,
          categoryName: deviceCat.name,
          brandCount: deviceCat.brands.length,
          modelCount: deviceCat.brands.reduce((sum, brand) => sum + brand.models.length, 0)
        }))
      }));
    }

    // Include real-time pricing if requested
    if (includePricing) {
      const pricingRules = await prisma.pricingRule.findMany({
        where: { isActive: true },
        include: {
          deviceModel: {
            include: {
              brand: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      responseData = responseData.map(category => ({
        ...category,
        services: category.services.map(service => {
          // Get pricing rules for this repair type
          const relevantPricing = pricingRules.filter(rule => rule.repairType === service.type);
          
          const pricingInfo = {
            basePrice: service.basePrice,
            priceRange: {
              min: Math.min(...relevantPricing.map(r => Number(r.basePrice)), service.basePrice),
              max: Math.max(...relevantPricing.map(r => Number(r.basePrice)), service.basePrice)
            },
            deviceSpecificPricing: relevantPricing.length > 0
          };

          return {
            ...service,
            pricing: pricingInfo
          };
        })
      }));
    }

    // Get service statistics
    const stats = await getServiceStats();

    return NextResponse.json({
      categories: responseData,
      meta: {
        totalCategories: serviceCategories.length,
        totalServices: serviceCategories.reduce((sum, cat) => sum + cat.services.length, 0),
        lastUpdated: new Date().toISOString(),
        ...stats
      }
    });

  } catch (error) {
    console.error('Error fetching service categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service categories' },
      { status: 500 }
    );
  }
}

// Helper function to get service statistics
async function getServiceStats() {
  try {
    const [
      totalBookings,
      completedBookings,
      pricingRulesCount,
      deviceModelsCount
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.pricingRule.count({ where: { isActive: true } }),
      prisma.deviceModel.count({ where: { isActive: true } })
    ]);

    // Get most popular repair types
    const popularRepairs = await prisma.booking.groupBy({
      by: ['repairType'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    return {
      statistics: {
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : '0',
        pricingRulesCount,
        deviceModelsSupported: deviceModelsCount,
        popularRepairTypes: popularRepairs.map(repair => ({
          type: repair.repairType,
          count: repair._count.id
        }))
      }
    };
  } catch (error) {
    console.error('Error getting service stats:', error);
    return {
      statistics: {
        totalBookings: 0,
        completedBookings: 0,
        completionRate: '0',
        pricingRulesCount: 0,
        deviceModelsSupported: 0,
        popularRepairTypes: []
      }
    };
  }
}

// POST /api/services/categories - Create custom service category (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, services } = body;

    // Validate required fields
    if (!name || !services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Name and services array are required' },
        { status: 400 }
      );
    }

    // For now, we store custom categories in a simple way
    // In a full implementation, you might want a separate table for custom service categories
    
    const customCategory = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      description: description || '',
      icon: icon || 'tool',
      services: services.map((service: any) => ({
        ...service,
        basePrice: service.basePrice || 100,
        estimatedTime: service.estimatedTime || '1-2 hours',
        urgencySupported: service.urgencySupported !== false
      })),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Custom service category created successfully',
      category: customCategory
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating service category:', error);
    return NextResponse.json(
      { error: 'Failed to create service category' },
      { status: 500 }
    );
  }
}