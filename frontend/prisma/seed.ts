// Database Seeding Script
// Populates database with initial data for development and testing

import { PrismaClient, UserRole, RepairType, UrgencyLevel, NotificationType, NotificationChannel } from '../src/generated/prisma';
import { allCategories, allDevices } from '../config/devices';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    await cleanDatabase();
  }

  // Seed device categories, brands, and models
  await seedDevices();
  
  // Seed users
  await seedUsers();
  
  // Seed pricing rules
  await seedPricingRules();
  
  // Seed sample bookings
  await seedBookings();

}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');
  
  const tablesToClean = [
    'notifications',
    'booking_status_history',
    'bookings',
    'pricing_rules',
    'device_models',
    'device_brands',
    'device_categories',
    'user_sessions',
    'users',
    'audit_logs',
    'websocket_sessions',
  ];

  for (const table of tablesToClean) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
  }
}

async function seedDevices() {
  console.log('📱 Seeding comprehensive device catalog from configuration files...');

  // First, create categories from config
  const categoryMap = new Map<string, string>();
  
  for (const category of allCategories) {
    const createdCategory = await prisma.deviceCategory.create({
      data: {
        name: category.name,
        slug: category.id,
        description: category.description,
        iconName: category.icon,
        sortOrder: allCategories.indexOf(category) + 1,
      },
    });
    categoryMap.set(category.id, createdCategory.id);
    console.log(`✓ Created category: ${category.name}`);
  }

  // Then create brands for each category
  const brandMap = new Map<string, string>();
  const brandsByCategory = new Map<string, Set<string>>();

  // Group brands by category
  for (const device of allDevices) {
    if (!brandsByCategory.has(device.categoryId)) {
      brandsByCategory.set(device.categoryId, new Set());
    }
    brandsByCategory.get(device.categoryId)!.add(device.brand);
  }

  // Create brands
  for (const [categoryId, brands] of brandsByCategory) {
    const dbCategoryId = categoryMap.get(categoryId);
    if (dbCategoryId) {
      for (const brandName of brands) {
        const brandKey = `${categoryId}-${brandName}`;
        if (!brandMap.has(brandKey)) {
          const createdBrand = await prisma.deviceBrand.create({
            data: {
              categoryId: dbCategoryId,
              name: brandName,
              slug: brandName.toLowerCase().replace(/\s+/g, '-'),
              logoUrl: `/brands/${brandName.toLowerCase().replace(/\s+/g, '-')}.svg`,
            },
          });
          brandMap.set(brandKey, createdBrand.id);
          console.log(`✓ Created brand: ${brandName} in ${categoryId}`);
        }
      }
    }
  }

  // Finally, create all device models
  let deviceCount = 0;
  for (const device of allDevices) {
    const brandKey = `${device.categoryId}-${device.brand}`;
    const brandId = brandMap.get(brandKey);
    
    if (brandId) {
      try {
        await prisma.deviceModel.create({
          data: {
            brandId,
            name: device.name,
            slug: device.id || device.name.toLowerCase().replace(/\s+/g, '-'),
            year: device.year,
            screenSize: device.specifications?.screen?.size ? parseFloat(device.specifications.screen.size.replace('"', '')) : null,
            specs: device.specifications || {},
            imageUrl: device.imageUrl || `/devices/${device.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          },
        });
        deviceCount++;
        if (deviceCount % 10 === 0) {
          console.log(`✓ Created ${deviceCount} devices...`);
        }
      } catch (error) {
        console.error(`❌ Failed to create device ${device.name}:`, error);
      }
    }
  }

}

async function seedUsers() {
  console.log('👥 Seeding users...');

  await Promise.all([
    // Admin users
    prisma.user.create({
      data: {
        email: 'admin@revivatech.co.uk',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+44 20 1234 5678',
        role: UserRole.SUPER_ADMIN,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'technician@revivatech.co.uk',
        firstName: 'John',
        lastName: 'Technician',
        phone: '+44 20 1234 5679',
        role: UserRole.TECHNICIAN,
        isVerified: true,
        isActive: true,
      },
    }),
    // Sample customers
    prisma.user.create({
      data: {
        email: 'customer1@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        phone: '+44 77 1234 5678',
        role: UserRole.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer2@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
        phone: '+44 77 2345 6789',
        role: UserRole.CUSTOMER,
        isVerified: true,
        isActive: true,
      },
    }),
  ]);

}

async function seedPricingRules() {
  console.log('💰 Seeding pricing rules...');

  const deviceModels = await prisma.deviceModel.findMany();
  
  // Generic pricing rules for all repair types
  const repairTypes = Object.values(RepairType);
  
  for (const repairType of repairTypes) {
    let basePrice: number;
    
    // Set base prices by repair type
    switch (repairType) {
      case RepairType.SCREEN_REPAIR:
        basePrice = 150;
        break;
      case RepairType.BATTERY_REPLACEMENT:
        basePrice = 80;
        break;
      case RepairType.WATER_DAMAGE:
        basePrice = 200;
        break;
      case RepairType.DATA_RECOVERY:
        basePrice = 300;
        break;
      case RepairType.SOFTWARE_ISSUE:
        basePrice = 60;
        break;
      case RepairType.HARDWARE_DIAGNOSTIC:
        basePrice = 40;
        break;
      case RepairType.MOTHERBOARD_REPAIR:
        basePrice = 400;
        break;
      case RepairType.CAMERA_REPAIR:
        basePrice = 120;
        break;
      case RepairType.SPEAKER_REPAIR:
        basePrice = 90;
        break;
      case RepairType.CHARGING_PORT:
        basePrice = 100;
        break;
      case RepairType.BUTTON_REPAIR:
        basePrice = 70;
        break;
      default:
        basePrice = 100;
    }

    // Create generic rule
    await prisma.pricingRule.create({
      data: {
        deviceModelId: null,
        repairType,
        basePrice,
        urgencyMultiplier: 1.0,
        complexityMultiplier: 1.0,
        marketDemand: 1.0,
        seasonalFactor: 1.0,
      },
    });

    // Create specific rules for premium devices (iPhone models)
    const iPhoneModels = deviceModels.filter(model => 
      model.name.toLowerCase().includes('iphone')
    );

    for (const model of iPhoneModels) {
      const premiumMultiplier = model.year >= new Date().getFullYear() - 1 ? 1.3 : 1.1;
      
      await prisma.pricingRule.create({
        data: {
          deviceModelId: model.id,
          repairType,
          basePrice: Math.round(basePrice * premiumMultiplier),
          urgencyMultiplier: 1.0,
          complexityMultiplier: 1.2,
          marketDemand: 1.1,
          seasonalFactor: 1.0,
        },
      });
    }
  }

}

async function seedBookings() {
  console.log('📋 Seeding sample bookings...');

  const customers = await prisma.user.findMany({
    where: { role: UserRole.CUSTOMER },
  });

  const deviceModels = await prisma.deviceModel.findMany({
    include: {
      brand: {
        include: {
          category: true,
        },
      },
    },
  });

  const technician = await prisma.user.findFirst({
    where: { role: UserRole.TECHNICIAN },
  });

  if (customers.length === 0 || deviceModels.length === 0) {
    return;
  }

  const sampleBookings = [
    {
      customerId: customers[0].id,
      deviceModelId: deviceModels[0].id,
      repairType: RepairType.SCREEN_REPAIR,
      problemDescription: 'Screen is cracked after dropping the device',
      urgencyLevel: UrgencyLevel.HIGH,
      basePrice: 150,
      finalPrice: 180,
      customerInfo: {
        name: customers[0].firstName + ' ' + customers[0].lastName,
        email: customers[0].email,
        phone: customers[0].phone,
        address: '123 Main St, London, UK',
      },
      deviceCondition: {
        physicalDamage: 'Cracked screen',
        functionalIssues: 'Touch not responsive in bottom right corner',
        accessories: ['Charger', 'Case'],
      },
      photoUrls: ['/uploads/damage-photo-1.jpg'],
      assignedTechnicianId: technician?.id,
    },
    {
      customerId: customers[1]?.id || customers[0].id,
      deviceModelId: deviceModels[1]?.id || deviceModels[0].id,
      repairType: RepairType.BATTERY_REPLACEMENT,
      problemDescription: 'Battery drains very quickly, needs replacement',
      urgencyLevel: UrgencyLevel.STANDARD,
      basePrice: 80,
      finalPrice: 80,
      customerInfo: {
        name: (customers[1] || customers[0]).firstName + ' ' + (customers[1] || customers[0]).lastName,
        email: (customers[1] || customers[0]).email,
        phone: (customers[1] || customers[0]).phone,
        address: '456 Oak Ave, Manchester, UK',
      },
      deviceCondition: {
        physicalDamage: 'None',
        functionalIssues: 'Battery life less than 2 hours',
        accessories: ['Charger'],
      },
    },
  ];

  for (const bookingData of sampleBookings) {
    await prisma.booking.create({
      data: bookingData,
    });
  }

}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });