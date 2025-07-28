-- Migration: Create Device Database Tables
-- Description: Comprehensive device catalog for 2016-2025 models with repair information
-- Created: 2025-07-13

-- Device Categories Table
CREATE TABLE IF NOT EXISTS device_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Brands Table
CREATE TABLE IF NOT EXISTS device_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    country VARCHAR(2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devices Table (Main catalog)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    category_id UUID NOT NULL REFERENCES device_categories(id) ON DELETE RESTRICT,
    brand_id UUID NOT NULL REFERENCES device_brands(id) ON DELETE RESTRICT,
    model VARCHAR(200) NOT NULL,
    model_number VARCHAR(100),
    series VARCHAR(100),
    year INTEGER NOT NULL CHECK (year >= 2016 AND year <= 2025),
    
    -- Device Details
    display_name VARCHAR(255) NOT NULL, -- Full display name (e.g., "Apple iPhone 15 Pro Max")
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    
    -- Technical Specifications
    specifications JSONB DEFAULT '{}', -- Detailed specs (screen size, CPU, RAM, etc.)
    dimensions JSONB DEFAULT '{}', -- Physical dimensions
    weight DECIMAL(6,2), -- Weight in grams
    colors TEXT[] DEFAULT '{}', -- Available colors
    
    -- Repair Information
    repairability_score INTEGER CHECK (repairability_score >= 0 AND repairability_score <= 10),
    average_repair_time INTEGER, -- In minutes
    warranty_void_on_repair BOOLEAN DEFAULT FALSE,
    special_tools_required TEXT[] DEFAULT '{}',
    
    -- Status and Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_discontinued BOOLEAN DEFAULT FALSE,
    discontinued_date DATE,
    popularity_score INTEGER DEFAULT 0,
    search_keywords TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for search
    UNIQUE(brand_id, model, year)
);

-- Device Issues Table (Common problems)
CREATE TABLE IF NOT EXISTS device_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Issue Details
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'screen', 'battery', 'charging', 'audio', 'camera', etc.
    
    -- Diagnostic Information
    symptoms TEXT[] DEFAULT '{}',
    diagnostic_steps JSONB DEFAULT '[]', -- Array of diagnostic step objects
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    
    -- Visual Aids
    icon VARCHAR(50),
    diagram_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Issue Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS device_issue_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES device_issues(id) ON DELETE CASCADE,
    
    -- Issue-specific data for this device
    frequency VARCHAR(20) DEFAULT 'common' CHECK (frequency IN ('rare', 'uncommon', 'common', 'very_common')),
    typical_age_months INTEGER, -- When this issue typically appears
    notes TEXT,
    
    -- Repair Information
    estimated_cost_min DECIMAL(10,2),
    estimated_cost_max DECIMAL(10,2),
    repair_time_minutes INTEGER,
    parts_required TEXT[] DEFAULT '{}',
    
    -- Success Metrics
    success_rate DECIMAL(5,2) CHECK (success_rate >= 0 AND success_rate <= 100),
    customer_satisfaction DECIMAL(3,2) CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(device_id, issue_id)
);

-- Repair Parts Table
CREATE TABLE IF NOT EXISTS repair_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Part Information
    name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100),
    manufacturer VARCHAR(100),
    category VARCHAR(50), -- 'screen', 'battery', 'charging_port', etc.
    
    -- Compatibility and Quality
    quality_grade VARCHAR(20) CHECK (quality_grade IN ('oem', 'original', 'premium', 'standard', 'economy')),
    warranty_months INTEGER DEFAULT 0,
    
    -- Inventory and Pricing
    sku VARCHAR(100) UNIQUE,
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    unit_cost DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_stocked BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Part Compatibility (Many-to-Many)
CREATE TABLE IF NOT EXISTS device_part_compatibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES repair_parts(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES device_issues(id) ON DELETE SET NULL,
    
    -- Compatibility Details
    is_compatible BOOLEAN DEFAULT TRUE,
    compatibility_notes TEXT,
    installation_difficulty VARCHAR(20) CHECK (installation_difficulty IN ('easy', 'medium', 'hard', 'expert')),
    
    -- Installation Information
    installation_time_minutes INTEGER,
    special_instructions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(device_id, part_id, issue_id)
);

-- Repair Pricing Rules Table
CREATE TABLE IF NOT EXISTS repair_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule Definition
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'base_price', 'complexity_multiplier', 'urgency_surcharge', etc.
    
    -- Conditions (JSONB for flexibility)
    conditions JSONB NOT NULL DEFAULT '{}', -- e.g., {"category": "phone", "brand": "apple"}
    
    -- Pricing Logic
    base_amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    calculation_method VARCHAR(50), -- 'fixed', 'percentage', 'tiered'
    
    -- Priority and Status
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Valid Period
    valid_from DATE,
    valid_until DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device Search Index (Materialized View for fast searching)
CREATE MATERIALIZED VIEW IF NOT EXISTS device_search_index AS
SELECT 
    d.id,
    d.slug,
    d.display_name,
    d.year,
    d.image_url,
    d.repairability_score,
    d.popularity_score,
    dc.name as category_name,
    dc.slug as category_slug,
    db.name as brand_name,
    db.slug as brand_slug,
    -- Concatenated search text
    LOWER(
        d.display_name || ' ' || 
        d.model || ' ' || 
        COALESCE(d.model_number, '') || ' ' ||
        db.name || ' ' ||
        dc.name || ' ' ||
        d.year::text || ' ' ||
        COALESCE(array_to_string(d.search_keywords, ' '), '')
    ) as search_text,
    -- Common issue count
    COUNT(DISTINCT dim.issue_id) as issue_count,
    -- Average repair cost
    AVG((dim.estimated_cost_min + dim.estimated_cost_max) / 2) as avg_repair_cost
