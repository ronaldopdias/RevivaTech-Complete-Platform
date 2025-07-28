/**
 * RevivaTech Admin Analytics API
 * Dashboard data and ML metrics integration
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'revivatech_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'revivatech_new',
    password: process.env.DB_PASSWORD || 'secure_password_2024',
    port: process.env.DB_PORT || 5435,
});

// Phase 4 AI server connection
const PHASE4_SERVER_URL = process.env.PHASE4_SERVER_URL || 'http://localhost:3015';

// Helper function to fetch ML metrics from Phase 4 server
const fetchPhase4Metrics = async () => {
    try {
        const response = await axios.get(`${PHASE4_SERVER_URL}/api/ai-advanced/metrics`, {
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('⚠️ Warning: Cannot connect to Phase 4 server:', error.message);
        return null;
    }
};

// Helper function to calculate time periods
const getTimePeriod = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
        start: startDate.toISOString(),
        end: now.toISOString()
    };
};

// GET /api/admin/analytics/dashboard - Main dashboard metrics
router.get('/dashboard', async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const { start, end } = getTimePeriod(period);

        // Fetch data in parallel
        const [
            procedureStats,
            mediaStats,
            recentActivity,
            mlMetrics,
            phase4Metrics,
            systemPerformance
        ] = await Promise.all([
            // Procedure statistics
            pool.query(`
                SELECT 
                    COUNT(*) as total_procedures,
                    COUNT(*) FILTER (WHERE status = 'Published') as published_count,
                    COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
                    COUNT(*) FILTER (WHERE created_at >= $1) as recent_procedures,
                    ROUND(AVG(success_rate), 2) as avg_success_rate,
                    SUM(view_count) as total_views
                FROM repair_procedures
            `, [start]),

            // Media statistics
            pool.query(`
                SELECT 
                    COUNT(*) as total_files,
                    COUNT(*) FILTER (WHERE file_type = 'image') as image_count,
                    COUNT(*) FILTER (WHERE file_type = 'video') as video_count,
                    ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_size_mb,
                    COUNT(*) FILTER (WHERE upload_date >= $1) as recent_uploads
                FROM media_files 
                WHERE status = 'active'
            `, [start]),

            // Recent activity
            pool.query(`
                SELECT 
                    'procedure' as activity_type,
                    title as description,
                    created_at as timestamp,
                    'created' as action
                FROM repair_procedures 
                WHERE created_at >= $1
                UNION ALL
                SELECT 
                    'media' as activity_type,
                    original_name as description,
                    upload_date as timestamp,
                    'uploaded' as action
                FROM media_files 
                WHERE upload_date >= $1 AND status = 'active'
                ORDER BY timestamp DESC 
                LIMIT 10
            `, [start]),

            // ML Model Metrics from database
            pool.query(`
                SELECT 
                    model_name,
                    model_version,
                    metric_name,
                    metric_value,
                    evaluation_date
                FROM ml_model_metrics 
                WHERE evaluation_date >= $1
                ORDER BY evaluation_date DESC
            `, [start]),

            // Phase 4 server metrics
            fetchPhase4Metrics(),

            // System performance logs
            pool.query(`
                SELECT 
                    service_name,
                    AVG(response_time_ms) as avg_response_time,
                    COUNT(*) as request_count,
                    COUNT(*) FILTER (WHERE status_code >= 400) as error_count
                FROM system_performance_logs 
                WHERE request_timestamp >= $1
                GROUP BY service_name
                ORDER BY request_count DESC
            `, [start]).catch(() => ({ rows: [] })) // Graceful fallback if table doesn't exist
        ]);

        // Aggregate ML metrics
        const mlMetricsAggregated = {};
        mlMetrics.rows.forEach(row => {
            if (!mlMetricsAggregated[row.model_name]) {
                mlMetricsAggregated[row.model_name] = {};
            }
            mlMetricsAggregated[row.model_name][row.metric_name] = {
                value: parseFloat(row.metric_value),
                version: row.model_version,
                updated: row.evaluation_date
            };
        });

        // Build dashboard response
        const dashboardData = {
            overview: {
                procedures: procedureStats.rows[0],
                media: mediaStats.rows[0],
                performance: {
                    phase4_connected: !!phase4Metrics,
                    ml_accuracy: mlMetricsAggregated.recommendation_engine?.accuracy?.value || 0,
                    system_health: phase4Metrics?.system_health || 'unknown'
                }
            },
            recent_activity: recentActivity.rows,
            ml_metrics: {
                database_metrics: mlMetricsAggregated,
                phase4_metrics: phase4Metrics,
                last_updated: new Date().toISOString()
            },
            system_performance: systemPerformance.rows,
            metadata: {
                period,
                generated_at: new Date().toISOString(),
                data_sources: {
                    database: true,
                    phase4_server: !!phase4Metrics,
                    performance_logs: systemPerformance.rows.length > 0
                }
            }
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('❌ Error fetching dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard analytics',
            details: error.message
        });
    }
});

// GET /api/admin/analytics/procedures - Procedure-specific analytics
router.get('/procedures', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { start, end } = getTimePeriod(period);

        const [
            categoryBreakdown,
            difficultyDistribution,
            topProcedures,
            successRatesTrend,
            viewStatistics
        ] = await Promise.all([
            // Category breakdown
            pool.query(`
                SELECT 
                    category,
                    COUNT(*) as procedure_count,
                    ROUND(AVG(success_rate), 2) as avg_success_rate,
                    SUM(view_count) as total_views
                FROM repair_procedures 
                WHERE status = 'Published'
                GROUP BY category
                ORDER BY procedure_count DESC
            `),

            // Difficulty distribution
            pool.query(`
                SELECT 
                    difficulty,
                    COUNT(*) as count,
                    ROUND(AVG(success_rate), 2) as avg_success_rate
                FROM repair_procedures 
                WHERE status = 'Published'
                GROUP BY difficulty
                ORDER BY count DESC
            `),

            // Top procedures by views
            pool.query(`
                SELECT 
                    procedure_id,
                    title,
                    device_model,
                    category,
                    view_count,
                    success_rate,
                    video_count,
                    image_count
                FROM repair_procedures 
                WHERE status = 'Published'
                ORDER BY view_count DESC
                LIMIT 10
            `),

            // Success rates trend (mock data - would need historical tracking)
            pool.query(`
                SELECT 
                    DATE_TRUNC('day', updated_at) as date,
                    ROUND(AVG(success_rate), 2) as avg_success_rate,
                    COUNT(*) as procedures_updated
                FROM repair_procedures 
                WHERE updated_at >= $1 AND status = 'Published'
                GROUP BY DATE_TRUNC('day', updated_at)
                ORDER BY date DESC
                LIMIT 30
            `, [start]),

            // View statistics
            pool.query(`
                SELECT 
                    SUM(view_count) as total_views,
                    ROUND(AVG(view_count), 2) as avg_views_per_procedure,
                    MAX(view_count) as max_views,
                    COUNT(*) FILTER (WHERE view_count > 100) as popular_procedures
                FROM repair_procedures 
                WHERE status = 'Published'
            `)
        ]);

        res.json({
            success: true,
            data: {
                category_breakdown: categoryBreakdown.rows,
                difficulty_distribution: difficultyDistribution.rows,
                top_procedures: topProcedures.rows,
                success_rates_trend: successRatesTrend.rows,
                view_statistics: viewStatistics.rows[0],
                period,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching procedure analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch procedure analytics',
            details: error.message
        });
    }
});

// GET /api/admin/analytics/ml-metrics - ML model performance metrics
router.get('/ml-metrics', async (req, res) => {
    try {
        const { model_name, period = '30d' } = req.query;
        const { start, end } = getTimePeriod(period);

        let whereClause = 'WHERE evaluation_date >= $1';
        let queryParams = [start];

        if (model_name) {
            whereClause += ' AND model_name = $2';
            queryParams.push(model_name);
        }

        const [
            modelMetrics,
            trainingData,
            featureStore,
            phase4Status
        ] = await Promise.all([
            // Model performance metrics
            pool.query(`
                SELECT 
                    model_name,
                    model_version,
                    metric_name,
                    metric_value,
                    evaluation_date,
                    dataset_size,
                    training_duration_seconds,
                    is_production
                FROM ml_model_metrics 
                ${whereClause}
                ORDER BY evaluation_date DESC
            `, queryParams),

            // Training data statistics
            pool.query(`
                SELECT 
                    COUNT(*) as total_samples,
                    COUNT(DISTINCT device_type) as device_types,
                    COUNT(DISTINCT issue_category) as issue_categories,
                    ROUND(AVG(confidence_score), 2) as avg_confidence,
                    ROUND(AVG(feedback_score), 2) as avg_feedback_score
                FROM ml_training_data 
                WHERE created_at >= $1
            `, [start]),

            // Feature store stats (if exists)
            pool.query(`
                SELECT 
                    COUNT(*) as total_features,
                    COUNT(DISTINCT feature_group) as feature_groups
                FROM ml_feature_store 
                WHERE created_at >= $1
            `, [start]).catch(() => ({ rows: [{ total_features: 0, feature_groups: 0 }] })),

            // Phase 4 system status
            fetchPhase4Metrics()
        ]);

        // Group metrics by model
        const modelMetricsGrouped = {};
        modelMetrics.rows.forEach(row => {
            if (!modelMetricsGrouped[row.model_name]) {
                modelMetricsGrouped[row.model_name] = {
                    model_name: row.model_name,
                    model_version: row.model_version,
                    metrics: {},
                    last_evaluation: row.evaluation_date,
                    is_production: row.is_production
                };
            }
            modelMetricsGrouped[row.model_name].metrics[row.metric_name] = {
                value: parseFloat(row.metric_value),
                dataset_size: row.dataset_size,
                training_duration: row.training_duration_seconds,
                evaluation_date: row.evaluation_date
            };
        });

        res.json({
            success: true,
            data: {
                model_metrics: Object.values(modelMetricsGrouped),
                training_data: trainingData.rows[0],
                feature_store: featureStore.rows[0],
                phase4_status: {
                    connected: !!phase4Status,
                    metrics: phase4Status,
                    last_check: new Date().toISOString()
                },
                period,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching ML metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ML metrics',
            details: error.message
        });
    }
});

// GET /api/admin/analytics/system-health - System health and performance
router.get('/system-health', async (req, res) => {
    try {
        const { period = '24h' } = req.query;
        const { start, end } = getTimePeriod(period);

        const [
            serviceStatus,
            errorRates,
            responseTimesTrend,
            phase4Health
        ] = await Promise.all([
            // Service status from performance logs
            pool.query(`
                SELECT 
                    service_name,
                    COUNT(*) as total_requests,
                    ROUND(AVG(response_time_ms), 2) as avg_response_time,
                    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms), 2) as p95_response_time,
                    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
                    ROUND((COUNT(*) FILTER (WHERE status_code < 400)::float / COUNT(*) * 100), 2) as success_rate
                FROM system_performance_logs 
                WHERE request_timestamp >= $1
                GROUP BY service_name
                ORDER BY total_requests DESC
            `, [start]).catch(() => ({ rows: [] })),

            // Error rates over time
            pool.query(`
                SELECT 
                    DATE_TRUNC('hour', request_timestamp) as hour,
                    COUNT(*) as total_requests,
                    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
                    ROUND((COUNT(*) FILTER (WHERE status_code >= 400)::float / COUNT(*) * 100), 2) as error_rate
                FROM system_performance_logs 
                WHERE request_timestamp >= $1
                GROUP BY DATE_TRUNC('hour', request_timestamp)
                ORDER BY hour DESC
                LIMIT 24
            `, [start]).catch(() => ({ rows: [] })),

            // Response times trend
            pool.query(`
                SELECT 
                    DATE_TRUNC('hour', request_timestamp) as hour,
                    ROUND(AVG(response_time_ms), 2) as avg_response_time,
                    ROUND(MIN(response_time_ms), 2) as min_response_time,
                    ROUND(MAX(response_time_ms), 2) as max_response_time
                FROM system_performance_logs 
                WHERE request_timestamp >= $1
                GROUP BY DATE_TRUNC('hour', request_timestamp)
                ORDER BY hour DESC
                LIMIT 24
            `, [start]).catch(() => ({ rows: [] })),

            // Phase 4 health check
            axios.get(`${PHASE4_SERVER_URL}/api/ai-advanced/health`, {
                timeout: 3000
            }).then(response => response.data).catch(() => null)
        ]);

        // Calculate overall system health
        const overallHealth = {
            status: 'healthy',
            services_online: serviceStatus.rows.length,
            avg_success_rate: serviceStatus.rows.length > 0 
                ? Math.round(serviceStatus.rows.reduce((sum, service) => sum + service.success_rate, 0) / serviceStatus.rows.length)
                : 0,
            phase4_connected: !!phase4Health
        };

        if (overallHealth.avg_success_rate < 95) {
            overallHealth.status = 'degraded';
        }
        if (overallHealth.avg_success_rate < 90) {
            overallHealth.status = 'unhealthy';
        }

        res.json({
            success: true,
            data: {
                overall_health: overallHealth,
                service_status: serviceStatus.rows,
                error_rates: errorRates.rows,
                response_times: responseTimesTrend.rows,
                phase4_health: phase4Health,
                period,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching system health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system health',
            details: error.message
        });
    }
});

// GET /api/admin/analytics/user-interactions - User interaction analytics
router.get('/user-interactions', async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        const { start, end } = getTimePeriod(period);

        const [
            interactionSummary,
            engagementMetrics,
            deviceBreakdown
        ] = await Promise.all([
            // User interaction summary
            pool.query(`
                SELECT 
                    interaction_type,
                    COUNT(*) as interaction_count,
                    COUNT(DISTINCT user_id) as unique_users,
                    ROUND(AVG(engagement_score), 2) as avg_engagement_score
                FROM user_interaction_analytics 
                WHERE timestamp >= $1
                GROUP BY interaction_type
                ORDER BY interaction_count DESC
            `, [start]).catch(() => ({ rows: [] })),

            // Engagement metrics over time
            pool.query(`
                SELECT 
                    DATE_TRUNC('day', timestamp) as date,
                    COUNT(*) as total_interactions,
                    COUNT(DISTINCT user_id) as unique_users,
                    ROUND(AVG(engagement_score), 2) as avg_engagement
                FROM user_interaction_analytics 
                WHERE timestamp >= $1
                GROUP BY DATE_TRUNC('day', timestamp)
                ORDER BY date DESC
            `, [start]).catch(() => ({ rows: [] })),

            // Device breakdown
            pool.query(`
                SELECT 
                    device_info->>'device_type' as device_type,
                    COUNT(*) as interaction_count,
                    ROUND(AVG(engagement_score), 2) as avg_engagement
                FROM user_interaction_analytics 
                WHERE timestamp >= $1 AND device_info IS NOT NULL
                GROUP BY device_info->>'device_type'
                ORDER BY interaction_count DESC
            `, [start]).catch(() => ({ rows: [] }))
        ]);

        res.json({
            success: true,
            data: {
                interaction_summary: interactionSummary.rows,
                engagement_metrics: engagementMetrics.rows,
                device_breakdown: deviceBreakdown.rows,
                period,
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error fetching user interaction analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user interaction analytics',
            details: error.message
        });
    }
});

// POST /api/admin/analytics/refresh - Refresh cached analytics data
router.post('/refresh', async (req, res) => {
    try {
        const { component } = req.body; // 'dashboard', 'procedures', 'ml-metrics', 'system-health'

        // Refresh materialized views if they exist
        const refreshQueries = [
            'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_procedures_summary',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_ml_metrics_summary',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_system_performance_summary'
        ];

        const refreshResults = [];
        for (const query of refreshQueries) {
            try {
                await pool.query(query);
                refreshResults.push({ query, status: 'success' });
            } catch (error) {
                refreshResults.push({ query, status: 'failed', error: error.message });
            }
        }

        // Update analytics aggregations table
        const aggregationQuery = `
            INSERT INTO analytics_aggregations (
                metric_name, dimension_name, dimension_value, time_period,
                period_start, period_end, metric_value, record_count, last_updated
            ) VALUES 
            ('procedures_published', 'status', 'published', 'current', 
             CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 
             (SELECT COUNT(*) FROM repair_procedures WHERE status = 'Published'), 
             1, CURRENT_TIMESTAMP)
            ON CONFLICT (metric_name, dimension_name, dimension_value, time_period, period_start) 
            DO UPDATE SET 
                metric_value = EXCLUDED.metric_value,
                record_count = EXCLUDED.record_count,
                last_updated = CURRENT_TIMESTAMP
        `;

        try {
            await pool.query(aggregationQuery);
            refreshResults.push({ query: 'analytics_aggregations', status: 'success' });
        } catch (error) {
            refreshResults.push({ query: 'analytics_aggregations', status: 'failed', error: error.message });
        }

        res.json({
            success: true,
            data: {
                refresh_results: refreshResults,
                refreshed_at: new Date().toISOString(),
                component: component || 'all'
            },
            message: 'Analytics data refresh completed'
        });

    } catch (error) {
        console.error('❌ Error refreshing analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh analytics data',
            details: error.message
        });
    }
});

module.exports = router;