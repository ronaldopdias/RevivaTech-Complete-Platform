/**
 * RevivaTech Admin Database Management API
 * Comprehensive database administration interface with enterprise features
 * Following 2025 best practices for PostgreSQL web admin tools
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const winston = require('winston');

// Initialize PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'revivatech_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'revivatech_new',
    password: process.env.DB_PASSWORD || 'secure_password_2024',
    port: process.env.DB_PORT || 5435,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Logger for database operations
const dbLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'database-admin.log' })
    ]
});

// Audit logging middleware
const auditLog = (req, res, next) => {
    const audit = {
        user: req.user?.email || 'unknown',
        action: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    };
    dbLogger.info('Database Admin Action', audit);
    req.audit = audit;
    next();
};

// Apply audit logging to all routes
router.use(auditLog);

// Security middleware - limit query execution time and result size
const queryLimits = {
    maxExecutionTime: 30000, // 30 seconds
    maxRows: 10000,
    maxQueryLength: 50000
};

const validateQuery = (query) => {
    if (!query || typeof query !== 'string') {
        throw new Error('Query must be a non-empty string');
    }
    
    if (query.length > queryLimits.maxQueryLength) {
        throw new Error(`Query too long. Maximum ${queryLimits.maxQueryLength} characters allowed`);
    }
    
    // Block dangerous operations
    const dangerousPatterns = [
        /drop\s+database/i,
        /create\s+database/i,
        /alter\s+system/i,
        /pg_terminate_backend/i,
        /pg_cancel_backend/i
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            throw new Error('Query contains restricted operations');
        }
    }
    
    return true;
};

// =============================================================================
// SCHEMA MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/admin/database/schema
 * Get complete database schema information
 */
