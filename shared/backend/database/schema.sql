-- RevivaTech New Platform Database Schema
-- PostgreSQL optimized schema for the new platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(200),
  address JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (for admin/technician access)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'technician',
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Recovery Bookings table
CREATE TABLE IF NOT EXISTS data_recovery_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Device Assessment Data
  device_assessment JSONB NOT NULL DEFAULT '{}',
  
  -- Data Prioritization
  data_prioritization JSONB NOT NULL DEFAULT '{}',
  
  -- AI Recovery Assessment
  recovery_assessment JSONB DEFAULT '{}',
  
  -- Service Selection
  service_selection JSONB NOT NULL DEFAULT '{}',
  
  -- Emergency Details
  emergency_details JSONB DEFAULT '{}',
  
  -- Booking Status and Metadata
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  
  -- Technician Assignment
  assigned_technician_id UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Recovery Analyses table
CREATE TABLE IF NOT EXISTS recovery_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES data_recovery_bookings(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Analysis Results
  analysis_date TIMESTAMP NOT NULL DEFAULT NOW(),
  device_condition VARCHAR(50) NOT NULL,
  overall_recovery_rate DECIMAL(5,2) NOT NULL CHECK (overall_recovery_rate >= 0 AND overall_recovery_rate <= 100),
  total_files_found INTEGER NOT NULL DEFAULT 0,
  total_size_recovered BIGINT NOT NULL DEFAULT 0,
  
  -- File Structure
  file_structure JSONB NOT NULL DEFAULT '[]',
  
  -- Recovery Report
  recovery_report JSONB NOT NULL DEFAULT '{}',
  
  -- File Management
  structure_file_path VARCHAR(500),
  structure_file_size BIGINT,
  structure_file_hash VARCHAR(64),
  
  -- Cost Information
  final_cost DECIMAL(10,2) NOT NULL,
  estimated_delivery_time VARCHAR(100),
  payment_required BOOLEAN NOT NULL DEFAULT true,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Verifications table
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES data_recovery_bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES recovery_analyses(id) ON DELETE CASCADE,
  
  -- File Selections
  selected_files JSONB NOT NULL DEFAULT '[]',
  rejected_files JSONB DEFAULT '[]',
  priority_files JSONB DEFAULT '[]',
  
  -- Customer Input
  customer_notes TEXT,
  verification_date TIMESTAMP DEFAULT NOW(),
  
  -- Approval Status
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_approval BOOLEAN DEFAULT FALSE,
  
  -- Delivery Information
  delivery_method VARCHAR(50),
  delivery_address JSONB,
  
  -- Cost and Payment
  total_approved_cost DECIMAL(10,2),
  estimated_delivery_date TIMESTAMP,
  
  -- Legal
  digital_signature TEXT,
  signature_timestamp TIMESTAMP,
  signature_ip_address INET,
  
  -- Expiration
  verification_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Completion
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Repair Bookings table (for other services)
CREATE TABLE IF NOT EXISTS repair_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Device Information
  device_type VARCHAR(100) NOT NULL,
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  device_serial VARCHAR(100),
  
  -- Problem Description
  problem_description TEXT NOT NULL,
  symptoms JSONB DEFAULT '[]',
  
  -- Service Information
  service_type VARCHAR(100) NOT NULL,
  urgency_level VARCHAR(50) DEFAULT 'normal',
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  
  -- Scheduling
  preferred_date DATE,
  preferred_time TIME,
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  assigned_technician_id UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES customers(id),
  
  -- Action Information
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}',
  
  -- Request Information
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_data_recovery_bookings_customer_id ON data_recovery_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_data_recovery_bookings_status ON data_recovery_bookings(status);
CREATE INDEX IF NOT EXISTS idx_data_recovery_bookings_created_at ON data_recovery_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_data_recovery_bookings_technician ON data_recovery_bookings(assigned_technician_id);

CREATE INDEX IF NOT EXISTS idx_recovery_analyses_booking_id ON recovery_analyses(booking_id);
CREATE INDEX IF NOT EXISTS idx_recovery_analyses_technician ON recovery_analyses(technician_id);
CREATE INDEX IF NOT EXISTS idx_recovery_analyses_status ON recovery_analyses(status);

CREATE INDEX IF NOT EXISTS idx_customer_verifications_booking_id ON customer_verifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_customer_id ON customer_verifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_status ON customer_verifications(approval_status);

CREATE INDEX IF NOT EXISTS idx_repair_bookings_customer_id ON repair_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_status ON repair_bookings(status);
CREATE INDEX IF NOT EXISTS idx_repair_bookings_created_at ON repair_bookings(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER IF NOT EXISTS update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_data_recovery_bookings_updated_at 
    BEFORE UPDATE ON data_recovery_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_recovery_analyses_updated_at 
    BEFORE UPDATE ON recovery_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_customer_verifications_updated_at 
    BEFORE UPDATE ON customer_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_repair_bookings_updated_at 
    BEFORE UPDATE ON repair_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, permissions)
VALUES (
  'admin@revivatech.co.uk',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LK8/WjJTk5J5J5J5J',
  'Admin',
  'User',
  'admin',
  '["admin", "technician", "manager"]'
) ON CONFLICT (email) DO NOTHING;

-- Insert default services data
INSERT INTO repair_bookings (id, customer_id, device_type, device_brand, problem_description, service_type, status)
VALUES (
  uuid_generate_v4(),
  (SELECT id FROM customers WHERE email = 'admin@revivatech.co.uk' LIMIT 1),
  'Sample Device',
  'Sample Brand',
  'Sample problem for testing',
  'diagnosis',
  'completed'
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE customers IS 'Customer information for all services';
COMMENT ON TABLE users IS 'System users (admin, technicians, managers)';
COMMENT ON TABLE data_recovery_bookings IS 'Data recovery service bookings';
COMMENT ON TABLE recovery_analyses IS 'Technician analysis results';
COMMENT ON TABLE customer_verifications IS 'Customer verification and approval';
COMMENT ON TABLE repair_bookings IS 'General repair service bookings';
COMMENT ON TABLE audit_logs IS 'System audit trail';