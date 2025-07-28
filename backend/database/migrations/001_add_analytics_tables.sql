-- RevivaTech Analytics Migration Script
-- Migration: 001_add_analytics_tables.sql
-- Description: Add analytics events and user behavior tracking tables
-- Date: 2025-07-15
-- PHASE 1.2: PostgreSQL Schema Extension for Analytics

-- This migration adds comprehensive analytics capabilities to RevivaTech
-- Following the PRD requirements for Google/Facebook-level analytics

BEGIN;

-- ============================================================================
-- MIGRATION METADATA
-- ============================================================================
INSERT INTO migrations (
    version, 
    description, 
    applied_at
) VALUES (
    '001', 
    'Add analytics tables for events and user behavior tracking', 
    CURRENT_TIMESTAMP
) ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
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

-- Performance indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_fingerprint ON analytics_events(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_utm_source ON analytics_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url ON analytics_events(page_url);
CREATE INDEX IF NOT EXISTS idx_analytics_events_fingerprint_type ON analytics_events(user_fingerprint, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created ON analytics_events(session_id, created_at);

-- ============================================================================
-- USER BEHAVIOR PROFILES TABLE
-- ============================================================================
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
    
    -- ML scores (0-100)
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
    
    -- RFM analysis
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

-- Performance indexes for user_behavior_profiles
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_fingerprint ON user_behavior_profiles(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_user_id ON user_behavior_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_segment ON user_behavior_profiles(customer_segment);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_lead_score ON user_behavior_profiles(lead_score);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_engagement ON user_behavior_profiles(engagement_score);
CREATE INDEX IF NOT EXISTS idx_user_behavior_profiles_last_seen ON user_behavior_profiles(last_seen_at);

-- ============================================================================
-- CUSTOMER JOURNEY MAPPING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_journeys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Journey tracking
    journey_stage TEXT NOT NULL,
    touchpoint TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    
    -- Stage metrics
    time_spent_seconds NUMERIC(10,2) DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    page_views_in_stage INTEGER DEFAULT 0,
    events_in_stage INTEGER DEFAULT 0,
    
    -- Journey context
    entry_method TEXT,
    traffic_source TEXT,
    campaign_id TEXT,
    content_consumed JSONB DEFAULT '{}',
    actions_taken JSONB DEFAULT '{}',
    
    -- Conversion tracking
    converted_in_stage BOOLEAN DEFAULT FALSE,
    conversion_value NUMERIC(10,2) DEFAULT 0,
    conversion_type TEXT,
    
    -- Exit tracking
    exit_point TEXT,
    exit_reason TEXT,
    next_stage TEXT,
    
    -- Timestamps
    stage_entered_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stage_exited_at TIMESTAMP(3) WITHOUT TIME ZONE,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for customer_journeys
CREATE INDEX IF NOT EXISTS idx_customer_journeys_fingerprint ON customer_journeys(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_session ON customer_journeys(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage ON customer_journeys(journey_stage);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_touchpoint ON customer_journeys(touchpoint);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_sequence ON customer_journeys(sequence_number);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_created_at ON customer_journeys(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_fingerprint_sequence ON customer_journeys(user_fingerprint, sequence_number);
CREATE INDEX IF NOT EXISTS idx_customer_journeys_stage_entered ON customer_journeys(journey_stage, stage_entered_at);

-- ============================================================================
-- ML PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ml_predictions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Model information
    model_type TEXT NOT NULL,
    model_version TEXT NOT NULL,
    
    -- Prediction results
    prediction_value NUMERIC(10,6) NOT NULL,
    prediction_label TEXT,
    confidence_score NUMERIC(5,4) NOT NULL,
    probability_scores JSONB DEFAULT '{}',
    
    -- Model inputs
    features_used JSONB NOT NULL,
    feature_importance JSONB DEFAULT '{}',
    input_data_hash TEXT,
    
    -- Validation tracking
    actual_outcome TEXT,
    prediction_accuracy NUMERIC(5,4),
    validated_at TIMESTAMP(3) WITHOUT TIME ZONE,
    
    -- Metadata
    prediction_context JSONB DEFAULT '{}',
    expires_at TIMESTAMP(3) WITHOUT TIME ZONE,
    created_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for ml_predictions
CREATE INDEX IF NOT EXISTS idx_ml_predictions_fingerprint ON ml_predictions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_type ON ml_predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_version ON ml_predictions(model_version);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_expires_at ON ml_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_fingerprint_model ON ml_predictions(user_fingerprint, model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_created ON ml_predictions(model_type, created_at);

-- ============================================================================
-- ANALYTICS SESSIONS TABLE
-- ============================================================================
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

-- Performance indexes for analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_fingerprint ON analytics_sessions(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start ON analytics_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_traffic_source ON analytics_sessions(traffic_source);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_bounce ON analytics_sessions(bounce);

-- ============================================================================
-- CONVERSION FUNNELS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversion_funnels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_fingerprint TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    
    -- Funnel identification
    funnel_name TEXT NOT NULL,
    funnel_version TEXT DEFAULT 'v1',
    
    -- Step tracking
    step_name TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_category TEXT,
    
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

-- Performance indexes for conversion_funnels
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_fingerprint ON conversion_funnels(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_session ON conversion_funnels(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_name ON conversion_funnels(funnel_name);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_step ON conversion_funnels(step_number);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_completed ON conversion_funnels(completed_step);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_dropped ON conversion_funnels(dropped_off);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_name_step ON conversion_funnels(funnel_name, step_number);
CREATE INDEX IF NOT EXISTS idx_conversion_funnels_fingerprint_funnel ON conversion_funnels(user_fingerprint, funnel_name);

-- ============================================================================
-- ANALYTICS AGGREGATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_aggregations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    
    -- Aggregation metadata
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    dimension TEXT,
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

-- Performance indexes for analytics_aggregations
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_metric ON analytics_aggregations(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_type ON analytics_aggregations(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_period_start ON analytics_aggregations(period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_dimension ON analytics_aggregations(dimension, dimension_value);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_metric_period ON analytics_aggregations(metric_name, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregations_type_period ON analytics_aggregations(metric_type, period_start);

-- ============================================================================
-- CREATE MIGRATIONS TABLE IF IT DOESN'T EXIST
-- ============================================================================
CREATE TABLE IF NOT EXISTS migrations (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP(3) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update user behavior profile when new events are added
CREATE OR REPLACE FUNCTION update_user_behavior_profile()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_user_behavior_profile ON analytics_events;
CREATE TRIGGER trg_update_user_behavior_profile
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_behavior_profile();

-- Function for data cleanup (retention policy)
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
-- ANALYTICAL VIEWS
-- ============================================================================

-- Real-time metrics view
CREATE OR REPLACE VIEW v_realtime_metrics AS
SELECT 
    COUNT(DISTINCT user_fingerprint) as active_users_last_hour,
    COUNT(DISTINCT session_id) as active_sessions_last_hour,
    COUNT(*) as events_last_hour,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views_last_hour,
    COUNT(CASE WHEN event_type = 'booking_completed' THEN 1 END) as conversions_last_hour,
    ROUND(AVG(
        CASE WHEN event_data ? 'session_duration' 
        THEN (event_data->>'session_duration')::NUMERIC 
        ELSE NULL END
    ), 2) as avg_session_duration_minutes
FROM analytics_events 
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour';

-- User segmentation view
CREATE OR REPLACE VIEW v_user_segments AS
SELECT 
    customer_segment,
    COUNT(*) as user_count,
    ROUND(AVG(engagement_score), 2) as avg_engagement_score,
    ROUND(AVG(lead_score), 2) as avg_lead_score,
    ROUND(AVG(total_bookings), 2) as avg_bookings,
    ROUND(AVG(total_booking_value), 2) as avg_booking_value,
    ROUND(AVG(conversion_probability), 4) as avg_conversion_probability
FROM user_behavior_profiles 
WHERE last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY customer_segment
ORDER BY user_count DESC;

-- Conversion funnel summary view
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
         NULLIF(COUNT(DISTINCT user_fingerprint), 0)::NUMERIC) * 100, 2
    ) as completion_rate,
    ROUND(
        (COUNT(CASE WHEN dropped_off THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT user_fingerprint), 0)::NUMERIC) * 100, 2
    ) as drop_off_rate
FROM conversion_funnels 
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY funnel_name, step_number, step_name
ORDER BY funnel_name, step_number;

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO revivatech_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO revivatech_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO revivatech_user;

-- Add table comments for documentation
COMMENT ON TABLE analytics_events IS 'Core analytics events table storing all user interactions and behaviors - PHASE 1.2 implementation';
COMMENT ON TABLE user_behavior_profiles IS 'Aggregated user behavior data for ML models and customer insights';
COMMENT ON TABLE customer_journeys IS 'Customer journey mapping with stages and touchpoint tracking';
COMMENT ON TABLE ml_predictions IS 'Machine learning model predictions and scores for users';
COMMENT ON TABLE analytics_sessions IS 'Enhanced session tracking with analytics-specific metrics';
COMMENT ON TABLE conversion_funnels IS 'Conversion funnel tracking with step-by-step analysis';
COMMENT ON TABLE analytics_aggregations IS 'Pre-calculated metrics for dashboard performance optimization';

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Analytics migration 001 completed successfully! Added % tables with comprehensive indexing and views.', 
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name LIKE '%analytics%' OR table_name LIKE '%behavior%' OR table_name LIKE '%journey%' OR table_name LIKE '%prediction%' OR table_name LIKE '%funnel%');
END $$;