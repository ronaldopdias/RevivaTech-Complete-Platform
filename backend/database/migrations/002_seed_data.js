/**
 * RevivaTech Database Migration: Seed Data
 * Populates the database with initial configuration data from our config files
 */

exports.up = async function(knex) {
  console.log('🌱 Seeding RevivaTech database with initial data...');
  
  try {
    // ===================================
    // DEVICE BRANDS
    // ===================================
    
    const brands = await knex('device_brands').insert([
      {
        name: 'Apple',
        slug: 'apple',
        logo_url: '/images/brands/apple-logo.svg',
        website_url: 'https://www.apple.com',
        support_contact: 'Apple Support',
        display_order: 1
      },
      {
        name: 'Samsung',
        slug: 'samsung',
        logo_url: '/images/brands/samsung-logo.svg',
        website_url: 'https://www.samsung.com',
        support_contact: 'Samsung Support',
        display_order: 2
      },
      {
        name: 'Google',
        slug: 'google',
        logo_url: '/images/brands/google-logo.svg',
        website_url: 'https://store.google.com',
        support_contact: 'Google Support',
        display_order: 3
      },
      {
        name: 'Huawei',
        slug: 'huawei',
        logo_url: '/images/brands/huawei-logo.svg',
        website_url: 'https://www.huawei.com',
        support_contact: 'Huawei Support',
        display_order: 4
      },
      {
        name: 'Xiaomi',
        slug: 'xiaomi',
        logo_url: '/images/brands/xiaomi-logo.svg',
        website_url: 'https://www.mi.com',
        support_contact: 'Xiaomi Support',
        display_order: 5
      },
      {
        name: 'OnePlus',
        slug: 'oneplus',
        logo_url: '/images/brands/oneplus-logo.svg',
        website_url: 'https://www.oneplus.com',
        support_contact: 'OnePlus Support',
        display_order: 6
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${brands.length} device brands`);
    
    // ===================================
    // DEVICE CATEGORIES
    // ===================================
    
    const categories = await knex('device_categories').insert([
      {
        name: 'Smartphone',
        slug: 'smartphone',
        description: 'Mobile phones and smartphones',
        icon: 'smartphone',
        color: 'blue',
        display_order: 1
      },
      {
        name: 'Tablet',
        slug: 'tablet',
        description: 'Tablets and iPads',
        icon: 'tablet',
        color: 'green',
        display_order: 2
      },
      {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Laptops and notebooks',
        icon: 'laptop',
        color: 'purple',
        display_order: 3
      },
      {
        name: 'Desktop',
        slug: 'desktop',
        description: 'Desktop computers and all-in-ones',
        icon: 'monitor',
        color: 'orange',
        display_order: 4
      },
      {
        name: 'Gaming Console',
        slug: 'gaming-console',
        description: 'Gaming consoles and handhelds',
        icon: 'gamepad-2',
        color: 'red',
        display_order: 5
      },
      {
        name: 'Smartwatch',
        slug: 'smartwatch',
        description: 'Smartwatches and wearables',
        icon: 'watch',
        color: 'yellow',
        display_order: 6
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${categories.length} device categories`);
    
    // ===================================
    // REPAIR CATEGORIES
    // ===================================
    
    const repairCategories = await knex('repair_categories').insert([
      {
        name: 'Screen & Display',
        slug: 'screen-display',
        description: 'Screen replacements, display issues, touch problems',
        icon: 'monitor',
        color: 'blue',
        priority: 1,
        estimated_time_min: 1,
        estimated_time_max: 4,
        popularity_score: 95
      },
      {
        name: 'Battery & Power',
        slug: 'battery-power',
        description: 'Battery replacement, charging issues, power problems',
        icon: 'battery',
        color: 'green',
        priority: 2,
        estimated_time_min: 1,
        estimated_time_max: 3,
        popularity_score: 88
      },
      {
        name: 'Hardware Repair',
        slug: 'hardware-repair',
        description: 'Internal component repair and replacement',
        icon: 'cpu',
        color: 'purple',
        priority: 3,
        estimated_time_min: 2,
        estimated_time_max: 8,
        popularity_score: 72
      },
      {
        name: 'Water Damage',
        slug: 'water-damage',
        description: 'Liquid damage assessment and repair',
        icon: 'droplets',
        color: 'red',
        priority: 4,
        estimated_time_min: 4,
        estimated_time_max: 12,
        popularity_score: 45
      },
      {
        name: 'Software Repair',
        slug: 'software-repair',
        description: 'Software issues, OS problems, performance optimization',
        icon: 'settings',
        color: 'orange',
        priority: 5,
        estimated_time_min: 1,
        estimated_time_max: 6,
        popularity_score: 78
      },
      {
        name: 'Data Recovery',
        slug: 'data-recovery',
        description: 'Data recovery, file restoration, backup services',
        icon: 'hard-drive',
        color: 'yellow',
        priority: 6,
        estimated_time_min: 2,
        estimated_time_max: 24,
        popularity_score: 35
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${repairCategories.length} repair categories`);
    
    // ===================================
    // SAMPLE DEVICES (Popular models)
    // ===================================
    
    // Get brand IDs for reference
    const appleBrand = brands.find(b => b.slug === 'apple');
    const samsungBrand = brands.find(b => b.slug === 'samsung');
    const googleBrand = brands.find(b => b.slug === 'google');
    
    const smartphoneCategory = categories.find(c => c.slug === 'smartphone');
    const tabletCategory = categories.find(c => c.slug === 'tablet');
    const laptopCategory = categories.find(c => c.slug === 'laptop');
    
    const devices = await knex('devices').insert([
      // Apple iPhones
      {
        brand_id: appleBrand.id,
        category_id: smartphoneCategory.id,
        name: 'iPhone 15 Pro',
        model: 'iPhone15,2',
        slug: 'apple-iphone-15-pro',
        release_year: 2023,
        release_date: '2023-09-22',
        specifications: JSON.stringify({
          screen_size: '6.1"',
          display_tech: 'Super Retina XDR OLED',
          processor: 'A17 Pro',
          camera: '48MP Triple camera',
          connectivity: '5G, WiFi 6E, Bluetooth 5.3'
        }),
        has_variants: true,
        base_storage_gb: 128,
        available_storage: JSON.stringify([128, 256, 512, 1024]),
        available_colors: JSON.stringify(['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium']),
        primary_image_url: '/images/devices/iphone-15-pro.jpg',
        popularity_score: 98,
        repair_difficulty: 'medium',
        parts_availability: 'excellent',
        search_keywords: 'iPhone 15 Pro Apple smartphone mobile phone',
        is_featured: true
      },
      {
        brand_id: appleBrand.id,
        category_id: smartphoneCategory.id,
        name: 'iPhone 14',
        model: 'iPhone14,7',
        slug: 'apple-iphone-14',
        release_year: 2022,
        release_date: '2022-09-16',
        specifications: JSON.stringify({
          screen_size: '6.1"',
          display_tech: 'Super Retina XDR OLED',
          processor: 'A15 Bionic',
          camera: '12MP Dual camera',
          connectivity: '5G, WiFi 6, Bluetooth 5.3'
        }),
        has_variants: true,
        base_storage_gb: 128,
        available_storage: JSON.stringify([128, 256, 512]),
        available_colors: JSON.stringify(['Blue', 'Purple', 'Midnight', 'Starlight', 'Red']),
        primary_image_url: '/images/devices/iphone-14.jpg',
        popularity_score: 92,
        repair_difficulty: 'medium',
        parts_availability: 'excellent',
        search_keywords: 'iPhone 14 Apple smartphone mobile phone',
        is_featured: true
      },
      
      // Samsung Galaxy
      {
        brand_id: samsungBrand.id,
        category_id: smartphoneCategory.id,
        name: 'Galaxy S24 Ultra',
        model: 'SM-S928B',
        slug: 'samsung-galaxy-s24-ultra',
        release_year: 2024,
        release_date: '2024-01-24',
        specifications: JSON.stringify({
          screen_size: '6.8"',
          display_tech: 'Dynamic AMOLED 2X',
          processor: 'Snapdragon 8 Gen 3',
          camera: '200MP Quad camera',
          connectivity: '5G, WiFi 7, Bluetooth 5.3'
        }),
        has_variants: true,
        base_storage_gb: 256,
        available_storage: JSON.stringify([256, 512, 1024]),
        available_colors: JSON.stringify(['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow']),
        primary_image_url: '/images/devices/galaxy-s24-ultra.jpg',
        popularity_score: 89,
        repair_difficulty: 'hard',
        parts_availability: 'good',
        search_keywords: 'Galaxy S24 Ultra Samsung smartphone Android',
        is_featured: true
      },
      
      // Google Pixel
      {
        brand_id: googleBrand.id,
        category_id: smartphoneCategory.id,
        name: 'Pixel 8 Pro',
        model: 'GP4BC',
        slug: 'google-pixel-8-pro',
        release_year: 2023,
        release_date: '2023-10-12',
        specifications: JSON.stringify({
          screen_size: '6.7"',
          display_tech: 'LTPO OLED',
          processor: 'Google Tensor G3',
          camera: '50MP Triple camera',
          connectivity: '5G, WiFi 7, Bluetooth 5.3'
        }),
        has_variants: true,
        base_storage_gb: 128,
        available_storage: JSON.stringify([128, 256, 512]),
        available_colors: JSON.stringify(['Obsidian', 'Porcelain', 'Bay']),
        primary_image_url: '/images/devices/pixel-8-pro.jpg',
        popularity_score: 85,
        repair_difficulty: 'medium',
        parts_availability: 'good',
        search_keywords: 'Pixel 8 Pro Google smartphone Android camera',
        is_featured: true
      },
      
      // Apple iPad
      {
        brand_id: appleBrand.id,
        category_id: tabletCategory.id,
        name: 'iPad Pro 12.9" (6th generation)',
        model: 'iPad14,6',
        slug: 'apple-ipad-pro-12-9-6th-gen',
        release_year: 2022,
        release_date: '2022-10-26',
        specifications: JSON.stringify({
          screen_size: '12.9"',
          display_tech: 'Liquid Retina XDR',
          processor: 'Apple M2',
          connectivity: 'WiFi 6E, Bluetooth 5.3, 5G (Cellular models)'
        }),
        has_variants: true,
        base_storage_gb: 128,
        available_storage: JSON.stringify([128, 256, 512, 1024, 2048]),
        available_colors: JSON.stringify(['Space Gray', 'Silver']),
        primary_image_url: '/images/devices/ipad-pro-12-9.jpg',
        popularity_score: 82,
        repair_difficulty: 'hard',
        parts_availability: 'good',
        search_keywords: 'iPad Pro 12.9 Apple tablet M2 Liquid Retina',
        is_featured: false
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${devices.length} sample devices`);
    
    // ===================================
    // REPAIR TYPES (Key services)
    // ===================================
    
    const screenCategory = repairCategories.find(c => c.slug === 'screen-display');
    const batteryCategory = repairCategories.find(c => c.slug === 'battery-power');
    const waterCategory = repairCategories.find(c => c.slug === 'water-damage');
    const hardwareCategory = repairCategories.find(c => c.slug === 'hardware-repair');
    
    const repairTypes = await knex('repair_types').insert([
      {
        category_id: screenCategory.id,
        name: 'Screen Replacement (Standard)',
        slug: 'screen-replacement-basic',
        short_description: 'Professional screen replacement with 6-month warranty',
        long_description: 'Complete screen assembly replacement including touch digitizer, LCD/OLED panel, and front glass. All repairs include thorough testing and calibration.',
        base_price: 89.00,
        currency: 'GBP',
        labor_hours: 1.5,
        hourly_rate: 45.00,
        complexity_multipliers: JSON.stringify({
          simple: 0.8,
          standard: 1.0,
          complex: 1.3,
          extreme: 1.8
        }),
        urgency_multipliers: JSON.stringify({
          standard: 1.0,
          priority: 1.25,
          emergency: 1.5
        }),
        condition_multipliers: JSON.stringify({
          excellent: 1.0,
          good: 1.1,
          fair: 1.2,
          poor: 1.3
        }),
        skill_level: 'intermediate',
        estimated_duration: 1.5,
        required_tools: JSON.stringify(['screwdrivers', 'spudgers', 'heat-gun', 'adhesive']),
        required_parts: JSON.stringify(['screen-assembly', 'adhesive-strips']),
        risk_level: 'medium',
        data_risk: 'low',
        success_rate: 98,
        warranty_months: 6,
        diagnostic_required: true,
        testing_required: true,
        calibration_required: true,
        data_backup_recommended: true,
        compatible_device_types: JSON.stringify(['smartphone', 'tablet']),
        compatible_brands: JSON.stringify(['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus']),
        min_device_year: 2016,
        max_device_year: 2025,
        popularity_rank: 1,
        conversion_rate: 85.00,
        customer_satisfaction: 4.80,
        repeat_booking_rate: 12.00,
        seasonal_trends: JSON.stringify({
          january: 1.2, february: 1.0, march: 1.1,
          april: 1.0, may: 0.9, june: 0.8,
          july: 0.9, august: 1.0, september: 1.3,
          october: 1.1, november: 1.4, december: 1.6
        }),
        is_enabled: true,
        walk_in_accepted: true,
        advance_notice_hours: 2,
        max_bookings_per_day: 15
      },
      {
        category_id: batteryCategory.id,
        name: 'Phone Battery Replacement',
        slug: 'battery-replacement-phone',
        short_description: 'High-quality battery replacement with 12-month warranty',
        long_description: 'Professional battery replacement using genuine or premium aftermarket batteries. Includes battery calibration and health optimization.',
        base_price: 65.00,
        currency: 'GBP',
        labor_hours: 1.0,
        hourly_rate: 45.00,
        complexity_multipliers: JSON.stringify({
          simple: 0.9,
          standard: 1.0,
          complex: 1.2,
          extreme: 1.5
        }),
        urgency_multipliers: JSON.stringify({
          standard: 1.0,
          priority: 1.25,
          emergency: 1.5
        }),
        condition_multipliers: JSON.stringify({
          excellent: 1.0,
          good: 1.0,
          fair: 1.1,
          poor: 1.2
        }),
        skill_level: 'intermediate',
        estimated_duration: 1.0,
        required_tools: JSON.stringify(['screwdrivers', 'spudgers', 'battery-adhesive-remover']),
        required_parts: JSON.stringify(['battery', 'adhesive-strips']),
        risk_level: 'low',
        data_risk: 'none',
        success_rate: 99,
        warranty_months: 12,
        diagnostic_required: true,
        testing_required: true,
        calibration_required: true,
        compatible_device_types: JSON.stringify(['smartphone']),
        compatible_brands: JSON.stringify(['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'oneplus', 'sony']),
        min_device_year: 2015,
        max_device_year: 2025,
        popularity_rank: 2,
        conversion_rate: 90.00,
        customer_satisfaction: 4.90,
        repeat_booking_rate: 8.00,
        seasonal_trends: JSON.stringify({
          january: 1.3, february: 1.2, march: 1.0,
          april: 0.9, may: 0.8, june: 0.7,
          july: 0.8, august: 0.9, september: 1.1,
          october: 1.2, november: 1.4, december: 1.5
        }),
        is_enabled: true,
        walk_in_accepted: true,
        advance_notice_hours: 1,
        max_bookings_per_day: 20
      },
      {
        category_id: waterCategory.id,
        name: 'Water Damage Assessment & Repair',
        slug: 'water-damage-assessment',
        short_description: 'Professional liquid damage assessment with potential restoration',
        long_description: 'Comprehensive evaluation of liquid-damaged devices with professional cleaning, component testing, and repair where possible. No fix, no fee policy for irreparable devices.',
        base_price: 45.00,
        currency: 'GBP',
        labor_hours: 2.0,
        hourly_rate: 55.00,
        complexity_multipliers: JSON.stringify({
          simple: 1.0,
          standard: 1.5,
          complex: 2.5,
          extreme: 4.0
        }),
        urgency_multipliers: JSON.stringify({
          standard: 1.0,
          priority: 1.3,
          emergency: 1.8
        }),
        condition_multipliers: JSON.stringify({
          excellent: 1.0,
          good: 1.2,
          fair: 1.8,
          poor: 3.0
        }),
        skill_level: 'expert',
        estimated_duration: 4.0,
        required_tools: JSON.stringify(['ultrasonic-cleaner', 'isopropyl-alcohol', 'microscope', 'multimeter']),
        required_parts: JSON.stringify(['various-components']),
        risk_level: 'critical',
        data_risk: 'high',
        success_rate: 65,
        warranty_months: 3,
        diagnostic_required: true,
        testing_required: true,
        calibration_required: true,
        data_backup_recommended: true,
        compatible_device_types: JSON.stringify(['smartphone', 'tablet', 'laptop', 'watch']),
        compatible_brands: JSON.stringify(['apple', 'samsung', 'google', 'huawei', 'xiaomi', 'sony', 'lg']),
        min_device_year: 2010,
        max_device_year: 2025,
        popularity_rank: 8,
        conversion_rate: 45.00,
        customer_satisfaction: 4.20,
        repeat_booking_rate: 25.00,
        seasonal_trends: JSON.stringify({
          january: 0.8, february: 0.7, march: 0.9,
          april: 1.0, may: 1.2, june: 1.5,
          july: 1.8, august: 1.6, september: 1.1,
          october: 0.9, november: 0.8, december: 1.0
        }),
        is_enabled: true,
        requires_appointment: true,
        walk_in_accepted: false,
        advance_notice_hours: 24,
        max_bookings_per_day: 3
      },
      {
        category_id: hardwareCategory.id,
        name: 'Motherboard/Logic Board Repair',
        slug: 'motherboard-repair',
        short_description: 'Expert-level motherboard repair for complex hardware issues',
        long_description: 'Advanced component-level repair for motherboard issues including IC replacement, trace repair, and power management problems. Performed by certified micro-soldering specialists.',
        base_price: 150.00,
        currency: 'GBP',
        labor_hours: 4.0,
        hourly_rate: 75.00,
        complexity_multipliers: JSON.stringify({
          simple: 1.0,
          standard: 1.5,
          complex: 2.2,
          extreme: 3.5
        }),
        urgency_multipliers: JSON.stringify({
          standard: 1.0,
          priority: 1.4,
          emergency: 2.0
        }),
        condition_multipliers: JSON.stringify({
          excellent: 1.0,
          good: 1.2,
          fair: 1.6,
          poor: 2.5
        }),
        skill_level: 'expert',
        estimated_duration: 6.0,
        required_tools: JSON.stringify(['soldering-station', 'hot-air-rework', 'microscope', 'multimeter', 'oscilloscope']),
        required_parts: JSON.stringify(['various-ic-components']),
        risk_level: 'critical',
        data_risk: 'high',
        success_rate: 75,
        warranty_months: 6,
        diagnostic_required: true,
        testing_required: true,
        calibration_required: true,
        data_backup_recommended: true,
        compatible_device_types: JSON.stringify(['smartphone', 'tablet', 'laptop']),
        compatible_brands: JSON.stringify(['apple', 'samsung', 'google', 'huawei']),
        min_device_year: 2018,
        max_device_year: 2025,
        popularity_rank: 12,
        conversion_rate: 35.00,
        customer_satisfaction: 4.60,
        repeat_booking_rate: 5.00,
        seasonal_trends: JSON.stringify({
          january: 1.1, february: 1.0, march: 1.0,
          april: 0.9, may: 0.9, june: 0.8,
          july: 0.8, august: 0.9, september: 1.1,
          october: 1.2, november: 1.3, december: 1.4
        }),
        is_enabled: true,
        requires_appointment: true,
        walk_in_accepted: false,
        advance_notice_hours: 48,
        max_bookings_per_day: 2
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${repairTypes.length} repair types`);
    
    // ===================================
    // PRICING FACTORS
    // ===================================
    
    const pricingFactors = await knex('pricing_factors').insert([
      {
        name: 'Device Age',
        slug: 'device-age',
        description: 'Pricing adjustment based on device age',
        factor_type: 'multiplier',
        weight: 0.30,
        factor_values: JSON.stringify({
          new: { value: 1.0, label: 'New (0-1 years)', description: 'Latest devices' },
          recent: { value: 1.1, label: 'Recent (1-2 years)', description: 'Relatively new' },
          standard: { value: 1.2, label: 'Standard (2-4 years)', description: 'Common age range' },
          older: { value: 1.4, label: 'Older (4-6 years)', description: 'Harder to find parts' },
          vintage: { value: 1.8, label: 'Vintage (6+ years)', description: 'Rare parts required' }
        }),
        applies_to_all: true,
        min_value: 1.0,
        max_value: 2.0,
        precision_places: 2,
        is_stackable: true
      },
      {
        name: 'Damage Severity',
        slug: 'damage-severity',
        description: 'Adjustment based on extent of damage',
        factor_type: 'multiplier',
        weight: 0.40,
        factor_values: JSON.stringify({
          minor: { value: 0.9, label: 'Minor Damage', description: 'Small cracks or scratches' },
          moderate: { value: 1.0, label: 'Moderate Damage', description: 'Standard repair scope' },
          severe: { value: 1.3, label: 'Severe Damage', description: 'Multiple issues or complications' },
          extensive: { value: 1.6, label: 'Extensive Damage', description: 'Major reconstruction required' },
          catastrophic: { value: 2.0, label: 'Catastrophic', description: 'Near total replacement needed' }
        }),
        applies_to_all: true,
        min_value: 0.8,
        max_value: 2.5,
        precision_places: 2,
        is_stackable: true
      },
      {
        name: 'Service Urgency',
        slug: 'service-urgency',
        description: 'Surcharge for expedited service',
        factor_type: 'multiplier',
        weight: 0.30,
        factor_values: JSON.stringify({
          standard: { value: 1.0, label: 'Standard (3-5 days)', description: 'Normal service timeline' },
          priority: { value: 1.25, label: 'Priority (1-2 days)', description: 'Expedited service' },
          rush: { value: 1.5, label: 'Rush (same day)', description: 'Same day completion' },
          emergency: { value: 2.0, label: 'Emergency (immediate)', description: 'Immediate attention required' }
        }),
        applies_to_all: true,
        min_value: 1.0,
        max_value: 2.5,
        precision_places: 2,
        is_stackable: true
      },
      {
        name: 'Brand Premium',
        slug: 'brand-premium',
        description: 'Pricing adjustment based on device brand',
        factor_type: 'multiplier',
        weight: 0.20,
        factor_values: JSON.stringify({
          apple: { value: 1.2, label: 'Apple', description: 'Premium brand with specialized tools' },
          samsung: { value: 1.1, label: 'Samsung', description: 'Popular brand with good parts availability' },
          google: { value: 1.1, label: 'Google Pixel', description: 'Specialized components' },
          huawei: { value: 1.0, label: 'Huawei', description: 'Standard pricing' },
          xiaomi: { value: 0.9, label: 'Xiaomi', description: 'Lower complexity' },
          other: { value: 0.95, label: 'Other Brands', description: 'Generic pricing' }
        }),
        applies_to_device_types: JSON.stringify(['smartphone', 'tablet', 'laptop']),
        min_value: 0.8,
        max_value: 1.5,
        precision_places: 2,
        is_stackable: true
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${pricingFactors.length} pricing factors`);
    
    // ===================================
    // PRICING RULES
    // ===================================
    
    const pricingRules = await knex('pricing_rules').insert([
      {
        name: 'Minimum Viable Repair Cost',
        slug: 'minimum-viable-repair',
        description: 'Ensure all repairs meet minimum viable cost',
        priority: 100,
        conditions: JSON.stringify({}),
        effects: JSON.stringify([
          {
            type: 'set_minimum',
            value: 35,
            target: 'total',
            message: 'Minimum repair charge applied'
          }
        ]),
        is_enabled: true
      },
      {
        name: 'Water Damage Diagnostic Fee',
        slug: 'water-damage-diagnostic',
        description: 'Special diagnostic fee for water damaged devices',
        priority: 90,
        conditions: JSON.stringify({
          repairType: ['water-damage-assessment']
        }),
        effects: JSON.stringify([
          {
            type: 'add_surcharge',
            value: 25,
            target: 'total',
            message: 'Water damage diagnostic fee'
          }
        ]),
        is_enabled: true
      },
      {
        name: 'Weekend Service Premium',
        slug: 'weekend-premium',
        description: '15% surcharge for weekend appointments',
        priority: 80,
        conditions: JSON.stringify({
          dayOfWeek: [0, 6]
        }),
        effects: JSON.stringify([
          {
            type: 'apply_discount',
            value: -15,
            target: 'total',
            message: 'Weekend service premium (15%)'
          }
        ]),
        is_enabled: true
      },
      {
        name: 'Student Discount',
        slug: 'student-discount',
        description: '15% discount for students with valid ID',
        priority: 60,
        conditions: JSON.stringify({
          customerType: ['student']
        }),
        effects: JSON.stringify([
          {
            type: 'apply_discount',
            value: 15,
            target: 'total',
            message: 'Student discount (15%)'
          }
        ]),
        is_enabled: true
      },
      {
        name: 'Round to Nearest £5',
        slug: 'round-to-nearest-five',
        description: 'Round final price to nearest £5 for clean pricing',
        priority: 10,
        conditions: JSON.stringify({}),
        effects: JSON.stringify([
          {
            type: 'round_to',
            value: 5,
            target: 'total',
            message: 'Rounded to nearest £5'
          }
        ]),
        is_enabled: true
      }
    ]).returning('*');
    
    console.log(`✅ Inserted ${pricingRules.length} pricing rules`);
    
    // ===================================
    // SUMMARY
    // ===================================
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Seeded data summary:');
    console.log(`   - ${brands.length} device brands (Apple, Samsung, Google, etc.)`);
    console.log(`   - ${categories.length} device categories (Smartphone, Tablet, Laptop, etc.)`);
    console.log(`   - ${repairCategories.length} repair categories (Screen, Battery, Hardware, etc.)`);
    console.log(`   - ${devices.length} sample devices (iPhone 15 Pro, Galaxy S24 Ultra, etc.)`);
    console.log(`   - ${repairTypes.length} repair types (Screen replacement, Battery, Water damage, etc.)`);
    console.log(`   - ${pricingFactors.length} pricing factors (Device age, Damage severity, etc.)`);
    console.log(`   - ${pricingRules.length} pricing rules (Minimum charge, Discounts, etc.)`);
    console.log('');
    console.log('🚀 The database is now ready for production use!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
};

exports.down = async function(knex) {
  console.log('🔄 Rolling back seed data...');
  
  try {
    // Clear all data in reverse dependency order
    await knex('pricing_rules').del();
    await knex('pricing_factors').del();
    await knex('repair_types').del();
    await knex('repair_categories').del();
    await knex('device_variants').del();
    await knex('devices').del();
    await knex('device_categories').del();
    await knex('device_brands').del();
    
    console.log('✅ Seed data rollback completed');
    
  } catch (error) {
    console.error('❌ Seed rollback failed:', error.message);
    throw error;
  }
};