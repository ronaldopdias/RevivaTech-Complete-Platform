-- RevivaTech Database Schema
-- PostgreSQL schema for comprehensive repair booking system
-- Configuration-driven approach with advanced features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===================================
-- CORE DEVICE CATALOG TABLES
-- ===================================

-- Device brands and manufacturers
CREATE TABLE device_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    support_contact VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device categories (smartphone, tablet, laptop, etc.)
CREATE TABLE device_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main device catalog
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES device_brands(id),
    category_id UUID NOT NULL REFERENCES device_categories(id),
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    
    -- Product details
    release_year INTEGER,
    release_date DATE,
    discontinued_date DATE,
    
    -- Specifications (JSON for flexibility)
    specifications JSONB DEFAULT '{}',
    
    -- Variants and configurations
    has_variants BOOLEAN DEFAULT false,
    base_storage_gb INTEGER,
    available_storage JSONB DEFAULT '[]', -- [64, 128, 256, 512, 1024]
    available_colors JSONB DEFAULT '[]', -- ["black", "white", "blue"]
    
    -- Images and media
    primary_image_url VARCHAR(500),
    gallery_images JSONB DEFAULT '[]',
    
    -- Business data
    popularity_score INTEGER DEFAULT 0,
    repair_difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard, expert
    parts_availability VARCHAR(20) DEFAULT 'good', -- excellent, good, fair, poor, discontinued
    
    -- SEO and search
    search_keywords TEXT,
    meta_description TEXT,
    
    -- Status and visibility
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_repairable BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for search performance
    CONSTRAINT devices_brand_model_unique UNIQUE(brand_id, model)
);

-- Device variants (specific configurations)
CREATE TABLE device_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Variant details
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    
    -- Configuration
    storage_gb INTEGER,
    color VARCHAR(50),
    memory_gb INTEGER,
    
    -- Pricing and availability
    original_price DECIMAL(10,2),
    current_market_price DECIMAL(10,2),
    parts_availability VARCHAR(20) DEFAULT 'good',
    
    -- Additional specifications
    variant_specifications JSONB DEFAULT '{}',
    
    -- Images specific to this variant
    variant_images JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT device_variants_unique UNIQUE(device_id, storage_gb, color)
);

-- ===================================
-- REPAIR SERVICES CONFIGURATION
-- ===================================

-- Repair categories (Screen & Display, Battery & Power, etc.)
CREATE TABLE repair_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    priority INTEGER DEFAULT 0,
    estimated_time_min INTEGER, -- minimum hours
    estimated_time_max INTEGER, -- maximum hours
    popularity_score INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed repair types and services
