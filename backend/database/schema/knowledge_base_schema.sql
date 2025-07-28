-- RevivaTech Knowledge Base Schema - Phase 3
-- Comprehensive repair knowledge base with full-text search and AI integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ====================================================================
-- CORE KNOWLEDGE BASE TABLES
-- ====================================================================

-- Main repair procedures table
CREATE TABLE repair_procedures (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5), -- 1=Easy, 5=Expert
    estimated_time_minutes INTEGER,
    repair_type VARCHAR(100), -- screen_replacement, battery_replacement, etc.
    
    -- Device compatibility (JSONB for flexible device matching)
    device_compatibility JSONB NOT NULL, -- {brands: ["Apple"], models: ["iPhone 15"], types: ["smartphone"]}
    
    -- Requirements
    tools_required JSONB, -- [{"name": "Phillips #00", "required": true}, {"name": "Spudger", "required": true}]
    parts_required JSONB, -- [{"name": "iPhone 15 Screen", "part_number": "A2846", "quantity": 1}]
    
    -- Content and media
    overview TEXT,
    safety_warnings JSONB, -- ["Turn off device", "Disconnect battery first"]
    completion_tips TEXT,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'draft', -- draft, review, published, archived
    quality_score DECIMAL(3,2), -- 0.00 to 5.00 based on user ratings
    view_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- Percentage of successful repairs
    
    -- Timestamps and versioning
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    -- AI integration fields
    ai_keywords TEXT[], -- Keywords for enhanced search
    problem_categories VARCHAR(100)[], -- For problem-procedure matching
    diagnostic_tags VARCHAR(100)[] -- For AI diagnostic matching
);