FROM devices d
JOIN device_categories dc ON d.category_id = dc.id
JOIN device_brands db ON d.brand_id = db.id
LEFT JOIN device_issue_mappings dim ON d.id = dim.device_id
WHERE d.is_active = TRUE
GROUP BY d.id, dc.name, dc.slug, db.name, db.slug;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_category_id ON devices(category_id);
CREATE INDEX IF NOT EXISTS idx_devices_brand_id ON devices(brand_id);
CREATE INDEX IF NOT EXISTS idx_devices_year ON devices(year);
CREATE INDEX IF NOT EXISTS idx_devices_slug ON devices(slug);
CREATE INDEX IF NOT EXISTS idx_devices_search ON devices USING gin(to_tsvector('english', display_name || ' ' || model));

CREATE INDEX IF NOT EXISTS idx_device_issues_slug ON device_issues(slug);
CREATE INDEX IF NOT EXISTS idx_device_issues_category ON device_issues(category);

CREATE INDEX IF NOT EXISTS idx_device_issue_mappings_device_id ON device_issue_mappings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_issue_mappings_issue_id ON device_issue_mappings(issue_id);

CREATE INDEX IF NOT EXISTS idx_repair_parts_sku ON repair_parts(sku);
CREATE INDEX IF NOT EXISTS idx_repair_parts_category ON repair_parts(category);

CREATE INDEX IF NOT EXISTS idx_device_search_index_search_text ON device_search_index USING gin(to_tsvector('english', search_text));

-- Create update trigger for materialized view
CREATE OR REPLACE FUNCTION refresh_device_search_index()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY device_search_index;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_device_categories_updated_at 
    BEFORE UPDATE ON device_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_brands_updated_at 
    BEFORE UPDATE ON device_brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_issues_updated_at 
    BEFORE UPDATE ON device_issues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_parts_updated_at 
    BEFORE UPDATE ON repair_parts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial Data: Categories
INSERT INTO device_categories (name, slug, description, icon, display_order) VALUES
('Smartphones', 'smartphones', 'Mobile phones and smartphones', 'smartphone', 1),
('Tablets', 'tablets', 'Tablets and iPads', 'tablet', 2),
('Laptops', 'laptops', 'Laptops and notebooks', 'laptop', 3),
('Desktops', 'desktops', 'Desktop computers and all-in-ones', 'desktop', 4),
('Smartwatches', 'smartwatches', 'Smartwatches and fitness trackers', 'watch', 5),
('Game Consoles', 'game-consoles', 'Gaming consoles and handhelds', 'gamepad', 6),
('Audio Devices', 'audio-devices', 'Headphones, earbuds, and speakers', 'headphones', 7)
ON CONFLICT (slug) DO NOTHING;

-- Initial Data: Brands
INSERT INTO device_brands (name, slug, country) VALUES
('Apple', 'apple', 'US'),
('Samsung', 'samsung', 'KR'),
('Google', 'google', 'US'),
('Microsoft', 'microsoft', 'US'),
('Dell', 'dell', 'US'),
('HP', 'hp', 'US'),
('Lenovo', 'lenovo', 'CN'),
('ASUS', 'asus', 'TW'),
('Sony', 'sony', 'JP'),
('OnePlus', 'oneplus', 'CN'),
('Xiaomi', 'xiaomi', 'CN'),
('LG', 'lg', 'KR'),
('Motorola', 'motorola', 'US'),
('Nokia', 'nokia', 'FI'),
('Huawei', 'huawei', 'CN')
ON CONFLICT (slug) DO NOTHING;

-- Initial Data: Common Issues
INSERT INTO device_issues (name, slug, category, description, symptoms, difficulty_level) VALUES
('Cracked Screen', 'cracked-screen', 'screen', 'Physical damage to device display', ARRAY['Visible cracks', 'Touch not working', 'Display artifacts'], 'medium'),
('Battery Drain', 'battery-drain', 'battery', 'Battery depletes faster than normal', ARRAY['Fast discharge', 'Device gets hot', 'Unexpected shutdowns'], 'medium'),
('Charging Port Issues', 'charging-port', 'charging', 'Problems with charging connection', ARRAY['Loose connection', 'No charging', 'Intermittent charging'], 'hard'),
('Water Damage', 'water-damage', 'liquid', 'Liquid exposure damage', ARRAY['Device not turning on', 'Speaker issues', 'Screen flickering'], 'expert'),
('Camera Not Working', 'camera-not-working', 'camera', 'Camera malfunction', ARRAY['Black screen', 'Blurry images', 'Camera app crashes'], 'medium'),
('Speaker Issues', 'speaker-issues', 'audio', 'Audio output problems', ARRAY['No sound', 'Distorted audio', 'Low volume'], 'medium'),
('Microphone Not Working', 'microphone-not-working', 'audio', 'Microphone malfunction', ARRAY['No audio recording', 'Muffled sound', 'Static noise'], 'medium'),
('Button Malfunction', 'button-malfunction', 'hardware', 'Physical button issues', ARRAY['Button stuck', 'No response', 'Multiple presses'], 'easy'),
('Software Issues', 'software-issues', 'software', 'Operating system problems', ARRAY['Crashes', 'Slow performance', 'Apps not working'], 'easy'),
('WiFi/Bluetooth Issues', 'connectivity-issues', 'connectivity', 'Wireless connection problems', ARRAY['Cannot connect', 'Drops connection', 'Slow speeds'], 'medium')
ON CONFLICT (slug) DO NOTHING;