CREATE TABLE repair_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES repair_categories(id),
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_description TEXT,
    long_description TEXT,
    
    -- Pricing structure
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GBP',
    labor_hours DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    
    -- Dynamic pricing multipliers (JSON for flexibility)
    complexity_multipliers JSONB DEFAULT '{"simple": 0.8, "standard": 1.0, "complex": 1.3, "extreme": 1.8}',
    urgency_multipliers JSONB DEFAULT '{"standard": 1.0, "priority": 1.25, "emergency": 1.5}',
    condition_multipliers JSONB DEFAULT '{"excellent": 1.0, "good": 1.1, "fair": 1.2, "poor": 1.3}',
    
    -- Technical requirements
    skill_level VARCHAR(20) NOT NULL, -- basic, intermediate, advanced, expert
    estimated_duration DECIMAL(4,2) NOT NULL, -- hours
    required_tools JSONB DEFAULT '[]',
    required_parts JSONB DEFAULT '[]',
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    data_risk VARCHAR(20) DEFAULT 'none', -- none, low, medium, high
    success_rate INTEGER DEFAULT 95, -- percentage 0-100
    
    -- Service details
    warranty_months INTEGER DEFAULT 6,
    diagnostic_required BOOLEAN DEFAULT false,
    testing_required BOOLEAN DEFAULT true,
    calibration_required BOOLEAN DEFAULT false,
    software_update_included BOOLEAN DEFAULT false,
    data_backup_recommended BOOLEAN DEFAULT true,
    customer_presence_required BOOLEAN DEFAULT false,
    
    -- Device compatibility (JSON arrays for flexibility)
    compatible_device_types JSONB DEFAULT '[]', -- ["smartphone", "tablet", "laptop"]
    compatible_brands JSONB DEFAULT '[]', -- ["apple", "samsung", "google"]
    excluded_models JSONB DEFAULT '[]',
    min_device_year INTEGER DEFAULT 2015,
    max_device_year INTEGER DEFAULT 2030,
    
    -- Presentation and marketing
    before_after_images JSONB DEFAULT '[]',
    process_steps JSONB DEFAULT '[]',
    common_causes JSONB DEFAULT '[]',
    prevention_tips JSONB DEFAULT '[]',
    faq_items JSONB DEFAULT '[]',
    
    -- Analytics and business intelligence
    popularity_rank INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    repeat_booking_rate DECIMAL(5,2) DEFAULT 0.00,
    seasonal_trends JSONB DEFAULT '{}', -- month -> demand multiplier
    
    -- Availability and scheduling
    is_enabled BOOLEAN DEFAULT true,
    requires_appointment BOOLEAN DEFAULT false,
    walk_in_accepted BOOLEAN DEFAULT true,
    advance_notice_hours INTEGER DEFAULT 2,
    max_bookings_per_day INTEGER DEFAULT 10,
    blocked_dates JSONB DEFAULT '[]',
    seasonal_availability JSONB DEFAULT '{"winter": true, "spring": true, "summer": true, "autumn": true}',
    
    -- SEO and search
    search_keywords TEXT,
    meta_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Repair compatibility matrix (many-to-many)
CREATE TABLE repair_device_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_type_id UUID NOT NULL REFERENCES repair_types(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Compatibility details
    is_compatible BOOLEAN DEFAULT true,
    complexity_override VARCHAR(20), -- override default complexity
    price_override DECIMAL(10,2), -- override base price
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT repair_device_compatibility_unique UNIQUE(repair_type_id, device_id)
);

-- ===================================
-- PRICING ENGINE TABLES
-- ===================================

-- Pricing factors (device age, damage severity, etc.)
CREATE TABLE pricing_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    factor_type VARCHAR(20) NOT NULL, -- multiplier, fixed_amount, percentage, tiered, conditional
    weight DECIMAL(3,2) DEFAULT 1.00, -- 0-1, influence on final price
    
    -- Factor values (JSON for flexibility)
    factor_values JSONB NOT NULL, -- {"new": {"value": 1.0, "label": "New (0-1 years)"}}
    
    -- Application rules
    applies_to_repair_types JSONB DEFAULT '[]',
    applies_to_device_types JSONB DEFAULT '[]',
    applies_to_brands JSONB DEFAULT '[]',
    applies_to_categories JSONB DEFAULT '[]',
    applies_to_all BOOLEAN DEFAULT false,
    
    -- Constraints
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    precision_places INTEGER DEFAULT 2,
    currency VARCHAR(3) DEFAULT 'GBP',
    
    -- Business rules
    is_stackable BOOLEAN DEFAULT true,
    overrides_factors JSONB DEFAULT '[]', -- factor IDs this overrides
    requires_factors JSONB DEFAULT '[]', -- factor IDs this requires
    mutually_exclusive_factors JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing rules and business logic
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    priority INTEGER DEFAULT 0, -- higher numbers execute first
    
    -- Conditions for rule activation (JSON for complex logic)
    conditions JSONB DEFAULT '{}',
    
    -- Rule effects (JSON array of effects)
    effects JSONB NOT NULL, -- [{"type": "apply_discount", "value": 10, "target": "total"}]
    
    -- Rule metadata
    is_enabled BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- CUSTOMER MANAGEMENT
-- ===================================