router.get('/schema', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            // Get all tables with metadata
            const tablesQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    tableowner,
                    hasindexes,
                    hasrules,
                    hastriggers,
                    rowsecurity
                FROM pg_tables 
                WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
                ORDER BY schemaname, tablename;
            `;
            
            // Get all views
            const viewsQuery = `
                SELECT 
                    schemaname,
                    viewname,
                    viewowner,
                    definition
                FROM pg_views 
                WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
                ORDER BY schemaname, viewname;
            `;
            
            // Get all sequences
            const sequencesQuery = `
                SELECT 
                    schemaname,
                    sequencename,
                    sequenceowner
                FROM pg_sequences 
                WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
                ORDER BY schemaname, sequencename;
            `;
            
            // Get all functions
            const functionsQuery = `
                SELECT 
                    n.nspname as schema,
                    p.proname as name,
                    pg_get_function_result(p.oid) as result_type,
                    pg_get_function_arguments(p.oid) as arguments
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
                ORDER BY n.nspname, p.proname;
            `;
            
            const [tables, views, sequences, functions] = await Promise.all([
                client.query(tablesQuery),
                client.query(viewsQuery),
                client.query(sequencesQuery),
                client.query(functionsQuery)
            ]);
            
            // Get database size and statistics
            const statsQuery = `
                SELECT 
                    pg_size_pretty(pg_database_size(current_database())) as database_size,
                    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                    current_database() as database_name,
                    version() as postgresql_version;
            `;
            
            const stats = await client.query(statsQuery);
            
            res.json({
                success: true,
                data: {
                    database: stats.rows[0],
                    tables: tables.rows,
                    views: views.rows,
                    sequences: sequences.rows,
                    functions: functions.rows
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Schema fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database schema',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/database/tables
 * Get list of all tables with detailed metadata
 */
router.get('/tables', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT 
                    t.table_schema,
                    t.table_name,
                    t.table_type,
                    pg_size_pretty(pg_total_relation_size(c.oid)) as size,
                    pg_stat_get_tuples_returned(c.oid) as rows_read,
                    pg_stat_get_tuples_inserted(c.oid) as rows_inserted,
                    pg_stat_get_tuples_updated(c.oid) as rows_updated,
                    pg_stat_get_tuples_deleted(c.oid) as rows_deleted,
                    obj_description(c.oid) as comment
                FROM information_schema.tables t
                LEFT JOIN pg_class c ON c.relname = t.table_name
                LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
                WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
                ORDER BY t.table_schema, t.table_name;
            `;
            
            const result = await client.query(query);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length,
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Tables fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tables',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/database/tables/:tableName
 * Get detailed information about a specific table
 */
router.get('/tables/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const client = await pool.connect();
        
        try {
            // Get column information
            const columnsQuery = `
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `;
            
            // Get indexes
            const indexesQuery = `
                SELECT 
                    indexname,
                    indexdef,
                    tablespace
                FROM pg_indexes
                WHERE tablename = $1 AND schemaname = 'public';
            `;
            
            // Get constraints
            const constraintsQuery = `
                SELECT 
                    constraint_name,
                    constraint_type,
                    column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_name = $1 AND tc.table_schema = 'public';
            `;
            
            // Get foreign key relationships
            const foreignKeysQuery = `
                SELECT 
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
            `;
            
            const [columns, indexes, constraints, foreignKeys] = await Promise.all([
                client.query(columnsQuery, [tableName]),
                client.query(indexesQuery, [tableName]),
                client.query(constraintsQuery, [tableName]),
                client.query(foreignKeysQuery, [tableName])
            ]);
            
            res.json({
                success: true,
                data: {
                    table_name: tableName,
                    columns: columns.rows,
                    indexes: indexes.rows,
                    constraints: constraints.rows,
                    foreign_keys: foreignKeys.rows
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error(`❌ Table ${req.params.tableName} fetch error:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to fetch table ${req.params.tableName}`,
            details: error.message
        });
    }
});

// =============================================================================
// QUERY ENGINE ENDPOINTS
// =============================================================================

/**
 * POST /api/admin/database/query
 * Execute SQL query with validation and limits
 */
router.post('/query', async (req, res) => {
    try {
        const { query, params = [] } = req.body;
        
        // Validate query
        validateQuery(query);
        
        const client = await pool.connect();
        const startTime = Date.now();
        
        try {
            // Set query timeout
            await client.query('SET statement_timeout = $1', [queryLimits.maxExecutionTime]);
            
            // Execute query
            const result = await client.query(query, params);
            const executionTime = Date.now() - startTime;
            
            // Limit result size
            let rows = result.rows;
            let truncated = false;
            
            if (rows.length > queryLimits.maxRows) {
                rows = rows.slice(0, queryLimits.maxRows);
                truncated = true;
            }
            
            // Log query execution
            dbLogger.info('Query executed', {
                user: req.user?.email,
                query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
                executionTime,
                rowCount: result.rowCount,
                truncated
            });
            
            res.json({
                success: true,
                data: {
                    rows,
                    fields: result.fields || [],
                    rowCount: result.rowCount,
                    executionTime,
                    truncated,
                    command: result.command
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Query execution error:', error);
        
        // Log query error
        dbLogger.error('Query failed', {
            user: req.user?.email,
            query: req.body.query?.substring(0, 200),
            error: error.message
        });
        
        res.status(400).json({
            success: false,
            error: 'Query execution failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/admin/database/query/explain
 * Get query execution plan
 */
router.post('/query/explain', async (req, res) => {
    try {
        const { query } = req.body;
        
        // Validate query
        validateQuery(query);
        
        const client = await pool.connect();
        
        try {
            // Get execution plan
            const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
            const result = await client.query(explainQuery);
            
            res.json({
                success: true,
                data: {
                    plan: result.rows[0]['QUERY PLAN'],
                    query: query
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Explain query error:', error);
        res.status(400).json({
            success: false,
            error: 'Failed to explain query',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/database/query/history
 * Get user's query history
 */
router.get('/query/history', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;
        
        // This would typically come from a query_history table
        // For now, return sample data structure
        res.json({
            success: true,
            data: {
                queries: [],
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit)
            },
            message: 'Query history feature requires query logging table setup',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Query history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch query history',
            details: error.message
        });
    }
});

// =============================================================================
// DATA MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/admin/database/data/:tableName
 * Get paginated table data
 */
router.get('/data/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const { 
            page = 1, 
            limit = 100, 
            sort, 
            order = 'ASC',
            search,
            searchColumn 
        } = req.query;
        
        const offset = (page - 1) * limit;
        const client = await pool.connect();
        
        try {
            // Build query with optional filtering and sorting
            let query = `SELECT * FROM "${tableName}"`;
            let countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
            const queryParams = [];
            let paramIndex = 1;
            
            // Add search filter if provided
            if (search && searchColumn) {
                const whereClause = ` WHERE "${searchColumn}"::text ILIKE $${paramIndex}`;
                query += whereClause;
                countQuery += whereClause;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
            
            // Add sorting if provided
            if (sort) {
                query += ` ORDER BY "${sort}" ${order.toUpperCase()}`;
            }
            
            // Add pagination
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(limit, offset);
            
            // Execute queries
            const [dataResult, countResult] = await Promise.all([
                client.query(query, queryParams),
                client.query(countQuery, queryParams.slice(0, -2)) // Remove limit/offset for count
            ]);
            
            const totalRows = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalRows / limit);
            
            res.json({
                success: true,
                data: {
                    rows: dataResult.rows,
                    fields: dataResult.fields,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalRows,
                        totalPages,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error(`❌ Data fetch error for ${req.params.tableName}:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to fetch data from ${req.params.tableName}`,
            details: error.message
        });
    }
});

// =============================================================================
// DATABASE STATISTICS AND MONITORING
// =============================================================================

/**
 * GET /api/admin/database/stats
 * Get comprehensive database statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            // Database size and basic stats
            const basicStatsQuery = `
                SELECT 
                    current_database() as database_name,
                    pg_size_pretty(pg_database_size(current_database())) as database_size,
                    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                    (SELECT count(*) FROM pg_stat_activity) as total_connections,
                    version() as postgresql_version;
            `;
            
            // Table statistics
            const tableStatsQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    seq_scan,
                    idx_scan
                FROM pg_stat_user_tables
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 20;
            `;
            
            // Index usage statistics
            const indexStatsQuery = `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes
                WHERE idx_scan > 0
                ORDER BY idx_scan DESC
                LIMIT 20;
            `;
            
            // Active queries
            const activeQueriesQuery = `
                SELECT 
                    pid,
                    usename,
                    application_name,
                    state,
                    query_start,
                    query,
                    client_addr
                FROM pg_stat_activity
                WHERE state = 'active' AND pid != pg_backend_pid()
                ORDER BY query_start;
            `;
            
            const [basicStats, tableStats, indexStats, activeQueries] = await Promise.all([
                client.query(basicStatsQuery),
                client.query(tableStatsQuery),
                client.query(indexStatsQuery),
                client.query(activeQueriesQuery)
            ]);
            
            res.json({
                success: true,
                data: {
                    database: basicStats.rows[0],
                    tables: tableStats.rows,
                    indexes: indexStats.rows,
                    activeQueries: activeQueries.rows
                },
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Database stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/database/processes
 * Get active database processes and connections
 */
router.get('/processes', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            const query = `
                SELECT 
                    pid,
                    usename as username,
                    application_name,
                    client_addr,
                    client_port,
                    backend_start,
                    query_start,
                    state_change,
                    state,
                    query
                FROM pg_stat_activity
                WHERE pid != pg_backend_pid()
                ORDER BY backend_start DESC;
            `;
            
            const result = await client.query(query);
            
            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length,
                timestamp: new Date().toISOString()
            });
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Database processes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database processes',
            details: error.message
        });
    }
});

// =============================================================================
// EXPORT FUNCTIONALITY
// =============================================================================

/**
 * POST /api/admin/database/export
 * Export data in various formats (CSV, JSON, SQL)
 */
router.post('/export', async (req, res) => {
    try {
        const { table, format = 'csv', query, filename } = req.body;
        
        if (!table && !query) {
            return res.status(400).json({
                success: false,
                error: 'Either table name or query must be provided'
            });
        }
        
        const client = await pool.connect();
        
        try {
            let exportQuery;
            if (query) {
                validateQuery(query);
                exportQuery = query;
            } else {
                exportQuery = `SELECT * FROM "${table}"`;
            }
            
            const result = await client.query(exportQuery);
            
            let exportData;
            let contentType;
            let fileExtension;
            
            switch (format.toLowerCase()) {
                case 'csv':
                    exportData = convertToCSV(result.rows, result.fields);
                    contentType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = JSON.stringify(result.rows, null, 2);
                    contentType = 'application/json';
                    fileExtension = 'json';
                    break;
                case 'sql':
                    exportData = convertToSQL(table || 'query_result', result.rows, result.fields);
                    contentType = 'text/sql';
                    fileExtension = 'sql';
                    break;
                default:
                    throw new Error('Unsupported export format');
            }
            
            const exportFilename = filename || `${table || 'export'}_${Date.now()}.${fileExtension}`;
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}"`);
            res.send(exportData);
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Export error:', error);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            details: error.message
        });
    }
});

// Helper function to convert data to CSV
function convertToCSV(rows, fields) {
    if (!rows.length) return '';
    
    const headers = fields.map(field => field.name);
    const csvHeaders = headers.join(',');
    
    const csvRows = rows.map(row => {
        return headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Helper function to convert data to SQL INSERT statements
function convertToSQL(tableName, rows, fields) {
    if (!rows.length) return '';
    
    const headers = fields.map(field => field.name);
    const sqlStatements = rows.map(row => {
        const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return String(value);
        });
        return `INSERT INTO "${tableName}" (${headers.map(h => `"${h}"`).join(', ')}) VALUES (${values.join(', ')});`;
    });
    
    return sqlStatements.join('\n');
}

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('❌ Database Admin API Error:', error);
    
    dbLogger.error('Database admin error', {
        user: req.user?.email,
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
    });
    
    res.status(500).json({
        success: false,
        error: 'Database administration error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;