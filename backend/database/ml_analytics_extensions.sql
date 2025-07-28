-- RevivaTech Phase 4 ML Analytics Extensions
-- Additional tables for ML training data and advanced analytics

-- ML Training Data Table
CREATE TABLE IF NOT EXISTS ml_training_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    user_id VARCHAR(255),
    query_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
    confidence_score DECIMAL(5,2),
    response_time_ms INTEGER,
    user_context JSONB,
    device_type VARCHAR(100),
    issue_category VARCHAR(100),
    resolution_status VARCHAR(50) DEFAULT 'pending',
    ml_model_version VARCHAR(50),
    features JSONB, -- Store extracted features for ML training
    labels JSONB,   -- Store classification labels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ml_training_query (query_text),
    INDEX idx_ml_training_device (device_type),
    INDEX idx_ml_training_category (issue_category),
    INDEX idx_ml_training_created (created_at)
);

-- ML Model Performance Metrics
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dataset_size INTEGER,
    training_duration_seconds INTEGER,
    hyperparameters JSONB,
    performance_notes TEXT,
    is_production BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ml_metrics_model (model_name, model_version),
    INDEX idx_ml_metrics_date (evaluation_date),
    UNIQUE(model_name, model_version, metric_name, evaluation_date)
);

-- Advanced User Behavior Analytics
CREATE TABLE IF NOT EXISTS user_interaction_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    interaction_type VARCHAR(100) NOT NULL, -- 'query', 'click', 'scroll', 'download'
    interaction_target VARCHAR(255),
    interaction_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_url VARCHAR(500),
    user_agent TEXT,
    device_info JSONB,
    engagement_score DECIMAL(5,2),
    conversion_value DECIMAL(10,2),
    INDEX idx_interaction_user (user_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_interaction_timestamp (timestamp),
    INDEX idx_interaction_session (session_id)
);

-- Real-time Analytics Aggregations
CREATE TABLE IF NOT EXISTS analytics_aggregations (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    dimension_name VARCHAR(100),
    dimension_value VARCHAR(255),
    time_period VARCHAR(50), -- 'hour', 'day', 'week', 'month'
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    record_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agg_metric (metric_name),
    INDEX idx_agg_period (time_period, period_start),
    INDEX idx_agg_dimension (dimension_name, dimension_value),
    UNIQUE(metric_name, dimension_name, dimension_value, time_period, period_start)
);

-- Phase 4 System Performance Monitoring
CREATE TABLE IF NOT EXISTS system_performance_logs (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    request_method VARCHAR(10),
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    error_message TEXT,
    trace_id VARCHAR(255),
    user_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    additional_metrics JSONB,
    INDEX idx_perf_service (service_name),
    INDEX idx_perf_endpoint (endpoint),
    INDEX idx_perf_timestamp (timestamp),
    INDEX idx_perf_response_time (response_time_ms),
    INDEX idx_perf_status (status_code)
);

-- ML Feature Store
CREATE TABLE IF NOT EXISTS ml_feature_store (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    feature_type VARCHAR(50) NOT NULL, -- 'numerical', 'categorical', 'text', 'boolean'
    entity_id VARCHAR(255) NOT NULL,   -- user_id, session_id, device_id, etc.
    entity_type VARCHAR(50) NOT NULL,  -- 'user', 'session', 'device', 'repair'
    feature_value JSONB NOT NULL,
    feature_version INTEGER DEFAULT 1,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    tags JSONB,
    INDEX idx_feature_name (feature_name),
    INDEX idx_feature_entity (entity_type, entity_id),
    INDEX idx_feature_computed (computed_at),
    INDEX idx_feature_expires (expires_at),
    UNIQUE(feature_name, entity_id, feature_version)
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id SERIAL PRIMARY KEY,
    experiment_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    traffic_allocation DECIMAL(5,2) DEFAULT 100.00,
    variants JSONB NOT NULL, -- Array of variant configurations
    success_metrics JSONB,   -- Definition of success metrics
    target_audience JSONB,   -- Targeting criteria
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ab_experiment_status (status),
    INDEX idx_ab_experiment_dates (start_date, end_date)
);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ab_test_experiments(id),
    user_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    conversion_events JSONB,
    is_converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    INDEX idx_ab_assignment_exp (experiment_id),
    INDEX idx_ab_assignment_user (user_id),
    INDEX idx_ab_assignment_variant (variant_name),
    UNIQUE(experiment_id, user_id)
);

