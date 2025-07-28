-- Email Template System Database Schema
-- Part of $28K Email Template System with Automation

-- Email Templates Table
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(200) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    template_type VARCHAR(50) NOT NULL DEFAULT 'marketing', -- marketing, transactional, system
    category VARCHAR(50) NOT NULL, -- booking, repair, support, etc.
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    parent_template_id INTEGER REFERENCES email_templates(id),
    variables JSONB DEFAULT '{}', -- Template variables and their types
    personalization_rules JSONB DEFAULT '{}', -- Rules for dynamic content
    compliance_settings JSONB DEFAULT '{}', -- GDPR, CAN-SPAM compliance
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    CONSTRAINT valid_template_type CHECK (template_type IN ('marketing', 'transactional', 'system')),
    CONSTRAINT valid_category CHECK (category IN ('booking', 'repair', 'support', 'marketing', 'onboarding', 'feedback', 'reactivation'))
);

-- Email Template Versions (for A/B testing)
CREATE TABLE email_template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
    version_name VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    is_active BOOLEAN DEFAULT false,
    test_percentage DECIMAL(5,2) DEFAULT 0, -- Percentage for A/B testing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performance_data JSONB DEFAULT '{}', -- Open rates, click rates, etc.
    UNIQUE(template_id, version_name)
);

-- Email Campaigns
CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_id INTEGER NOT NULL REFERENCES email_templates(id),
    campaign_type VARCHAR(50) NOT NULL DEFAULT 'one_time', -- one_time, automated, recurring
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, active, paused, completed
    
    -- Scheduling
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    send_time TIME, -- For recurring campaigns
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Targeting
    audience_criteria JSONB DEFAULT '{}', -- Segmentation rules
    max_recipients INTEGER,
    
    -- A/B Testing
    enable_ab_testing BOOLEAN DEFAULT false,
    ab_test_config JSONB DEFAULT '{}',
    
    -- Performance
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_campaign_type CHECK (campaign_type IN ('one_time', 'automated', 'recurring')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'))
);

-- Email Automation Workflows
CREATE TABLE email_workflows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- booking_abandoned, repair_completed, etc.
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- Timing
    delay_minutes INTEGER DEFAULT 0, -- Delay before sending
    max_executions_per_user INTEGER DEFAULT 1, -- Prevent spam
    
    -- Performance
    total_triggered INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
        'booking_abandoned', 'booking_confirmed', 'repair_started', 'repair_completed',
        'payment_received', 'customer_inactive', 'feedback_request', 'welcome', 'reactivation'
    ))
);

-- Email Workflow Steps
CREATE TABLE email_workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES email_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    template_id INTEGER NOT NULL REFERENCES email_templates(id),
    delay_minutes INTEGER DEFAULT 0, -- Delay after previous step
    conditions JSONB DEFAULT '{}', -- Conditions to execute this step
    is_active BOOLEAN DEFAULT true,
    
    -- Performance
    total_sent INTEGER DEFAULT 0,
    
    UNIQUE(workflow_id, step_order)
);

-- Email Sends (Individual email tracking)
CREATE TABLE email_sends (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL,
    user_id INTEGER, -- NULL for non-registered users
    template_id INTEGER NOT NULL REFERENCES email_templates(id),
    campaign_id INTEGER REFERENCES email_campaigns(id),
    workflow_id INTEGER REFERENCES email_workflows(id),
    workflow_step_id INTEGER REFERENCES email_workflow_steps(id),
    
    -- Message Details
    subject VARCHAR(500) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(100),
    reply_to VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'queued', -- queued, sent, delivered, bounced, failed
    external_message_id VARCHAR(255), -- SendGrid message ID
    
    -- Personalization Data
    personalization_data JSONB DEFAULT '{}',
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_send_status CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'cancelled'))
);

