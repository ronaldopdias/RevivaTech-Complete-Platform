-- RevivaTech Core Database Schema
-- Session 1: Backend Foundation Implementation
-- Created: July 19, 2025

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS repair_status_updates CASCADE;
DROP TABLE IF EXISTS repairs CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS repair_types CASCADE;
DROP TABLE IF EXISTS device_models CASCADE;
DROP TABLE IF EXISTS device_categories CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with role-based access
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'admin', 'technician')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions for JWT management
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device categories
CREATE TABLE device_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device models (2016-2025 database)
CREATE TABLE device_models (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES device_categories(id),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    year INTEGER,
    specifications JSONB,
    image_url VARCHAR(500),
    repair_difficulty VARCHAR(20) CHECK (repair_difficulty IN ('easy', 'medium', 'hard')),
    common_issues TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair types and pricing
CREATE TABLE repair_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES device_categories(id),
    base_price DECIMAL(10,2) NOT NULL,
    estimated_time_hours INTEGER DEFAULT 1,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    parts_required JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer bookings
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES users(id),
    device_category_id INTEGER REFERENCES device_categories(id),
    device_model_id INTEGER REFERENCES device_models(id),
    repair_type_id INTEGER REFERENCES repair_types(id),
    issue_description TEXT NOT NULL,
    device_condition VARCHAR(20) CHECK (device_condition IN ('excellent', 'good', 'fair', 'poor')),
    urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    preferred_date DATE,
    preferred_time TIME,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_intent_id VARCHAR(255),
    additional_services JSONB,
    booking_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair tracking
CREATE TABLE repairs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    technician_id INTEGER REFERENCES users(id),
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    current_status VARCHAR(30) DEFAULT 'received' CHECK (current_status IN ('received', 'diagnosed', 'waiting_parts', 'in_progress', 'testing', 'completed', 'failed')),
    diagnosis TEXT,
    work_performed TEXT,
    parts_used JSONB,
    time_spent_hours DECIMAL(5,2),
    quality_notes TEXT,
    customer_notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Repair status updates (for real-time tracking)
CREATE TABLE repair_status_updates (
    id SERIAL PRIMARY KEY,
    repair_id INTEGER REFERENCES repairs(id),
    booking_id INTEGER REFERENCES bookings(id),
    status VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    technician_id INTEGER REFERENCES users(id),
    customer_visible BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File uploads (photos, documents)
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    repair_id INTEGER REFERENCES repairs(id),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_type VARCHAR(20) CHECK (file_type IN ('device_photo', 'diagnosis_photo', 'repair_photo', 'document', 'receipt')),
    uploaded_by INTEGER REFERENCES users(id),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications system
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_device_models_category_id ON device_models(category_id);
CREATE INDEX idx_device_models_brand ON device_models(brand);
CREATE INDEX idx_device_models_year ON device_models(year);
CREATE INDEX idx_device_models_active ON device_models(active);

CREATE INDEX idx_repair_types_category_id ON repair_types(category_id);
CREATE INDEX idx_repair_types_active ON repair_types(active);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

CREATE INDEX idx_repairs_booking_id ON repairs(booking_id);
CREATE INDEX idx_repairs_technician_id ON repairs(technician_id);
CREATE INDEX idx_repairs_status ON repairs(current_status);

CREATE INDEX idx_repair_status_updates_repair_id ON repair_status_updates(repair_id);
CREATE INDEX idx_repair_status_updates_booking_id ON repair_status_updates(booking_id);
CREATE INDEX idx_repair_status_updates_created_at ON repair_status_updates(created_at);

CREATE INDEX idx_file_uploads_booking_id ON file_uploads(booking_id);
CREATE INDEX idx_file_uploads_repair_id ON file_uploads(repair_id);
CREATE INDEX idx_file_uploads_type ON file_uploads(file_type);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_repairs_updated_at BEFORE UPDATE ON repairs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Generate booking reference function
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS VARCHAR(20) AS $$
DECLARE
    reference VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        reference := 'RV' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || 
                    LPAD((EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::INTEGER % 10000)::TEXT, 4, '0');
        
        -- Check if reference already exists
        IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = reference) THEN
            RETURN reference;
        END IF;
        
        counter := counter + 1;
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique booking reference';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking reference trigger
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference_trigger BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE PROCEDURE set_booking_reference();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE user_sessions IS 'JWT refresh token management';
COMMENT ON TABLE device_categories IS 'Device categories (MacBook, iPhone, etc.)';
COMMENT ON TABLE device_models IS 'Complete device database 2016-2025';
COMMENT ON TABLE repair_types IS 'Available repair services with pricing';
COMMENT ON TABLE bookings IS 'Customer repair bookings';
COMMENT ON TABLE repairs IS 'Repair tracking and workflow';
COMMENT ON TABLE repair_status_updates IS 'Real-time repair status updates';
COMMENT ON TABLE file_uploads IS 'File attachments for bookings and repairs';
COMMENT ON TABLE notifications IS 'User notification system';

-- Schema version tracking
CREATE TABLE schema_versions (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_versions (version, description) VALUES 
(1, 'Core schema - Backend foundation implementation');