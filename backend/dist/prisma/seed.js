"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    const mobileCategory = await prisma.deviceCategory.upsert({
        where: { slug: 'mobile-phones' },
        update: {},
        create: {
            name: 'Mobile Phones',
            slug: 'mobile-phones',
            description: 'Smartphones and mobile devices',
            iconName: 'smartphone',
            sortOrder: 1,
        },
    });
    const tabletCategory = await prisma.deviceCategory.upsert({
        where: { slug: 'tablets' },
        update: {},
        create: {
            name: 'Tablets',
            slug: 'tablets',
            description: 'iPad, Android tablets, and other tablet devices',
            iconName: 'tablet',
            sortOrder: 2,
        },
    });
    const appleBrand = await prisma.deviceBrand.upsert({
        where: { categoryId_slug: { categoryId: mobileCategory.id, slug: 'apple' } },
        update: {},
        create: {
            categoryId: mobileCategory.id,
            name: 'Apple',
            slug: 'apple',
            logoUrl: '/images/brands/apple.png',
        },
    });
    const samsungBrand = await prisma.deviceBrand.upsert({
        where: { categoryId_slug: { categoryId: mobileCategory.id, slug: 'samsung' } },
        update: {},
        create: {
            categoryId: mobileCategory.id,
            name: 'Samsung',
            slug: 'samsung',
            logoUrl: '/images/brands/samsung.png',
        },
    });
    const iPhone15 = await prisma.deviceModel.upsert({
        where: { brandId_slug: { brandId: appleBrand.id, slug: 'iphone-15' } },
        update: {},
        create: {
            brandId: appleBrand.id,
            name: 'iPhone 15',
            slug: 'iphone-15',
            year: 2023,
            screenSize: 6.1,
            specs: {
                display: '6.1-inch Super Retina XDR display',
                chipset: 'A16 Bionic chip',
                camera: '48MP main camera',
                storage: ['128GB', '256GB', '512GB'],
                colors: ['Pink', 'Yellow', 'Green', 'Blue', 'Black'],
            },
            imageUrl: '/images/devices/iphone-15.png',
        },
    });
    const galaxyS24 = await prisma.deviceModel.upsert({
        where: { brandId_slug: { brandId: samsungBrand.id, slug: 'galaxy-s24' } },
        update: {},
        create: {
            brandId: samsungBrand.id,
            name: 'Galaxy S24',
            slug: 'galaxy-s24',
            year: 2024,
            screenSize: 6.2,
            specs: {
                display: '6.2-inch Dynamic AMOLED 2X',
                chipset: 'Snapdragon 8 Gen 3',
                camera: '50MP triple camera system',
                storage: ['128GB', '256GB', '512GB'],
                colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
            },
            imageUrl: '/images/devices/galaxy-s24.png',
        },
    });
    await prisma.pricingRule.upsert({
        where: { id: 'screen-repair-iphone-15' },
        update: {},
        create: {
            id: 'screen-repair-iphone-15',
            deviceModelId: iPhone15.id,
            repairType: 'SCREEN_REPAIR',
            basePrice: 279.99,
            urgencyMultiplier: 1.00,
            complexityMultiplier: 1.00,
            marketDemand: 1.2,
            seasonalFactor: 1.0,
            validFrom: new Date('2024-01-01'),
        },
    });
    await prisma.pricingRule.upsert({
        where: { id: 'battery-replacement-iphone-15' },
        update: {},
        create: {
            id: 'battery-replacement-iphone-15',
            deviceModelId: iPhone15.id,
            repairType: 'BATTERY_REPLACEMENT',
            basePrice: 89.99,
            urgencyMultiplier: 1.00,
            complexityMultiplier: 0.8,
            marketDemand: 1.1,
            seasonalFactor: 1.0,
            validFrom: new Date('2024-01-01'),
        },
    });
    const hashedPassword = await (0, bcryptjs_1.hash)('AdminPass123!', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@revivatech.co.uk' },
        update: {},
        create: {
            email: 'admin@revivatech.co.uk',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN',
            isActive: true,
            isVerified: true,
            password_hash: hashedPassword,
        },
    });
    const techPassword = await (0, bcryptjs_1.hash)('TechPass123!', 12);
    const techUser = await prisma.user.upsert({
        where: { email: 'tech@revivatech.co.uk' },
        update: {},
        create: {
            email: 'tech@revivatech.co.uk',
            firstName: 'Tech',
            lastName: 'Specialist',
            role: 'TECHNICIAN',
            isActive: true,
            isVerified: true,
            password_hash: techPassword,
        },
    });
    const customerPassword = await (0, bcryptjs_1.hash)('CustomerPass123!', 12);
    const customerUser = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            email: 'customer@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+44 7700 900123',
            role: 'CUSTOMER',
            isActive: true,
            isVerified: true,
            password_hash: customerPassword,
        },
    });
    await prisma.booking.upsert({
        where: { id: 'sample-booking-1' },
        update: {},
        create: {
            id: 'sample-booking-1',
            customerId: customerUser.id,
            deviceModelId: iPhone15.id,
            repairType: 'SCREEN_REPAIR',
            problemDescription: 'Screen cracked after dropping the phone',
            urgencyLevel: 'STANDARD',
            status: 'PENDING',
            basePrice: 279.99,
            finalPrice: 279.99,
            customerInfo: {
                contactMethod: 'email',
                preferredLanguage: 'en',
                address: {
                    street: '123 High Street',
                    city: 'London',
                    postcode: 'SW1A 1AA',
                    country: 'UK',
                },
            },
            deviceCondition: {
                overallCondition: 'fair',
                screenCondition: 'cracked',
                backCondition: 'good',
                batteryHealth: 'unknown',
            },
            photoUrls: ['/uploads/sample-damage-1.jpg'],
            preferredDate: new Date('2024-12-01'),
        },
    });
    await prisma.email_templates.upsert({
        where: { slug: 'booking-confirmation' },
        update: {},
        create: {
            name: 'Booking Confirmation',
            slug: 'booking-confirmation',
            category: 'booking',
            subject: 'Your RevivaTech Repair Booking Confirmed - {{booking_id}}',
            html_content: `
        <h1>Booking Confirmed!</h1>
        <p>Dear {{customer_name}},</p>
        <p>Thank you for choosing RevivaTech for your device repair needs.</p>
        
        <h2>Booking Details:</h2>
        <ul>
          <li><strong>Booking ID:</strong> {{booking_id}}</li>
          <li><strong>Device:</strong> {{device_name}}</li>
          <li><strong>Repair Type:</strong> {{repair_type}}</li>
          <li><strong>Estimated Price:</strong> £{{price}}</li>
          <li><strong>Scheduled Date:</strong> {{scheduled_date}}</li>
        </ul>
        
        <p>We'll contact you soon with further details.</p>
        
        <p>Best regards,<br>The RevivaTech Team</p>
      `,
            text_content: `
        Booking Confirmed!
        
        Dear {{customer_name}},
        
        Thank you for choosing RevivaTech for your device repair needs.
        
        Booking Details:
        - Booking ID: {{booking_id}}
        - Device: {{device_name}}
        - Repair Type: {{repair_type}}
        - Estimated Price: £{{price}}
        - Scheduled Date: {{scheduled_date}}
        
        We'll contact you soon with further details.
        
        Best regards,
        The RevivaTech Team
      `,
            variables: [
                'customer_name',
                'booking_id',
                'device_name',
                'repair_type',
                'price',
                'scheduled_date',
            ],
            sample_data: {
                customer_name: 'John Doe',
                booking_id: 'RTB20240101-12345',
                device_name: 'iPhone 15',
                repair_type: 'Screen Repair',
                price: '279.99',
                scheduled_date: '2024-12-01',
            },
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log(`
Created:
- Device Categories: Mobile Phones, Tablets
- Device Brands: Apple, Samsung
- Device Models: iPhone 15, Galaxy S24
- Pricing Rules: Screen repair and battery replacement
- Users:
  - Admin: admin@revivatech.co.uk (password: AdminPass123!)
  - Technician: tech@revivatech.co.uk (password: TechPass123!)
  - Customer: customer@example.com (password: CustomerPass123!)
- Sample Booking
- Email Template: Booking Confirmation
  `);
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map