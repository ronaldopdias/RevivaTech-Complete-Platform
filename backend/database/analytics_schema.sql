-- RevivaTech Analytics Schema Extension
-- PHASE 1.2: PostgreSQL Schema for Analytics Events and User Behavior Tracking
-- This file extends the existing schema with analytics-specific tables

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
-- Core table for storing all user interaction events
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    ip_address INET,
    geo_country TEXT,
    geo_city TEXT,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP(3) WITHOUT TIME ZONE
);

-- Indexes for analytics_events table
CREATE INDEX IF NOT EXISTS idx_analytics_events_fingerprint ON analytics_events(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url ON analytics_events(page_url);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_fingerprint_type ON analytics_events(user_fingerprint, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created ON analytics_events(session_id, created_at);

-- ============================================================================
-- USER BEHAVIOR PROFILES TABLE
-- ============================================================================
-- Aggregated user behavior data for ML and analytics
CREATE TABLE IF NOT EXISTS user_behavior_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL UNIQUE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Session metrics
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration_seconds NUMERIC(10,2) DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    pages_per_session NUMERIC(6,2) DEFAULT 0,
    bounce_rate NUMERIC(5,4) DEFAULT 0,
    
    -- Engagement metrics
    total_events INTEGER DEFAULT 0,
    scroll_depth_avg NUMERIC(5,2) DEFAULT 0,
    click_through_rate NUMERIC(5,4) DEFAULT 0,
    form_completion_rate NUMERIC(5,4) DEFAULT 0,
    time_on_site_total_seconds INTEGER DEFAULT 0,
    
    -- Business metrics
    booking_conversion_rate NUMERIC(5,4) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_booking_value NUMERIC(12,2) DEFAULT 0,
    avg_booking_value NUMERIC(10,2) DEFAULT 0,
    price_check_frequency INTEGER DEFAULT 0,
    service_comparison_count INTEGER DEFAULT 0,
    
    -- Behavioral scores (0-100)
    engagement_score NUMERIC(5,2) DEFAULT 0,
    lead_score NUMERIC(5,2) DEFAULT 0,
    conversion_probability NUMERIC(5,4) DEFAULT 0,
    churn_risk_score NUMERIC(5,2) DEFAULT 0,
    price_sensitivity_score NUMERIC(5,2) DEFAULT 0,
    
    -- Customer segmentation
    customer_segment TEXT DEFAULT 'Unknown',
    behavioral_traits JSONB DEFAULT '{}',
    preferred_device_types TEXT[] DEFAULT '{}',
    preferred_contact_methods TEXT[] DEFAULT '{}',
    
    -- Recency, Frequency, Monetary (RFM) analysis
    days_since_first_visit INTEGER DEFAULT 0,
    days_since_last_visit INTEGER DEFAULT 0,
    visit_frequency_score NUMERIC(5,2) DEFAULT 0,
    monetary_value_score NUMERIC(5,2) DEFAULT 0,
    
    -- Technical attributes
    primary_browser TEXT,
    primary_os TEXT,
    primary_device_type TEXT,
    mobile_usage_rate NUMERIC(5,4) DEFAULT 0,
    
    -- Timestamps
    first_seen_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_behavior_profiles table
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_fingerprint ON user_behavior_profiles(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_user_id ON user_behavior_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_segment ON user_behavior_profiles(customer_segment);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_lead_score ON user_behavior_profiles(lead_score);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_engagement ON user_behavior_profiles(engagement_score);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_last_seen ON user_behavior_profiles(last_seen_at);

-- ============================================================================
-- CUSTOMER JOURNEY MAPPING TABLE
-- ============================================================================
-- Track customer journey stages and touchpoints
CREATE TABLE IF NOT EXISTS customer_journeys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Journey tracking
    journey_stage TEXT NOT NULL, -- awareness, interest, consideration, conversion, retention
    touchpoint TEXT NOT NULL, -- landing_page, pricing_page, service_detail, booking_form, etc.
    sequence_number INTEGER NOT NULL,
    
    -- Stage metrics
    time_spent_seconds NUMERIC(10,2) DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    page_views_in_stage INTEGER DEFAULT 0,
    events_in_stage INTEGER DEFAULT 0,
    
    -- Journey context
    entry_method TEXT, -- organic, paid, direct, referral, social
    traffic_source TEXT,
    campaign_id TEXT,
    content_consumed JSONB DEFAULT '{}',
    actions_taken JSONB DEFAULT '{}',
    
    -- Conversion tracking
    converted_in_stage BOOLEAN DEFAULT FALSE,
    conversion_value NUMERIC(10,2) DEFAULT 0,
    conversion_type TEXT, -- booking, quote_request, contact, newsletter
    
    -- Exit tracking
    exit_point TEXT,
    exit_reason TEXT, -- abandoned, completed, bounced, diverted
    next_stage TEXT,
    
    -- Timestamps
    stage_entered_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage_exited_at TIMESTAMP(3) WITHOUT TIME ZONE,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for customer_journeys table
CREATE INDEX IF NOT EXISTS idx_customer_journeys_fingerprint ON customer_journeys(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_session ON customer_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage ON customer_journeys(journey_stage);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_touchpoint ON customer_journeys(touchpoint);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_sequence ON customer_journeys(sequence_number);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_created_at ON customer_journeys(created_at);

-- Composite indexes for journey analysis
CREATE INDEX IF NOT EXISTS idx_customer_journeys_fingerprint_sequence ON customer_journeys(user_fingerprint, sequence_number);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage_entered ON customer_journeys(journey_stage, stage_entered_at);

-- ============================================================================
-- ML PREDICTIONS TABLE
-- ============================================================================
-- Store machine learning model predictions and scores
CREATE TABLE IF NOT EXISTS ml_predictions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Model information
    model_type TEXT NOT NULL, -- lead_scoring, churn_prediction, segment_classification, price_sensitivity
    model_version TEXT NOT NULL,
    
    -- Prediction results
    prediction_value NUMERIC(10,6) NOT NULL,
    prediction_label TEXT,
    confidence_score NUMERIC(5,4) NOT NULL,
    probability_scores JSONB DEFAULT '{}', -- For multi-class predictions
    
    -- Model inputs
    features_used JSONB NOT NULL,
    feature_importance JSONB DEFAULT '{}',
    input_data_hash TEXT, -- For reproducibility
    
    -- Validation tracking
    actual_outcome TEXT,
    prediction_accuracy NUMERIC(5,4),
    validated_at TIMESTAMP(3) WITHOUT TIME ZONE,
    
    -- Metadata
    prediction_context JSONB DEFAULT '{}',
    expires_at TIMESTAMP(3) WITHOUT TIME ZONE,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ml_predictions table
CREATE INDEX IF NOT EXISTS idx_ml_predictions_fingerprint ON ml_predictions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_type ON ml_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_version ON ml_predictions(model_version);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_expires_at ON ml_predictions(expires_at);

-- Composite indexes for ML queries
CREATE INDEX IF NOT EXISTS idx_ml_predictions_fingerprint_model ON ml_predictions(user_fingerprint, model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_created ON ml_predictions(model_type, created_at);

-- ============================================================================
-- ANALYTICS SESSIONS TABLE
-- ============================================================================
-- Enhanced session tracking with analytics-specific data
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    session_id TEXT NOT NULL UNIQUE,
    user_fingerprint TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Session basic info
    session_start TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP(3) WITHOUT TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    
    -- Traffic source
    traffic_source TEXT,
    traffic_medium TEXT,
    traffic_campaign TEXT,
    referrer_domain TEXT,
    landing_page TEXT,
    exit_page TEXT,
    
    -- Device/Technical info
    device_type TEXT,
    device_brand TEXT,
    browser TEXT,
    browser_version TEXT,
    os TEXT,
    os_version TEXT,
    screen_resolution TEXT,
    viewport_size TEXT,
    user_agent TEXT,
    
    -- Location data
    ip_address INET,
    geo_country TEXT,
    geo_region TEXT,
    geo_city TEXT,
    timezone TEXT,
    
    -- Session metrics
    page_views INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    scroll_depth_max NUMERIC(5,2) DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    form_submissions INTEGER DEFAULT 0,
    
    -- Engagement metrics
    engagement_score NUMERIC(5,2) DEFAULT 0,
    bounce BOOLEAN DEFAULT FALSE,
    time_to_first_interaction_ms INTEGER,
    pages_before_conversion INTEGER DEFAULT 0,
    
    -- Conversion tracking
    goals_completed TEXT[] DEFAULT '{}',
    conversion_events JSONB DEFAULT '{}',
    revenue_generated NUMERIC(12,2) DEFAULT 0,
    
    -- Quality scores
    quality_score NUMERIC(5,2) DEFAULT 0,
    spam_score NUMERIC(5,2) DEFAULT 0,
    bot_probability NUMERIC(5,4) DEFAULT 0,
    
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics_sessions table
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_fingerprint ON analytics_sessions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start ON analytics_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_traffic_source ON analytics_sessions(traffic_source);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_bounce ON analytics_sessions(bounce);

-- ============================================================================
-- CONVERSION FUNNELS TABLE
-- ============================================================================
-- Track conversion funnel steps and drop-off points
CREATE TABLE IF NOT EXISTS conversion_funnels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Funnel identification
    funnel_name TEXT NOT NULL, -- booking_funnel, quote_funnel, contact_funnel
    funnel_version TEXT DEFAULT 'v1',
    
    -- Step tracking
    step_name TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_category TEXT, -- awareness, consideration, conversion
    
    -- Step metrics
    entered_step_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    exited_step_at TIMESTAMP(3) WITHOUT TIME ZONE,
    time_in_step_seconds NUMERIC(10,2),
    completed_step BOOLEAN DEFAULT FALSE,
    
    -- Drop-off analysis
    dropped_off BOOLEAN DEFAULT FALSE,
    drop_off_reason TEXT,
    next_step TEXT,
    
    -- Context data
    entry_source TEXT,
    step_data JSONB DEFAULT '{}',
    conversion_value NUMERIC(10,2) DEFAULT 0,
    
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for conversion_funnels table
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_fingerprint ON conversion_funnels(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_session ON conversion_funnels(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_name ON conversion_funnels(funnel_name);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_step ON conversion_funnels(step_number);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_completed ON conversion_funnels(completed_step);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_dropped ON conversion_funnels(dropped_off);

-- Composite indexes for funnel analysis
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_name_step ON conversion_funnels(funnel_name, step_number);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_fingerprint_funnel ON conversion_funnels(user_fingerprint, funnel_name);

-- ============================================================================
-- ANALYTICS AGGREGATIONS TABLE
-- ============================================================================
-- Pre-calculated aggregations for dashboard performance
CREATE TABLE IF NOT EXISTS analytics_aggregations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Aggregation metadata
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- hourly, daily, weekly, monthly
    dimension TEXT, -- page, source, device, segment
    dimension_value TEXT,
    
    -- Time period
    period_start TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    period_end TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL,
    
    -- Metric values
    metric_value NUMERIC(15,4) NOT NULL,
    count_value INTEGER DEFAULT 0,
    
    -- Metadata
    calculation_method TEXT,
    data_quality_score NUMERIC(5,2) DEFAULT 100,
    last_calculated_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics_aggregations table
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_metric ON analytics_aggregations(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_type ON analytics_aggregations(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_period_start ON analytics_aggregations(period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_dimension ON analytics_aggregations(dimension, dimension_value);

-- Composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_metric_period ON analytics_aggregations(metric_name, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_type_period ON analytics_aggregations(metric_type, period_start);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update user behavior profile when new events are added
CREATE OR REPLACE FUNCTION update_user_behavior_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert user behavior profile
    INSERT INTO user_behavior_profiles (user_fingerprint, user_id, last_seen_at, last_updated_at)
    VALUES (NEW.user_fingerprint, NEW.user_id, NEW.created_at, CURRENT_TIMESTAMP)
    ON CONFLICT (user_fingerprint) 
    DO UPDATE SET 
        user_id = COALESCE(EXCLUDED.user_id, user_behavior_profiles.user_id),
        last_seen_at = EXCLUDED.last_seen_at,
        last_updated_at = EXCLUDED.last_updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user behavior profiles
CREATE TRIGGER trg_update_user_behavior_profile
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_behavior_profile();

-- Function to clean up old analytics data (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    -- Delete events older than 2 years
    DELETE FROM analytics_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '2 years';
    
    -- Delete old session data older than 1 year
    DELETE FROM analytics_sessions 
    WHERE session_start < CURRENT_TIMESTAMP - INTERVAL '1 year';
    
    -- Delete expired ML predictions
    DELETE FROM ml_predictions 
    WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up old aggregations older than 3 years
    DELETE FROM analytics_aggregations 
    WHERE period_start < CURRENT_TIMESTAMP - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON ANALYTICS QUERIES
-- ============================================================================

-- Real-time metrics view
CREATE OR REPLACE VIEW v_realtime_metrics AS
SELECT 
    COUNT(DISTINCT user_fingerprint) as active_users_last_hour,
    COUNT(DISTINCT session_id) as active_sessions_last_hour,
    COUNT(*) as events_last_hour,
    AVG(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) as avg_page_views_per_user,
    COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as conversions_last_hour
FROM analytics_events 
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- User segmentation view
CREATE OR REPLACE VIEW v_user_segments AS
SELECT 
    customer_segment,
    COUNT(*) as user_count,
    AVG(engagement_score) as avg_engagement_score,
    AVG(lead_score) as avg_lead_score,
    AVG(total_bookings) as avg_bookings,
    AVG(total_booking_value) as avg_booking_value
FROM user_behavior_profiles 
WHERE last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY customer_segment;

-- Conversion funnel view
CREATE OR REPLACE VIEW v_conversion_funnel_summary AS
SELECT 
    funnel_name,
    step_number,
    step_name,
    COUNT(DISTINCT user_fingerprint) as users_entered,
    COUNT(CASE WHEN completed_step THEN 1 END) as users_completed,
    COUNT(CASE WHEN dropped_off THEN 1 END) as users_dropped,
    ROUND(
        (COUNT(CASE WHEN completed_step THEN 1 END)::NUMERIC / 
         COUNT(DISTINCT user_fingerprint)::NUMERIC) * 100, 2
    ) as completion_rate
FROM conversion_funnels 
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY funnel_name, step_number, step_name
ORDER BY funnel_name, step_number;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE analytics_events IS 'Core analytics events table storing all user interactions and behaviors';
COMMENT ON TABLE user_behavior_profiles IS 'Aggregated user behavior data for ML models and customer insights';
COMMENT ON TABLE customer_journeys IS 'Customer journey mapping with stages and touchpoint tracking';
COMMENT ON TABLE ml_predictions IS 'Machine learning model predictions and scores for users';
COMMENT ON TABLE analytics_sessions IS 'Enhanced session tracking with analytics-specific metrics';
COMMENT ON TABLE conversion_funnels IS 'Conversion funnel tracking with step-by-step analysis';
COMMENT ON TABLE analytics_aggregations IS 'Pre-calculated metrics for dashboard performance';

COMMENT ON COLUMN analytics_events.user_fingerprint IS 'Browser fingerprint for anonymous user tracking';
COMMENT ON COLUMN analytics_events.event_data IS 'JSON data containing event-specific information';
COMMENT ON COLUMN user_behavior_profiles.engagement_score IS 'Calculated engagement score (0-100) based on user interactions';
COMMENT ON COLUMN user_behavior_profiles.lead_score IS 'ML-calculated lead scoring (0-100) for conversion probability';
COMMENT ON COLUMN user_behavior_profiles.behavioral_traits IS 'JSON object containing behavioral analysis results';

-- Grant necessary permissions (adjust according to your user setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO revivatech_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO revivatech_user;