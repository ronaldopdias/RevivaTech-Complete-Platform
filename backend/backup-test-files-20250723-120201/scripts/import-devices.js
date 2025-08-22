#!/usr/bin/env node

/**
 * Device Configuration Import Script
 * Imports device data from frontend TypeScript configs to PostgreSQL database
 * 
 * Usage: node scripts/import-devices.js
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

// Device configuration data (imported from frontend configs)
const deviceData = {
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
  
  devices: [
    // Sample devices - this would be populated from the full TypeScript configs
    {
      id: 'macbook-pro-14-m4-2024',
      category_id: 'macbook',
      brand_name: 'Apple',
      display_name: 'MacBook Pro 14" M4',
      model: 'A2918',
      year: 2024,
      slug: 'macbook-pro-14-m4-2024',
      image_url: '/images/devices/macbook-pro-14-m4-2024.jpg',
      thumbnail_url: '/images/devices/thumbs/macbook-pro-14-m4-2024.jpg',
      specifications: {
        screen: { size: '14.2"', resolution: '3024x1964', type: 'Liquid Retina XDR' },
        processor: 'Apple M4, M4 Pro, or M4 Max (up to 14-core CPU, 32-core GPU)',
        memory: '16GB - 128GB unified memory',
        storage: '512GB - 8TB SSD',
        ports: ['3x Thunderbolt 5/4', 'HDMI', 'SDXC', 'MagSafe 3', '3.5mm headphone'],
        dimensions: { width: 312.6, height: 221.2, depth: 15.5, weight: 1.55 }
      },
      common_issues: ['Screen flickering', 'Thermal management', 'Port connectivity', 'Battery optimization'],
      repairability_score: 8.5,
      popularity_score: 9.2,
      average_repair_time: 120,
      average_repair_cost: 450.00,
      warranty_void_on_repair: false,
      special_tools_required: ['Pentalobe screwdriver', 'Spudger', 'iFixit opening tools'],
      is_active: true
    },
    {
      id: 'iphone-16-pro-max',
      category_id: 'iphone',
      brand_name: 'Apple',
      display_name: 'iPhone 16 Pro Max',
      model: 'A3294',
      year: 2024,
      slug: 'iphone-16-pro-max',
      image_url: '/images/devices/iphone-16-pro-max.jpg',
      thumbnail_url: '/images/devices/thumbs/iphone-16-pro-max.jpg',
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
      average_repair_cost: 280.00,
      warranty_void_on_repair: true,
      special_tools_required: ['Pentalobe screwdriver', 'Tri-point screwdriver', 'Suction handle', 'Heat gun'],
      is_active: true
    },
    {
      id: 'dell-xps-13-plus-2023',
      category_id: 'ultrabook',
      brand_name: 'Dell',
      display_name: 'XPS 13 Plus',
      model: '9320',
      year: 2023,
      slug: 'dell-xps-13-plus-2023',
      image_url: '/images/devices/dell-xps-13-plus-2023.jpg',
      thumbnail_url: '/images/devices/thumbs/dell-xps-13-plus-2023.jpg',
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
      average_repair_cost: 320.00,
      warranty_void_on_repair: false,
      special_tools_required: ['Phillips screwdriver', 'Spudger', 'Anti-static wrist strap'],
      is_active: true
    }
  ]
};

// SQL Queries for creating device tables
const createTablesSQL = `
-- Device Categories table
CREATE TABLE IF NOT EXISTS device_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Brands table
CREATE TABLE IF NOT EXISTS device_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url VARCHAR(255),
  website VARCHAR(255),
  support_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES device_categories(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES device_brands(id) ON DELETE CASCADE,
  slug VARCHAR(200) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  model VARCHAR(100),
  year INTEGER NOT NULL CHECK (year >= 2016 AND year <= 2030),
  image_url VARCHAR(255),
  thumbnail_url VARCHAR(255),
  specifications JSONB DEFAULT '{}',
  common_issues JSONB DEFAULT '[]',
  repairability_score DECIMAL(3,1) DEFAULT 5.0 CHECK (repairability_score >= 0 AND repairability_score <= 10),
  popularity_score DECIMAL(3,1) DEFAULT 5.0 CHECK (popularity_score >= 0 AND popularity_score <= 10),
  average_repair_time INTEGER DEFAULT 60, -- minutes
  average_repair_cost DECIMAL(10,2) DEFAULT 0.00,
  warranty_void_on_repair BOOLEAN DEFAULT TRUE,
  special_tools_required JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Issues table
CREATE TABLE IF NOT EXISTS device_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  symptoms JSONB DEFAULT '[]',
  difficulty_level VARCHAR(20) DEFAULT 'medium',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Issue Mappings table (links devices to their common issues)
CREATE TABLE IF NOT EXISTS device_issue_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES device_issues(id) ON DELETE CASCADE,
  frequency VARCHAR(20) DEFAULT 'common', -- very_common, common, uncommon, rare
  typical_age_months INTEGER,
  estimated_cost_min DECIMAL(10,2) DEFAULT 0.00,
  estimated_cost_max DECIMAL(10,2) DEFAULT 0.00,
  repair_time_minutes INTEGER DEFAULT 60,
  success_rate DECIMAL(5,2) DEFAULT 95.0,
  customer_satisfaction DECIMAL(3,1) DEFAULT 4.5,
  parts_required JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_id, issue_id)
);

-- Repair Parts table
CREATE TABLE IF NOT EXISTS repair_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  part_number VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  quality_grade VARCHAR(20) DEFAULT 'OEM', -- OEM, Compatible, Refurbished
  warranty_months INTEGER DEFAULT 12,
  unit_cost DECIMAL(10,2) NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  is_stocked BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device Part Compatibility table
CREATE TABLE IF NOT EXISTS device_part_compatibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  part_id UUID REFERENCES repair_parts(id) ON DELETE CASCADE,
  compatibility_notes TEXT,
  installation_difficulty VARCHAR(20) DEFAULT 'medium',
  installation_time_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_id, part_id)
);

-- Repair Pricing Rules table
CREATE TABLE IF NOT EXISTS repair_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- discount, surcharge, service_fee
  conditions JSONB NOT NULL DEFAULT '{}',
  calculation_method VARCHAR(20) NOT NULL DEFAULT 'percentage', -- fixed, percentage
  base_amount DECIMAL(10,2) DEFAULT 0.00,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_categories_slug ON device_categories(slug);
CREATE INDEX IF NOT EXISTS idx_device_categories_active ON device_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_device_brands_slug ON device_brands(slug);
CREATE INDEX IF NOT EXISTS idx_device_brands_active ON device_brands(is_active);

CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category_id);
CREATE INDEX IF NOT EXISTS idx_devices_brand ON devices(brand_id);
CREATE INDEX IF NOT EXISTS idx_devices_slug ON devices(slug);
CREATE INDEX IF NOT EXISTS idx_devices_year ON devices(year);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_popularity ON devices(popularity_score);

CREATE INDEX IF NOT EXISTS idx_device_issues_slug ON device_issues(slug);
CREATE INDEX IF NOT EXISTS idx_device_issues_category ON device_issues(category);

CREATE INDEX IF NOT EXISTS idx_device_issue_mappings_device ON device_issue_mappings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_issue_mappings_issue ON device_issue_mappings(issue_id);

CREATE INDEX IF NOT EXISTS idx_repair_parts_category ON repair_parts(category);
CREATE INDEX IF NOT EXISTS idx_repair_parts_active ON repair_parts(is_active);

-- Triggers for automatic timestamp updates (PostgreSQL doesn't support IF NOT EXISTS for triggers)
DROP TRIGGER IF EXISTS update_device_categories_updated_at ON device_categories;
CREATE TRIGGER update_device_categories_updated_at 
    BEFORE UPDATE ON device_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_device_brands_updated_at ON device_brands;
CREATE TRIGGER update_device_brands_updated_at 
    BEFORE UPDATE ON device_brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_device_issues_updated_at ON device_issues;
CREATE TRIGGER update_device_issues_updated_at 
    BEFORE UPDATE ON device_issues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_repair_pricing_rules_updated_at ON repair_pricing_rules;
CREATE TRIGGER update_repair_pricing_rules_updated_at 
    BEFORE UPDATE ON repair_pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// Function to insert categories
async function insertCategories(client) {
  console.log('Inserting device categories...');
  
  for (const category of deviceData.categories) {
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
  
  console.log(`✓ Inserted ${deviceData.categories.length} categories`);
}

// Function to insert brands
async function insertBrands(client) {
  console.log('Inserting device brands...');
  
  for (const brand of deviceData.brands) {
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
  
  console.log(`✓ Inserted ${deviceData.brands.length} brands`);
}

// Function to insert devices
async function insertDevices(client) {
  console.log('Inserting devices...');
  
  for (const device of deviceData.devices) {
    // Get category ID
    const categoryResult = await client.query(
      'SELECT id FROM device_categories WHERE slug = $1',
      [device.category_id]
    );
    
    if (categoryResult.rows.length === 0) {
      console.warn(`Warning: Category '${device.category_id}' not found for device '${device.display_name}'`);
      continue;
    }
    
    // Get brand ID
    const brandResult = await client.query(
      'SELECT id FROM device_brands WHERE name = $1',
      [device.brand_name]
    );
    
    if (brandResult.rows.length === 0) {
      console.warn(`Warning: Brand '${device.brand_name}' not found for device '${device.display_name}'`);
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
      device.slug,
      device.display_name,
      device.model,
      device.year,
      device.image_url,
      device.thumbnail_url,
      JSON.stringify(device.specifications),
      JSON.stringify(device.common_issues),
      device.repairability_score,
      device.popularity_score,
      device.average_repair_time,
      device.average_repair_cost,
      device.warranty_void_on_repair,
      JSON.stringify(device.special_tools_required),
      device.is_active
    ]);
  }
  
  console.log(`✓ Inserted ${deviceData.devices.length} devices`);
}

// Function to insert common issues
async function insertCommonIssues(client) {
  console.log('Inserting common device issues...');
  
  const commonIssues = [
    { slug: 'screen-crack', name: 'Screen Crack', description: 'Cracked or damaged display', category: 'display', difficulty: 'medium' },
    { slug: 'battery-drain', name: 'Battery Drain', description: 'Poor battery life or charging issues', category: 'power', difficulty: 'easy' },
    { slug: 'keyboard-issues', name: 'Keyboard Problems', description: 'Sticky keys, unresponsive keys, or keyboard failure', category: 'input', difficulty: 'medium' },
    { slug: 'overheating', name: 'Overheating', description: 'Device runs hot, thermal throttling, or fan issues', category: 'thermal', difficulty: 'medium' },
    { slug: 'port-connectivity', name: 'Port Connectivity', description: 'USB, charging, or other port connection problems', category: 'connectivity', difficulty: 'medium' },
    { slug: 'screen-flickering', name: 'Screen Flickering', description: 'Display flickering, backlight issues, or color problems', category: 'display', difficulty: 'hard' },
    { slug: 'camera-issues', name: 'Camera Problems', description: 'Camera not working, blurry images, or lens damage', category: 'camera', difficulty: 'medium' },
    { slug: 'speaker-problems', name: 'Speaker Issues', description: 'No sound, distorted audio, or speaker damage', category: 'audio', difficulty: 'easy' },
    { slug: 'wifi-connectivity', name: 'WiFi Connectivity', description: 'Cannot connect to WiFi or poor signal strength', category: 'connectivity', difficulty: 'easy' },
    { slug: 'slow-performance', name: 'Slow Performance', description: 'Device running slowly, apps crashing, or freezing', category: 'performance', difficulty: 'easy' }
  ];
  
  for (const issue of commonIssues) {
    await client.query(`
      INSERT INTO device_issues (slug, name, description, category, difficulty_level, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        difficulty_level = EXCLUDED.difficulty_level,
        updated_at = NOW()
    `, [issue.slug, issue.name, issue.description, issue.category, issue.difficulty, true]);
  }
  
  console.log(`✓ Inserted ${commonIssues.length} common issues`);
}

// Main import function
async function importDeviceData() {
  const client = await pool.connect();
  
  try {
    
    // Create tables
    console.log('Creating device tables...');
    await client.query(createTablesSQL);
    console.log('✓ Device tables created\n');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Import data
    await insertCategories(client);
    await insertBrands(client);
    await insertDevices(client);
    await insertCommonIssues(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n🎉 Device data import completed successfully!');
    
    // Show summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM device_categories WHERE is_active = TRUE) as categories,
        (SELECT COUNT(*) FROM device_brands WHERE is_active = TRUE) as brands,
        (SELECT COUNT(*) FROM devices WHERE is_active = TRUE) as devices,
        (SELECT COUNT(*) FROM device_issues WHERE is_active = TRUE) as issues
    `);
    
    const stats = summary.rows[0];
    console.log('\n📊 Import Summary:');
    console.log(`   Categories: ${stats.categories}`);
    console.log(`   Brands: ${stats.brands}`);
    console.log(`   Devices: ${stats.devices}`);
    console.log(`   Issues: ${stats.issues}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
if (require.main === module) {
  importDeviceData()
    .then(() => {
      console.log('\n✅ Import process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Import process failed:', error);
      process.exit(1);
    });
}

module.exports = { importDeviceData };