-- Advanced Procedure Analytics
CREATE TABLE IF NOT EXISTS procedure_performance_analytics (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES repair_procedures(id),
    metric_type VARCHAR(100) NOT NULL, -- 'completion_rate', 'success_rate', 'avg_time', 'user_rating'
    metric_value DECIMAL(10,4) NOT NULL,
    measurement_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    sample_size INTEGER DEFAULT 0,
    confidence_interval JSONB, -- Statistical confidence intervals
    benchmark_comparison DECIMAL(10,4), -- Comparison to historical average
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_proc_analytics_id (procedure_id),
    INDEX idx_proc_analytics_metric (metric_type),
    INDEX idx_proc_analytics_period (measurement_period, period_start),
    UNIQUE(procedure_id, metric_type, measurement_period, period_start)
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ml_training_data_updated_at 
    BEFORE UPDATE ON ml_training_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ab_test_experiments_updated_at 
    BEFORE UPDATE ON ab_test_experiments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized views for common aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_ml_performance AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_queries,
    AVG(confidence_score) as avg_confidence,
    AVG(response_time_ms) as avg_response_time,
    AVG(CASE WHEN feedback_score >= 4 THEN 1.0 ELSE 0.0 END) as satisfaction_rate,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT device_type) as device_variety
FROM ml_training_data 
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON daily_ml_performance (date);

CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_system_performance AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    service_name,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    AVG(memory_usage_mb) as avg_memory_usage,
    AVG(cpu_usage_percent) as avg_cpu_usage,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM system_performance_logs 
GROUP BY DATE_TRUNC('hour', timestamp), service_name
ORDER BY hour DESC, service_name;

CREATE UNIQUE INDEX ON hourly_system_performance (hour, service_name);

-- Create indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_ml_training_user_context ON ml_training_data USING GIN (user_context);
CREATE INDEX IF NOT EXISTS idx_ml_training_features ON ml_training_data USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_interaction_data ON user_interaction_analytics USING GIN (interaction_data);
CREATE INDEX IF NOT EXISTS idx_ml_feature_value ON ml_feature_store USING GIN (feature_value);

-- Insert initial data for ML model tracking
INSERT INTO ml_model_metrics (model_name, model_version, metric_name, metric_value, dataset_size, is_production)
VALUES 
    ('recommendation_engine', '4.0.0', 'accuracy', 92.4, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'precision', 89.7, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'recall', 91.2, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'f1_score', 90.4, 10000, TRUE),
    ('sentiment_classifier', '2.1.0', 'accuracy', 88.6, 5000, TRUE),
    ('intent_classifier', '3.2.0', 'accuracy', 94.1, 8000, TRUE)
ON CONFLICT DO NOTHING;

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_ml_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_system_performance;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to refresh views (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '*/15 * * * *', 'SELECT refresh_analytics_views();');

COMMENT ON TABLE ml_training_data IS 'Stores ML training data with user interactions and feedback';
COMMENT ON TABLE ml_model_metrics IS 'Tracks ML model performance metrics over time';
COMMENT ON TABLE user_interaction_analytics IS 'Advanced user behavior analytics for ML training';
COMMENT ON TABLE analytics_aggregations IS 'Pre-computed analytics aggregations for dashboard performance';
COMMENT ON TABLE system_performance_logs IS 'System performance monitoring for Phase 4 services';
COMMENT ON TABLE ml_feature_store IS 'Feature store for ML model inputs and computed features';
COMMENT ON TABLE ab_test_experiments IS 'A/B testing framework for ML model improvements';
COMMENT ON TABLE procedure_performance_analytics IS 'Advanced analytics for repair procedure performance';

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO revivatech_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO revivatech_user;