-- Customer accounts
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    
    -- Address information
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United Kingdom',
    
    -- Customer classification
    customer_type VARCHAR(20) DEFAULT 'individual', -- individual, business, student, senior
    company_name VARCHAR(200),
    vat_number VARCHAR(50),
    
    -- Preferences
    preferred_contact_method VARCHAR(20) DEFAULT 'email', -- email, phone, sms
    marketing_consent BOOLEAN DEFAULT false,
    newsletter_consent BOOLEAN DEFAULT false,
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    loyalty_tier VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    
    -- Business intelligence
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    last_booking_date TIMESTAMP WITH TIME ZONE,
    
    -- Authentication (if implementing accounts)
    password_hash VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    remember_token VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- BOOKING SYSTEM
-- ===================================

-- Main bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    -- Booking flow state
    current_step VARCHAR(50) DEFAULT 'device-selection',
    booking_status VARCHAR(20) DEFAULT 'draft', -- draft, pending, confirmed, in_progress, completed, cancelled
    completion_percentage INTEGER DEFAULT 0,
    
    -- Device information
    device_id UUID REFERENCES devices(id),
    device_variant_id UUID REFERENCES device_variants(id),
    device_condition VARCHAR(20), -- excellent, good, fair, poor
    purchase_date DATE,
    device_notes TEXT,
    
    -- Issue description
    reported_issues JSONB DEFAULT '[]', -- array of issue IDs
    issue_description TEXT,
    damage_photos JSONB DEFAULT '[]', -- array of photo URLs
    urgency_level VARCHAR(20) DEFAULT 'standard', -- standard, priority, emergency
    backup_status VARCHAR(20), -- backed_up, partial_backup, no_backup, not_important
    
    -- Service preferences
    service_type VARCHAR(20) DEFAULT 'bring_in', -- bring_in, collection, on_site
    preferred_contact_methods JSONB DEFAULT '["email"]',
    special_instructions TEXT,
    
    -- Repair selection
    selected_repairs JSONB DEFAULT '[]', -- array of repair type IDs
    repair_complexity VARCHAR(20) DEFAULT 'standard', -- simple, standard, complex, extreme
    
    -- Pricing information
    quote_base_price DECIMAL(10,2) DEFAULT 0.00,
    quote_labor_cost DECIMAL(10,2) DEFAULT 0.00,
    quote_total_price DECIMAL(10,2) DEFAULT 0.00,
    quote_valid_until TIMESTAMP WITH TIME ZONE,
    quote_accepted BOOLEAN DEFAULT false,
    quote_accepted_at TIMESTAMP WITH TIME ZONE,
    
    -- Applied pricing factors and discounts
    applied_factors JSONB DEFAULT '[]',
    applied_discounts JSONB DEFAULT '[]',
    pricing_breakdown JSONB DEFAULT '{}',
    
    -- Scheduling
    preferred_date DATE,
    preferred_time TIME,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    actual_completion TIMESTAMP WITH TIME ZONE,
    
    -- Collection/delivery (if applicable)
    collection_address JSONB DEFAULT '{}',
    collection_instructions TEXT,
    collection_scheduled TIMESTAMP WITH TIME ZONE,
    delivery_scheduled TIMESTAMP WITH TIME ZONE,
    
    -- Agreements and consent
    terms_accepted BOOLEAN DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    data_protection_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Business tracking
    source VARCHAR(50), -- website, phone, walk_in, referral
    referral_source VARCHAR(100),
    campaign_code VARCHAR(50),
    
    -- Session and flow management
    session_data JSONB DEFAULT '{}', -- store form progress
    auto_save_data JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking state transitions (audit trail)
CREATE TABLE booking_state_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    transition_reason VARCHAR(100),
    user_id UUID, -- staff member who made the change
    
    -- Additional context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- SCHEDULING AND AVAILABILITY
-- ===================================

