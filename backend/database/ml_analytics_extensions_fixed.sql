-- RevivaTech Phase 4 ML Analytics Extensions - Fixed
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
    features JSONB,
    labels JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advanced User Behavior Analytics
CREATE TABLE IF NOT EXISTS user_interaction_analytics (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    interaction_type VARCHAR(100) NOT NULL,
    interaction_target VARCHAR(255),
    interaction_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_url VARCHAR(500),
    user_agent TEXT,
    device_info JSONB,
    engagement_score DECIMAL(5,2),
    conversion_value DECIMAL(10,2)
);

-- Real-time Analytics Aggregations
CREATE TABLE IF NOT EXISTS analytics_aggregations (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    dimension_name VARCHAR(100),
    dimension_value VARCHAR(255),
    time_period VARCHAR(50),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    record_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    additional_metrics JSONB
);

-- ML Feature Store
CREATE TABLE IF NOT EXISTS ml_feature_store (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    feature_value JSONB NOT NULL,
    feature_version INTEGER DEFAULT 1,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    tags JSONB
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_test_experiments (
    id SERIAL PRIMARY KEY,
    experiment_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    traffic_allocation DECIMAL(5,2) DEFAULT 100.00,
    variants JSONB NOT NULL,
    success_metrics JSONB,
    target_audience JSONB,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES ab_test_experiments(id),
    user_id VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    conversion_events JSONB,
    is_converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2)
);

-- Advanced Procedure Analytics
CREATE TABLE IF NOT EXISTS procedure_performance_analytics (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    measurement_period VARCHAR(50),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    sample_size INTEGER DEFAULT 0,
    confidence_interval JSONB,
    benchmark_comparison DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes after tables are created
CREATE INDEX IF NOT EXISTS idx_ml_training_query ON ml_training_data (query_text);
CREATE INDEX IF NOT EXISTS idx_ml_training_device ON ml_training_data (device_type);
CREATE INDEX IF NOT EXISTS idx_ml_training_category ON ml_training_data (issue_category);
CREATE INDEX IF NOT EXISTS idx_ml_training_created ON ml_training_data (created_at);

CREATE INDEX IF NOT EXISTS idx_ml_metrics_model ON ml_model_metrics (model_name, model_version);
CREATE INDEX IF NOT EXISTS idx_ml_metrics_date ON ml_model_metrics (evaluation_date);

CREATE INDEX IF NOT EXISTS idx_interaction_user ON user_interaction_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON user_interaction_analytics (interaction_type);
CREATE INDEX IF NOT EXISTS idx_interaction_timestamp ON user_interaction_analytics (timestamp);
CREATE INDEX IF NOT EXISTS idx_interaction_session ON user_interaction_analytics (session_id);

CREATE INDEX IF NOT EXISTS idx_agg_metric ON analytics_aggregations (metric_name);
CREATE INDEX IF NOT EXISTS idx_agg_period ON analytics_aggregations (time_period, period_start);
CREATE INDEX IF NOT EXISTS idx_agg_dimension ON analytics_aggregations (dimension_name, dimension_value);

CREATE INDEX IF NOT EXISTS idx_perf_service ON system_performance_logs (service_name);
CREATE INDEX IF NOT EXISTS idx_perf_endpoint ON system_performance_logs (endpoint);
CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON system_performance_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_perf_response_time ON system_performance_logs (response_time_ms);
CREATE INDEX IF NOT EXISTS idx_perf_status ON system_performance_logs (status_code);

CREATE INDEX IF NOT EXISTS idx_feature_name ON ml_feature_store (feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_entity ON ml_feature_store (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_feature_computed ON ml_feature_store (computed_at);
CREATE INDEX IF NOT EXISTS idx_feature_expires ON ml_feature_store (expires_at);

CREATE INDEX IF NOT EXISTS idx_ab_experiment_status ON ab_test_experiments (status);
CREATE INDEX IF NOT EXISTS idx_ab_experiment_dates ON ab_test_experiments (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ab_assignment_exp ON ab_test_assignments (experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignment_user ON ab_test_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignment_variant ON ab_test_assignments (variant_name);

CREATE INDEX IF NOT EXISTS idx_proc_analytics_id ON procedure_performance_analytics (procedure_id);
CREATE INDEX IF NOT EXISTS idx_proc_analytics_metric ON procedure_performance_analytics (metric_type);
CREATE INDEX IF NOT EXISTS idx_proc_analytics_period ON procedure_performance_analytics (measurement_period, period_start);

-- Add unique constraints
ALTER TABLE ml_model_metrics ADD CONSTRAINT IF NOT EXISTS unique_ml_metrics 
    UNIQUE(model_name, model_version, metric_name, evaluation_date);

ALTER TABLE analytics_aggregations ADD CONSTRAINT IF NOT EXISTS unique_analytics_agg 
    UNIQUE(metric_name, dimension_name, dimension_value, time_period, period_start);

ALTER TABLE ml_feature_store ADD CONSTRAINT IF NOT EXISTS unique_ml_features 
    UNIQUE(feature_name, entity_id, feature_version);

ALTER TABLE ab_test_assignments ADD CONSTRAINT IF NOT EXISTS unique_ab_assignment 
    UNIQUE(experiment_id, user_id);

ALTER TABLE procedure_performance_analytics ADD CONSTRAINT IF NOT EXISTS unique_proc_analytics 
    UNIQUE(procedure_id, metric_type, measurement_period, period_start);

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

-- Create JSONB indexes
CREATE INDEX IF NOT EXISTS idx_ml_training_user_context ON ml_training_data USING GIN (user_context);
CREATE INDEX IF NOT EXISTS idx_ml_training_features ON ml_training_data USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_interaction_data ON user_interaction_analytics USING GIN (interaction_data);
CREATE INDEX IF NOT EXISTS idx_ml_feature_value ON ml_feature_store USING GIN (feature_value);

-- Insert initial ML model metrics
INSERT INTO ml_model_metrics (model_name, model_version, metric_name, metric_value, dataset_size, is_production)
VALUES 
    ('recommendation_engine', '4.0.0', 'accuracy', 92.4, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'precision', 89.7, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'recall', 91.2, 10000, TRUE),
    ('recommendation_engine', '4.0.0', 'f1_score', 90.4, 10000, TRUE),
    ('sentiment_classifier', '2.1.0', 'accuracy', 88.6, 5000, TRUE),
    ('intent_classifier', '3.2.0', 'accuracy', 94.1, 8000, TRUE)
ON CONFLICT ON CONSTRAINT unique_ml_metrics DO NOTHING;

-- Create materialized views for analytics
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_ml_perf_date ON daily_ml_performance (date);

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_sys_perf ON hourly_system_performance (hour, service_name);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_ml_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_system_performance;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE ml_training_data IS 'Stores ML training data with user interactions and feedback for Phase 4';
COMMENT ON TABLE ml_model_metrics IS 'Tracks ML model performance metrics over time';
COMMENT ON TABLE user_interaction_analytics IS 'Advanced user behavior analytics for ML training';
COMMENT ON TABLE analytics_aggregations IS 'Pre-computed analytics aggregations for dashboard performance';
COMMENT ON TABLE system_performance_logs IS 'System performance monitoring for Phase 4 services';
COMMENT ON TABLE ml_feature_store IS 'Feature store for ML model inputs and computed features';
COMMENT ON TABLE ab_test_experiments IS 'A/B testing framework for ML model improvements';
COMMENT ON TABLE procedure_performance_analytics IS 'Advanced analytics for repair procedure performance';