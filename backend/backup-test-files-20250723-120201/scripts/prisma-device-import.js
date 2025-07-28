#!/usr/bin/env node

/**
 * Prisma-Compatible UK Device Database Import Script
 * Works with existing Prisma schema (camelCase columns)
 * Expands device catalog to include comprehensive UK market coverage (2015-2025)
 * 
 * Usage: node scripts/prisma-device-import.js
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5435,
  database: process.env.DB_NAME || 'revivatech_new',
  user: process.env.DB_USER || 'revivatech_user',
  password: process.env.DB_PASSWORD || 'revivatech_password',
});

// Helper function to generate unique IDs
function generateId(prefix, name, year) {
  return `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${year}`;
}

// Helper function to calculate repair prices with UK market adjustments
function calculateRepairPrice(basePrice, year, brand) {
  let price = basePrice;
  
  // Age-based pricing adjustments (UK market)
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age >= 8) { // 2015-2017
    price += 20;
  } else if (age >= 5) { // 2018-2020
    price += 15;
  } else if (age >= 3) { // 2021-2022
    price += 10;
  }
  
  // Brand premiums (UK market rates)
  const brandMultipliers = {
    'Apple': 1.25,       // 25% premium
    'Samsung': 1.15,     // 15% premium
    'Google': 1.10,      // 10% premium
    'Sony': 1.30,        // 30% premium (PlayStation/premium)
    'MSI': 1.30,         // 30% premium (gaming)
    'Razer': 1.30,       // 30% premium (gaming)
    'Microsoft': 1.15,   // 15% premium
    'Dell': 1.05,        // 5% premium
    'HP': 1.05,          // 5% premium
    'Lenovo': 1.05,      // 5% premium
    'ASUS': 1.10,        // 10% premium
    'OnePlus': 1.08,     // 8% premium
    'Nintendo': 1.25,    // 25% premium
  };
  
  const multiplier = brandMultipliers[brand] || 1.0;
  return Math.round(price * multiplier);
}

// Categories to insert/update
const categories = [
  // Apple Categories
  { id: 'macbook', name: 'MacBook', slug: 'macbook', description: 'Apple MacBook laptops - Air and Pro models', iconName: 'laptop', sortOrder: 1 },
  { id: 'imac', name: 'iMac', slug: 'imac', description: 'Apple iMac all-in-one desktop computers', iconName: 'desktop', sortOrder: 2 },
  { id: 'mac_mini', name: 'Mac Mini', slug: 'mac-mini', description: 'Apple Mac Mini compact desktop computers', iconName: 'cpu', sortOrder: 3 },
  { id: 'mac_studio', name: 'Mac Studio', slug: 'mac-studio', description: 'Apple Mac Studio high-performance compact desktops', iconName: 'cpu', sortOrder: 4 },
  { id: 'mac_pro', name: 'Mac Pro', slug: 'mac-pro', description: 'Apple Mac Pro professional workstations', iconName: 'cpu', sortOrder: 5 },
  { id: 'iphone', name: 'iPhone', slug: 'iphone', description: 'Apple iPhone smartphones', iconName: 'smartphone', sortOrder: 6 },
  { id: 'ipad', name: 'iPad', slug: 'ipad', description: 'Apple iPad tablets', iconName: 'tablet', sortOrder: 7 },
  
  // PC Categories
  { id: 'laptop_pc', name: 'Laptop PC', slug: 'laptop-pc', description: 'Windows laptops and ultrabooks from all manufacturers', iconName: 'laptop', sortOrder: 8 },
  { id: 'gaming_laptop', name: 'Gaming Laptop', slug: 'gaming-laptop', description: 'High-performance gaming laptops', iconName: 'laptop', sortOrder: 9 },
  { id: 'ultrabook', name: 'Ultrabook', slug: 'ultrabook', description: 'Thin and light premium laptops', iconName: 'laptop', sortOrder: 10 },
  { id: 'desktop_pc', name: 'Desktop PC', slug: 'desktop-pc', description: 'Windows desktop computers and workstations', iconName: 'desktop', sortOrder: 11 },
  
  // Android Categories
  { id: 'android_phone', name: 'Android Phone', slug: 'android-phone', description: 'Android smartphones from all manufacturers', iconName: 'smartphone', sortOrder: 12 },
  { id: 'android_tablet', name: 'Android Tablet', slug: 'android-tablet', description: 'Android tablets and e-readers', iconName: 'tablet', sortOrder: 13 },
  
  // Gaming Categories
  { id: 'gaming_console', name: 'Gaming Console', slug: 'gaming-console', description: 'PlayStation, Xbox, Nintendo Switch, and other gaming consoles', iconName: 'gamepad', sortOrder: 14 },
];

// Brands to insert/update
const brands = [
  // Apple
  { id: 'apple', categoryId: 'iphone', name: 'Apple', slug: 'apple', logoUrl: '/images/brands/apple.svg' },
  
  // Android Brands
  { id: 'samsung', categoryId: 'android_phone', name: 'Samsung', slug: 'samsung', logoUrl: '/images/brands/samsung.svg' },
  { id: 'google', categoryId: 'android_phone', name: 'Google', slug: 'google', logoUrl: '/images/brands/google.svg' },
  { id: 'oneplus', categoryId: 'android_phone', name: 'OnePlus', slug: 'oneplus', logoUrl: '/images/brands/oneplus.svg' },
  
  // PC Brands
  { id: 'dell', categoryId: 'laptop_pc', name: 'Dell', slug: 'dell', logoUrl: '/images/brands/dell.svg' },
  { id: 'hp', categoryId: 'laptop_pc', name: 'HP', slug: 'hp', logoUrl: '/images/brands/hp.svg' },
  { id: 'lenovo', categoryId: 'laptop_pc', name: 'Lenovo', slug: 'lenovo', logoUrl: '/images/brands/lenovo.svg' },
  { id: 'asus', categoryId: 'laptop_pc', name: 'ASUS', slug: 'asus', logoUrl: '/images/brands/asus.svg' },
  { id: 'msi', categoryId: 'gaming_laptop', name: 'MSI', slug: 'msi', logoUrl: '/images/brands/msi.svg' },
  { id: 'microsoft', categoryId: 'ultrabook', name: 'Microsoft', slug: 'microsoft', logoUrl: '/images/brands/microsoft.svg' },
  { id: 'razer', categoryId: 'gaming_laptop', name: 'Razer', slug: 'razer', logoUrl: '/images/brands/razer.svg' },
  
  // Gaming Brands
  { id: 'sony', categoryId: 'gaming_console', name: 'Sony', slug: 'sony', logoUrl: '/images/brands/sony.svg' },
  { id: 'nintendo', categoryId: 'gaming_console', name: 'Nintendo', slug: 'nintendo', logoUrl: '/images/brands/nintendo.svg' },
];

// Comprehensive device models for UK market (2015-2025)
const deviceModels = [
  // === IPHONE MODELS (2015-2025) ===
  
  // iPhone 16 Series (2024)
  {
    id: generateId('iphone', '16_pro_max', 2024),
    brandId: 'apple',
    name: 'iPhone 16 Pro Max',
    slug: 'iphone-16-pro-max',
    year: 2024,
    screenSize: 6.9,
    specs: {
      model: 'A3294',
      processor: 'A18 Pro',
      memory: '8GB',
      storage: '256GB - 1TB',
      screen: { size: '6.9"', resolution: '2868x1320', type: 'Super Retina XDR OLED ProMotion' },
      cameras: 'Triple camera system (48MP Main, 48MP Ultra Wide, 12MP Telephoto 5x)',
      connectivity: 'USB-C, 5G, Wi-Fi 7, Bluetooth 5.3',
      common_issues: ['Screen cracks', 'Camera lens damage', 'Battery degradation', 'USB-C port issues', 'Camera Control button problems'],
      average_repair_cost: calculateRepairPrice(280, 2024, 'Apple'),
      repairability_score: 6.0,
      popularity_score: 9.8
    },
    imageUrl: '/images/devices/iphone-16-pro-max.jpg'
  },
  {
    id: generateId('iphone', '16_pro', 2024),
    brandId: 'apple',
    name: 'iPhone 16 Pro',
    slug: 'iphone-16-pro',
    year: 2024,
    screenSize: 6.3,
    specs: {
      model: 'A3293',
      processor: 'A18 Pro',
      memory: '8GB',
      storage: '128GB - 1TB',
      screen: { size: '6.3"', resolution: '2622x1206', type: 'Super Retina XDR OLED ProMotion' },
      common_issues: ['Screen cracks', 'Camera lens damage', 'Battery degradation', 'USB-C port issues'],
      average_repair_cost: calculateRepairPrice(260, 2024, 'Apple')
    },
    imageUrl: '/images/devices/iphone-16-pro.jpg'
  },
  {
    id: generateId('iphone', '16_plus', 2024),
    brandId: 'apple',
    name: 'iPhone 16 Plus',
    slug: 'iphone-16-plus',
    year: 2024,
    screenSize: 6.7,
    specs: {
      model: 'A3292',
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB',
      common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
      average_repair_cost: calculateRepairPrice(220, 2024, 'Apple')
    },
    imageUrl: '/images/devices/iphone-16-plus.jpg'
  },
  {
    id: generateId('iphone', '16', 2024),
    brandId: 'apple',
    name: 'iPhone 16',
    slug: 'iphone-16',
    year: 2024,
    screenSize: 6.1,
    specs: {
      model: 'A3291',
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB',
      common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
      average_repair_cost: calculateRepairPrice(200, 2024, 'Apple')
    },
    imageUrl: '/images/devices/iphone-16.jpg'
  },
  
  // iPhone 15 Series (2023)
  {
    id: generateId('iphone', '15_pro_max', 2023),
    brandId: 'apple',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    year: 2023,
    screenSize: 6.7,
    specs: {
      model: 'A3108',
      processor: 'A17 Pro',
      memory: '8GB',
      storage: '256GB - 1TB',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Apple')
    },
    imageUrl: '/images/devices/iphone-15-pro-max.jpg'
  },
  {
    id: generateId('iphone', '15_pro', 2023),
    brandId: 'apple',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    year: 2023,
    screenSize: 6.1,
    specs: {
      model: 'A3107',
      processor: 'A17 Pro',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
      average_repair_cost: calculateRepairPrice(200, 2023, 'Apple')
    },
    imageUrl: '/images/devices/iphone-15-pro.jpg'
  },
  {
    id: generateId('iphone', '15_plus', 2023),
    brandId: 'apple',
    name: 'iPhone 15 Plus',
    slug: 'iphone-15-plus',
    year: 2023,
    screenSize: 6.7,
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(180, 2023, 'Apple')
    },
    imageUrl: '/images/devices/iphone-15-plus.jpg'
  },
  {
    id: generateId('iphone', '15', 2023),
    brandId: 'apple',
    name: 'iPhone 15',
    slug: 'iphone-15',
    year: 2023,
    screenSize: 6.1,
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(160, 2023, 'Apple')
    },
    imageUrl: '/images/devices/iphone-15.jpg'
  },
  
  // iPhone 14 Series (2022)
  {
    id: generateId('iphone', '14_pro_max', 2022),
    brandId: 'apple',
    name: 'iPhone 14 Pro Max',
    slug: 'iphone-14-pro-max',
    year: 2022,
    screenSize: 6.7,
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Apple')
    },
    imageUrl: '/images/devices/iphone-14-pro-max.jpg'
  },
  {
    id: generateId('iphone', '14_pro', 2022),
    brandId: 'apple',
    name: 'iPhone 14 Pro',
    slug: 'iphone-14-pro',
    year: 2022,
    screenSize: 6.1,
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2022, 'Apple')
    },
    imageUrl: '/images/devices/iphone-14-pro.jpg'
  },
  {
    id: generateId('iphone', '14_plus', 2022),
    brandId: 'apple',
    name: 'iPhone 14 Plus',
    slug: 'iphone-14-plus',
    year: 2022,
    screenSize: 6.7,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2022, 'Apple')
    },
    imageUrl: '/images/devices/iphone-14-plus.jpg'
  },
  {
    id: generateId('iphone', '14', 2022),
    brandId: 'apple',
    name: 'iPhone 14',
    slug: 'iphone-14',
    year: 2022,
    screenSize: 6.1,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2022, 'Apple')
    },
    imageUrl: '/images/devices/iphone-14.jpg'
  },
  
  // iPhone 13 Series (2021)
  {
    id: generateId('iphone', '13_pro_max', 2021),
    brandId: 'apple',
    name: 'iPhone 13 Pro Max',
    slug: 'iphone-13-pro-max',
    year: 2021,
    screenSize: 6.7,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Face ID problems'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Apple')
    },
    imageUrl: '/images/devices/iphone-13-pro-max.jpg'
  },
  {
    id: generateId('iphone', '13_pro', 2021),
    brandId: 'apple',
    name: 'iPhone 13 Pro',
    slug: 'iphone-13-pro',
    year: 2021,
    screenSize: 6.1,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'Apple')
    },
    imageUrl: '/images/devices/iphone-13-pro.jpg'
  },
  {
    id: generateId('iphone', '13_mini', 2021),
    brandId: 'apple',
    name: 'iPhone 13 mini',
    slug: 'iphone-13-mini',
    year: 2021,
    screenSize: 5.4,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2021, 'Apple')
    },
    imageUrl: '/images/devices/iphone-13-mini.jpg'
  },
  {
    id: generateId('iphone', '13', 2021),
    brandId: 'apple',
    name: 'iPhone 13',
    slug: 'iphone-13',
    year: 2021,
    screenSize: 6.1,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2021, 'Apple')
    },
    imageUrl: '/images/devices/iphone-13.jpg'
  },
  
  // iPhone 12 Series (2020)
  {
    id: generateId('iphone', '12_pro_max', 2020),
    brandId: 'apple',
    name: 'iPhone 12 Pro Max',
    slug: 'iphone-12-pro-max',
    year: 2020,
    screenSize: 6.7,
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(160, 2020, 'Apple')
    },
    imageUrl: '/images/devices/iphone-12-pro-max.jpg'
  },
  {
    id: generateId('iphone', '12_pro', 2020),
    brandId: 'apple',
    name: 'iPhone 12 Pro',
    slug: 'iphone-12-pro',
    year: 2020,
    screenSize: 6.1,
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'Apple')
    },
    imageUrl: '/images/devices/iphone-12-pro.jpg'
  },
  {
    id: generateId('iphone', '12_mini', 2020),
    brandId: 'apple',
    name: 'iPhone 12 mini',
    slug: 'iphone-12-mini',
    year: 2020,
    screenSize: 5.4,
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2020, 'Apple')
    },
    imageUrl: '/images/devices/iphone-12-mini.jpg'
  },
  {
    id: generateId('iphone', '12', 2020),
    brandId: 'apple',
    name: 'iPhone 12',
    slug: 'iphone-12',
    year: 2020,
    screenSize: 6.1,
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(140, 2020, 'Apple')
    },
    imageUrl: '/images/devices/iphone-12.jpg'
  },
  
  // iPhone SE Series
  {
    id: generateId('iphone', 'se_3rd_gen', 2022),
    brandId: 'apple',
    name: 'iPhone SE (3rd generation)',
    slug: 'iphone-se-3rd-gen',
    year: 2022,
    screenSize: 4.7,
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Home button issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2022, 'Apple')
    },
    imageUrl: '/images/devices/iphone-se-3rd-gen.jpg'
  },
  {
    id: generateId('iphone', 'se_2nd_gen', 2020),
    brandId: 'apple',
    name: 'iPhone SE (2nd generation)',
    slug: 'iphone-se-2nd-gen',
    year: 2020,
    screenSize: 4.7,
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Home button issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(100, 2020, 'Apple')
    },
    imageUrl: '/images/devices/iphone-se-2nd-gen.jpg'
  },
  
  // iPhone 11 Series (2019)
  {
    id: generateId('iphone', '11_pro_max', 2019),
    brandId: 'apple',
    name: 'iPhone 11 Pro Max',
    slug: 'iphone-11-pro-max',
    year: 2019,
    screenSize: 6.5,
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'Apple')
    },
    imageUrl: '/images/devices/iphone-11-pro-max.jpg'
  },
  {
    id: generateId('iphone', '11_pro', 2019),
    brandId: 'apple',
    name: 'iPhone 11 Pro',
    slug: 'iphone-11-pro',
    year: 2019,
    screenSize: 5.8,
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(130, 2019, 'Apple')
    },
    imageUrl: '/images/devices/iphone-11-pro.jpg'
  },
  {
    id: generateId('iphone', '11', 2019),
    brandId: 'apple',
    name: 'iPhone 11',
    slug: 'iphone-11',
    year: 2019,
    screenSize: 6.1,
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(120, 2019, 'Apple')
    },
    imageUrl: '/images/devices/iphone-11.jpg'
  },
  
  // iPhone XS/XR Series (2018)
  {
    id: generateId('iphone', 'xs_max', 2018),
    brandId: 'apple',
    name: 'iPhone XS Max',
    slug: 'iphone-xs-max',
    year: 2018,
    screenSize: 6.5,
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(130, 2018, 'Apple')
    },
    imageUrl: '/images/devices/iphone-xs-max.jpg'
  },
  {
    id: generateId('iphone', 'xs', 2018),
    brandId: 'apple',
    name: 'iPhone XS',
    slug: 'iphone-xs',
    year: 2018,
    screenSize: 5.8,
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(120, 2018, 'Apple')
    },
    imageUrl: '/images/devices/iphone-xs.jpg'
  },
  {
    id: generateId('iphone', 'xr', 2018),
    brandId: 'apple',
    name: 'iPhone XR',
    slug: 'iphone-xr',
    year: 2018,
    screenSize: 6.1,
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(110, 2018, 'Apple')
    },
    imageUrl: '/images/devices/iphone-xr.jpg'
  },
  
  // iPhone X (2017)
  {
    id: generateId('iphone', 'x', 2017),
    brandId: 'apple',
    name: 'iPhone X',
    slug: 'iphone-x',
    year: 2017,
    screenSize: 5.8,
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Green line display issue'],
      average_repair_cost: calculateRepairPrice(120, 2017, 'Apple')
    },
    imageUrl: '/images/devices/iphone-x.jpg'
  },
  
  // iPhone 8 Series (2017)
  {
    id: generateId('iphone', '8_plus', 2017),
    brandId: 'apple',
    name: 'iPhone 8 Plus',
    slug: 'iphone-8-plus',
    year: 2017,
    screenSize: 5.5,
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Battery swelling', 'Screen cracks', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(110, 2017, 'Apple')
    },
    imageUrl: '/images/devices/iphone-8-plus.jpg'
  },
  {
    id: generateId('iphone', '8', 2017),
    brandId: 'apple',
    name: 'iPhone 8',
    slug: 'iphone-8',
    year: 2017,
    screenSize: 4.7,
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Battery swelling', 'Screen cracks', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(100, 2017, 'Apple')
    },
    imageUrl: '/images/devices/iphone-8.jpg'
  },
  
  // iPhone 7 Series (2016)
  {
    id: generateId('iphone', '7_plus', 2016),
    brandId: 'apple',
    name: 'iPhone 7 Plus',
    slug: 'iphone-7-plus',
    year: 2016,
    screenSize: 5.5,
    specs: {
      processor: 'A10 Fusion',
      common_issues: ['Audio IC failure', 'Battery degradation', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(110, 2016, 'Apple')
    },
    imageUrl: '/images/devices/iphone-7-plus.jpg'
  },
  {
    id: generateId('iphone', '7', 2016),
    brandId: 'apple',
    name: 'iPhone 7',
    slug: 'iphone-7',
    year: 2016,
    screenSize: 4.7,
    specs: {
      processor: 'A10 Fusion',
      common_issues: ['Audio IC failure', 'Battery degradation', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(100, 2016, 'Apple')
    },
    imageUrl: '/images/devices/iphone-7.jpg'
  },
  
  // iPhone 6S Series (2015)
  {
    id: generateId('iphone', '6s_plus', 2015),
    brandId: 'apple',
    name: 'iPhone 6s Plus',
    slug: 'iphone-6s-plus',
    year: 2015,
    screenSize: 5.5,
    specs: {
      processor: 'A9',
      common_issues: ['Battery degradation', 'Touch disease', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(105, 2015, 'Apple')
    },
    imageUrl: '/images/devices/iphone-6s-plus.jpg'
  },
  {
    id: generateId('iphone', '6s', 2015),
    brandId: 'apple',
    name: 'iPhone 6s',
    slug: 'iphone-6s',
    year: 2015,
    screenSize: 4.7,
    specs: {
      processor: 'A9',
      common_issues: ['Battery degradation', 'Touch disease', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(95, 2015, 'Apple')
    },
    imageUrl: '/images/devices/iphone-6s.jpg'
  },
  
  // === SAMSUNG GALAXY DEVICES (2015-2025) ===
  
  // Galaxy S24 Series (2024)
  {
    id: generateId('samsung', 's24_ultra', 2024),
    brandId: 'samsung',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    year: 2024,
    screenSize: 6.8,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      memory: '12GB',
      storage: '256GB - 1TB',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(280, 2024, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s24-ultra.jpg'
  },
  {
    id: generateId('samsung', 's24_plus', 2024),
    brandId: 'samsung',
    name: 'Samsung Galaxy S24+',
    slug: 'samsung-galaxy-s24-plus',
    year: 2024,
    screenSize: 6.7,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(240, 2024, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s24-plus.jpg'
  },
  {
    id: generateId('samsung', 's24', 2024),
    brandId: 'samsung',
    name: 'Samsung Galaxy S24',
    slug: 'samsung-galaxy-s24',
    year: 2024,
    screenSize: 6.2,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2024, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s24.jpg'
  },
  
  // Galaxy S23 Series (2023)
  {
    id: generateId('samsung', 's23_ultra', 2023),
    brandId: 'samsung',
    name: 'Samsung Galaxy S23 Ultra',
    slug: 'samsung-galaxy-s23-ultra',
    year: 2023,
    screenSize: 6.8,
    specs: {
      processor: 'Snapdragon 8 Gen 2',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(260, 2023, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s23-ultra.jpg'
  },
  {
    id: generateId('samsung', 's23_plus', 2023),
    brandId: 'samsung',
    name: 'Samsung Galaxy S23+',
    slug: 'samsung-galaxy-s23-plus',
    year: 2023,
    screenSize: 6.6,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s23-plus.jpg'
  },
  {
    id: generateId('samsung', 's23', 2023),
    brandId: 'samsung',
    name: 'Samsung Galaxy S23',
    slug: 'samsung-galaxy-s23',
    year: 2023,
    screenSize: 6.1,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2023, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s23.jpg'
  },
  
  // Galaxy S22 Series (2022)
  {
    id: generateId('samsung', 's22_ultra', 2022),
    brandId: 'samsung',
    name: 'Samsung Galaxy S22 Ultra',
    slug: 'samsung-galaxy-s22-ultra',
    year: 2022,
    screenSize: 6.8,
    specs: {
      processor: 'Snapdragon 8 Gen 1',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Overheating'],
      average_repair_cost: calculateRepairPrice(240, 2022, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s22-ultra.jpg'
  },
  {
    id: generateId('samsung', 's22_plus', 2022),
    brandId: 'samsung',
    name: 'Samsung Galaxy S22+',
    slug: 'samsung-galaxy-s22-plus',
    year: 2022,
    screenSize: 6.6,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s22-plus.jpg'
  },
  {
    id: generateId('samsung', 's22', 2022),
    brandId: 'samsung',
    name: 'Samsung Galaxy S22',
    slug: 'samsung-galaxy-s22',
    year: 2022,
    screenSize: 6.1,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(180, 2022, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s22.jpg'
  },
  
  // Galaxy S21 Series (2021)
  {
    id: generateId('samsung', 's21_ultra', 2021),
    brandId: 'samsung',
    name: 'Samsung Galaxy S21 Ultra',
    slug: 'samsung-galaxy-s21-ultra',
    year: 2021,
    screenSize: 6.8,
    specs: {
      processor: 'Snapdragon 888',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2021, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s21-ultra.jpg'
  },
  {
    id: generateId('samsung', 's21_plus', 2021),
    brandId: 'samsung',
    name: 'Samsung Galaxy S21+',
    slug: 'samsung-galaxy-s21-plus',
    year: 2021,
    screenSize: 6.7,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s21-plus.jpg'
  },
  {
    id: generateId('samsung', 's21', 2021),
    brandId: 'samsung',
    name: 'Samsung Galaxy S21',
    slug: 'samsung-galaxy-s21',
    year: 2021,
    screenSize: 6.2,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s21.jpg'
  },
  
  // Galaxy S20 Series (2020)
  {
    id: generateId('samsung', 's20_ultra', 2020),
    brandId: 'samsung',
    name: 'Samsung Galaxy S20 Ultra',
    slug: 'samsung-galaxy-s20-ultra',
    year: 2020,
    screenSize: 6.9,
    specs: {
      processor: 'Snapdragon 865',
      common_issues: ['Camera focus issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s20-ultra.jpg'
  },
  {
    id: generateId('samsung', 's20_plus', 2020),
    brandId: 'samsung',
    name: 'Samsung Galaxy S20+',
    slug: 'samsung-galaxy-s20-plus',
    year: 2020,
    screenSize: 6.7,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s20-plus.jpg'
  },
  {
    id: generateId('samsung', 's20', 2020),
    brandId: 'samsung',
    name: 'Samsung Galaxy S20',
    slug: 'samsung-galaxy-s20',
    year: 2020,
    screenSize: 6.2,
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-s20.jpg'
  },
  
  // Galaxy Note Series
  {
    id: generateId('samsung', 'note_20_ultra', 2020),
    brandId: 'samsung',
    name: 'Samsung Galaxy Note 20 Ultra',
    slug: 'samsung-galaxy-note-20-ultra',
    year: 2020,
    screenSize: 6.9,
    specs: {
      processor: 'Snapdragon 865+',
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-note-20-ultra.jpg'
  },
  {
    id: generateId('samsung', 'note_20', 2020),
    brandId: 'samsung',
    name: 'Samsung Galaxy Note 20',
    slug: 'samsung-galaxy-note-20',
    year: 2020,
    screenSize: 6.7,
    specs: {
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-note-20.jpg'
  },
  {
    id: generateId('samsung', 'note_10_plus', 2019),
    brandId: 'samsung',
    name: 'Samsung Galaxy Note 10+',
    slug: 'samsung-galaxy-note-10-plus',
    year: 2019,
    screenSize: 6.8,
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Charging port issues'],
      average_repair_cost: calculateRepairPrice(180, 2019, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-note-10-plus.jpg'
  },
  {
    id: generateId('samsung', 'note_10', 2019),
    brandId: 'samsung',
    name: 'Samsung Galaxy Note 10',
    slug: 'samsung-galaxy-note-10',
    year: 2019,
    screenSize: 6.3,
    specs: {
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2019, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-note-10.jpg'
  },
  
  // Galaxy A Series (Mid-range)
  {
    id: generateId('samsung', 'a54', 2023),
    brandId: 'samsung',
    name: 'Samsung Galaxy A54 5G',
    slug: 'samsung-galaxy-a54',
    year: 2023,
    screenSize: 6.4,
    specs: {
      processor: 'Exynos 1380',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(140, 2023, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-a54.jpg'
  },
  {
    id: generateId('samsung', 'a73', 2022),
    brandId: 'samsung',
    name: 'Samsung Galaxy A73 5G',
    slug: 'samsung-galaxy-a73',
    year: 2022,
    screenSize: 6.7,
    specs: {
      processor: 'Snapdragon 778G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2022, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-a73.jpg'
  },
  {
    id: generateId('samsung', 'a53', 2022),
    brandId: 'samsung',
    name: 'Samsung Galaxy A53 5G',
    slug: 'samsung-galaxy-a53',
    year: 2022,
    screenSize: 6.5,
    specs: {
      processor: 'Exynos 1280',
      common_issues: ['Screen cracks', 'Performance issues'],
      average_repair_cost: calculateRepairPrice(120, 2022, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-a53.jpg'
  },
  {
    id: generateId('samsung', 'a52', 2021),
    brandId: 'samsung',
    name: 'Samsung Galaxy A52 5G',
    slug: 'samsung-galaxy-a52',
    year: 2021,
    screenSize: 6.5,
    specs: {
      processor: 'Snapdragon 750G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2021, 'Samsung')
    },
    imageUrl: '/images/devices/samsung-galaxy-a52.jpg'
  },
  
  // === GOOGLE PIXEL DEVICES (2016-2025) ===
  
  // Pixel 8 Series (2023)
  {
    id: generateId('google', 'pixel_8_pro', 2023),
    brandId: 'google',
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    year: 2023,
    screenSize: 6.7,
    specs: {
      processor: 'Google Tensor G3',
      memory: '12GB',
      storage: '128GB - 1TB',
      common_issues: ['Screen cracks', 'Battery degradation', 'Fingerprint sensor problems'],
      average_repair_cost: calculateRepairPrice(260, 2023, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-8-pro.jpg'
  },
  {
    id: generateId('google', 'pixel_8', 2023),
    brandId: 'google',
    name: 'Google Pixel 8',
    slug: 'google-pixel-8',
    year: 2023,
    screenSize: 6.2,
    specs: {
      processor: 'Google Tensor G3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-8.jpg'
  },
  
  // Pixel 7 Series (2022)
  {
    id: generateId('google', 'pixel_7_pro', 2022),
    brandId: 'google',
    name: 'Google Pixel 7 Pro',
    slug: 'google-pixel-7-pro',
    year: 2022,
    screenSize: 6.7,
    specs: {
      processor: 'Google Tensor G2',
      common_issues: ['Screen cracks', 'Camera bar issues', 'Fingerprint sensor problems'],
      average_repair_cost: calculateRepairPrice(240, 2022, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-7-pro.jpg'
  },
  {
    id: generateId('google', 'pixel_7', 2022),
    brandId: 'google',
    name: 'Google Pixel 7',
    slug: 'google-pixel-7',
    year: 2022,
    screenSize: 6.3,
    specs: {
      processor: 'Google Tensor G2',
      common_issues: ['Screen cracks', 'Camera bar issues'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-7.jpg'
  },
  
  // Pixel 6 Series (2021)
  {
    id: generateId('google', 'pixel_6_pro', 2021),
    brandId: 'google',
    name: 'Google Pixel 6 Pro',
    slug: 'google-pixel-6-pro',
    year: 2021,
    screenSize: 6.7,
    specs: {
      processor: 'Google Tensor',
      common_issues: ['Fingerprint sensor issues', 'Camera bar cracks', 'Connectivity problems'],
      average_repair_cost: calculateRepairPrice(220, 2021, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-6-pro.jpg'
  },
  {
    id: generateId('google', 'pixel_6', 2021),
    brandId: 'google',
    name: 'Google Pixel 6',
    slug: 'google-pixel-6',
    year: 2021,
    screenSize: 6.4,
    specs: {
      processor: 'Google Tensor',
      common_issues: ['Fingerprint sensor issues', 'Camera bar cracks'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-6.jpg'
  },
  
  // Pixel 5 Series (2020)
  {
    id: generateId('google', 'pixel_5', 2020),
    brandId: 'google',
    name: 'Google Pixel 5',
    slug: 'google-pixel-5',
    year: 2020,
    screenSize: 6.0,
    specs: {
      processor: 'Snapdragon 765G',
      common_issues: ['Screen cracks', 'Battery degradation', 'Speaker issues'],
      average_repair_cost: calculateRepairPrice(160, 2020, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-5.jpg'
  },
  {
    id: generateId('google', 'pixel_4a_5g', 2020),
    brandId: 'google',
    name: 'Google Pixel 4a 5G',
    slug: 'google-pixel-4a-5g',
    year: 2020,
    screenSize: 6.2,
    specs: {
      processor: 'Snapdragon 765G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2020, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-4a-5g.jpg'
  },
  {
    id: generateId('google', 'pixel_4a', 2020),
    brandId: 'google',
    name: 'Google Pixel 4a',
    slug: 'google-pixel-4a',
    year: 2020,
    screenSize: 5.8,
    specs: {
      processor: 'Snapdragon 730G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2020, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-4a.jpg'
  },
  
  // Pixel 4 Series (2019)
  {
    id: generateId('google', 'pixel_4_xl', 2019),
    brandId: 'google',
    name: 'Google Pixel 4 XL',
    slug: 'google-pixel-4-xl',
    year: 2019,
    screenSize: 6.3,
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Battery degradation', 'Face unlock issues', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(150, 2019, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-4-xl.jpg'
  },
  {
    id: generateId('google', 'pixel_4', 2019),
    brandId: 'google',
    name: 'Google Pixel 4',
    slug: 'google-pixel-4',
    year: 2019,
    screenSize: 5.7,
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Battery degradation', 'Face unlock issues'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-4.jpg'
  },
  
  // Pixel 3 Series (2018)
  {
    id: generateId('google', 'pixel_3_xl', 2018),
    brandId: 'google',
    name: 'Google Pixel 3 XL',
    slug: 'google-pixel-3-xl',
    year: 2018,
    screenSize: 6.3,
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Screen burn-in', 'Battery degradation', 'Memory management'],
      average_repair_cost: calculateRepairPrice(140, 2018, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-3-xl.jpg'
  },
  {
    id: generateId('google', 'pixel_3', 2018),
    brandId: 'google',
    name: 'Google Pixel 3',
    slug: 'google-pixel-3',
    year: 2018,
    screenSize: 5.5,
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2018, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-3.jpg'
  },
  
  // Pixel 2 Series (2017)
  {
    id: generateId('google', 'pixel_2_xl', 2017),
    brandId: 'google',
    name: 'Google Pixel 2 XL',
    slug: 'google-pixel-2-xl',
    year: 2017,
    screenSize: 6.0,
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen burn-in', 'Blue tint issue', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2017, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-2-xl.jpg'
  },
  {
    id: generateId('google', 'pixel_2', 2017),
    brandId: 'google',
    name: 'Google Pixel 2',
    slug: 'google-pixel-2',
    year: 2017,
    screenSize: 5.0,
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2017, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-2.jpg'
  },
  
  // Original Pixel (2016)
  {
    id: generateId('google', 'pixel_xl', 2016),
    brandId: 'google',
    name: 'Google Pixel XL',
    slug: 'google-pixel-xl',
    year: 2016,
    screenSize: 5.5,
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Microphone failure', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(120, 2016, 'Google')
    },
    imageUrl: '/images/devices/google-pixel-xl.jpg'
  },
  {
    id: generateId('google', 'pixel', 2016),
    brandId: 'google',
    name: 'Google Pixel',
    slug: 'google-pixel',
    year: 2016,
    screenSize: 5.0,
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Microphone failure', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2016, 'Google')
    },
    imageUrl: '/images/devices/google-pixel.jpg'
  },
  
  // === ONEPLUS DEVICES (2015-2025) ===
  
  {
    id: generateId('oneplus', '12', 2024),
    brandId: 'oneplus',
    name: 'OnePlus 12',
    slug: 'oneplus-12',
    year: 2024,
    screenSize: 6.82,
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(200, 2024, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-12.jpg'
  },
  {
    id: generateId('oneplus', '11', 2023),
    brandId: 'oneplus',
    name: 'OnePlus 11',
    slug: 'oneplus-11',
    year: 2023,
    screenSize: 6.7,
    specs: {
      processor: 'Snapdragon 8 Gen 2',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2023, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-11.jpg'
  },
  {
    id: generateId('oneplus', '10_pro', 2022),
    brandId: 'oneplus',
    name: 'OnePlus 10 Pro',
    slug: 'oneplus-10-pro',
    year: 2022,
    screenSize: 6.7,
    specs: {
      processor: 'Snapdragon 8 Gen 1',
      common_issues: ['Screen cracks', 'Overheating'],
      average_repair_cost: calculateRepairPrice(170, 2022, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-10-pro.jpg'
  },
  {
    id: generateId('oneplus', '9_pro', 2021),
    brandId: 'oneplus',
    name: 'OnePlus 9 Pro',
    slug: 'oneplus-9-pro',
    year: 2021,
    screenSize: 6.7,
    specs: {
      processor: 'Snapdragon 888',
      common_issues: ['Screen tint issues', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-9-pro.jpg'
  },
  {
    id: generateId('oneplus', '8_pro', 2020),
    brandId: 'oneplus',
    name: 'OnePlus 8 Pro',
    slug: 'oneplus-8-pro',
    year: 2020,
    screenSize: 6.78,
    specs: {
      processor: 'Snapdragon 865',
      common_issues: ['Screen tint issues', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-8-pro.jpg'
  },
  {
    id: generateId('oneplus', '7_pro', 2019),
    brandId: 'oneplus',
    name: 'OnePlus 7 Pro',
    slug: 'oneplus-7-pro',
    year: 2019,
    screenSize: 6.67,
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Pop-up camera failure', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-7-pro.jpg'
  },
  {
    id: generateId('oneplus', '6t', 2018),
    brandId: 'oneplus',
    name: 'OnePlus 6T',
    slug: 'oneplus-6t',
    year: 2018,
    screenSize: 6.41,
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Fingerprint sensor issues', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(120, 2018, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-6t.jpg'
  },
  {
    id: generateId('oneplus', '5t', 2017),
    brandId: 'oneplus',
    name: 'OnePlus 5T',
    slug: 'oneplus-5t',
    year: 2017,
    screenSize: 6.01,
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2017, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-5t.jpg'
  },
  {
    id: generateId('oneplus', '3t', 2016),
    brandId: 'oneplus',
    name: 'OnePlus 3T',
    slug: 'oneplus-3t',
    year: 2016,
    screenSize: 5.5,
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Screen cracks', 'Charging port issues'],
      average_repair_cost: calculateRepairPrice(100, 2016, 'OnePlus')
    },
    imageUrl: '/images/devices/oneplus-3t.jpg'
  },
  
  // === LAPTOP/PC DEVICES (2015-2025) ===
  
  // Dell XPS Series
  {
    id: generateId('dell', 'xps_13_plus', 2023),
    brandId: 'dell',
    name: 'Dell XPS 13 Plus',
    slug: 'dell-xps-13-plus-2023',
    year: 2023,
    screenSize: 13.4,
    specs: {
      processor: 'Intel Core i5-1340P / i7-1360P',
      memory: '8GB - 32GB LPDDR5',
      storage: '256GB - 2TB PCIe SSD',
      common_issues: ['Screen flickering', 'Thermal throttling', 'Battery drain'],
      average_repair_cost: calculateRepairPrice(320, 2023, 'Dell')
    },
    imageUrl: '/images/devices/dell-xps-13-plus-2023.jpg'
  },
  {
    id: generateId('dell', 'xps_15', 2023),
    brandId: 'dell',
    name: 'Dell XPS 15',
    slug: 'dell-xps-15-2023',
    year: 2023,
    screenSize: 15.6,
    specs: {
      processor: 'Intel Core i7-13700H / i9-13900H',
      memory: '16GB - 64GB DDR5',
      graphics: 'NVIDIA GeForce RTX 4050/4060/4070',
      common_issues: ['Thermal management', 'Fan noise', 'Battery swelling'],
      average_repair_cost: calculateRepairPrice(380, 2023, 'Dell')
    },
    imageUrl: '/images/devices/dell-xps-15-2023.jpg'
  },
  {
    id: generateId('dell', 'inspiron_15_3000', 2022),
    brandId: 'dell',
    name: 'Dell Inspiron 15 3000',
    slug: 'dell-inspiron-15-3000-2022',
    year: 2022,
    screenSize: 15.6,
    specs: {
      processor: 'Intel Core i3/i5/i7',
      common_issues: ['Slow performance', 'Battery degradation', 'Screen flickering'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Dell')
    },
    imageUrl: '/images/devices/dell-inspiron-15-3000-2022.jpg'
  },
  
  // HP Spectre/Envy Series
  {
    id: generateId('hp', 'spectre_x360_14', 2023),
    brandId: 'hp',
    name: 'HP Spectre x360 14',
    slug: 'hp-spectre-x360-14-2023',
    year: 2023,
    screenSize: 13.5,
    specs: {
      processor: 'Intel Core i5-1235U / i7-1255U',
      memory: '8GB - 32GB LPDDR4x',
      common_issues: ['Hinge problems', 'Battery swelling', 'Touchscreen issues'],
      average_repair_cost: calculateRepairPrice(350, 2023, 'HP')
    },
    imageUrl: '/images/devices/hp-spectre-x360-14-2023.jpg'
  },
  {
    id: generateId('hp', 'envy_x360_15', 2022),
    brandId: 'hp',
    name: 'HP Envy x360 15',
    slug: 'hp-envy-x360-15-2022',
    year: 2022,
    screenSize: 15.6,
    specs: {
      processor: 'AMD Ryzen 5/7',
      common_issues: ['Hinge wear', 'Battery degradation', 'Touchscreen calibration'],
      average_repair_cost: calculateRepairPrice(280, 2022, 'HP')
    },
    imageUrl: '/images/devices/hp-envy-x360-15-2022.jpg'
  },
  {
    id: generateId('hp', 'pavilion_15', 2021),
    brandId: 'hp',
    name: 'HP Pavilion 15',
    slug: 'hp-pavilion-15-2021',
    year: 2021,
    screenSize: 15.6,
    specs: {
      processor: 'AMD Ryzen 5/7',
      common_issues: ['Slow performance', 'Battery degradation', 'Keyboard wear'],
      average_repair_cost: calculateRepairPrice(220, 2021, 'HP')
    },
    imageUrl: '/images/devices/hp-pavilion-15-2021.jpg'
  },
  
  // Lenovo ThinkPad Series
  {
    id: generateId('lenovo', 'thinkpad_x1_carbon_gen_11', 2023),
    brandId: 'lenovo',
    name: 'ThinkPad X1 Carbon Gen 11',
    slug: 'lenovo-thinkpad-x1-carbon-gen-11',
    year: 2023,
    screenSize: 14,
    specs: {
      processor: 'Intel Core i5-1335U / i7-1355U / i7-1365U',
      memory: '8GB - 32GB LPDDR5',
      common_issues: ['Trackpoint issues', 'Battery degradation', 'Screen flickering'],
      average_repair_cost: calculateRepairPrice(380, 2023, 'Lenovo')
    },
    imageUrl: '/images/devices/lenovo-thinkpad-x1-carbon-gen-11.jpg'
  },
  {
    id: generateId('lenovo', 'thinkpad_t14_gen_3', 2022),
    brandId: 'lenovo',
    name: 'ThinkPad T14 Gen 3',
    slug: 'lenovo-thinkpad-t14-gen-3',
    year: 2022,
    screenSize: 14,
    specs: {
      processor: 'Intel Core i5/i7 or AMD Ryzen 5/7',
      common_issues: ['Port connectivity', 'Battery degradation', 'Fan noise'],
      average_repair_cost: calculateRepairPrice(320, 2022, 'Lenovo')
    },
    imageUrl: '/images/devices/lenovo-thinkpad-t14-gen-3.jpg'
  },
  {
    id: generateId('lenovo', 'ideapad_5_pro', 2021),
    brandId: 'lenovo',
    name: 'IdeaPad 5 Pro',
    slug: 'lenovo-ideapad-5-pro-2021',
    year: 2021,
    screenSize: 16,
    specs: {
      processor: 'AMD Ryzen 7 5800H',
      common_issues: ['Screen flickering', 'Battery degradation', 'Thermal management'],
      average_repair_cost: calculateRepairPrice(260, 2021, 'Lenovo')
    },
    imageUrl: '/images/devices/lenovo-ideapad-5-pro-2021.jpg'
  },
  {
    id: generateId('lenovo', 'legion_5_pro', 2022),
    brandId: 'lenovo',
    name: 'Legion 5 Pro',
    slug: 'lenovo-legion-5-pro-2022',
    year: 2022,
    screenSize: 16,
    specs: {
      processor: 'AMD Ryzen 7 6800H / Ryzen 9 6900HX',
      graphics: 'NVIDIA GeForce RTX 3060/3070/3070Ti',
      common_issues: ['Overheating', 'Fan noise', 'RGB lighting issues'],
      average_repair_cost: calculateRepairPrice(400, 2022, 'Lenovo')
    },
    imageUrl: '/images/devices/lenovo-legion-5-pro-2022.jpg'
  },
  
  // ASUS ZenBook/ROG Series
  {
    id: generateId('asus', 'zenbook_14_oled', 2023),
    brandId: 'asus',
    name: 'ASUS ZenBook 14 OLED',
    slug: 'asus-zenbook-14-oled-2023',
    year: 2023,
    screenSize: 14,
    specs: {
      processor: 'Intel Core i5-1340P / i7-1360P',
      memory: '8GB - 16GB LPDDR5',
      common_issues: ['OLED burn-in', 'Battery degradation', 'Trackpad issues'],
      average_repair_cost: calculateRepairPrice(350, 2023, 'ASUS')
    },
    imageUrl: '/images/devices/asus-zenbook-14-oled-2023.jpg'
  },
  {
    id: generateId('asus', 'rog_strix_g15', 2022),
    brandId: 'asus',
    name: 'ASUS ROG Strix G15',
    slug: 'asus-rog-strix-g15-2022',
    year: 2022,
    screenSize: 15.6,
    specs: {
      processor: 'AMD Ryzen 7 6800H / Ryzen 9 6900HX',
      graphics: 'NVIDIA GeForce RTX 3060/3070Ti/3080Ti',
      common_issues: ['Overheating', 'Fan noise', 'RGB lighting failure'],
      average_repair_cost: calculateRepairPrice(420, 2022, 'ASUS')
    },
    imageUrl: '/images/devices/asus-rog-strix-g15-2022.jpg'
  },
  {
    id: generateId('asus', 'vivobook_s15', 2021),
    brandId: 'asus',
    name: 'ASUS VivoBook S15',
    slug: 'asus-vivobook-s15-2021',
    year: 2021,
    screenSize: 15.6,
    specs: {
      processor: 'Intel Core i5/i7',
      common_issues: ['Screen flickering', 'Battery degradation', 'Keyboard backlight'],
      average_repair_cost: calculateRepairPrice(240, 2021, 'ASUS')
    },
    imageUrl: '/images/devices/asus-vivobook-s15-2021.jpg'
  },
  
  // MSI Gaming Laptops
  {
    id: generateId('msi', 'ge76_raider', 2022),
    brandId: 'msi',
    name: 'MSI GE76 Raider',
    slug: 'msi-ge76-raider-2022',
    year: 2022,
    screenSize: 17.3,
    specs: {
      processor: 'Intel Core i7-12700H / i9-12900H',
      graphics: 'NVIDIA GeForce RTX 3070Ti/3080Ti',
      common_issues: ['Extreme overheating', 'Fan failure', 'RGB lighting issues'],
      average_repair_cost: calculateRepairPrice(500, 2022, 'MSI')
    },
    imageUrl: '/images/devices/msi-ge76-raider-2022.jpg'
  },
  {
    id: generateId('msi', 'stealth_15m', 2021),
    brandId: 'msi',
    name: 'MSI Stealth 15M',
    slug: 'msi-stealth-15m-2021',
    year: 2021,
    screenSize: 15.6,
    specs: {
      processor: 'Intel Core i7-11375H',
      common_issues: ['Thermal throttling', 'Battery degradation', 'Build quality'],
      average_repair_cost: calculateRepairPrice(380, 2021, 'MSI')
    },
    imageUrl: '/images/devices/msi-stealth-15m-2021.jpg'
  },
  
  // Microsoft Surface Laptops
  {
    id: generateId('microsoft', 'surface_laptop_5', 2022),
    brandId: 'microsoft',
    name: 'Microsoft Surface Laptop 5',
    slug: 'microsoft-surface-laptop-5-2022',
    year: 2022,
    screenSize: 13.5,
    specs: {
      processor: 'Intel Core i5-1235U / i7-1255U',
      memory: '8GB - 32GB LPDDR5x',
      common_issues: ['Screen cracks', 'Battery swelling', 'Keyboard issues'],
      average_repair_cost: calculateRepairPrice(380, 2022, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-surface-laptop-5-2022.jpg'
  },
  {
    id: generateId('microsoft', 'surface_pro_9', 2022),
    brandId: 'microsoft',
    name: 'Microsoft Surface Pro 9',
    slug: 'microsoft-surface-pro-9-2022',
    year: 2022,
    screenSize: 13,
    specs: {
      processor: 'Intel Core i5/i7 or Microsoft SQ3',
      common_issues: ['Screen cracks', 'Type Cover issues', 'Kickstand problems'],
      average_repair_cost: calculateRepairPrice(420, 2022, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-surface-pro-9-2022.jpg'
  },
  
  // === GAMING CONSOLES (2015-2025) ===
  
  // PlayStation Consoles
  {
    id: generateId('sony', 'playstation_5', 2020),
    brandId: 'sony',
    name: 'Sony PlayStation 5',
    slug: 'sony-playstation-5',
    year: 2020,
    screenSize: null,
    specs: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '16GB GDDR6',
      storage: '825GB SSD',
      common_issues: ['Overheating', 'Fan noise', 'SSD issues', 'Controller drift'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Sony')
    },
    imageUrl: '/images/devices/sony-playstation-5.jpg'
  },
  {
    id: generateId('sony', 'playstation_5_digital', 2020),
    brandId: 'sony',
    name: 'Sony PlayStation 5 Digital Edition',
    slug: 'sony-playstation-5-digital',
    year: 2020,
    screenSize: null,
    specs: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '16GB GDDR6',
      storage: '825GB SSD',
      common_issues: ['Overheating', 'Fan noise', 'SSD issues'],
      average_repair_cost: calculateRepairPrice(180, 2020, 'Sony')
    },
    imageUrl: '/images/devices/sony-playstation-5-digital.jpg'
  },
  {
    id: generateId('sony', 'playstation_4_pro', 2016),
    brandId: 'sony',
    name: 'Sony PlayStation 4 Pro',
    slug: 'sony-playstation-4-pro',
    year: 2016,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      graphics: 'AMD Radeon',
      common_issues: ['Overheating', 'Fan noise', 'HDD failure', 'Blue light of death'],
      average_repair_cost: calculateRepairPrice(150, 2016, 'Sony')
    },
    imageUrl: '/images/devices/sony-playstation-4-pro.jpg'
  },
  {
    id: generateId('sony', 'playstation_4_slim', 2016),
    brandId: 'sony',
    name: 'Sony PlayStation 4 Slim',
    slug: 'sony-playstation-4-slim',
    year: 2016,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      common_issues: ['Overheating', 'HDD failure', 'Controller drift'],
      average_repair_cost: calculateRepairPrice(130, 2016, 'Sony')
    },
    imageUrl: '/images/devices/sony-playstation-4-slim.jpg'
  },
  {
    id: generateId('sony', 'playstation_4', 2015),
    brandId: 'sony',
    name: 'Sony PlayStation 4',
    slug: 'sony-playstation-4',
    year: 2015,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      common_issues: ['Overheating', 'HDD failure', 'HDMI port issues', 'Blue light of death'],
      average_repair_cost: calculateRepairPrice(120, 2015, 'Sony')
    },
    imageUrl: '/images/devices/sony-playstation-4.jpg'
  },
  
  // Xbox Consoles
  {
    id: generateId('microsoft', 'xbox_series_x', 2020),
    brandId: 'microsoft',
    name: 'Microsoft Xbox Series X',
    slug: 'microsoft-xbox-series-x',
    year: 2020,
    screenSize: null,
    specs: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '16GB GDDR6',
      storage: '1TB SSD',
      common_issues: ['Overheating', 'Fan noise', 'SSD issues', 'Controller drift'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-xbox-series-x.jpg'
  },
  {
    id: generateId('microsoft', 'xbox_series_s', 2020),
    brandId: 'microsoft',
    name: 'Microsoft Xbox Series S',
    slug: 'microsoft-xbox-series-s',
    year: 2020,
    screenSize: null,
    specs: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '10GB GDDR6',
      storage: '512GB SSD',
      common_issues: ['Overheating', 'Storage limitations', 'Controller drift'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-xbox-series-s.jpg'
  },
  {
    id: generateId('microsoft', 'xbox_one_x', 2017),
    brandId: 'microsoft',
    name: 'Microsoft Xbox One X',
    slug: 'microsoft-xbox-one-x',
    year: 2017,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      graphics: 'AMD Radeon',
      common_issues: ['Overheating', 'HDD failure', 'Power supply issues'],
      average_repair_cost: calculateRepairPrice(160, 2017, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-xbox-one-x.jpg'
  },
  {
    id: generateId('microsoft', 'xbox_one_s', 2016),
    brandId: 'microsoft',
    name: 'Microsoft Xbox One S',
    slug: 'microsoft-xbox-one-s',
    year: 2016,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      common_issues: ['HDD failure', 'Power supply issues', 'Controller drift'],
      average_repair_cost: calculateRepairPrice(130, 2016, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-xbox-one-s.jpg'
  },
  {
    id: generateId('microsoft', 'xbox_one', 2015),
    brandId: 'microsoft',
    name: 'Microsoft Xbox One',
    slug: 'microsoft-xbox-one',
    year: 2015,
    screenSize: null,
    specs: {
      processor: 'AMD Jaguar 8-core',
      common_issues: ['HDD failure', 'Power supply problems', 'Kinect issues'],
      average_repair_cost: calculateRepairPrice(120, 2015, 'Microsoft')
    },
    imageUrl: '/images/devices/microsoft-xbox-one.jpg'
  },
  
  // Nintendo Consoles
  {
    id: generateId('nintendo', 'switch_oled', 2021),
    brandId: 'nintendo',
    name: 'Nintendo Switch OLED',
    slug: 'nintendo-switch-oled',
    year: 2021,
    screenSize: 7,
    specs: {
      processor: 'NVIDIA Tegra X1',
      storage: '64GB',
      screen: { size: '7"', resolution: '1280x720', type: 'OLED' },
      common_issues: ['Joy-Con drift', 'Screen burn-in', 'Dock scratching screen'],
      average_repair_cost: calculateRepairPrice(120, 2021, 'Nintendo')
    },
    imageUrl: '/images/devices/nintendo-switch-oled.jpg'
  },
  {
    id: generateId('nintendo', 'switch', 2017),
    brandId: 'nintendo',
    name: 'Nintendo Switch',
    slug: 'nintendo-switch',
    year: 2017,
    screenSize: 6.2,
    specs: {
      processor: 'NVIDIA Tegra X1',
      storage: '32GB',
      screen: { size: '6.2"', resolution: '1280x720', type: 'LCD' },
      common_issues: ['Joy-Con drift', 'Dock scratching screen', 'Charging port wear'],
      average_repair_cost: calculateRepairPrice(100, 2017, 'Nintendo')
    },
    imageUrl: '/images/devices/nintendo-switch.jpg'
  },
  {
    id: generateId('nintendo', 'switch_lite', 2019),
    brandId: 'nintendo',
    name: 'Nintendo Switch Lite',
    slug: 'nintendo-switch-lite',
    year: 2019,
    screenSize: 5.5,
    specs: {
      processor: 'NVIDIA Tegra X1',
      storage: '32GB',
      screen: { size: '5.5"', resolution: '1280x720', type: 'LCD' },
      common_issues: ['Analog stick drift', 'Button sticking', 'Charging port issues'],
      average_repair_cost: calculateRepairPrice(80, 2019, 'Nintendo')
    },
    imageUrl: '/images/devices/nintendo-switch-lite.jpg'
  }
];

// Function to insert categories
async function insertCategories(client) {
  console.log('Inserting device categories...');
  
  for (const category of categories) {
    await client.query(`
      INSERT INTO device_categories (id, name, slug, description, "iconName", "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        "iconName" = EXCLUDED."iconName",
        "sortOrder" = EXCLUDED."sortOrder",
        "updatedAt" = NOW()
    `, [category.id, category.name, category.slug, category.description, category.iconName, category.sortOrder, true]);
  }
  
  console.log(`✓ Inserted ${categories.length} categories`);
}

// Function to insert brands
async function insertBrands(client) {
  console.log('Inserting device brands...');
  
  for (const brand of brands) {
    await client.query(`
      INSERT INTO device_brands (id, "categoryId", name, slug, "logoUrl", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        "categoryId" = EXCLUDED."categoryId",
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        "logoUrl" = EXCLUDED."logoUrl",
        "updatedAt" = NOW()
    `, [brand.id, brand.categoryId, brand.name, brand.slug, brand.logoUrl, true]);
  }
  
  console.log(`✓ Inserted ${brands.length} brands`);
}

// Function to insert device models
async function insertDeviceModels(client) {
  console.log('Inserting comprehensive device models...');
  
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const device of deviceModels) {
    try {
      await client.query(`
        INSERT INTO device_models (id, "brandId", name, slug, year, "screenSize", specs, "imageUrl", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          "brandId" = EXCLUDED."brandId",
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          year = EXCLUDED.year,
          "screenSize" = EXCLUDED."screenSize",
          specs = EXCLUDED.specs,
          "imageUrl" = EXCLUDED."imageUrl",
          "updatedAt" = NOW()
      `, [
        device.id,
        device.brandId,
        device.name,
        device.slug,
        device.year,
        device.screenSize,
        JSON.stringify(device.specs),
        device.imageUrl,
        true
      ]);
      
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting device '${device.name}':`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`✓ Inserted ${insertedCount} device models, skipped ${skippedCount}`);
}

// Main import function
async function importPrismaDeviceData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive UK device database import (Prisma schema)...\n');
    console.log(`📊 Import Statistics:`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Brands: ${brands.length}`);
    console.log(`   Total Device Models: ${deviceModels.length}`);
    
    // Count devices by brand
    const brandCounts = {};
    deviceModels.forEach(device => {
      const brandName = brands.find(b => b.id === device.brandId)?.name || 'Unknown';
      brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
    });
    
    console.log('\n   Device Models by Brand:');
    Object.entries(brandCounts).forEach(([brand, count]) => {
      console.log(`   - ${brand}: ${count} models`);
    });
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Import data in sequence
    await insertCategories(client);
    await insertBrands(client);
    await insertDeviceModels(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Comprehensive device data import completed successfully!');
    
    // Show detailed summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM device_categories WHERE "isActive" = TRUE) as categories,
        (SELECT COUNT(*) FROM device_brands WHERE "isActive" = TRUE) as brands,
        (SELECT COUNT(*) FROM device_models WHERE "isActive" = TRUE) as models
    `);
    
    const modelsByBrand = await client.query(`
      SELECT b.name as brand, COUNT(d.id) as model_count
      FROM device_brands b
      LEFT JOIN device_models d ON b.id = d."brandId" AND d."isActive" = TRUE
      WHERE b."isActive" = TRUE
      GROUP BY b.name
      ORDER BY model_count DESC
    `);
    
    const modelsByCategory = await client.query(`
      SELECT c.name as category, COUNT(d.id) as model_count
      FROM device_categories c
      LEFT JOIN device_brands b ON c.id = b."categoryId" AND b."isActive" = TRUE
      LEFT JOIN device_models d ON b.id = d."brandId" AND d."isActive" = TRUE
      WHERE c."isActive" = TRUE
      GROUP BY c.name
      ORDER BY model_count DESC
    `);
    
    const yearRange = await client.query(`
      SELECT MIN(year) as oldest_year, MAX(year) as newest_year
      FROM device_models WHERE "isActive" = TRUE
    `);
    
    const stats = summary.rows[0];
    console.log('\n📊 Final Database Summary:');
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Brands: ${stats.brands}`);
    console.log(`   Device Models: ${stats.models}`);
    
    if (yearRange.rows[0].oldest_year) {
      console.log(`   Year Coverage: ${yearRange.rows[0].oldest_year} - ${yearRange.rows[0].newest_year}`);
    }
    
    console.log('\n📱 Models by Brand:');
    modelsByBrand.rows.forEach(row => {
      console.log(`   ${row.brand}: ${row.model_count} models`);
    });
    
    console.log('\n📋 Models by Category:');
    modelsByCategory.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.model_count} models`);
    });
    
    console.log('\n✅ UK Market Device Database Ready!');
    console.log('   • Complete 2015-2025 device coverage');
    console.log('   • Age-based pricing implemented');
    console.log('   • Brand premiums configured');
    console.log('   • API endpoints ready for testing');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
if (require.main === module) {
  importPrismaDeviceData()
    .then(() => {
      console.log('\n🎯 Ready for next steps:');
      console.log('   1. Test API endpoints: curl "http://localhost:3011/api/devices/search?limit=10"');
      console.log('   2. Verify categories: curl "http://localhost:3011/api/devices/categories"');
      console.log('   3. Check pricing: curl "http://localhost:3011/api/pricing/calculate"');
      console.log('   4. Launch frontend: http://localhost:3010/book-repair');
      console.log('\n✅ Comprehensive UK device database import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Comprehensive device import failed:', error);
      process.exit(1);
    });
}

module.exports = { importPrismaDeviceData };