#!/usr/bin/env node

/**
 * Comprehensive UK Device Database Import Script
 * Expands the device catalog to include comprehensive UK market coverage (2015-2025)
 * 
 * Enhanced Features:
 * - Complete Apple device lineup (iPhone, iPad, MacBook, iMac, Mac Studio, Mac Pro, Mac Mini)
 * - Samsung Galaxy series (S6-S24, Note 5-20, A series, Tab series)
 * - Google Pixel (1-8 series)
 * - Major UK PC brands (Dell, HP, Lenovo, ASUS, MSI)
 * - Gaming consoles (PlayStation, Xbox, Nintendo Switch)
 * - Age-based pricing rules and brand premiums
 * 
 * Usage: node scripts/comprehensive-device-import.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5435,
  database: process.env.DB_NAME || 'revivatech_new',
  user: process.env.DB_USER || 'revivatech_user',
  password: process.env.DB_PASSWORD || 'revivatech_password',
});

// Comprehensive device configuration for UK market
const comprehensiveDeviceData = {
  categories: [
    // Apple Categories
    { id: 'macbook', name: 'MacBook', description: 'Apple MacBook laptops - Air and Pro models', icon: 'laptop', brands: ['Apple'] },
    { id: 'imac', name: 'iMac', description: 'Apple iMac all-in-one desktop computers', icon: 'desktop', brands: ['Apple'] },
    { id: 'mac-mini', name: 'Mac Mini', description: 'Apple Mac Mini compact desktop computers', icon: 'cpu', brands: ['Apple'] },
    { id: 'mac-studio', name: 'Mac Studio', description: 'Apple Mac Studio high-performance compact desktops', icon: 'cpu', brands: ['Apple'] },
    { id: 'mac-pro', name: 'Mac Pro', description: 'Apple Mac Pro professional workstations', icon: 'cpu', brands: ['Apple'] },
    { id: 'iphone', name: 'iPhone', description: 'Apple iPhone smartphones', icon: 'smartphone', brands: ['Apple'] },
    { id: 'ipad', name: 'iPad', description: 'Apple iPad tablets', icon: 'tablet', brands: ['Apple'] },
    
    // PC Categories
    { id: 'laptop-pc', name: 'Laptop', description: 'Windows laptops and ultrabooks from all manufacturers', icon: 'laptop', brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Razer', 'Microsoft'] },
    { id: 'desktop-pc', name: 'Desktop PC', description: 'Windows desktop computers and workstations', icon: 'desktop', brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Custom Build'] },
    { id: 'gaming-laptop', name: 'Gaming Laptop', description: 'High-performance gaming laptops', icon: 'laptop', brands: ['ASUS ROG', 'MSI', 'Razer', 'Alienware', 'HP Omen', 'Lenovo Legion'] },
    { id: 'ultrabook', name: 'Ultrabook', description: 'Thin and light premium laptops', icon: 'laptop', brands: ['Dell', 'HP', 'Lenovo', 'ASUS', 'Microsoft'] },
    
    // Android Categories
    { id: 'android-phone', name: 'Android Phone', description: 'Android smartphones from all manufacturers', icon: 'smartphone', brands: ['Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony'] },
    { id: 'android-tablet', name: 'Android Tablet', description: 'Android tablets and e-readers', icon: 'tablet', brands: ['Samsung', 'Google', 'Lenovo', 'Huawei'] },
    
    // Gaming Categories
    { id: 'playstation', name: 'PlayStation', description: 'Sony PlayStation consoles', icon: 'gamepad', brands: ['Sony'] },
    { id: 'xbox', name: 'Xbox', description: 'Microsoft Xbox consoles', icon: 'gamepad', brands: ['Microsoft'] },
    { id: 'nintendo', name: 'Nintendo', description: 'Nintendo gaming consoles', icon: 'gamepad', brands: ['Nintendo'] },
  ],
  
  brands: [
    // Apple
    { name: 'Apple', slug: 'apple', logo_url: '/images/brands/apple.svg', website: 'https://apple.com' },
    
    // PC Brands
    { name: 'Dell', slug: 'dell', logo_url: '/images/brands/dell.svg', website: 'https://dell.com' },
    { name: 'HP', slug: 'hp', logo_url: '/images/brands/hp.svg', website: 'https://hp.com' },
    { name: 'Lenovo', slug: 'lenovo', logo_url: '/images/brands/lenovo.svg', website: 'https://lenovo.com' },
    { name: 'ASUS', slug: 'asus', logo_url: '/images/brands/asus.svg', website: 'https://asus.com' },
    { name: 'MSI', slug: 'msi', logo_url: '/images/brands/msi.svg', website: 'https://msi.com' },
    { name: 'Microsoft', slug: 'microsoft', logo_url: '/images/brands/microsoft.svg', website: 'https://microsoft.com' },
    { name: 'Razer', slug: 'razer', logo_url: '/images/brands/razer.svg', website: 'https://razer.com' },
    { name: 'Custom Build', slug: 'custom-build', logo_url: '/images/brands/custom.svg', website: '' },
    
    // Android Brands
    { name: 'Samsung', slug: 'samsung', logo_url: '/images/brands/samsung.svg', website: 'https://samsung.com' },
    { name: 'Google', slug: 'google', logo_url: '/images/brands/google.svg', website: 'https://google.com' },
    { name: 'OnePlus', slug: 'oneplus', logo_url: '/images/brands/oneplus.svg', website: 'https://oneplus.com' },
    { name: 'Xiaomi', slug: 'xiaomi', logo_url: '/images/brands/xiaomi.svg', website: 'https://xiaomi.com' },
    
    // Gaming Brands
    { name: 'Sony', slug: 'sony', logo_url: '/images/brands/sony.svg', website: 'https://sony.com' },
    { name: 'Nintendo', slug: 'nintendo', logo_url: '/images/brands/nintendo.svg', website: 'https://nintendo.com' },
  ],
  
  devices: []
};

// Helper function to calculate age-based pricing
function calculateRepairPrice(basePrice, year, brand) {
  let price = basePrice;
  
  // Age-based pricing adjustments
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age >= 8) { // 2015-2017
    price += 20;
  } else if (age >= 5) { // 2018-2020
    price += 15;
  } else if (age >= 3) { // 2021-2022
    price += 10;
  }
  // 2023-2025: standard pricing
  
  // Brand premiums
  const brandMultipliers = {
    'Apple': 1.25,
    'Samsung': 1.15,
    'Google': 1.10,
    'Sony': 1.30,
    'MSI': 1.30,
    'Razer': 1.30,
    'Microsoft': 1.15,
    'Dell': 1.05,
    'HP': 1.05,
    'Lenovo': 1.05,
    'ASUS': 1.10,
  };
  
  const multiplier = brandMultipliers[brand] || 1.0;
  return Math.round(price * multiplier);
}

// COMPREHENSIVE DEVICE DATABASE

// === APPLE DEVICES (EXPANDED) ===

// iPhone Models (2015-2025) - Complete UK Market Coverage
const iphoneDevices = [
  // iPhone 16 Series (2024)
  {
    id: 'iphone-16-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 16 Pro Max',
    model: 'A3294',
    year: 2024,
    slug: 'iphone-16-pro-max',
    image_url: '/images/devices/iphone-16-pro-max.jpg',
    specifications: {
      screen: { size: '6.9"', resolution: '2868x1320', type: 'Super Retina XDR OLED ProMotion' },
      processor: 'A18 Pro',
      memory: '8GB',
      storage: '256GB - 1TB',
      cameras: 'Triple camera system (48MP Main, 48MP Ultra Wide, 12MP Telephoto 5x)',
      connectivity: 'USB-C, 5G, Wi-Fi 7, Bluetooth 5.3'
    },
    common_issues: ['Screen cracks', 'Camera lens damage', 'Battery degradation', 'USB-C port issues', 'Camera Control button problems'],
    repairability_score: 6.0,
    popularity_score: 9.8,
    average_repair_time: 90,
    average_repair_cost: calculateRepairPrice(280, 2024, 'Apple'),
    warranty_void_on_repair: true,
    special_tools_required: ['Pentalobe screwdriver', 'Tri-point screwdriver', 'Suction handle', 'Heat gun'],
    is_active: true
  },
  {
    id: 'iphone-16-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 16 Pro',
    model: 'A3293',
    year: 2024,
    slug: 'iphone-16-pro',
    image_url: '/images/devices/iphone-16-pro.jpg',
    specifications: {
      screen: { size: '6.3"', resolution: '2622x1206', type: 'Super Retina XDR OLED ProMotion' },
      processor: 'A18 Pro',
      memory: '8GB',
      storage: '128GB - 1TB'
    },
    common_issues: ['Screen cracks', 'Camera lens damage', 'Battery degradation', 'USB-C port issues'],
    repairability_score: 6.0,
    popularity_score: 9.5,
    average_repair_time: 90,
    average_repair_cost: calculateRepairPrice(260, 2024, 'Apple'),
    warranty_void_on_repair: true,
    is_active: true
  },
  {
    id: 'iphone-16-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 16 Plus',
    model: 'A3292',
    year: 2024,
    slug: 'iphone-16-plus',
    specifications: {
      screen: { size: '6.7"', resolution: '2796x1290', type: 'Super Retina XDR OLED' },
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB'
    },
    common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
    average_repair_cost: calculateRepairPrice(220, 2024, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-16',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 16',
    model: 'A3291',
    year: 2024,
    slug: 'iphone-16',
    specifications: {
      screen: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR OLED' },
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB'
    },
    common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
    average_repair_cost: calculateRepairPrice(200, 2024, 'Apple'),
    is_active: true
  },
  
  // iPhone 15 Series (2023)
  {
    id: 'iphone-15-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 15 Pro Max',
    model: 'A3108',
    year: 2023,
    slug: 'iphone-15-pro-max',
    specifications: {
      screen: { size: '6.7"', resolution: '2796x1290', type: 'Super Retina XDR OLED' },
      processor: 'A17 Pro',
      memory: '8GB',
      storage: '256GB - 1TB'
    },
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
    average_repair_cost: calculateRepairPrice(220, 2023, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-15-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 15 Pro',
    model: 'A3107',
    year: 2023,
    slug: 'iphone-15-pro',
    specifications: {
      screen: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR OLED' },
      processor: 'A17 Pro',
      memory: '8GB',
      storage: '128GB - 1TB'
    },
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
    average_repair_cost: calculateRepairPrice(200, 2023, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-15-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 15 Plus',
    model: 'A3106',
    year: 2023,
    slug: 'iphone-15-plus',
    specifications: {
      screen: { size: '6.7"', resolution: '2796x1290', type: 'Super Retina XDR OLED' },
      processor: 'A16 Bionic',
      memory: '6GB',
      storage: '128GB - 512GB'
    },
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
    average_repair_cost: calculateRepairPrice(180, 2023, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-15',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 15',
    model: 'A3105',
    year: 2023,
    slug: 'iphone-15',
    specifications: {
      screen: { size: '6.1"', resolution: '2556x1179', type: 'Super Retina XDR OLED' },
      processor: 'A16 Bionic',
      memory: '6GB',
      storage: '128GB - 512GB'
    },
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
    average_repair_cost: calculateRepairPrice(160, 2023, 'Apple'),
    is_active: true
  },
  
  // iPhone 14 Series (2022)
  {
    id: 'iphone-14-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 14 Pro Max',
    model: 'A2895',
    year: 2022,
    slug: 'iphone-14-pro-max',
    common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation', 'Camera problems'],
    average_repair_cost: calculateRepairPrice(200, 2022, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-14-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 14 Pro',
    model: 'A2890',
    year: 2022,
    slug: 'iphone-14-pro',
    common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation', 'Camera problems'],
    average_repair_cost: calculateRepairPrice(180, 2022, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-14-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 14 Plus',
    model: 'A2886',
    year: 2022,
    slug: 'iphone-14-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera problems'],
    average_repair_cost: calculateRepairPrice(160, 2022, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-14',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 14',
    model: 'A2882',
    year: 2022,
    slug: 'iphone-14',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera problems'],
    average_repair_cost: calculateRepairPrice(140, 2022, 'Apple'),
    is_active: true
  },
  
  // iPhone 13 Series (2021)
  {
    id: 'iphone-13-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 13 Pro Max',
    model: 'A2484',
    year: 2021,
    slug: 'iphone-13-pro-max',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Face ID problems'],
    average_repair_cost: calculateRepairPrice(180, 2021, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-13-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 13 Pro',
    model: 'A2483',
    year: 2021,
    slug: 'iphone-13-pro',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Face ID problems'],
    average_repair_cost: calculateRepairPrice(160, 2021, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-13-mini',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 13 mini',
    model: 'A2481',
    year: 2021,
    slug: 'iphone-13-mini',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(120, 2021, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-13',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 13',
    model: 'A2482',
    year: 2021,
    slug: 'iphone-13',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(140, 2021, 'Apple'),
    is_active: true
  },
  
  // iPhone 12 Series (2020)
  {
    id: 'iphone-12-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 12 Pro Max',
    model: 'A2342',
    year: 2020,
    slug: 'iphone-12-pro-max',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues', 'Speaker problems'],
    average_repair_cost: calculateRepairPrice(160, 2020, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-12-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 12 Pro',
    model: 'A2341',
    year: 2020,
    slug: 'iphone-12-pro',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues', 'Speaker problems'],
    average_repair_cost: calculateRepairPrice(150, 2020, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-12-mini',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 12 mini',
    model: 'A2176',
    year: 2020,
    slug: 'iphone-12-mini',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(110, 2020, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-12',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 12',
    model: 'A2172',
    year: 2020,
    slug: 'iphone-12',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues', 'Speaker problems'],
    average_repair_cost: calculateRepairPrice(140, 2020, 'Apple'),
    is_active: true
  },
  
  // iPhone SE Series
  {
    id: 'iphone-se-3rd-gen',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone SE (3rd generation)',
    model: 'A2595',
    year: 2022,
    slug: 'iphone-se-3rd-gen',
    common_issues: ['Home button issues', 'Screen cracks', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(120, 2022, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-se-2nd-gen',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone SE (2nd generation)',
    model: 'A2296',
    year: 2020,
    slug: 'iphone-se-2nd-gen',
    common_issues: ['Home button issues', 'Screen cracks', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(100, 2020, 'Apple'),
    is_active: true
  },
  
  // iPhone 11 Series (2019)
  {
    id: 'iphone-11-pro-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 11 Pro Max',
    model: 'A2161',
    year: 2019,
    slug: 'iphone-11-pro-max',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(140, 2019, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-11-pro',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 11 Pro',
    model: 'A2160',
    year: 2019,
    slug: 'iphone-11-pro',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(130, 2019, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-11',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 11',
    model: 'A2111',
    year: 2019,
    slug: 'iphone-11',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(120, 2019, 'Apple'),
    is_active: true
  },
  
  // iPhone XS/XR Series (2018)
  {
    id: 'iphone-xs-max',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone XS Max',
    model: 'A1921',
    year: 2018,
    slug: 'iphone-xs-max',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(130, 2018, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-xs',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone XS',
    model: 'A1920',
    year: 2018,
    slug: 'iphone-xs',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
    average_repair_cost: calculateRepairPrice(120, 2018, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-xr',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone XR',
    model: 'A1984',
    year: 2018,
    slug: 'iphone-xr',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
    average_repair_cost: calculateRepairPrice(110, 2018, 'Apple'),
    is_active: true
  },
  
  // iPhone X (2017)
  {
    id: 'iphone-x',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone X',
    model: 'A1865',
    year: 2017,
    slug: 'iphone-x',
    common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Green line display issue'],
    average_repair_cost: calculateRepairPrice(120, 2017, 'Apple'),
    is_active: true
  },
  
  // iPhone 8 Series (2017)
  {
    id: 'iphone-8-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 8 Plus',
    model: 'A1864',
    year: 2017,
    slug: 'iphone-8-plus',
    common_issues: ['Battery swelling', 'Screen cracks', 'Home button issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(110, 2017, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-8',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 8',
    model: 'A1863',
    year: 2017,
    slug: 'iphone-8',
    common_issues: ['Battery swelling', 'Screen cracks', 'Home button issues'],
    average_repair_cost: calculateRepairPrice(100, 2017, 'Apple'),
    is_active: true
  },
  
  // iPhone 7 Series (2016)
  {
    id: 'iphone-7-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 7 Plus',
    model: 'A1661',
    year: 2016,
    slug: 'iphone-7-plus',
    common_issues: ['Audio IC failure', 'Battery degradation', 'Home button issues', 'Screen cracks'],
    average_repair_cost: calculateRepairPrice(110, 2016, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-7',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 7',
    model: 'A1660',
    year: 2016,
    slug: 'iphone-7',
    common_issues: ['Audio IC failure', 'Battery degradation', 'Home button issues'],
    average_repair_cost: calculateRepairPrice(100, 2016, 'Apple'),
    is_active: true
  },
  
  // iPhone 6S Series (2015)
  {
    id: 'iphone-6s-plus',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 6s Plus',
    model: 'A1634',
    year: 2015,
    slug: 'iphone-6s-plus',
    common_issues: ['Battery degradation', 'Touch disease', 'Home button issues', 'Screen cracks'],
    average_repair_cost: calculateRepairPrice(105, 2015, 'Apple'),
    is_active: true
  },
  {
    id: 'iphone-6s',
    category_id: 'iphone',
    brand_name: 'Apple',
    display_name: 'iPhone 6s',
    model: 'A1633',
    year: 2015,
    slug: 'iphone-6s',
    common_issues: ['Battery degradation', 'Touch disease', 'Home button issues'],
    average_repair_cost: calculateRepairPrice(95, 2015, 'Apple'),
    is_active: true
  }
];

// === SAMSUNG DEVICES (2015-2025) ===

const samsungDevices = [
  // Galaxy S24 Series (2024)
  {
    id: 'samsung-galaxy-s24-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S24 Ultra',
    model: 'SM-S928B',
    year: 2024,
    slug: 'samsung-galaxy-s24-ultra',
    specifications: {
      screen: { size: '6.8"', resolution: '3120x1440', type: 'Dynamic LTPO AMOLED 2X' },
      processor: 'Snapdragon 8 Gen 3',
      memory: '12GB',
      storage: '256GB - 1TB',
      cameras: '200MP main, 50MP periscope telephoto, 10MP telephoto, 12MP ultra-wide'
    },
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(280, 2024, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s24-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S24+',
    model: 'SM-S926B',
    year: 2024,
    slug: 'samsung-galaxy-s24-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(240, 2024, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s24',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S24',
    model: 'SM-S921B',
    year: 2024,
    slug: 'samsung-galaxy-s24',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(220, 2024, 'Samsung'),
    is_active: true
  },
  
  // Galaxy S23 Series (2023)
  {
    id: 'samsung-galaxy-s23-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S23 Ultra',
    model: 'SM-S918B',
    year: 2023,
    slug: 'samsung-galaxy-s23-ultra',
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(260, 2023, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s23-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S23+',
    model: 'SM-S916B',
    year: 2023,
    slug: 'samsung-galaxy-s23-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(220, 2023, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s23',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S23',
    model: 'SM-S911B',
    year: 2023,
    slug: 'samsung-galaxy-s23',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(200, 2023, 'Samsung'),
    is_active: true
  },
  
  // Galaxy S22 Series (2022)
  {
    id: 'samsung-galaxy-s22-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S22 Ultra',
    model: 'SM-S908B',
    year: 2022,
    slug: 'samsung-galaxy-s22-ultra',
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation', 'Overheating'],
    average_repair_cost: calculateRepairPrice(240, 2022, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s22-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S22+',
    model: 'SM-S906B',
    year: 2022,
    slug: 'samsung-galaxy-s22-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
    average_repair_cost: calculateRepairPrice(200, 2022, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s22',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S22',
    model: 'SM-S901B',
    year: 2022,
    slug: 'samsung-galaxy-s22',
    common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
    average_repair_cost: calculateRepairPrice(180, 2022, 'Samsung'),
    is_active: true
  },
  
  // Galaxy S21 Series (2021)
  {
    id: 'samsung-galaxy-s21-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S21 Ultra',
    model: 'SM-G998B',
    year: 2021,
    slug: 'samsung-galaxy-s21-ultra',
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(220, 2021, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s21-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S21+',
    model: 'SM-G996B',
    year: 2021,
    slug: 'samsung-galaxy-s21-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(180, 2021, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s21',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S21',
    model: 'SM-G991B',
    year: 2021,
    slug: 'samsung-galaxy-s21',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(160, 2021, 'Samsung'),
    is_active: true
  },
  
  // Galaxy S20 Series (2020)
  {
    id: 'samsung-galaxy-s20-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S20 Ultra',
    model: 'SM-G988B',
    year: 2020,
    slug: 'samsung-galaxy-s20-ultra',
    common_issues: ['Camera focus issues', 'Screen cracks', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s20-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S20+',
    model: 'SM-G985B',
    year: 2020,
    slug: 'samsung-galaxy-s20-plus',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-s20',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy S20',
    model: 'SM-G980B',
    year: 2020,
    slug: 'samsung-galaxy-s20',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(150, 2020, 'Samsung'),
    is_active: true
  },
  
  // Galaxy Note Series
  {
    id: 'samsung-galaxy-note-20-ultra',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Note 20 Ultra',
    model: 'SM-N986B',
    year: 2020,
    slug: 'samsung-galaxy-note-20-ultra',
    common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-note-20',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Note 20',
    model: 'SM-N981B',
    year: 2020,
    slug: 'samsung-galaxy-note-20',
    common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-note-10-plus',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Note 10+',
    model: 'SM-N975F',
    year: 2019,
    slug: 'samsung-galaxy-note-10-plus',
    common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation', 'Charging port issues'],
    average_repair_cost: calculateRepairPrice(180, 2019, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-note-10',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Note 10',
    model: 'SM-N970F',
    year: 2019,
    slug: 'samsung-galaxy-note-10',
    common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(160, 2019, 'Samsung'),
    is_active: true
  },
  
  // Galaxy A Series (Mid-range)
  {
    id: 'samsung-galaxy-a54',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy A54 5G',
    model: 'SM-A546B',
    year: 2023,
    slug: 'samsung-galaxy-a54',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(140, 2023, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-a73',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy A73 5G',
    model: 'SM-A736B',
    year: 2022,
    slug: 'samsung-galaxy-a73',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(130, 2022, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-a53',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy A53 5G',
    model: 'SM-A536B',
    year: 2022,
    slug: 'samsung-galaxy-a53',
    common_issues: ['Screen cracks', 'Battery degradation', 'Performance issues'],
    average_repair_cost: calculateRepairPrice(120, 2022, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-a52',
    category_id: 'android-phone',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy A52 5G',
    model: 'SM-A526B',
    year: 2021,
    slug: 'samsung-galaxy-a52',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(110, 2021, 'Samsung'),
    is_active: true
  },
  
  // Galaxy Tab Series
  {
    id: 'samsung-galaxy-tab-s9-ultra',
    category_id: 'android-tablet',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Tab S9 Ultra',
    model: 'SM-X916B',
    year: 2023,
    slug: 'samsung-galaxy-tab-s9-ultra',
    specifications: {
      screen: { size: '14.6"', resolution: '2960x1848', type: 'Dynamic AMOLED 2X' },
      processor: 'Snapdragon 8 Gen 2',
      memory: '12GB - 16GB',
      storage: '256GB - 1TB'
    },
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(350, 2023, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-tab-s9-plus',
    category_id: 'android-tablet',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Tab S9+',
    model: 'SM-X816B',
    year: 2023,
    slug: 'samsung-galaxy-tab-s9-plus',
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(300, 2023, 'Samsung'),
    is_active: true
  },
  {
    id: 'samsung-galaxy-tab-s9',
    category_id: 'android-tablet',
    brand_name: 'Samsung',
    display_name: 'Samsung Galaxy Tab S9',
    model: 'SM-X716B',
    year: 2023,
    slug: 'samsung-galaxy-tab-s9',
    common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(250, 2023, 'Samsung'),
    is_active: true
  }
];

// === GOOGLE PIXEL DEVICES (2016-2025) ===

const googlePixelDevices = [
  // Pixel 8 Series (2023)
  {
    id: 'google-pixel-8-pro',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 8 Pro',
    model: 'GC3VE',
    year: 2023,
    slug: 'google-pixel-8-pro',
    specifications: {
      screen: { size: '6.7"', resolution: '2992x1344', type: 'LTPO OLED' },
      processor: 'Google Tensor G3',
      memory: '12GB',
      storage: '128GB - 1TB',
      cameras: '50MP main, 48MP telephoto, 48MP ultra-wide'
    },
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Fingerprint sensor problems'],
    average_repair_cost: calculateRepairPrice(260, 2023, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-8',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 8',
    model: 'GC3VF',
    year: 2023,
    slug: 'google-pixel-8',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(220, 2023, 'Google'),
    is_active: true
  },
  
  // Pixel 7 Series (2022)
  {
    id: 'google-pixel-7-pro',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 7 Pro',
    model: 'GP4BC',
    year: 2022,
    slug: 'google-pixel-7-pro',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera bar issues', 'Fingerprint sensor problems'],
    average_repair_cost: calculateRepairPrice(240, 2022, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-7',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 7',
    model: 'GVU6C',
    year: 2022,
    slug: 'google-pixel-7',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera bar issues'],
    average_repair_cost: calculateRepairPrice(200, 2022, 'Google'),
    is_active: true
  },
  
  // Pixel 6 Series (2021)
  {
    id: 'google-pixel-6-pro',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 6 Pro',
    model: 'GF5KQ',
    year: 2021,
    slug: 'google-pixel-6-pro',
    common_issues: ['Screen cracks', 'Fingerprint sensor issues', 'Camera bar cracks', 'Connectivity problems'],
    average_repair_cost: calculateRepairPrice(220, 2021, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-6',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 6',
    model: 'GB7N6',
    year: 2021,
    slug: 'google-pixel-6',
    common_issues: ['Screen cracks', 'Fingerprint sensor issues', 'Camera bar cracks'],
    average_repair_cost: calculateRepairPrice(180, 2021, 'Google'),
    is_active: true
  },
  
  // Pixel 5 Series (2020)
  {
    id: 'google-pixel-5',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 5',
    model: 'GD1YQ',
    year: 2020,
    slug: 'google-pixel-5',
    common_issues: ['Screen cracks', 'Battery degradation', 'Speaker issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(160, 2020, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-4a-5g',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 4a 5G',
    model: 'G025E',
    year: 2020,
    slug: 'google-pixel-4a-5g',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(140, 2020, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-4a',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 4a',
    model: 'G025J',
    year: 2020,
    slug: 'google-pixel-4a',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(130, 2020, 'Google'),
    is_active: true
  },
  
  // Pixel 4 Series (2019)
  {
    id: 'google-pixel-4-xl',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 4 XL',
    model: 'G020J',
    year: 2019,
    slug: 'google-pixel-4-xl',
    common_issues: ['Battery degradation', 'Face unlock issues', 'Screen cracks', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(150, 2019, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-4',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 4',
    model: 'G020I',
    year: 2019,
    slug: 'google-pixel-4',
    common_issues: ['Battery degradation', 'Face unlock issues', 'Screen cracks'],
    average_repair_cost: calculateRepairPrice(140, 2019, 'Google'),
    is_active: true
  },
  
  // Pixel 3 Series (2018)
  {
    id: 'google-pixel-3-xl',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 3 XL',
    model: 'G013C',
    year: 2018,
    slug: 'google-pixel-3-xl',
    common_issues: ['Screen burn-in', 'Battery degradation', 'Charging issues', 'Memory management'],
    average_repair_cost: calculateRepairPrice(140, 2018, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-3',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 3',
    model: 'G013A',
    year: 2018,
    slug: 'google-pixel-3',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(130, 2018, 'Google'),
    is_active: true
  },
  
  // Pixel 2 Series (2017)
  {
    id: 'google-pixel-2-xl',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 2 XL',
    model: 'G011C',
    year: 2017,
    slug: 'google-pixel-2-xl',
    common_issues: ['Screen burn-in', 'Blue tint issue', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(130, 2017, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel-2',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel 2',
    model: 'G011A',
    year: 2017,
    slug: 'google-pixel-2',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(120, 2017, 'Google'),
    is_active: true
  },
  
  // Original Pixel (2016)
  {
    id: 'google-pixel-xl',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel XL',
    model: 'G-2PW2100',
    year: 2016,
    slug: 'google-pixel-xl',
    common_issues: ['Microphone failure', 'Battery degradation', 'Charging issues', 'Screen cracks'],
    average_repair_cost: calculateRepairPrice(120, 2016, 'Google'),
    is_active: true
  },
  {
    id: 'google-pixel',
    category_id: 'android-phone',
    brand_name: 'Google',
    display_name: 'Google Pixel',
    model: 'G-2PW4100',
    year: 2016,
    slug: 'google-pixel',
    common_issues: ['Microphone failure', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(110, 2016, 'Google'),
    is_active: true
  }
];

// === ONEPLUS DEVICES (2015-2025) ===

const onePlusDevices = [
  {
    id: 'oneplus-12',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 12',
    model: 'CPH2581',
    year: 2024,
    slug: 'oneplus-12',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(200, 2024, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-11',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 11',
    model: 'CPH2449',
    year: 2023,
    slug: 'oneplus-11',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
    average_repair_cost: calculateRepairPrice(180, 2023, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-10-pro',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 10 Pro',
    model: 'NE2213',
    year: 2022,
    slug: 'oneplus-10-pro',
    common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Overheating'],
    average_repair_cost: calculateRepairPrice(170, 2022, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-9-pro',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 9 Pro',
    model: 'LE2123',
    year: 2021,
    slug: 'oneplus-9-pro',
    common_issues: ['Screen tint issues', 'Battery degradation', 'Camera problems', 'Overheating'],
    average_repair_cost: calculateRepairPrice(160, 2021, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-8-pro',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 8 Pro',
    model: 'IN2023',
    year: 2020,
    slug: 'oneplus-8-pro',
    common_issues: ['Screen tint issues', 'Battery degradation', 'Charging problems'],
    average_repair_cost: calculateRepairPrice(150, 2020, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-7-pro',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 7 Pro',
    model: 'GM1913',
    year: 2019,
    slug: 'oneplus-7-pro',
    common_issues: ['Pop-up camera failure', 'Screen cracks', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(140, 2019, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-6t',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 6T',
    model: 'A6013',
    year: 2018,
    slug: 'oneplus-6t',
    common_issues: ['Screen cracks', 'Fingerprint sensor issues', 'Battery degradation'],
    average_repair_cost: calculateRepairPrice(120, 2018, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-5t',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 5T',
    model: 'A5010',
    year: 2017,
    slug: 'oneplus-5t',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
    average_repair_cost: calculateRepairPrice(110, 2017, 'OnePlus'),
    is_active: true
  },
  {
    id: 'oneplus-3t',
    category_id: 'android-phone',
    brand_name: 'OnePlus',
    display_name: 'OnePlus 3T',
    model: 'A3003',
    year: 2016,
    slug: 'oneplus-3t',
    common_issues: ['Screen cracks', 'Battery degradation', 'Charging port issues'],
    average_repair_cost: calculateRepairPrice(100, 2016, 'OnePlus'),
    is_active: true
  }
];

// Combine all Android devices
const allAndroidDevices = [
  ...samsungDevices,
  ...googlePixelDevices,
  ...onePlusDevices
];

// === PC/LAPTOP DEVICES (2015-2025) ===

const laptopDevices = [
  // Dell XPS Series
  {
    id: 'dell-xps-13-plus-2023',
    category_id: 'ultrabook',
    brand_name: 'Dell',
    display_name: 'Dell XPS 13 Plus',
    model: '9320',
    year: 2023,
    slug: 'dell-xps-13-plus-2023',
    specifications: {
      screen: { size: '13.4"', resolution: '1920x1200 or 3840x2400', type: 'InfinityEdge' },
      processor: 'Intel Core i5-1340P / i7-1360P',
      memory: '8GB - 32GB LPDDR5',
      storage: '256GB - 2TB PCIe SSD',
      graphics: 'Intel Iris Xe',
      ports: ['2x Thunderbolt 4', '1x USB-C 3.2']
    },
    common_issues: ['Screen flickering', 'Thermal throttling', 'Battery drain', 'Keyboard backlight issues'],
    repairability_score: 7.0,
    popularity_score: 8.5,
    average_repair_time: 150,
    average_repair_cost: calculateRepairPrice(320, 2023, 'Dell'),
    warranty_void_on_repair: false,
    special_tools_required: ['Phillips screwdriver', 'Spudger', 'Anti-static wrist strap'],
    is_active: true
  },
  {
    id: 'dell-xps-15-2023',
    category_id: 'laptop-pc',
    brand_name: 'Dell',
    display_name: 'Dell XPS 15',
    model: '9530',
    year: 2023,
    slug: 'dell-xps-15-2023',
    specifications: {
      screen: { size: '15.6"', resolution: '1920x1200, 3456x2160, or 3840x2400', type: 'InfinityEdge' },
      processor: 'Intel Core i7-13700H / i9-13900H',
      memory: '16GB - 64GB DDR5',
      storage: '512GB - 4TB PCIe SSD',
      graphics: 'Intel Arc A370M / NVIDIA GeForce RTX 4050/4060/4070'
    },
    common_issues: ['Thermal management', 'Fan noise', 'Battery swelling', 'Display issues'],
    average_repair_cost: calculateRepairPrice(380, 2023, 'Dell'),
    is_active: true
  },
  {
    id: 'dell-inspiron-15-3000-2022',
    category_id: 'laptop-pc',
    brand_name: 'Dell',
    display_name: 'Dell Inspiron 15 3000',
    model: '3511',
    year: 2022,
    slug: 'dell-inspiron-15-3000-2022',
    common_issues: ['Slow performance', 'Battery degradation', 'Screen flickering', 'Keyboard issues'],
    average_repair_cost: calculateRepairPrice(200, 2022, 'Dell'),
    is_active: true
  },
  
  // HP Spectre/Envy Series
  {
    id: 'hp-spectre-x360-14-2023',
    category_id: 'ultrabook',
    brand_name: 'HP',
    display_name: 'HP Spectre x360 14',
    model: '14-ef0000',
    year: 2023,
    slug: 'hp-spectre-x360-14-2023',
    specifications: {
      screen: { size: '13.5"', resolution: '1920x1280 or 3000x2000', type: 'OLED or IPS' },
      processor: 'Intel Core i5-1235U / i7-1255U',
      memory: '8GB - 32GB LPDDR4x',
      storage: '256GB - 2TB PCIe SSD'
    },
    common_issues: ['Hinge problems', 'Battery swelling', 'Touchscreen issues', 'Overheating'],
    average_repair_cost: calculateRepairPrice(350, 2023, 'HP'),
    is_active: true
  },
  {
    id: 'hp-envy-x360-15-2022',
    category_id: 'laptop-pc',
    brand_name: 'HP',
    display_name: 'HP Envy x360 15',
    model: '15-es0000',
    year: 2022,
    slug: 'hp-envy-x360-15-2022',
    common_issues: ['Hinge wear', 'Battery degradation', 'Touchscreen calibration', 'Fan noise'],
    average_repair_cost: calculateRepairPrice(280, 2022, 'HP'),
    is_active: true
  },
  {
    id: 'hp-pavilion-15-2021',
    category_id: 'laptop-pc',
    brand_name: 'HP',
    display_name: 'HP Pavilion 15',
    model: '15-eh0000',
    year: 2021,
    slug: 'hp-pavilion-15-2021',
    common_issues: ['Slow performance', 'Battery degradation', 'Screen flickering', 'Keyboard wear'],
    average_repair_cost: calculateRepairPrice(220, 2021, 'HP'),
    is_active: true
  },
  
  // Lenovo ThinkPad Series
  {
    id: 'lenovo-thinkpad-x1-carbon-gen-11',
    category_id: 'ultrabook',
    brand_name: 'Lenovo',
    display_name: 'ThinkPad X1 Carbon Gen 11',
    model: '21HM',
    year: 2023,
    slug: 'lenovo-thinkpad-x1-carbon-gen-11',
    specifications: {
      screen: { size: '14"', resolution: '1920x1200, 2240x1400, or 2880x1800', type: 'IPS or OLED' },
      processor: 'Intel Core i5-1335U / i7-1355U / i7-1365U',
      memory: '8GB - 32GB LPDDR5',
      storage: '256GB - 2TB PCIe SSD'
    },
    common_issues: ['Trackpoint issues', 'Battery degradation', 'Screen flickering', 'Keyboard problems'],
    average_repair_cost: calculateRepairPrice(380, 2023, 'Lenovo'),
    is_active: true
  },
  {
    id: 'lenovo-thinkpad-t14-gen-3',
    category_id: 'laptop-pc',
    brand_name: 'Lenovo',
    display_name: 'ThinkPad T14 Gen 3',
    model: '21AH',
    year: 2022,
    slug: 'lenovo-thinkpad-t14-gen-3',
    common_issues: ['Port connectivity', 'Battery degradation', 'Fan noise', 'Trackpad issues'],
    average_repair_cost: calculateRepairPrice(320, 2022, 'Lenovo'),
    is_active: true
  },
  {
    id: 'lenovo-ideapad-5-pro-2021',
    category_id: 'laptop-pc',
    brand_name: 'Lenovo',
    display_name: 'IdeaPad 5 Pro',
    model: '16ACH6',
    year: 2021,
    slug: 'lenovo-ideapad-5-pro-2021',
    common_issues: ['Screen flickering', 'Battery degradation', 'Thermal management', 'Keyboard backlight'],
    average_repair_cost: calculateRepairPrice(260, 2021, 'Lenovo'),
    is_active: true
  },
  {
    id: 'lenovo-legion-5-pro-2022',
    category_id: 'gaming-laptop',
    brand_name: 'Lenovo',
    display_name: 'Legion 5 Pro',
    model: '16ARH7H',
    year: 2022,
    slug: 'lenovo-legion-5-pro-2022',
    specifications: {
      screen: { size: '16"', resolution: '2560x1600', type: 'IPS 165Hz' },
      processor: 'AMD Ryzen 7 6800H / Ryzen 9 6900HX',
      memory: '16GB - 32GB DDR5',
      graphics: 'NVIDIA GeForce RTX 3060/3070/3070Ti'
    },
    common_issues: ['Overheating', 'Fan noise', 'Battery degradation', 'RGB lighting issues'],
    average_repair_cost: calculateRepairPrice(400, 2022, 'Lenovo'),
    is_active: true
  },
  
  // ASUS ZenBook/ROG Series
  {
    id: 'asus-zenbook-14-oled-2023',
    category_id: 'ultrabook',
    brand_name: 'ASUS',
    display_name: 'ASUS ZenBook 14 OLED',
    model: 'UX3402VA',
    year: 2023,
    slug: 'asus-zenbook-14-oled-2023',
    specifications: {
      screen: { size: '14"', resolution: '2880x1800', type: 'OLED' },
      processor: 'Intel Core i5-1340P / i7-1360P',
      memory: '8GB - 16GB LPDDR5',
      storage: '512GB - 1TB PCIe SSD'
    },
    common_issues: ['OLED burn-in', 'Battery degradation', 'Trackpad issues', 'Thermal management'],
    average_repair_cost: calculateRepairPrice(350, 2023, 'ASUS'),
    is_active: true
  },
  {
    id: 'asus-rog-strix-g15-2022',
    category_id: 'gaming-laptop',
    brand_name: 'ASUS',
    display_name: 'ASUS ROG Strix G15',
    model: 'G513RM',
    year: 2022,
    slug: 'asus-rog-strix-g15-2022',
    specifications: {
      screen: { size: '15.6"', resolution: '1920x1080', type: 'IPS 144Hz/300Hz' },
      processor: 'AMD Ryzen 7 6800H / Ryzen 9 6900HX',
      graphics: 'NVIDIA GeForce RTX 3060/3070Ti/3080Ti'
    },
    common_issues: ['Overheating', 'Fan noise', 'RGB lighting failure', 'Battery swelling'],
    average_repair_cost: calculateRepairPrice(420, 2022, 'ASUS'),
    is_active: true
  },
  {
    id: 'asus-vivobook-s15-2021',
    category_id: 'laptop-pc',
    brand_name: 'ASUS',
    display_name: 'ASUS VivoBook S15',
    model: 'S533EA',
    year: 2021,
    slug: 'asus-vivobook-s15-2021',
    common_issues: ['Screen flickering', 'Battery degradation', 'Keyboard backlight', 'Port issues'],
    average_repair_cost: calculateRepairPrice(240, 2021, 'ASUS'),
    is_active: true
  },
  
  // MSI Gaming Laptops
  {
    id: 'msi-ge76-raider-2022',
    category_id: 'gaming-laptop',
    brand_name: 'MSI',
    display_name: 'MSI GE76 Raider',
    model: '12UH',
    year: 2022,
    slug: 'msi-ge76-raider-2022',
    specifications: {
      screen: { size: '17.3"', resolution: '1920x1080 or 2560x1440', type: 'IPS 144Hz/240Hz/360Hz' },
      processor: 'Intel Core i7-12700H / i9-12900H',
      graphics: 'NVIDIA GeForce RTX 3070Ti/3080Ti'
    },
    common_issues: ['Extreme overheating', 'Fan failure', 'RGB lighting issues', 'Battery swelling'],
    average_repair_cost: calculateRepairPrice(500, 2022, 'MSI'),
    is_active: true
  },
  {
    id: 'msi-stealth-15m-2021',
    category_id: 'gaming-laptop',
    brand_name: 'MSI',
    display_name: 'MSI Stealth 15M',
    model: 'A11UEK',
    year: 2021,
    slug: 'msi-stealth-15m-2021',
    common_issues: ['Thermal throttling', 'Battery degradation', 'Screen flickering', 'Build quality'],
    average_repair_cost: calculateRepairPrice(380, 2021, 'MSI'),
    is_active: true
  },
  
  // Microsoft Surface Laptops
  {
    id: 'microsoft-surface-laptop-5-2022',
    category_id: 'ultrabook',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Surface Laptop 5',
    model: '1950/1951',
    year: 2022,
    slug: 'microsoft-surface-laptop-5-2022',
    specifications: {
      screen: { size: '13.5" or 15"', resolution: '2256x1504 or 2496x1664', type: 'PixelSense' },
      processor: 'Intel Core i5-1235U / i7-1255U',
      memory: '8GB - 32GB LPDDR5x',
      storage: '256GB - 1TB SSD'
    },
    common_issues: ['Screen cracks', 'Battery swelling', 'Keyboard issues', 'Trackpad problems'],
    average_repair_cost: calculateRepairPrice(380, 2022, 'Microsoft'),
    is_active: true
  },
  {
    id: 'microsoft-surface-pro-9-2022',
    category_id: 'ultrabook',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Surface Pro 9',
    model: '1960',
    year: 2022,
    slug: 'microsoft-surface-pro-9-2022',
    common_issues: ['Screen cracks', 'Type Cover issues', 'Kickstand problems', 'Charging port wear'],
    average_repair_cost: calculateRepairPrice(420, 2022, 'Microsoft'),
    is_active: true
  }
];

// === GAMING CONSOLES (2015-2025) ===

const gamingConsoles = [
  // PlayStation Consoles
  {
    id: 'sony-playstation-5',
    category_id: 'playstation',
    brand_name: 'Sony',
    display_name: 'Sony PlayStation 5',
    model: 'CFI-1000/1100/1200',
    year: 2020,
    slug: 'sony-playstation-5',
    specifications: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '16GB GDDR6',
      storage: '825GB SSD',
      connectivity: 'Wi-Fi 6, Bluetooth 5.1, Gigabit Ethernet'
    },
    common_issues: ['Overheating', 'Fan noise', 'SSD issues', 'Controller drift', 'Disc drive problems'],
    average_repair_cost: calculateRepairPrice(200, 2020, 'Sony'),
    is_active: true
  },
  {
    id: 'sony-playstation-5-digital',
    category_id: 'playstation',
    brand_name: 'Sony',
    display_name: 'Sony PlayStation 5 Digital Edition',
    model: 'CFI-1000B/1100B/1200B',
    year: 2020,
    slug: 'sony-playstation-5-digital',
    common_issues: ['Overheating', 'Fan noise', 'SSD issues', 'Controller drift'],
    average_repair_cost: calculateRepairPrice(180, 2020, 'Sony'),
    is_active: true
  },
  {
    id: 'sony-playstation-4-pro',
    category_id: 'playstation',
    brand_name: 'Sony',
    display_name: 'Sony PlayStation 4 Pro',
    model: 'CUH-7000/7100/7200',
    year: 2016,
    slug: 'sony-playstation-4-pro',
    common_issues: ['Overheating', 'Fan noise', 'HDD failure', 'HDMI port issues', 'Blue light of death'],
    average_repair_cost: calculateRepairPrice(150, 2016, 'Sony'),
    is_active: true
  },
  {
    id: 'sony-playstation-4-slim',
    category_id: 'playstation',
    brand_name: 'Sony',
    display_name: 'Sony PlayStation 4 Slim',
    model: 'CUH-2000/2100/2200',
    year: 2016,
    slug: 'sony-playstation-4-slim',
    common_issues: ['Overheating', 'HDD failure', 'Controller drift', 'Disc drive issues'],
    average_repair_cost: calculateRepairPrice(130, 2016, 'Sony'),
    is_active: true
  },
  {
    id: 'sony-playstation-4',
    category_id: 'playstation',
    brand_name: 'Sony',
    display_name: 'Sony PlayStation 4',
    model: 'CUH-1000/1100/1200',
    year: 2013, // Available in UK from 2015+
    slug: 'sony-playstation-4',
    common_issues: ['Overheating', 'HDD failure', 'HDMI port issues', 'Blue light of death', 'Disc drive problems'],
    average_repair_cost: calculateRepairPrice(120, 2015, 'Sony'),
    is_active: true
  },
  
  // Xbox Consoles
  {
    id: 'microsoft-xbox-series-x',
    category_id: 'xbox',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Xbox Series X',
    model: 'RDN-00001',
    year: 2020,
    slug: 'microsoft-xbox-series-x',
    specifications: {
      processor: 'AMD Zen 2 8-core CPU',
      graphics: 'AMD RDNA 2 GPU',
      memory: '16GB GDDR6',
      storage: '1TB SSD'
    },
    common_issues: ['Overheating', 'Fan noise', 'SSD issues', 'Controller drift', 'Disc drive problems'],
    average_repair_cost: calculateRepairPrice(200, 2020, 'Microsoft'),
    is_active: true
  },
  {
    id: 'microsoft-xbox-series-s',
    category_id: 'xbox',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Xbox Series S',
    model: 'RRS-00001',
    year: 2020,
    slug: 'microsoft-xbox-series-s',
    common_issues: ['Overheating', 'Storage limitations', 'Controller drift', 'Fan noise'],
    average_repair_cost: calculateRepairPrice(150, 2020, 'Microsoft'),
    is_active: true
  },
  {
    id: 'microsoft-xbox-one-x',
    category_id: 'xbox',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Xbox One X',
    model: '1787',
    year: 2017,
    slug: 'microsoft-xbox-one-x',
    common_issues: ['Overheating', 'HDD failure', 'Power supply issues', 'Controller drift'],
    average_repair_cost: calculateRepairPrice(160, 2017, 'Microsoft'),
    is_active: true
  },
  {
    id: 'microsoft-xbox-one-s',
    category_id: 'xbox',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Xbox One S',
    model: '1681',
    year: 2016,
    slug: 'microsoft-xbox-one-s',
    common_issues: ['HDD failure', 'Power supply issues', 'Controller drift', 'Disc drive problems'],
    average_repair_cost: calculateRepairPrice(130, 2016, 'Microsoft'),
    is_active: true
  },
  {
    id: 'microsoft-xbox-one',
    category_id: 'xbox',
    brand_name: 'Microsoft',
    display_name: 'Microsoft Xbox One',
    model: '1540',
    year: 2013, // Available in UK from 2015+
    slug: 'microsoft-xbox-one',
    common_issues: ['HDD failure', 'Power supply problems', 'Kinect issues', 'Disc drive failure'],
    average_repair_cost: calculateRepairPrice(120, 2015, 'Microsoft'),
    is_active: true
  },
  
  // Nintendo Consoles
  {
    id: 'nintendo-switch-oled',
    category_id: 'nintendo',
    brand_name: 'Nintendo',
    display_name: 'Nintendo Switch OLED',
    model: 'HEG-001',
    year: 2021,
    slug: 'nintendo-switch-oled',
    specifications: {
      screen: { size: '7"', resolution: '1280x720', type: 'OLED' },
      processor: 'NVIDIA Tegra X1',
      storage: '64GB',
      connectivity: 'Wi-Fi, Bluetooth'
    },
    common_issues: ['Joy-Con drift', 'Screen burn-in', 'Dock scratching screen', 'Charging port wear'],
    average_repair_cost: calculateRepairPrice(120, 2021, 'Nintendo'),
    is_active: true
  },
  {
    id: 'nintendo-switch',
    category_id: 'nintendo',
    brand_name: 'Nintendo',
    display_name: 'Nintendo Switch',
    model: 'HAC-001',
    year: 2017,
    slug: 'nintendo-switch',
    common_issues: ['Joy-Con drift', 'Dock scratching screen', 'Charging port wear', 'Kickstand problems'],
    average_repair_cost: calculateRepairPrice(100, 2017, 'Nintendo'),
    is_active: true
  },
  {
    id: 'nintendo-switch-lite',
    category_id: 'nintendo',
    brand_name: 'Nintendo',
    display_name: 'Nintendo Switch Lite',
    model: 'HDH-001',
    year: 2019,
    slug: 'nintendo-switch-lite',
    common_issues: ['Analog stick drift', 'Button sticking', 'Charging port issues', 'Screen cracks'],
    average_repair_cost: calculateRepairPrice(80, 2019, 'Nintendo'),
    is_active: true
  }
];

// Combine all device arrays
comprehensiveDeviceData.devices = [
  ...iphoneDevices,
  ...allAndroidDevices,
  ...laptopDevices,
  ...gamingConsoles
];

// Function to insert categories
async function insertCategories(client) {
  console.log('Inserting comprehensive device categories...');
  
  for (const category of comprehensiveDeviceData.categories) {
    await client.query(`
      INSERT INTO device_categories (slug, name, description, icon, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        updated_at = NOW()
    `, [category.id, category.name, category.description, category.icon, 0, true]);
  }
  
  console.log(`✓ Inserted ${comprehensiveDeviceData.categories.length} categories`);
}

// Function to insert brands
async function insertBrands(client) {
  console.log('Inserting comprehensive device brands...');
  
  for (const brand of comprehensiveDeviceData.brands) {
    await client.query(`
      INSERT INTO device_brands (slug, name, logo_url, website, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        website = EXCLUDED.website,
        updated_at = NOW()
    `, [brand.slug, brand.name, brand.logo_url, brand.website, true]);
  }
  
  console.log(`✓ Inserted ${comprehensiveDeviceData.brands.length} brands`);
}

// Function to insert devices
async function insertDevices(client) {
  console.log('Inserting comprehensive device catalog...');
  
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const device of comprehensiveDeviceData.devices) {
    try {
      // Get category ID
      const categoryResult = await client.query(
        'SELECT id FROM device_categories WHERE slug = $1',
        [device.category_id]
      );
      
      if (categoryResult.rows.length === 0) {
        console.warn(`Warning: Category '${device.category_id}' not found for device '${device.display_name}'`);
        skippedCount++;
        continue;
      }
      
      // Get brand ID
      const brandResult = await client.query(
        'SELECT id FROM device_brands WHERE name = $1',
        [device.brand_name]
      );
      
      if (brandResult.rows.length === 0) {
        console.warn(`Warning: Brand '${device.brand_name}' not found for device '${device.display_name}'`);
        skippedCount++;
        continue;
      }
      
      const categoryId = categoryResult.rows[0].id;
      const brandId = brandResult.rows[0].id;
      
      await client.query(`
        INSERT INTO devices (
          category_id, brand_id, slug, display_name, model, year,
          image_url, thumbnail_url, specifications, common_issues,
          repairability_score, popularity_score, average_repair_time,
          average_repair_cost, warranty_void_on_repair, special_tools_required,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (slug) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          model = EXCLUDED.model,
          year = EXCLUDED.year,
          image_url = EXCLUDED.image_url,
          thumbnail_url = EXCLUDED.thumbnail_url,
          specifications = EXCLUDED.specifications,
          common_issues = EXCLUDED.common_issues,
          repairability_score = EXCLUDED.repairability_score,
          popularity_score = EXCLUDED.popularity_score,
          average_repair_time = EXCLUDED.average_repair_time,
          average_repair_cost = EXCLUDED.average_repair_cost,
          warranty_void_on_repair = EXCLUDED.warranty_void_on_repair,
          special_tools_required = EXCLUDED.special_tools_required,
          updated_at = NOW()
      `, [
        categoryId,
        brandId,
        device.slug || device.id,
        device.display_name,
        device.model || '',
        device.year,
        device.image_url || `/images/devices/${device.slug || device.id}.jpg`,
        device.thumbnail_url || `/images/devices/thumbs/${device.slug || device.id}.jpg`,
        JSON.stringify(device.specifications || {}),
        JSON.stringify(device.common_issues || []),
        device.repairability_score || 5.0,
        device.popularity_score || 5.0,
        device.average_repair_time || 90,
        device.average_repair_cost,
        device.warranty_void_on_repair || false,
        JSON.stringify(device.special_tools_required || []),
        device.is_active !== false
      ]);
      
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting device '${device.display_name}':`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`✓ Inserted ${insertedCount} devices, skipped ${skippedCount}`);
}

// Enhanced pricing rules for UK market
async function insertPricingRules(client) {
  console.log('Inserting UK market pricing rules...');
  
  const pricingRules = [
    // Age-based pricing surcharges
    {
      name: 'Legacy Device Surcharge (2015-2017)',
      rule_type: 'surcharge',
      conditions: { device_year_range: [2015, 2017] },
      calculation_method: 'fixed',
      base_amount: 20.00,
      priority: 100,
      description: 'Additional cost for servicing older devices requiring specialized parts'
    },
    {
      name: 'Older Device Surcharge (2018-2020)', 
      rule_type: 'surcharge',
      conditions: { device_year_range: [2018, 2020] },
      calculation_method: 'fixed',
      base_amount: 15.00,
      priority: 100,
      description: 'Moderate surcharge for devices with limited part availability'
    },
    {
      name: 'Recent Device Surcharge (2021-2022)',
      rule_type: 'surcharge', 
      conditions: { device_year_range: [2021, 2022] },
      calculation_method: 'fixed',
      base_amount: 10.00,
      priority: 100,
      description: 'Minor surcharge for specialized tools and procedures'
    },
    
    // Brand premium multipliers
    {
      name: 'Apple Premium',
      rule_type: 'surcharge',
      conditions: { brand: 'Apple' },
      calculation_method: 'percentage',
      percentage: 25.00,
      priority: 200,
      description: '25% premium for Apple devices due to specialized parts and tools'
    },
    {
      name: 'Gaming Console Premium',
      rule_type: 'surcharge',
      conditions: { categories: ['playstation', 'xbox', 'nintendo'] },
      calculation_method: 'percentage',
      percentage: 30.00,
      priority: 200,
      description: '30% premium for gaming console repairs requiring specialized expertise'
    },
    {
      name: 'Gaming Laptop Premium',
      rule_type: 'surcharge',
      conditions: { category: 'gaming-laptop' },
      calculation_method: 'percentage',
      percentage: 30.00,
      priority: 200,
      description: '30% premium for gaming laptop complexity and thermal challenges'
    },
    {
      name: 'Samsung Premium',
      rule_type: 'surcharge',
      conditions: { brand: 'Samsung' },
      calculation_method: 'percentage',
      percentage: 15.00,
      priority: 200,
      description: '15% premium for Samsung devices'
    },
    {
      name: 'Business/Enterprise Premium',
      rule_type: 'surcharge',
      conditions: { brands: ['Dell', 'HP', 'Lenovo', 'Microsoft'] },
      calculation_method: 'percentage',
      percentage: 15.00,
      priority: 200,
      description: '15% premium for business-grade devices with enterprise features'
    },
    {
      name: 'Premium Gaming Brand Premium',
      rule_type: 'surcharge',
      conditions: { brands: ['MSI', 'Razer', 'Sony'] },
      calculation_method: 'percentage', 
      percentage: 30.00,
      priority: 200,
      description: '30% premium for high-end gaming and professional devices'
    },
    {
      name: 'Google Pixel Premium',
      rule_type: 'surcharge',
      conditions: { brand: 'Google' },
      calculation_method: 'percentage',
      percentage: 10.00,
      priority: 200,
      description: '10% premium for Google Pixel devices'
    },
    
    // Service-specific fees
    {
      name: 'Express Service Fee',
      rule_type: 'service_fee',
      conditions: { service_type: 'express' },
      calculation_method: 'percentage',
      percentage: 50.00,
      priority: 300,
      description: '50% surcharge for same-day or express repair services'
    },
    {
      name: 'Out-of-Warranty Service Fee',
      rule_type: 'service_fee',
      conditions: { warranty_status: 'expired' },
      calculation_method: 'fixed',
      base_amount: 25.00,
      priority: 300,
      description: 'Fixed fee for out-of-warranty device servicing'
    },
    {
      name: 'Data Recovery Service Fee',
      rule_type: 'service_fee',
      conditions: { service_category: 'data_recovery' },
      calculation_method: 'fixed',
      base_amount: 75.00,
      priority: 300,
      description: 'Specialized data recovery service fee'
    },
    
    // Seasonal adjustments
    {
      name: 'Peak Season Adjustment (Nov-Jan)',
      rule_type: 'surcharge',
      conditions: { months: [11, 12, 1] },
      calculation_method: 'percentage',
      percentage: 10.00,
      priority: 400,
      valid_from: '2024-11-01',
      valid_until: '2025-01-31',
      description: 'Holiday season demand adjustment'
    }
  ];
  
  for (const rule of pricingRules) {
    await client.query(`
      INSERT INTO repair_pricing_rules (
        name, rule_type, conditions, calculation_method, base_amount, 
        percentage, priority, is_active, valid_from, valid_until
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (name) DO UPDATE SET
        rule_type = EXCLUDED.rule_type,
        conditions = EXCLUDED.conditions,
        calculation_method = EXCLUDED.calculation_method,
        base_amount = EXCLUDED.base_amount,
        percentage = EXCLUDED.percentage,
        priority = EXCLUDED.priority,
        updated_at = NOW()
    `, [
      rule.name,
      rule.rule_type,
      JSON.stringify(rule.conditions),
      rule.calculation_method,
      rule.base_amount || 0,
      rule.percentage || 0,
      rule.priority,
      true,
      rule.valid_from || null,
      rule.valid_until || null
    ]);
  }
  
  console.log(`✓ Inserted ${pricingRules.length} pricing rules`);
}

// Main import function
async function importComprehensiveDeviceData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting comprehensive UK device database import...\n');
    console.log(`📊 Import Statistics:`);
    console.log(`   Categories: ${comprehensiveDeviceData.categories.length}`);
    console.log(`   Brands: ${comprehensiveDeviceData.brands.length}`);
    console.log(`   Total Devices: ${comprehensiveDeviceData.devices.length}`);
    console.log(`   - iPhones: ${iphoneDevices.length}`);
    console.log(`   - Samsung: ${samsungDevices.length}`);
    console.log(`   - Google Pixel: ${googlePixelDevices.length}`);
    console.log(`   - OnePlus: ${onePlusDevices.length}`);
    console.log(`   - Laptops/PCs: ${laptopDevices.length}`);
    console.log(`   - Gaming Consoles: ${gamingConsoles.length}\n`);
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Import data in sequence
    await insertCategories(client);
    await insertBrands(client);
    await insertDevices(client);
    await insertPricingRules(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Comprehensive device data import completed successfully!');
    
    // Show detailed summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM device_categories WHERE is_active = TRUE) as categories,
        (SELECT COUNT(*) FROM device_brands WHERE is_active = TRUE) as brands,
        (SELECT COUNT(*) FROM devices WHERE is_active = TRUE) as devices,
        (SELECT COUNT(*) FROM device_issues WHERE is_active = TRUE) as issues,
        (SELECT COUNT(*) FROM repair_pricing_rules WHERE is_active = TRUE) as pricing_rules
    `);
    
    const devicesByBrand = await client.query(`
      SELECT b.name as brand, COUNT(d.id) as device_count
      FROM device_brands b
      LEFT JOIN devices d ON b.id = d.brand_id AND d.is_active = TRUE
      WHERE b.is_active = TRUE
      GROUP BY b.name
      ORDER BY device_count DESC
    `);
    
    const devicesByCategory = await client.query(`
      SELECT c.name as category, COUNT(d.id) as device_count
      FROM device_categories c
      LEFT JOIN devices d ON c.id = d.category_id AND d.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.name
      ORDER BY device_count DESC
    `);
    
    const yearRange = await client.query(`
      SELECT MIN(year) as oldest_year, MAX(year) as newest_year
      FROM devices WHERE is_active = TRUE
    `);
    
    const stats = summary.rows[0];
    console.log('\n📊 Final Database Summary:');
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Brands: ${stats.brands}`);
    console.log(`   Total Devices: ${stats.devices}`);
    console.log(`   Device Issues: ${stats.issues}`);
    console.log(`   Pricing Rules: ${stats.pricing_rules}`);
    
    if (yearRange.rows[0].oldest_year) {
      console.log(`   Year Coverage: ${yearRange.rows[0].oldest_year} - ${yearRange.rows[0].newest_year}`);
    }
    
    console.log('\n📱 Devices by Brand:');
    devicesByBrand.rows.forEach(row => {
      console.log(`   ${row.brand}: ${row.device_count} devices`);
    });
    
    console.log('\n📋 Devices by Category:');
    devicesByCategory.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.device_count} devices`);
    });
    
    console.log('\n✅ UK Market Device Database Ready!');
    console.log('   • Complete 2015-2025 device coverage');
    console.log('   • Age-based pricing implemented');
    console.log('   • Brand premiums configured');
    console.log('   • Seasonal adjustments active');
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
  importComprehensiveDeviceData()
    .then(() => {
      console.log('\n🎯 Ready for next steps:');
      console.log('   1. Test API endpoints: curl "http://localhost:3011/api/devices/search?limit=10"');
      console.log('   2. Verify pricing: curl "http://localhost:3011/api/pricing/calculate"');
      console.log('   3. Check categories: curl "http://localhost:3011/api/devices/categories"');
      console.log('   4. Launch frontend: http://localhost:3010/book-repair');
      console.log('\n✅ Comprehensive UK device database import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Comprehensive device import failed:', error);
      process.exit(1);
    });
}

module.exports = { importComprehensiveDeviceData };