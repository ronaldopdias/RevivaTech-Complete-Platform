-- Email Management System Tables
-- Creates tables for comprehensive email account management

-- Enable required extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Email Accounts Table (manages multiple email configurations)
CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., 'Customer Support', 'No Reply', 'Quotes'
    email VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'support@revivatech.co.uk'
    purpose TEXT, -- Description of what this email is used for
    
    -- SMTP Configuration
    provider VARCHAR(50) NOT NULL DEFAULT 'zoho', -- 'zoho', 'gmail', 'sendgrid', 'smtp'
    smtp_host VARCHAR(255) NOT NULL DEFAULT 'smtp.zoho.com',
    smtp_port INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN NOT NULL DEFAULT false,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255), -- will be encrypted by application
    
    -- Email Settings
    from_name VARCHAR(100) NOT NULL DEFAULT 'RevivaTech',
    reply_to_email VARCHAR(255), -- Where replies should go
    
    -- Configuration
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false, -- Primary email for general use
    priority INTEGER NOT NULL DEFAULT 1, -- Priority for backup/failover
    
    -- Rate Limiting
    daily_limit INTEGER DEFAULT 1000,
    hourly_limit INTEGER DEFAULT 100,
    
    -- Tracking
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- Will reference users(id) when available
    updated_by TEXT, -- Will reference users(id) when available
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Statistics
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    last_error TEXT
);

-- Email Templates Table (reusable email templates)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., 'Booking Confirmation', 'Quote Request'
    slug VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'booking_confirmation'
    category VARCHAR(50) NOT NULL, -- e.g., 'booking', 'quote', 'support'
    
    -- Template Content
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Template Variables
    variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names used in template
    sample_data JSONB DEFAULT '{}'::jsonb, -- Sample data for preview
    
    -- Configuration
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Tracking
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- Will reference users(id) when available
    updated_by TEXT, -- Will reference users(id) when available
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITHOUT TIME ZONE
);

-- Email Queue Table (manages email sending queue) - Simplified for now
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES email_accounts(id),
    template_id UUID REFERENCES email_templates(id),
    
    -- Email Details
    to_email VARCHAR(255) NOT NULL,
    to_name VARCHAR(255),
    
    -- Content (resolved from template)
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Template Data
    template_data JSONB DEFAULT '{}'::jsonb,
    
    -- Queue Management
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed', 'cancelled'
    priority INTEGER NOT NULL DEFAULT 1, -- Higher number = higher priority
    scheduled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Results
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    error_message TEXT,
    message_id VARCHAR(255),
    
    -- Tracking
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- Will reference users(id) when available
    
    -- References (optional, will be added when tables exist)
    booking_id TEXT,
    customer_id TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);
CREATE INDEX IF NOT EXISTS idx_email_accounts_priority ON email_accounts(priority);

CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_account ON email_queue(account_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
DROP TRIGGER IF EXISTS update_email_accounts_updated_at_trigger ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at_trigger
    BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_email_accounts_updated_at();

DROP TRIGGER IF EXISTS update_email_templates_updated_at_trigger ON email_templates;
CREATE TRIGGER update_email_templates_updated_at_trigger
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_email_templates_updated_at();

DROP TRIGGER IF EXISTS update_email_queue_updated_at_trigger ON email_queue;
CREATE TRIGGER update_email_queue_updated_at_trigger
    BEFORE UPDATE ON email_queue
    FOR EACH ROW EXECUTE FUNCTION update_email_queue_updated_at();

-- Insert default email accounts based on .env configuration (plain text passwords for now)
INSERT INTO email_accounts (name, email, purpose, smtp_user, smtp_password, from_name, is_primary, priority) VALUES
('Main Business', 'info@revivatech.co.uk', 'General business communications and inquiries', 'info@revivatech.co.uk', 'heb0uRUCigLv', 'RevivaTech', true, 1),
('Customer Support', 'support@revivatech.co.uk', 'Customer service and support inquiries', 'support@revivatech.co.uk', 'heb0uRUCigLv', 'RevivaTech Support', false, 2),
('Repairs Department', 'repairs@revivatech.co.uk', 'Repair status updates and technical communications', 'repairs@revivatech.co.uk', 'heb0uRUCigLv', 'RevivaTech Repairs', false, 3),
('No Reply (Automated)', 'noreply@revivatech.co.uk', 'Automated booking confirmations and notifications', 'noreply@revivatech.co.uk', 'heb0uRUCigLv', 'RevivaTech', false, 4),
('Quotes Department', 'quotes@revivatech.co.uk', 'Price quotes and repair estimates', 'quotes@revivatech.co.uk', 'heb0uRUCigLv', 'RevivaTech Quotes', false, 5)
ON CONFLICT (email) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, slug, category, subject, html_content, text_content, variables, sample_data) VALUES
('Booking Confirmation', 'booking_confirmation', 'booking', 
'✅ Booking Confirmation #{bookingId} - {deviceName} Repair',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h1 style="color: #1A5266;">Booking Confirmed!</h1>
<p>Dear {customerName},</p>
<p>Your repair booking has been confirmed.</p>
<div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
<h3>Repair Details</h3>
<p><strong>Booking ID:</strong> #{bookingId}</p>
<p><strong>Device:</strong> {deviceName}</p>
<p><strong>Issue:</strong> {issue}</p>
<p><strong>Estimated Cost:</strong> £{estimatedCost}</p>
</div>
</div>',
'Booking Confirmed!\n\nDear {customerName},\n\nYour repair booking #{bookingId} has been confirmed.\n\nDevice: {deviceName}\nIssue: {issue}\nEstimated Cost: £{estimatedCost}',
'["customerName", "bookingId", "deviceName", "issue", "estimatedCost"]'::jsonb,
'{"customerName": "John Doe", "bookingId": "REV-12345", "deviceName": "MacBook Pro 16\"", "issue": "Screen replacement", "estimatedCost": "280.00"}'::jsonb),

('Repair Quote', 'repair_quote', 'quote',
'💰 Repair Quote #{quoteNumber} - {deviceName} Repair',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h1 style="color: #1A5266;">Repair Quote</h1>
<p>Dear {customerName},</p>
<p>We''ve prepared a detailed quote for your {deviceName} repair.</p>
<div style="background: #f9f9f9; padding: 20px; margin: 20px 0;">
<h3>Quote Details</h3>
<p><strong>Quote #:</strong> {quoteNumber}</p>
<p><strong>Device:</strong> {deviceName}</p>
<p><strong>Service:</strong> {serviceName}</p>
<p><strong>Total Cost:</strong> £{totalCost}</p>
<p><strong>Valid Until:</strong> {validUntil}</p>
</div>
</div>',
'Repair Quote\n\nDear {customerName},\n\nQuote #{quoteNumber} for {deviceName} repair:\n\nService: {serviceName}\nTotal Cost: £{totalCost}\nValid Until: {validUntil}',
'["customerName", "quoteNumber", "deviceName", "serviceName", "totalCost", "validUntil"]'::jsonb,
'{"customerName": "Jane Smith", "quoteNumber": "REV-67890", "deviceName": "MacBook Pro 16\"", "serviceName": "Screen replacement", "totalCost": "384.00", "validUntil": "July 31, 2025"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;