-- Business hours configuration
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    is_open BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    break_start TIME,
    break_end TIME,
    
    -- Special configurations
    is_emergency_hours BOOLEAN DEFAULT false,
    emergency_rate_multiplier DECIMAL(4,2) DEFAULT 2.0,
    
    -- Effective dates
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT business_hours_day_unique UNIQUE(day_of_week, effective_from)
);

-- Time slots and availability
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Slot timing
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    
    -- Capacity and booking limits
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    
    -- Slot type and priority
    slot_type VARCHAR(20) DEFAULT 'standard', -- standard, priority, emergency, maintenance
    service_types JSONB DEFAULT '["bring_in", "collection", "on_site"]',
    
    -- Staff and resource allocation
    assigned_technician_id UUID,
    required_skills JSONB DEFAULT '[]',
    
    -- Pricing modifiers
    price_modifier DECIMAL(4,2) DEFAULT 1.0,
    
    -- Status
    is_blocked BOOLEAN DEFAULT false,
    block_reason VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT availability_slots_unique UNIQUE(slot_date, start_time, end_time)
);

-- Holiday and special dates
CREATE TABLE special_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    date_type VARCHAR(20) NOT NULL, -- holiday, closure, special_hours, high_demand
    
    -- Business impact
    is_closed BOOLEAN DEFAULT false,
    special_hours_open TIME,
    special_hours_close TIME,
    price_modifier DECIMAL(4,2) DEFAULT 1.0,
    
    -- Availability impact
    reduced_capacity_percentage INTEGER DEFAULT 100,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- NOTIFICATIONS AND COMMUNICATION
-- ===================================

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Template content
    channel VARCHAR(20) NOT NULL, -- email, sms, push, in_app
    subject VARCHAR(200),
    content TEXT NOT NULL,
    html_content TEXT,
    
    -- Template variables
    available_variables JSONB DEFAULT '[]',
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    send_delay_minutes INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification queue and history
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    customer_id UUID REFERENCES customers(id),
    template_id UUID REFERENCES notification_templates(id),
    
    -- Notification details
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed, cancelled
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    -- Metadata
    external_id VARCHAR(100), -- ID from email/SMS provider
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- ANALYTICS AND REPORTING
-- ===================================

-- Booking analytics events
CREATE TABLE booking_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    customer_id UUID REFERENCES customers(id),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL, -- flow_started, step_completed, booking_submitted, etc.
    event_data JSONB DEFAULT '{}',
    
    -- Context
    step_name VARCHAR(50),
    device_type VARCHAR(50),
    repair_type VARCHAR(50),
    
    -- Technical details
    user_agent TEXT,
    ip_address INET,
    session_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- SEARCH AND INDEXING
-- ===================================

-- Full-text search indexes
CREATE INDEX idx_devices_search ON devices USING GIN (
    to_tsvector('english', name || ' ' || model || ' ' || COALESCE(search_keywords, ''))
);

CREATE INDEX idx_repair_types_search ON repair_types USING GIN (
    to_tsvector('english', name || ' ' || short_description || ' ' || COALESCE(search_keywords, ''))
);

-- Performance indexes
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);

CREATE INDEX idx_devices_brand_category ON devices(brand_id, category_id);
CREATE INDEX idx_devices_active ON devices(is_active);
CREATE INDEX idx_devices_popularity ON devices(popularity_score DESC);

CREATE INDEX idx_repair_types_category ON repair_types(category_id);
CREATE INDEX idx_repair_types_enabled ON repair_types(is_enabled);
CREATE INDEX idx_repair_types_popularity ON repair_types(popularity_rank DESC);

CREATE INDEX idx_availability_slots_date ON availability_slots(slot_date);
CREATE INDEX idx_availability_slots_available ON availability_slots(is_available);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_customer_status_date ON bookings(customer_id, booking_status, created_at);
CREATE INDEX idx_devices_search_active ON devices(is_active, popularity_score DESC) WHERE is_active = true;

-- ===================================
-- TRIGGERS AND FUNCTIONS
-- ===================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at
                       BEFORE UPDATE ON %I
                       FOR EACH ROW
                       EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;

