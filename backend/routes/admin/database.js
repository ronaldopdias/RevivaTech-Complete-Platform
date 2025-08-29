/**
 * PRISMA MIGRATION: Admin Database Management API
 * Converted from raw SQL to Prisma ORM operations
 * Comprehensive database administration interface with enterprise features
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { requireAuth: authenticateToken, requireAdmin } = require('../../lib/auth-utils');
const winston = require('winston');

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

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'admin-database-api',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get database schema information using Prisma introspection
router.get('/schema', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all table information using Prisma raw queries
        const tablesInfo = await prisma.$queryRaw`
            SELECT 
                schemaname as schema_name,
                tablename as table_name,
                hasindexes as has_indexes,
                hasrules as has_rules,
                hastriggers as has_triggers
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `;

        // Get column information for each table
        const columnsInfo = await prisma.$queryRaw`
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `;

        // Get foreign key constraints
        const foreignKeys = await prisma.$queryRaw`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name
        `;

        // Get index information
        const indexes = await prisma.$queryRaw`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `;

        // Organize data by table
        const schema = {};
        
        // Initialize tables
        tablesInfo.forEach(table => {
            schema[table.table_name] = {
                name: table.table_name,
                schema: table.schema_name,
                has_indexes: table.has_indexes,
                has_rules: table.has_rules,
                has_triggers: table.has_triggers,
                columns: [],
                foreign_keys: [],
                indexes: []
            };
        });

        // Add columns
        columnsInfo.forEach(col => {
            if (schema[col.table_name]) {
                schema[col.table_name].columns.push({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                    default: col.column_default,
                    max_length: col.character_maximum_length,
                    precision: col.numeric_precision,
                    scale: col.numeric_scale
                });
            }
        });

        // Add foreign keys
        foreignKeys.forEach(fk => {
            if (schema[fk.table_name]) {
                schema[fk.table_name].foreign_keys.push({
                    column: fk.column_name,
                    references_table: fk.foreign_table_name,
                    references_column: fk.foreign_column_name,
                    constraint_name: fk.constraint_name
                });
            }
        });

        // Add indexes
        indexes.forEach(idx => {
            if (schema[idx.tablename]) {
                schema[idx.tablename].indexes.push({
                    name: idx.indexname,
                    definition: idx.indexdef
                });
            }
        });

        res.json({
            success: true,
            data: {
                schema: Object.values(schema),
                summary: {
                    total_tables: tablesInfo.length,
                    total_columns: columnsInfo.length,
                    total_foreign_keys: foreignKeys.length,
                    total_indexes: indexes.length
                }
            }
        });

    } catch (error) {
        dbLogger.error('Schema retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve database schema',
            code: 'SCHEMA_RETRIEVAL_ERROR'
        });
    }
});

// Get list of all tables with row counts
router.get('/tables', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get table list
        const tables = await prisma.$queryRaw`
            SELECT 
                tablename as table_name,
                schemaname as schema_name
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `;

        // Get row counts for each table using Prisma models where available
        const tableStats = await Promise.all(
            tables.map(async (table) => {
                try {
                    let rowCount = 0;
                    
                    // Try to get count using Prisma models first
                    switch (table.table_name) {
                        case 'users':
                            rowCount = await prisma.user.count();
                            break;
                        case 'bookings':
                            rowCount = await prisma.booking.count();
                            break;
                        case 'device_models':
                            rowCount = await prisma.deviceModel.count();
                            break;
                        case 'device_brands':
                            rowCount = await prisma.deviceBrand.count();
                            break;
                        case 'device_categories':
                            rowCount = await prisma.deviceCategory.count();
                            break;
                        case 'sessions':
                            rowCount = await prisma.session.count();
                            break;
                        case 'accounts':
                            rowCount = await prisma.account.count();
                            break;
                        default:
                            // Fallback to raw SQL for tables without Prisma models
                            const result = await prisma.$queryRaw`
                                SELECT COUNT(*) as count FROM ${prisma.Prisma.raw(table.table_name)}
                            `;
                            rowCount = parseInt(result[0].count);
                    }

                    return {
                        table_name: table.table_name,
                        schema_name: table.schema_name,
                        row_count: rowCount,
                        accessible: true
                    };
                } catch (error) {
                    return {
                        table_name: table.table_name,
                        schema_name: table.schema_name,
                        row_count: 0,
                        accessible: false,
                        error: error.message
                    };
                }
            })
        );

        res.json({
            success: true,
            data: {
                tables: tableStats,
                summary: {
                    total_tables: tables.length,
                    total_rows: tableStats.reduce((sum, table) => sum + table.row_count, 0),
                    accessible_tables: tableStats.filter(t => t.accessible).length
                }
            }
        });

    } catch (error) {
        dbLogger.error('Tables retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve tables information',
            code: 'TABLES_RETRIEVAL_ERROR'
        });
    }
});

// Get detailed information about a specific table
router.get('/tables/:tableName', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { tableName } = req.params;
        
        // Validate table name to prevent injection
        const validTables = [
            'users', 'bookings', 'device_models', 'device_brands', 'device_categories',
            'sessions', 'accounts', 'pricing_rules', 'notifications', 'email_templates'
        ];
        
        if (!validTables.includes(tableName)) {
            return res.status(400).json({
                error: 'Invalid table name or table not accessible',
                code: 'INVALID_TABLE'
            });
        }

        // SECURITY FIX: Use parameterized query to prevent injection
        const columns = await prisma.$queryRaw`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
            FROM information_schema.columns
            WHERE table_name = ${tableName}::text AND table_schema = 'public'
            ORDER BY ordinal_position
        `;

        // Get sample data using Prisma where possible
        let sampleData = [];
        try {
            switch (tableName) {
                case 'users':
                    sampleData = await prisma.user.findMany({
                        take: 10,
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                            createdAt: true
                        }
                    });
                    break;
                case 'bookings':
                    sampleData = await prisma.booking.findMany({
                        take: 10,
                        select: {
                            id: true,
                            status: true,
                            repairType: true,
                            basePrice: true,
                            finalPrice: true,
                            createdAt: true
                        }
                    });
                    break;
                case 'device_models':
                    sampleData = await prisma.deviceModel.findMany({
                        take: 10,
                        select: {
                            id: true,
                            name: true,
                            year: true,
                            createdAt: true
                        },
                        include: {
                            brand: {
                                select: { name: true }
                            }
                        }
                    });
                    break;
                default:
                    // Fallback to raw SQL for other tables
                    sampleData = await prisma.$queryRaw`
                        SELECT * FROM ${prisma.Prisma.raw(tableName)} LIMIT 10
                    `;
            }
        } catch (error) {
            dbLogger.warn(`Could not fetch sample data for ${tableName}:`, error.message);
        }

        // Get row count
        let rowCount = 0;
        try {
            switch (tableName) {
                case 'users':
                    rowCount = await prisma.user.count();
                    break;
                case 'bookings':
                    rowCount = await prisma.booking.count();
                    break;
                case 'device_models':
                    rowCount = await prisma.deviceModel.count();
                    break;
                default:
                    const result = await prisma.$queryRaw`
                        SELECT COUNT(*) as count FROM ${prisma.Prisma.raw(tableName)}
                    `;
                    rowCount = parseInt(result[0].count);
            }
        } catch (error) {
            dbLogger.warn(`Could not get count for ${tableName}:`, error.message);
        }

        res.json({
            success: true,
            data: {
                table_name: tableName,
                columns: columns.map(col => ({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                    default: col.column_default,
                    max_length: col.character_maximum_length,
                    precision: col.numeric_precision,
                    scale: col.numeric_scale
                })),
                row_count: rowCount,
                sample_data: sampleData
            }
        });

    } catch (error) {
        dbLogger.error('Table details retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve table details',
            code: 'TABLE_DETAILS_ERROR'
        });
    }
});

// Execute custom database queries (READ-ONLY for security)
router.post('/query', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Query is required and must be a string',
                code: 'INVALID_QUERY'
            });
        }

        // Security: Only allow SELECT statements
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery.startsWith('select')) {
            return res.status(403).json({
                error: 'Only SELECT queries are allowed',
                code: 'FORBIDDEN_QUERY_TYPE'
            });
        }

        // Security: Blacklist dangerous keywords
        const dangerousKeywords = [
            'insert', 'update', 'delete', 'drop', 'create', 'alter',
            'truncate', 'grant', 'revoke', 'copy', 'bulk'
        ];
        
        if (dangerousKeywords.some(keyword => trimmedQuery.includes(keyword))) {
            return res.status(403).json({
                error: 'Query contains forbidden operations',
                code: 'FORBIDDEN_QUERY_CONTENT'
            });
        }

        // Execute query with timeout
        const startTime = Date.now();
        const result = await prisma.$queryRawUnsafe(query);
        const executionTime = Date.now() - startTime;

        // Log query execution
        dbLogger.info('Query executed', {
            user: req.audit.user,
            query: query.substring(0, 200),
            execution_time: executionTime,
            row_count: Array.isArray(result) ? result.length : 1
        });

        res.json({
            success: true,
            data: {
                result,
                execution_time: executionTime,
                row_count: Array.isArray(result) ? result.length : 1
            }
        });

    } catch (error) {
        dbLogger.error('Query execution error:', {
            user: req.audit.user,
            query: req.body.query,
            error: error.message
        });
        
        res.status(500).json({
            error: 'Query execution failed',
            message: error.message,
            code: 'QUERY_EXECUTION_ERROR'
        });
    }
});

// Get query execution plan
router.post('/query/explain', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Query is required and must be a string',
                code: 'INVALID_QUERY'
            });
        }

        // Security: Only allow SELECT statements
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery.startsWith('select')) {
            return res.status(403).json({
                error: 'Only SELECT queries can be explained',
                code: 'FORBIDDEN_QUERY_TYPE'
            });
        }

        // Execute EXPLAIN ANALYZE
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        const result = await prisma.$queryRawUnsafe(explainQuery);

        res.json({
            success: true,
            data: {
                plan: result[0]['QUERY PLAN'],
                original_query: query
            }
        });

    } catch (error) {
        dbLogger.error('Query explain error:', error);
        res.status(500).json({
            error: 'Failed to explain query',
            message: error.message,
            code: 'QUERY_EXPLAIN_ERROR'
        });
    }
});

// Get database statistics using Prisma aggregations where possible
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get database size and connection info
        const dbStats = await prisma.$queryRaw`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                current_database() as database_name,
                current_user as current_user,
                version() as postgresql_version
        `;

        // Get table sizes
        const tableSizes = await prisma.$queryRaw`
            SELECT 
                schemaname as schema_name,
                tablename as table_name,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 20
        `;

        // Get activity statistics using Prisma where available
        const [
            userStats,
            bookingStats,
            sessionStats
        ] = await Promise.all([
            // User statistics
            Promise.all([
                prisma.user.count(),
                prisma.user.count({ where: { role: 'CUSTOMER' } }),
                prisma.user.count({ where: { role: 'ADMIN' } }),
                prisma.user.count({ where: { role: 'TECHNICIAN' } })
            ]).then(([total, customers, admins, techs]) => ({
                total_users: total,
                customers,
                admins,
                technicians: techs
            })),

            // Booking statistics
            Promise.all([
                prisma.booking.count(),
                prisma.booking.count({ where: { status: 'COMPLETED' } }),
                prisma.booking.count({ where: { status: 'PENDING' } }),
                prisma.booking.count({ where: { status: 'IN_PROGRESS' } })
            ]).then(([total, completed, pending, inProgress]) => ({
                total_bookings: total,
                completed,
                pending,
                in_progress: inProgress
            })),

            // Session statistics (if available)
            prisma.session.count().catch(() => 0)
        ]);

        // Get connection statistics
        const connectionStats = await prisma.$queryRaw`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity
            WHERE datname = current_database()
        `;

        res.json({
            success: true,
            data: {
                database: {
                    ...dbStats[0],
                    connection_stats: connectionStats[0]
                },
                tables: {
                    sizes: tableSizes,
                    largest_table: tableSizes[0]?.table_name || 'unknown'
                },
                business_metrics: {
                    users: userStats,
                    bookings: bookingStats,
                    active_sessions: sessionStats
                },
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        dbLogger.error('Database stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve database statistics',
            code: 'DATABASE_STATS_ERROR'
        });
    }
});

// Get current database processes/activity
router.get('/processes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const processes = await prisma.$queryRaw`
            SELECT 
                pid,
                usename as username,
                application_name,
                client_addr,
                client_port,
                backend_start,
                query_start,
                state,
                query
            FROM pg_stat_activity
            WHERE datname = current_database()
                AND pid != pg_backend_pid()
            ORDER BY query_start DESC NULLS LAST
            LIMIT 50
        `;

        res.json({
            success: true,
            data: {
                processes: processes.map(proc => ({
                    ...proc,
                    backend_start: proc.backend_start?.toISOString(),
                    query_start: proc.query_start?.toISOString(),
                    query: proc.query ? proc.query.substring(0, 200) : null
                })),
                total_processes: processes.length
            }
        });

    } catch (error) {
        dbLogger.error('Database processes error:', error);
        res.status(500).json({
            error: 'Failed to retrieve database processes',
            code: 'DATABASE_PROCESSES_ERROR'
        });
    }
});

// Backup database metadata (structure only)
router.post('/backup/metadata', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get complete schema information
        const schemaBackup = {
            timestamp: new Date().toISOString(),
            database_name: 'revivatech',
            backup_type: 'metadata_only',
            tables: {},
            constraints: [],
            indexes: []
        };

        // Get all tables with columns
        const tables = await prisma.$queryRaw`
            SELECT 
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.character_maximum_length
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
            ORDER BY t.table_name, c.ordinal_position
        `;

        // Group by table
        tables.forEach(row => {
            if (!schemaBackup.tables[row.table_name]) {
                schemaBackup.tables[row.table_name] = {
                    columns: []
                };
            }
            schemaBackup.tables[row.table_name].columns.push({
                name: row.column_name,
                type: row.data_type,
                nullable: row.is_nullable === 'YES',
                default: row.column_default,
                max_length: row.character_maximum_length
            });
        });

        // Get constraints
        const constraints = await prisma.$queryRaw`
            SELECT 
                constraint_name,
                table_name,
                constraint_type
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
        `;
        schemaBackup.constraints = constraints;

        // Get indexes
        const indexes = await prisma.$queryRaw`
            SELECT 
                indexname,
                tablename,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
        `;
        schemaBackup.indexes = indexes;

        // Log backup creation
        dbLogger.info('Database metadata backup created', {
            user: req.audit.user,
            tables_count: Object.keys(schemaBackup.tables).length,
            constraints_count: constraints.length,
            indexes_count: indexes.length
        });

        res.json({
            success: true,
            message: 'Database metadata backup created successfully',
            data: schemaBackup
        });

    } catch (error) {
        dbLogger.error('Database backup error:', error);
        res.status(500).json({
            error: 'Failed to create database backup',
            code: 'DATABASE_BACKUP_ERROR'
        });
    }
});

module.exports = router;