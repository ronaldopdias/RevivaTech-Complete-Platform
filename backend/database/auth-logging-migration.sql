-- Authentication Logging Migration
-- Creates comprehensive audit trail for authentication events

BEGIN;

-- Create authentication events table
CREATE TABLE IF NOT EXISTS auth_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id TEXT,
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    error_code VARCHAR(100),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table if user exists
    CONSTRAINT fk_auth_events_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON auth_events(email);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip_address ON auth_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_events_success ON auth_events(success);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_session_id ON auth_events(session_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_auth_events_user_event_time 
    ON auth_events(user_id, event_type, created_at);
    
CREATE INDEX IF NOT EXISTS idx_auth_events_ip_event_time 
    ON auth_events(ip_address, event_type, created_at);
    
CREATE INDEX IF NOT EXISTS idx_auth_events_success_time 
    ON auth_events(success, created_at);

-- Create authentication statistics view
CREATE OR REPLACE VIEW auth_event_summary AS
SELECT 
    event_type,
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE success = true) as successful_events,
    COUNT(*) FILTER (WHERE success = false) as failed_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            ROUND(
                (COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric) * 100, 2
            )
        ELSE 0
    END as success_rate
FROM auth_events 
GROUP BY event_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC, event_type;

-- Create recent suspicious activity view
CREATE OR REPLACE VIEW recent_suspicious_activity AS
SELECT 
    user_id,
    email,
    ip_address,
    event_type,
    error_code,
    error_message,
    metadata,
    created_at
FROM auth_events
WHERE 
    success = false
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND (
        error_code IN ('RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY', 'INVALID_CREDENTIALS')
        OR event_type = 'suspicious_activity'
        OR (event_type = 'sign_in' AND success = false)
    )
ORDER BY created_at DESC;

-- Create user authentication timeline view  
CREATE OR REPLACE VIEW user_auth_timeline AS
SELECT 
    u.id as user_id,
    u.email,
    u."firstName",
    u."lastName", 
    ae.event_type,
    ae.success,
    ae.ip_address,
    ae.session_id,
    ae.error_code,
    ae.created_at
FROM users u
LEFT JOIN auth_events ae ON u.id = ae.user_id
WHERE ae.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.id, ae.created_at DESC;

-- Insert migration record
INSERT INTO better_auth_migration (step, notes) 
VALUES ('auth_logging_setup', 'Authentication logging tables and views created');

COMMIT;

-- Migration completed successfully
-- Authentication events will now be logged to auth_events table
-- Views provide convenient access to statistics and analysis