-- Email Events (Opens, clicks, etc.)
CREATE TABLE email_events (
    id SERIAL PRIMARY KEY,
    email_send_id INTEGER NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL, -- open, click, bounce, spam, unsubscribe
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Event Details
    user_agent TEXT,
    ip_address INET,
    location JSONB DEFAULT '{}', -- GeoIP data
    
    -- Click-specific
    clicked_url TEXT, -- For click events
    link_name VARCHAR(100), -- Named links in template
    
    -- Device/Platform
    device_type VARCHAR(20), -- mobile, desktop, tablet
    platform VARCHAR(50),
    browser VARCHAR(50),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('open', 'click', 'bounce', 'spam', 'unsubscribe', 'delivered'))
);

-- Email Preferences (User opt-ins/opt-outs)
CREATE TABLE email_preferences (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER, -- NULL for non-registered users
    
    -- Subscription Preferences
    marketing_emails BOOLEAN DEFAULT true,
    transactional_emails BOOLEAN DEFAULT true,
    repair_updates BOOLEAN DEFAULT true,
    promotional_offers BOOLEAN DEFAULT true,
    newsletter BOOLEAN DEFAULT false,
    
    -- Global Settings
    is_globally_unsubscribed BOOLEAN DEFAULT false,
    unsubscribe_token VARCHAR(255) UNIQUE,
    
    -- Frequency Preferences
    max_emails_per_week INTEGER DEFAULT 10,
    preferred_send_time TIME DEFAULT '10:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Compliance
    consent_given_at TIMESTAMP WITH TIME ZONE,
    consent_ip_address INET,
    consent_source VARCHAR(100), -- web_form, api, import
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Analytics Summary (Daily aggregates)
CREATE TABLE email_analytics_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    template_id INTEGER REFERENCES email_templates(id),
    campaign_id INTEGER REFERENCES email_campaigns(id),
    
    -- Volume Metrics
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    unique_opens INTEGER DEFAULT 0,
    total_opens INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    spam_complaints INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    
    -- Performance Metrics
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,
    click_to_open_rate DECIMAL(5,4) DEFAULT 0,
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    spam_rate DECIMAL(5,4) DEFAULT 0,
    unsubscribe_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Revenue Attribution (if applicable)
    attributed_revenue DECIMAL(10,2) DEFAULT 0,
    attributed_conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, template_id, campaign_id)
);

-- A/B Test Results
CREATE TABLE email_ab_test_results (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES email_campaigns(id),
    template_version_a INTEGER NOT NULL REFERENCES email_template_versions(id),
    template_version_b INTEGER NOT NULL REFERENCES email_template_versions(id),
    
    -- Test Configuration
    test_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    test_end_date TIMESTAMP WITH TIME ZONE,
    significance_level DECIMAL(5,4) DEFAULT 0.05,
    
    -- Version A Results
    version_a_sent INTEGER DEFAULT 0,
    version_a_opens INTEGER DEFAULT 0,
    version_a_clicks INTEGER DEFAULT 0,
    version_a_conversions INTEGER DEFAULT 0,
    version_a_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Version B Results
    version_b_sent INTEGER DEFAULT 0,
    version_b_opens INTEGER DEFAULT 0,
    version_b_clicks INTEGER DEFAULT 0,
    version_b_conversions INTEGER DEFAULT 0,
    version_b_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Statistical Analysis
    winner VARCHAR(10), -- 'A', 'B', or 'inconclusive'
    confidence_level DECIMAL(5,4),
    p_value DECIMAL(10,8),
    statistical_significance BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_winner CHECK (winner IN ('A', 'B', 'inconclusive'))
);

-- Indexes for Performance
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

CREATE INDEX idx_email_sends_email ON email_sends(email_address);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX idx_email_sends_template ON email_sends(template_id);
CREATE INDEX idx_email_sends_campaign ON email_sends(campaign_id);

CREATE INDEX idx_email_events_send_id ON email_events(email_send_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_timestamp ON email_events(timestamp);

CREATE INDEX idx_email_preferences_email ON email_preferences(email_address);
CREATE INDEX idx_email_preferences_unsubscribed ON email_preferences(is_globally_unsubscribed);

CREATE INDEX idx_email_analytics_date ON email_analytics_daily(date);
CREATE INDEX idx_email_analytics_template ON email_analytics_daily(template_id);
CREATE INDEX idx_email_analytics_campaign ON email_analytics_daily(campaign_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_workflows_updated_at BEFORE UPDATE ON email_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();