-- Function to generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := 'RTB' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                             LPAD((EXTRACT(EPOCH FROM NOW()) % 86400)::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for booking number generation
CREATE TRIGGER generate_booking_number_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_number();

-- Function to update booking analytics
CREATE OR REPLACE FUNCTION track_booking_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Track state changes
    IF TG_OP = 'UPDATE' AND OLD.current_step != NEW.current_step THEN
        INSERT INTO booking_analytics (
            booking_id, customer_id, event_type, event_data, step_name
        ) VALUES (
            NEW.id, NEW.customer_id, 'step_completed',
            jsonb_build_object('from_step', OLD.current_step, 'to_step', NEW.current_step),
            NEW.current_step
        );
    END IF;
    
    -- Track booking submission
    IF TG_OP = 'UPDATE' AND OLD.booking_status = 'draft' AND NEW.booking_status = 'pending' THEN
        INSERT INTO booking_analytics (
            booking_id, customer_id, event_type, event_data
        ) VALUES (
            NEW.id, NEW.customer_id, 'booking_submitted',
            jsonb_build_object('total_price', NEW.quote_total_price)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for booking analytics
CREATE TRIGGER track_booking_events_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION track_booking_event();

-- ===================================
-- INITIAL DATA POPULATION
-- ===================================

-- Insert default business hours
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
(1, true, '09:00', '18:00'), -- Monday
(2, true, '09:00', '18:00'), -- Tuesday
(3, true, '09:00', '18:00'), -- Wednesday
(4, true, '09:00', '18:00'), -- Thursday
(5, true, '09:00', '18:00'), -- Friday
(6, true, '10:00', '16:00'), -- Saturday
(0, false, null, null);      -- Sunday (closed)

-- Insert common notification templates
INSERT INTO notification_templates (name, slug, channel, subject, content) VALUES
('Booking Confirmation', 'booking-confirmation', 'email', 
 'Your repair booking has been confirmed - {{booking_number}}',
 'Dear {{customer_name}},\n\nYour repair booking {{booking_number}} has been confirmed.\n\nDevice: {{device_name}}\nScheduled: {{scheduled_date}}\nEstimated completion: {{estimated_completion}}\n\nThank you for choosing RevivaTech!'),

('Booking Started', 'booking-started', 'email',
 'Welcome to RevivaTech - Let''s get your device repaired!',
 'Hi {{customer_name}},\n\nThanks for starting your repair booking with RevivaTech. We''re here to help get your {{device_name}} back to perfect condition.\n\nYour booking reference: {{booking_number}}\n\nComplete your booking: {{booking_url}}'),

('Quote Ready', 'quote-ready', 'email',
 'Your repair quote is ready - {{booking_number}}',
 'Hi {{customer_name}},\n\nGreat news! We''ve prepared your repair quote for {{device_name}}.\n\nTotal cost: £{{quote_total}}\nEstimated completion: {{estimated_days}} days\n\nView and accept your quote: {{quote_url}}');

-- Create configuration table for app settings
CREATE TABLE app_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_sensitive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration values
INSERT INTO app_configuration (key, value, description, category) VALUES
('pricing.currency', '"GBP"', 'Default currency for pricing', 'pricing'),
('pricing.tax_rate', '20', 'VAT rate percentage', 'pricing'),
('pricing.minimum_charge', '35', 'Minimum repair charge', 'pricing'),
('booking.session_timeout', '30', 'Booking session timeout in minutes', 'booking'),
('booking.max_photos', '10', 'Maximum photos per booking', 'booking'),
('business.timezone', '"Europe/London"', 'Business timezone', 'general'),
('notifications.from_email', '"repairs@revivatech.co.uk"', 'Default from email', 'notifications');

COMMENT ON DATABASE revivatech IS 'RevivaTech repair booking system database - configuration-driven approach with comprehensive device catalog, dynamic pricing, and advanced booking flow management';