-- Individual procedure steps
CREATE TABLE procedure_steps (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES repair_procedures(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT NOT NULL,
    
    -- Media and visual aids
    primary_image_url VARCHAR(500),
    additional_images JSONB, -- [{"url": "...", "caption": "..."}, ...]
    video_url VARCHAR(500),
    diagram_data JSONB, -- Interactive diagram annotations
    
    -- Step metadata
    estimated_duration_minutes INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    caution_level VARCHAR(20), -- none, low, medium, high, critical
    
    -- Special instructions
    tips_and_tricks TEXT,
    common_mistakes TEXT,
    troubleshooting_notes TEXT,
    
    -- Ordering and grouping
    step_group VARCHAR(100), -- "preparation", "disassembly", "replacement", "reassembly"
    is_optional BOOLEAN DEFAULT FALSE,
    prerequisites INTEGER[], -- Array of step IDs that must be completed first
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device compatibility and mapping
CREATE TABLE device_models (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_aliases JSONB, -- ["iPhone15Pro", "iPhone 15 Pro Max", "A2848"]
    device_type VARCHAR(50), -- smartphone, laptop, tablet, etc.
    release_year INTEGER,
    
    -- Repair characteristics
    repairability_score INTEGER CHECK (repairability_score BETWEEN 1 AND 10),
    common_problems JSONB, -- [{"problem": "screen_damage", "frequency": 85}, ...]
    average_repair_time INTEGER, -- minutes
    
    -- Business data
    market_popularity INTEGER, -- 1-100 scale
    parts_availability VARCHAR(20), -- excellent, good, limited, poor
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(brand, model)
);

-- Parts catalog and inventory
CREATE TABLE parts_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    manufacturer VARCHAR(100),
    
    -- Compatibility
    compatible_devices JSONB, -- Device IDs this part works with
    part_category VARCHAR(100), -- screen, battery, camera, etc.
    
    -- Pricing and availability
    cost_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    availability_status VARCHAR(20), -- in_stock, low_stock, out_of_stock, discontinued
    supplier_info JSONB,
    
    -- Quality and specifications
    quality_grade VARCHAR(20), -- oem, aftermarket_premium, aftermarket_standard
    warranty_period_days INTEGER,
    specifications JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tools and equipment catalog
CREATE TABLE tools_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tool_type VARCHAR(100), -- screwdriver, spudger, heat_gun, etc.
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Usage information
    typical_use_cases VARCHAR(200)[],
    skill_level_required INTEGER CHECK (skill_level_required BETWEEN 1 AND 5),
    
    -- Purchasing information
    approximate_cost DECIMAL(10,2),
    where_to_buy JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- DIAGNOSTIC AND AI ENHANCEMENT TABLES
-- ====================================================================

-- Diagnostic decision trees for AI
CREATE TABLE diagnostic_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    device_types VARCHAR(50)[], -- Which device types this rule applies to
    
    -- Condition matching
    symptom_keywords VARCHAR(100)[], -- Keywords that trigger this rule
    problem_category VARCHAR(100),
    confidence_threshold DECIMAL(3,2), -- Minimum confidence to trigger
    
    -- Decision logic
    condition_logic JSONB, -- Complex decision tree logic
    recommended_procedures INTEGER[], -- procedure_ids to recommend
    
    -- Priority and effectiveness
    priority_score INTEGER DEFAULT 50, -- 1-100, higher means more important
    success_rate DECIMAL(5,2), -- How often this rule leads to successful diagnosis
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User feedback and quality metrics
CREATE TABLE procedure_feedback (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES repair_procedures(id) ON DELETE CASCADE,
    
    -- Feedback details
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    was_successful BOOLEAN,
    actual_time_minutes INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    
    -- Comments and improvements
    feedback_text TEXT,
    suggested_improvements TEXT,
    missing_steps TEXT,
    
    -- Source information
    feedback_source VARCHAR(50), -- customer, technician, admin
    technician_level VARCHAR(20), -- beginner, intermediate, expert
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- CONTENT MANAGEMENT AND VERSIONING
-- ====================================================================

-- Content version history
CREATE TABLE content_versions (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES repair_procedures(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Change tracking
    changes_summary TEXT,
    changed_by VARCHAR(100), -- User ID or username
    change_type VARCHAR(50), -- created, updated, reviewed, published
    
    -- Version data (snapshot)
    version_data JSONB, -- Complete procedure data at this version
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media files and assets
CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_type VARCHAR(10), -- jpg, png, mp4, pdf, etc.
    file_size_bytes BIGINT,
    
    -- Storage information
    storage_path VARCHAR(500),
    storage_provider VARCHAR(50) DEFAULT 'local', -- local, s3, cloudinary
    
    -- Usage and metadata
    title VARCHAR(255),
    description TEXT,
    alt_text VARCHAR(255), -- For accessibility
    used_in_procedures INTEGER[], -- Array of procedure IDs using this media
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, ready, failed
    thumbnail_url VARCHAR(500),
    compressed_url VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE AND ANALYTICS TABLES
-- ====================================================================

-- Search and usage analytics
CREATE TABLE knowledge_base_analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50), -- search, view, download, rating
    
    -- Content reference
    procedure_id INTEGER REFERENCES repair_procedures(id) ON DELETE SET NULL,
    search_query TEXT,
    
    -- User context
    user_agent TEXT,
    device_detected VARCHAR(100),
    problem_detected VARCHAR(100),
    
    -- Performance metrics
    response_time_ms INTEGER,
    results_count INTEGER,
    result_clicked_position INTEGER,
    
    -- Session information
    session_id VARCHAR(100),
    ip_address INET,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================================

-- Full-text search indexes
CREATE INDEX idx_procedures_fulltext ON repair_procedures 
USING GIN(to_tsvector('english', title || ' ' || description || ' ' || overview));

CREATE INDEX idx_steps_fulltext ON procedure_steps 
USING GIN(to_tsvector('english', title || ' ' || description));

-- Device and compatibility indexes
CREATE INDEX idx_procedures_device_compat ON repair_procedures USING GIN(device_compatibility);
CREATE INDEX idx_procedures_problem_cats ON repair_procedures USING GIN(problem_categories);
CREATE INDEX idx_procedures_tags ON repair_procedures USING GIN(diagnostic_tags);

-- Performance indexes
CREATE INDEX idx_procedures_status ON repair_procedures(status);
CREATE INDEX idx_procedures_difficulty ON repair_procedures(difficulty_level);
CREATE INDEX idx_procedures_type ON repair_procedures(repair_type);
CREATE INDEX idx_procedures_quality ON repair_procedures(quality_score DESC);

-- Foreign key indexes
CREATE INDEX idx_steps_procedure ON procedure_steps(procedure_id);
CREATE INDEX idx_feedback_procedure ON procedure_feedback(procedure_id);
CREATE INDEX idx_versions_procedure ON content_versions(procedure_id);

-- Analytics indexes
CREATE INDEX idx_analytics_created_at ON knowledge_base_analytics(created_at);
CREATE INDEX idx_analytics_procedure ON knowledge_base_analytics(procedure_id);
CREATE INDEX idx_analytics_event_type ON knowledge_base_analytics(event_type);

-- ====================================================================
-- SAMPLE DATA FOR TESTING
-- ====================================================================

-- Insert sample device models
INSERT INTO device_models (brand, model, model_aliases, device_type, release_year, repairability_score, common_problems) VALUES 
('Apple', 'iPhone 15 Pro', '["iPhone15Pro", "A2848", "iPhone 15 Pro Max"]', 'smartphone', 2023, 6, '[{"problem": "screen_damage", "frequency": 78}, {"problem": "battery_issues", "frequency": 45}, {"problem": "camera_malfunction", "frequency": 32}]'),
('Samsung', 'Galaxy S24', '["GalaxyS24", "SM-S921", "Galaxy S24+"]', 'smartphone', 2024, 7, '[{"problem": "screen_damage", "frequency": 72}, {"problem": "battery_issues", "frequency": 38}, {"problem": "charging_port", "frequency": 28}]'),
('Apple', 'MacBook Pro 14"', '["MacBookPro14", "A2442", "MacBook Pro 2023"]', 'laptop', 2023, 4, '[{"problem": "keyboard_malfunction", "frequency": 55}, {"problem": "battery_issues", "frequency": 67}, {"problem": "screen_damage", "frequency": 23}]');

-- Insert sample parts
INSERT INTO parts_catalog (name, part_number, manufacturer, compatible_devices, part_category, cost_price, retail_price, availability_status, quality_grade) VALUES 
('iPhone 15 Pro Screen Assembly', 'A2848-SCREEN', 'Apple', '[1]', 'screen', 89.99, 179.99, 'in_stock', 'oem'),
('iPhone 15 Pro Battery', 'A2848-BATT', 'Apple', '[1]', 'battery', 34.99, 69.99, 'in_stock', 'oem'),
('Galaxy S24 Screen Assembly', 'SM-S921-SCREEN', 'Samsung', '[2]', 'screen', 79.99, 159.99, 'in_stock', 'oem');

-- Insert sample tools
INSERT INTO tools_catalog (name, tool_type, brand, typical_use_cases, skill_level_required, approximate_cost) VALUES 
('Phillips #00 Screwdriver', 'screwdriver', 'iFixit', '{"iPhone repair", "small electronics"}', 1, 8.99),
('Plastic Spudger Set', 'prying_tool', 'iFixit', '{"safe prying", "connector removal"}', 1, 12.99),
('Heat Gun', 'heating_tool', 'Generic', '{"adhesive removal", "screen separation"}', 3, 45.99);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_repair_procedures_updated_at BEFORE UPDATE ON repair_procedures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procedure_steps_updated_at BEFORE UPDATE ON procedure_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_models_updated_at BEFORE UPDATE ON device_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- VIEWS FOR COMMON QUERIES
-- ====================================================================

-- Complete procedure view with all related data
CREATE VIEW procedure_complete AS
SELECT 
    p.*,
    COUNT(ps.id) as step_count,
    AVG(f.rating) as average_rating,
    COUNT(f.id) as feedback_count,
    dm.brand as primary_brand,
    dm.model as primary_model
FROM repair_procedures p
LEFT JOIN procedure_steps ps ON p.id = ps.procedure_id
LEFT JOIN procedure_feedback f ON p.id = f.procedure_id
LEFT JOIN device_models dm ON (p.device_compatibility->>'brands')::jsonb ? dm.brand
GROUP BY p.id, dm.brand, dm.model;

-- Popular procedures view
CREATE VIEW popular_procedures AS
SELECT 
    p.*,
    ka.view_count as analytics_views,
    AVG(f.rating) as avg_rating
FROM repair_procedures p
LEFT JOIN (
    SELECT procedure_id, COUNT(*) as view_count
    FROM knowledge_base_analytics 
    WHERE event_type = 'view' 
    GROUP BY procedure_id
) ka ON p.id = ka.procedure_id
LEFT JOIN procedure_feedback f ON p.id = f.procedure_id
WHERE p.status = 'published'
GROUP BY p.id, ka.view_count
ORDER BY ka.view_count DESC, p.quality_score DESC;

COMMENT ON SCHEMA public IS 'RevivaTech Knowledge Base - Phase 3: Comprehensive repair knowledge system with AI integration';