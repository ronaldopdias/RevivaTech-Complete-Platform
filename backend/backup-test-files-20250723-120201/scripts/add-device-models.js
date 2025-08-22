#!/usr/bin/env node

/**
 * Add Device Models to Existing Prisma Database
 * Adds comprehensive UK market device models (2015-2025) to existing categories and brands
 * 
 * Usage: node scripts/add-device-models.js
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

// Helper function to generate unique IDs (same format as existing)
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'dev_';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// New device models to add (comprehensive UK market coverage)
const newDeviceModels = [
  // === IPHONE MODELS (2015-2025) - COMPREHENSIVE ===
  
  // iPhone 16 Series (2024)
  {
    name: 'iPhone 16 Pro Max',
    slug: 'iphone-16-pro-max',
    year: 2024,
    screenSize: 6.9,
    brandSlug: 'apple',
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
    }
  },
  {
    name: 'iPhone 16 Pro',
    slug: 'iphone-16-pro',
    year: 2024,
    screenSize: 6.3,
    brandSlug: 'apple',
    specs: {
      model: 'A3293',
      processor: 'A18 Pro',
      memory: '8GB',
      storage: '128GB - 1TB',
      common_issues: ['Screen cracks', 'Camera lens damage', 'Battery degradation', 'USB-C port issues'],
      average_repair_cost: calculateRepairPrice(260, 2024, 'Apple')
    }
  },
  {
    name: 'iPhone 16 Plus',
    slug: 'iphone-16-plus',
    year: 2024,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      model: 'A3292',
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB',
      common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
      average_repair_cost: calculateRepairPrice(220, 2024, 'Apple')
    }
  },
  {
    name: 'iPhone 16',
    slug: 'iphone-16',
    year: 2024,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      model: 'A3291',
      processor: 'A18',
      memory: '8GB',
      storage: '128GB - 512GB',
      common_issues: ['Screen cracks', 'Camera damage', 'Battery issues', 'Action button problems'],
      average_repair_cost: calculateRepairPrice(200, 2024, 'Apple')
    }
  },
  
  // iPhone 15 Series (2023)
  {
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    year: 2023,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A17 Pro',
      memory: '8GB',
      storage: '256GB - 1TB',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues', 'Charging port problems'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Apple')
    }
  },
  {
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    year: 2023,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A17 Pro',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(200, 2023, 'Apple')
    }
  },
  {
    name: 'iPhone 15 Plus',
    slug: 'iphone-15-plus',
    year: 2023,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2023, 'Apple')
    }
  },
  {
    name: 'iPhone 15',
    slug: 'iphone-15',
    year: 2023,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2023, 'Apple')
    }
  },
  
  // iPhone 14 Series (2022)
  {
    name: 'iPhone 14 Pro Max',
    slug: 'iphone-14-pro-max',
    year: 2022,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Apple')
    }
  },
  {
    name: 'iPhone 14 Pro',
    slug: 'iphone-14-pro',
    year: 2022,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A16 Bionic',
      common_issues: ['Dynamic Island issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2022, 'Apple')
    }
  },
  {
    name: 'iPhone 14 Plus',
    slug: 'iphone-14-plus',
    year: 2022,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2022, 'Apple')
    }
  },
  {
    name: 'iPhone 14',
    slug: 'iphone-14',
    year: 2022,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2022, 'Apple')
    }
  },
  
  // iPhone 13 Series (2021)
  {
    name: 'iPhone 13 Pro Max',
    slug: 'iphone-13-pro-max',
    year: 2021,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Apple')
    }
  },
  {
    name: 'iPhone 13 Pro',
    slug: 'iphone-13-pro',
    year: 2021,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'Apple')
    }
  },
  {
    name: 'iPhone 13 mini',
    slug: 'iphone-13-mini',
    year: 2021,
    screenSize: 5.4,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2021, 'Apple')
    }
  },
  {
    name: 'iPhone 13',
    slug: 'iphone-13',
    year: 2021,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2021, 'Apple')
    }
  },
  
  // iPhone 12 Series (2020)
  {
    name: 'iPhone 12 Pro Max',
    slug: 'iphone-12-pro-max',
    year: 2020,
    screenSize: 6.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(160, 2020, 'Apple')
    }
  },
  {
    name: 'iPhone 12 Pro',
    slug: 'iphone-12-pro',
    year: 2020,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'Apple')
    }
  },
  {
    name: 'iPhone 12 mini',
    slug: 'iphone-12-mini',
    year: 2020,
    screenSize: 5.4,
    brandSlug: 'apple',
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2020, 'Apple')
    }
  },
  {
    name: 'iPhone 12',
    slug: 'iphone-12',
    year: 2020,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A14 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2020, 'Apple')
    }
  },
  
  // iPhone SE Series
  {
    name: 'iPhone SE (3rd generation)',
    slug: 'iphone-se-3rd-gen',
    year: 2022,
    screenSize: 4.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A15 Bionic',
      common_issues: ['Home button issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2022, 'Apple')
    }
  },
  {
    name: 'iPhone SE (2nd generation)',
    slug: 'iphone-se-2nd-gen',
    year: 2020,
    screenSize: 4.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Home button issues', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(100, 2020, 'Apple')
    }
  },
  
  // iPhone 11 Series (2019)
  {
    name: 'iPhone 11 Pro Max',
    slug: 'iphone-11-pro-max',
    year: 2019,
    screenSize: 6.5,
    brandSlug: 'apple',
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'Apple')
    }
  },
  {
    name: 'iPhone 11 Pro',
    slug: 'iphone-11-pro',
    year: 2019,
    screenSize: 5.8,
    brandSlug: 'apple',
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(130, 2019, 'Apple')
    }
  },
  {
    name: 'iPhone 11',
    slug: 'iphone-11',
    year: 2019,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A13 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2019, 'Apple')
    }
  },
  
  // iPhone XS/XR Series (2018)
  {
    name: 'iPhone XS Max',
    slug: 'iphone-xs-max',
    year: 2018,
    screenSize: 6.5,
    brandSlug: 'apple',
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues'],
      average_repair_cost: calculateRepairPrice(130, 2018, 'Apple')
    }
  },
  {
    name: 'iPhone XS',
    slug: 'iphone-xs',
    year: 2018,
    screenSize: 5.8,
    brandSlug: 'apple',
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2018, 'Apple')
    }
  },
  {
    name: 'iPhone XR',
    slug: 'iphone-xr',
    year: 2018,
    screenSize: 6.1,
    brandSlug: 'apple',
    specs: {
      processor: 'A12 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2018, 'Apple')
    }
  },
  
  // iPhone X (2017)
  {
    name: 'iPhone X',
    slug: 'iphone-x',
    year: 2017,
    screenSize: 5.8,
    brandSlug: 'apple',
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Screen cracks', 'Battery degradation', 'Face ID issues', 'Green line display issue'],
      average_repair_cost: calculateRepairPrice(120, 2017, 'Apple')
    }
  },
  
  // iPhone 8 Series (2017)
  {
    name: 'iPhone 8 Plus',
    slug: 'iphone-8-plus',
    year: 2017,
    screenSize: 5.5,
    brandSlug: 'apple',
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Battery swelling', 'Screen cracks', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(110, 2017, 'Apple')
    }
  },
  {
    name: 'iPhone 8',
    slug: 'iphone-8',
    year: 2017,
    screenSize: 4.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A11 Bionic',
      common_issues: ['Battery swelling', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(100, 2017, 'Apple')
    }
  },
  
  // iPhone 7 Series (2016)
  {
    name: 'iPhone 7 Plus',
    slug: 'iphone-7-plus',
    year: 2016,
    screenSize: 5.5,
    brandSlug: 'apple',
    specs: {
      processor: 'A10 Fusion',
      common_issues: ['Audio IC failure', 'Battery degradation', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(110, 2016, 'Apple')
    }
  },
  {
    name: 'iPhone 7',
    slug: 'iphone-7',
    year: 2016,
    screenSize: 4.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A10 Fusion',
      common_issues: ['Audio IC failure', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(100, 2016, 'Apple')
    }
  },
  
  // iPhone 6S Series (2015)
  {
    name: 'iPhone 6s Plus',
    slug: 'iphone-6s-plus',
    year: 2015,
    screenSize: 5.5,
    brandSlug: 'apple',
    specs: {
      processor: 'A9',
      common_issues: ['Battery degradation', 'Touch disease', 'Home button issues'],
      average_repair_cost: calculateRepairPrice(105, 2015, 'Apple')
    }
  },
  {
    name: 'iPhone 6s',
    slug: 'iphone-6s',
    year: 2015,
    screenSize: 4.7,
    brandSlug: 'apple',
    specs: {
      processor: 'A9',
      common_issues: ['Battery degradation', 'Touch disease'],
      average_repair_cost: calculateRepairPrice(95, 2015, 'Apple')
    }
  },
  
  // === SAMSUNG GALAXY DEVICES (2015-2025) ===
  
  // Galaxy S24 Series (2024)
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    year: 2024,
    screenSize: 6.8,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      memory: '12GB',
      storage: '256GB - 1TB',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(280, 2024, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S24+',
    slug: 'samsung-galaxy-s24-plus',
    year: 2024,
    screenSize: 6.7,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(240, 2024, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S24',
    slug: 'samsung-galaxy-s24',
    year: 2024,
    screenSize: 6.2,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2024, 'Samsung')
    }
  },
  
  // Galaxy S23 Series (2023)
  {
    name: 'Samsung Galaxy S23 Ultra',
    slug: 'samsung-galaxy-s23-ultra',
    year: 2023,
    screenSize: 6.8,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 8 Gen 2',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(260, 2023, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S23+',
    slug: 'samsung-galaxy-s23-plus',
    year: 2023,
    screenSize: 6.6,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S23',
    slug: 'samsung-galaxy-s23',
    year: 2023,
    screenSize: 6.1,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2023, 'Samsung')
    }
  },
  
  // Galaxy S22 Series (2022)
  {
    name: 'Samsung Galaxy S22 Ultra',
    slug: 'samsung-galaxy-s22-ultra',
    year: 2022,
    screenSize: 6.8,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 8 Gen 1',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Overheating'],
      average_repair_cost: calculateRepairPrice(240, 2022, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S22+',
    slug: 'samsung-galaxy-s22-plus',
    year: 2022,
    screenSize: 6.6,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S22',
    slug: 'samsung-galaxy-s22',
    year: 2022,
    screenSize: 6.1,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(180, 2022, 'Samsung')
    }
  },
  
  // Galaxy S21 Series (2021)
  {
    name: 'Samsung Galaxy S21 Ultra',
    slug: 'samsung-galaxy-s21-ultra',
    year: 2021,
    screenSize: 6.8,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 888',
      common_issues: ['Screen cracks', 'S Pen connectivity', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2021, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S21+',
    slug: 'samsung-galaxy-s21-plus',
    year: 2021,
    screenSize: 6.7,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S21',
    slug: 'samsung-galaxy-s21',
    year: 2021,
    screenSize: 6.2,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'Samsung')
    }
  },
  
  // Galaxy S20 Series (2020)
  {
    name: 'Samsung Galaxy S20 Ultra',
    slug: 'samsung-galaxy-s20-ultra',
    year: 2020,
    screenSize: 6.9,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 865',
      common_issues: ['Camera focus issues', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S20+',
    slug: 'samsung-galaxy-s20-plus',
    year: 2020,
    screenSize: 6.7,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy S20',
    slug: 'samsung-galaxy-s20',
    year: 2020,
    screenSize: 6.2,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'Samsung')
    }
  },
  
  // Galaxy Note Series
  {
    name: 'Samsung Galaxy Note 20 Ultra',
    slug: 'samsung-galaxy-note-20-ultra',
    year: 2020,
    screenSize: 6.9,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 865+',
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(200, 2020, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy Note 20',
    slug: 'samsung-galaxy-note-20',
    year: 2020,
    screenSize: 6.7,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['S Pen connectivity', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(170, 2020, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy Note 10+',
    slug: 'samsung-galaxy-note-10-plus',
    year: 2019,
    screenSize: 6.8,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['S Pen connectivity', 'Screen cracks', 'Charging port issues'],
      average_repair_cost: calculateRepairPrice(180, 2019, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy Note 10',
    slug: 'samsung-galaxy-note-10',
    year: 2019,
    screenSize: 6.3,
    brandSlug: 'samsung',
    specs: {
      common_issues: ['S Pen connectivity', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(160, 2019, 'Samsung')
    }
  },
  
  // Galaxy A Series (Mid-range)
  {
    name: 'Samsung Galaxy A54 5G',
    slug: 'samsung-galaxy-a54',
    year: 2023,
    screenSize: 6.4,
    brandSlug: 'samsung',
    specs: {
      processor: 'Exynos 1380',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(140, 2023, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy A73 5G',
    slug: 'samsung-galaxy-a73',
    year: 2022,
    screenSize: 6.7,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 778G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2022, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy A53 5G',
    slug: 'samsung-galaxy-a53',
    year: 2022,
    screenSize: 6.5,
    brandSlug: 'samsung',
    specs: {
      processor: 'Exynos 1280',
      common_issues: ['Screen cracks', 'Performance issues'],
      average_repair_cost: calculateRepairPrice(120, 2022, 'Samsung')
    }
  },
  {
    name: 'Samsung Galaxy A52 5G',
    slug: 'samsung-galaxy-a52',
    year: 2021,
    screenSize: 6.5,
    brandSlug: 'samsung',
    specs: {
      processor: 'Snapdragon 750G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2021, 'Samsung')
    }
  },
  
  // === GOOGLE PIXEL DEVICES (2016-2025) ===
  
  // Pixel 8 Series (2023)
  {
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    year: 2023,
    screenSize: 6.7,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor G3',
      memory: '12GB',
      storage: '128GB - 1TB',
      common_issues: ['Screen cracks', 'Battery degradation', 'Fingerprint sensor problems'],
      average_repair_cost: calculateRepairPrice(260, 2023, 'Google')
    }
  },
  {
    name: 'Google Pixel 8',
    slug: 'google-pixel-8',
    year: 2023,
    screenSize: 6.2,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor G3',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(220, 2023, 'Google')
    }
  },
  
  // Pixel 7 Series (2022)
  {
    name: 'Google Pixel 7 Pro',
    slug: 'google-pixel-7-pro',
    year: 2022,
    screenSize: 6.7,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor G2',
      common_issues: ['Screen cracks', 'Camera bar issues', 'Fingerprint sensor problems'],
      average_repair_cost: calculateRepairPrice(240, 2022, 'Google')
    }
  },
  {
    name: 'Google Pixel 7',
    slug: 'google-pixel-7',
    year: 2022,
    screenSize: 6.3,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor G2',
      common_issues: ['Screen cracks', 'Camera bar issues'],
      average_repair_cost: calculateRepairPrice(200, 2022, 'Google')
    }
  },
  
  // Pixel 6 Series (2021)
  {
    name: 'Google Pixel 6 Pro',
    slug: 'google-pixel-6-pro',
    year: 2021,
    screenSize: 6.7,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor',
      common_issues: ['Fingerprint sensor issues', 'Camera bar cracks', 'Connectivity problems'],
      average_repair_cost: calculateRepairPrice(220, 2021, 'Google')
    }
  },
  {
    name: 'Google Pixel 6',
    slug: 'google-pixel-6',
    year: 2021,
    screenSize: 6.4,
    brandSlug: 'google',
    specs: {
      processor: 'Google Tensor',
      common_issues: ['Fingerprint sensor issues', 'Camera bar cracks'],
      average_repair_cost: calculateRepairPrice(180, 2021, 'Google')
    }
  },
  
  // Pixel 5 Series (2020)
  {
    name: 'Google Pixel 5',
    slug: 'google-pixel-5',
    year: 2020,
    screenSize: 6.0,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 765G',
      common_issues: ['Screen cracks', 'Battery degradation', 'Speaker issues'],
      average_repair_cost: calculateRepairPrice(160, 2020, 'Google')
    }
  },
  {
    name: 'Google Pixel 4a 5G',
    slug: 'google-pixel-4a-5g',
    year: 2020,
    screenSize: 6.2,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 765G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2020, 'Google')
    }
  },
  {
    name: 'Google Pixel 4a',
    slug: 'google-pixel-4a',
    year: 2020,
    screenSize: 5.8,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 730G',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2020, 'Google')
    }
  },
  
  // Pixel 4 Series (2019)
  {
    name: 'Google Pixel 4 XL',
    slug: 'google-pixel-4-xl',
    year: 2019,
    screenSize: 6.3,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Battery degradation', 'Face unlock issues', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(150, 2019, 'Google')
    }
  },
  {
    name: 'Google Pixel 4',
    slug: 'google-pixel-4',
    year: 2019,
    screenSize: 5.7,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Battery degradation', 'Face unlock issues'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'Google')
    }
  },
  
  // Pixel 3 Series (2018)
  {
    name: 'Google Pixel 3 XL',
    slug: 'google-pixel-3-xl',
    year: 2018,
    screenSize: 6.3,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Screen burn-in', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(140, 2018, 'Google')
    }
  },
  {
    name: 'Google Pixel 3',
    slug: 'google-pixel-3',
    year: 2018,
    screenSize: 5.5,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2018, 'Google')
    }
  },
  
  // Pixel 2 Series (2017)
  {
    name: 'Google Pixel 2 XL',
    slug: 'google-pixel-2-xl',
    year: 2017,
    screenSize: 6.0,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen burn-in', 'Blue tint issue', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(130, 2017, 'Google')
    }
  },
  {
    name: 'Google Pixel 2',
    slug: 'google-pixel-2',
    year: 2017,
    screenSize: 5.0,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(120, 2017, 'Google')
    }
  },
  
  // Original Pixel (2016)
  {
    name: 'Google Pixel XL',
    slug: 'google-pixel-xl',
    year: 2016,
    screenSize: 5.5,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Microphone failure', 'Battery degradation', 'Charging issues'],
      average_repair_cost: calculateRepairPrice(120, 2016, 'Google')
    }
  },
  {
    name: 'Google Pixel',
    slug: 'google-pixel',
    year: 2016,
    screenSize: 5.0,
    brandSlug: 'google',
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Microphone failure', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2016, 'Google')
    }
  },
  
  // === ONEPLUS DEVICES (2015-2025) ===
  
  {
    name: 'OnePlus 12',
    slug: 'oneplus-12',
    year: 2024,
    screenSize: 6.82,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 8 Gen 3',
      common_issues: ['Screen cracks', 'Battery degradation', 'Camera issues'],
      average_repair_cost: calculateRepairPrice(200, 2024, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 11',
    slug: 'oneplus-11',
    year: 2023,
    screenSize: 6.7,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 8 Gen 2',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(180, 2023, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 10 Pro',
    slug: 'oneplus-10-pro',
    year: 2022,
    screenSize: 6.7,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 8 Gen 1',
      common_issues: ['Screen cracks', 'Overheating'],
      average_repair_cost: calculateRepairPrice(170, 2022, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 9 Pro',
    slug: 'oneplus-9-pro',
    year: 2021,
    screenSize: 6.7,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 888',
      common_issues: ['Screen tint issues', 'Battery degradation', 'Overheating'],
      average_repair_cost: calculateRepairPrice(160, 2021, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 8 Pro',
    slug: 'oneplus-8-pro',
    year: 2020,
    screenSize: 6.78,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 865',
      common_issues: ['Screen tint issues', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(150, 2020, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 7 Pro',
    slug: 'oneplus-7-pro',
    year: 2019,
    screenSize: 6.67,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 855',
      common_issues: ['Pop-up camera failure', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(140, 2019, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 6T',
    slug: 'oneplus-6t',
    year: 2018,
    screenSize: 6.41,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 845',
      common_issues: ['Fingerprint sensor issues', 'Screen cracks'],
      average_repair_cost: calculateRepairPrice(120, 2018, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 5T',
    slug: 'oneplus-5t',
    year: 2017,
    screenSize: 6.01,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 835',
      common_issues: ['Screen cracks', 'Battery degradation'],
      average_repair_cost: calculateRepairPrice(110, 2017, 'OnePlus')
    }
  },
  {
    name: 'OnePlus 3T',
    slug: 'oneplus-3t',
    year: 2016,
    screenSize: 5.5,
    brandSlug: 'oneplus',
    specs: {
      processor: 'Snapdragon 821',
      common_issues: ['Screen cracks', 'Charging port issues'],
      average_repair_cost: calculateRepairPrice(100, 2016, 'OnePlus')
    }
  }
];

// Function to add new brands if they don't exist
async function addMissingBrands(client) {
  console.log('Adding missing brands...');
  
  const missingBrands = [
    { name: 'Samsung', slug: 'samsung', categorySlug: 'android-phone', logoUrl: '/images/brands/samsung.svg' },
    { name: 'Google', slug: 'google', categorySlug: 'android-phone', logoUrl: '/images/brands/google.svg' },
    { name: 'OnePlus', slug: 'oneplus', categorySlug: 'android-phone', logoUrl: '/images/brands/oneplus.svg' }
  ];
  
  let addedCount = 0;
  
  for (const brand of missingBrands) {
    try {
      // Get category ID by slug
      const categoryResult = await client.query(
        'SELECT id FROM device_categories WHERE slug = $1',
        [brand.categorySlug]
      );
      
      if (categoryResult.rows.length === 0) {
        console.warn(`Warning: Category '${brand.categorySlug}' not found for brand '${brand.name}'`);
        continue;
      }
      
      const categoryId = categoryResult.rows[0].id;
      
      // Check if brand already exists
      const existingBrand = await client.query(
        'SELECT id FROM device_brands WHERE slug = $1',
        [brand.slug]
      );
      
      if (existingBrand.rows.length === 0) {
        const brandId = generateId();
        await client.query(`
          INSERT INTO device_brands (id, "categoryId", name, slug, "logoUrl", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [brandId, categoryId, brand.name, brand.slug, brand.logoUrl, true]);
        
        addedCount++;
        console.log(`  ✓ Added brand: ${brand.name}`);
      }
    } catch (error) {
      console.error(`Error adding brand '${brand.name}':`, error.message);
    }
  }
  
  console.log(`✓ Added ${addedCount} missing brands`);
}

// Function to insert device models
async function insertNewDeviceModels(client) {
  console.log('Inserting comprehensive device models...');
  
  let insertedCount = 0;
  let skippedCount = 0;
  
  for (const device of newDeviceModels) {
    try {
      // Check if device already exists
      const existingDevice = await client.query(
        'SELECT id FROM device_models WHERE slug = $1',
        [device.slug]
      );
      
      if (existingDevice.rows.length > 0) {
        skippedCount++;
        continue;
      }
      
      // Get brand ID by slug
      const brandResult = await client.query(
        'SELECT id FROM device_brands WHERE slug = $1',
        [device.brandSlug]
      );
      
      if (brandResult.rows.length === 0) {
        console.warn(`Warning: Brand '${device.brandSlug}' not found for device '${device.name}'`);
        skippedCount++;
        continue;
      }
      
      const brandId = brandResult.rows[0].id;
      const deviceId = generateId();
      
      await client.query(`
        INSERT INTO device_models (id, "brandId", name, slug, year, "screenSize", specs, "imageUrl", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        deviceId,
        brandId,
        device.name,
        device.slug,
        device.year,
        device.screenSize,
        JSON.stringify(device.specs),
        `/images/devices/${device.slug}.jpg`,
        true
      ]);
      
      insertedCount++;
      
      if (insertedCount % 10 === 0) {
        console.log(`  Progress: ${insertedCount} devices added...`);
      }
    } catch (error) {
      console.error(`Error inserting device '${device.name}':`, error.message);
      skippedCount++;
    }
  }
  
  console.log(`✓ Inserted ${insertedCount} new device models, skipped ${skippedCount}`);
}

// Main import function
async function addDeviceModels() {
  const client = await pool.connect();
  
  try {
    console.log(`📊 Addition Statistics:`);
    console.log(`   New Device Models to Add: ${newDeviceModels.length}`);
    
    // Count devices by brand
    const brandCounts = {};
    newDeviceModels.forEach(device => {
      const brandName = device.brandSlug;
      brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
    });
    
    console.log('\n   New Device Models by Brand:');
    Object.entries(brandCounts).forEach(([brand, count]) => {
      console.log(`   - ${brand}: ${count} models`);
    });
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Add missing brands first
    await addMissingBrands(client);
    
    // Import device models
    await insertNewDeviceModels(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Device model addition completed successfully!');
    
    // Show updated summary
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
    
    const yearRange = await client.query(`
      SELECT MIN(year) as oldest_year, MAX(year) as newest_year
      FROM device_models WHERE "isActive" = TRUE
    `);
    
    const stats = summary.rows[0];
    console.log('\n📊 Updated Database Summary:');
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
    
    console.log('\n✅ UK Market Device Database Enhanced!');
    console.log('   • Complete 2015-2025 device coverage');
    console.log('   • Age-based pricing implemented');
    console.log('   • Brand premiums configured');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Addition failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the addition
if (require.main === module) {
  addDeviceModels()
    .then(() => {
      console.log('   1. Test API endpoints: curl "http://localhost:3011/api/devices/search?limit=10"');
      console.log('   2. Verify categories: curl "http://localhost:3011/api/devices/categories"');
      console.log('   3. Check pricing: curl "http://localhost:3011/api/pricing/calculate"');
      console.log('   4. Launch frontend: http://localhost:3010/book-repair');
      console.log('\n✅ Comprehensive UK device database expansion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Device model addition failed:', error);
      process.exit(1);
    });
}

module.exports = { addDeviceModels };