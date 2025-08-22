/**
 * DatabaseOptimizer.js - Database Performance Optimization Service
 * Session 8: Performance & Monitoring Implementation
 * 
 * Features:
 * - Index management and optimization
 * - Query performance analysis
 * - Connection pool optimization
 * - Database health monitoring
 * - Performance tuning recommendations
 */

const { Pool } = require('pg');
const EventEmitter = require('events');

class DatabaseOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5435,
        database: process.env.DB_NAME || 'revivatech',
        user: process.env.DB_USER || 'revivatech_user',
        password: process.env.DB_PASSWORD || 'revivatech_pass',
        
        // Connection pool optimization
        max: 20,                    // Maximum connections
        min: 5,                     // Minimum connections
        idleTimeoutMillis: 30000,   // 30 seconds
        connectionTimeoutMillis: 10000, // 10 seconds
        acquireTimeoutMillis: 60000,    // 60 seconds
        
        // Performance settings
        statement_timeout: 30000,   // 30 seconds
        query_timeout: 15000,       // 15 seconds
        ...config.database
      },
      
      optimization: {
        enableSlowQueryLogging: true,
        slowQueryThreshold: 1000,   // 1 second
        enableIndexAnalysis: true,
        enableQueryPlanAnalysis: true,
        enableConnectionPoolMonitoring: true,
        autoVacuumAnalysis: true,
        ...config.optimization
      },
      
      monitoring: {
        metricsInterval: 60000,     // 1 minute
        healthCheckInterval: 30000,  // 30 seconds
        ...config.monitoring
      }
    };

    this.pool = null;
    this.metrics = {
      connections: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0
      },
      queries: {
        total: 0,
        slow: 0,
        errors: 0,
        avgResponseTime: 0,
        totalResponseTime: 0
      },
      cache: {
        hitRatio: 0,
        bufferUsage: 0
      },
      performance: {
        tps: 0,           // Transactions per second
        indexUsage: 0,    // Index hit ratio
        diskUsage: 0,     // Disk space usage
        tableStats: {}
      }
    };

    this.slowQueries = [];
    this.indexRecommendations = [];
    this.isMonitoring = false;

    this.init();
  }

  async init() {
    try {
      
      // Create optimized connection pool
      await this.createConnectionPool();
      
      // Create performance indexes
      await this.createPerformanceIndexes();
      
      // Setup monitoring
      this.startMonitoring();
      
      console.log('DatabaseOptimizer initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize DatabaseOptimizer:', error);
      throw error;
    }
  }

  async createConnectionPool() {
    this.pool = new Pool({
      ...this.config.database,
      
      // Optimizations
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      
      // Connection lifecycle hooks
      onConnect: (client) => {
        console.log('Database connection established');
        this.metrics.connections.total++;
        
        // Set session-level optimizations
        client.query(`
          SET statement_timeout = ${this.config.database.statement_timeout};
          SET lock_timeout = ${this.config.database.query_timeout};
          SET effective_cache_size = '256MB';
          SET work_mem = '16MB';
          SET maintenance_work_mem = '64MB';
        `).catch(err => console.error('Failed to set session optimizations:', err));
      },
      
      onRemove: () => {
        this.metrics.connections.total--;
        console.log('Database connection removed');
      }
    });

    // Pool event handlers
    this.pool.on('connect', (client) => {
      this.metrics.connections.active++;
      this.emit('connectionCreated', { total: this.metrics.connections.total });
    });

    this.pool.on('remove', (client) => {
      this.metrics.connections.active--;
      this.emit('connectionRemoved', { total: this.metrics.connections.total });
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      this.emit('poolError', err);
    });

    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('Database connection pool created successfully');
    } finally {
      client.release();
    }
  }

  async createPerformanceIndexes() {
    const client = await this.pool.connect();
    
    try {
      console.log('Creating performance indexes...');
      
      // Analytics event indexes for high-performance queries
      const indexQueries = [
        // Event tracking indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp 
         ON analytics_events (timestamp DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_timestamp 
         ON analytics_events (user_id, timestamp DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_session_timestamp 
         ON analytics_events (session_id, timestamp DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type_timestamp 
         ON analytics_events (event_type, timestamp DESC)`,
        
        // User analytics indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
         ON users (created_at DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_active 
         ON users (last_active_at DESC) WHERE last_active_at IS NOT NULL`,
        
        // Session analytics indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_created 
         ON user_sessions (user_id, created_at DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_duration 
         ON user_sessions (duration DESC) WHERE duration IS NOT NULL`,
        
        // Customer journey indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journeys_customer_timestamp 
         ON customer_journeys (customer_id, timestamp DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journeys_stage_timestamp 
         ON customer_journeys (stage, timestamp DESC)`,
        
        // ML results indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_results_model_timestamp 
         ON ml_results (model_id, created_at DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_results_user_model 
         ON ml_results (user_id, model_id, created_at DESC)`,
        
        // Marketing automation indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_triggers_event 
         ON automation_triggers (event_type, trigger_time DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_automation_executions_status 
         ON automation_executions (status, created_at DESC)`,
        
        // Composite indexes for complex queries
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_composite_performance 
         ON analytics_events (user_id, event_type, timestamp DESC) 
         INCLUDE (event_data)`,
        
        // Partial indexes for frequently filtered data
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_recent_active 
         ON analytics_events (timestamp DESC) 
         WHERE timestamp > NOW() - INTERVAL '30 days'`,
        
        // GIN indexes for JSON data
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_data_gin 
         ON analytics_events USING GIN (event_data)`,
        
        // BRIN indexes for time-series data
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp_brin 
         ON analytics_events USING BRIN (timestamp)`
      ];

      for (const query of indexQueries) {
        try {
          await client.query(query);
          console.log(`Created index: ${query.split(' ')[5] || 'unknown'}`);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error(`Failed to create index: ${error.message}`);
          }
        }
      }

      // Create performance monitoring table
      await client.query(`
        CREATE TABLE IF NOT EXISTS query_performance_log (
          id SERIAL PRIMARY KEY,
          query_hash VARCHAR(64) NOT NULL,
          query_text TEXT NOT NULL,
          execution_time INTEGER NOT NULL,
          rows_examined INTEGER,
          rows_returned INTEGER,
          timestamp TIMESTAMP DEFAULT NOW(),
          query_plan JSONB
        )
      `);

      // Create index on performance log
      await client.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_performance_hash_time 
        ON query_performance_log (query_hash, timestamp DESC)
      `);

      console.log('Performance indexes created successfully');
      
    } finally {
      client.release();
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Database metrics collection
    setInterval(() => {
      this.collectDatabaseMetrics();
    }, this.config.monitoring.metricsInterval);
    
    // Health checks
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.monitoring.healthCheckInterval);
    
    // Index analysis
    if (this.config.optimization.enableIndexAnalysis) {
      setInterval(() => {
        this.analyzeIndexUsage();
      }, this.config.monitoring.metricsInterval * 5); // Every 5 minutes
    }
    
    console.log('Database monitoring started');
  }

  async collectDatabaseMetrics() {
    const client = await this.pool.connect();
    
    try {
      // Connection pool metrics
      this.metrics.connections = {
        total: this.pool.totalCount,
        active: this.pool.totalCount - this.pool.idleCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      };

      // Database statistics
      const statsQuery = `
        SELECT 
          sum(numbackends) as connections,
          sum(xact_commit) as commits,
          sum(xact_rollback) as rollbacks,
          sum(blks_read) as blocks_read,
          sum(blks_hit) as blocks_hit,
          sum(tup_returned) as tuples_returned,
          sum(tup_fetched) as tuples_fetched,
          sum(tup_inserted) as tuples_inserted,
          sum(tup_updated) as tuples_updated,
          sum(tup_deleted) as tuples_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      const statsResult = await client.query(statsQuery);
      const stats = statsResult.rows[0];
      
      // Calculate cache hit ratio
      const cacheHitRatio = stats.blocks_hit > 0 ? 
        (stats.blocks_hit / (stats.blocks_hit + stats.blocks_read)) * 100 : 0;
      
      this.metrics.cache.hitRatio = cacheHitRatio;
      
      // Calculate transactions per second (simplified)
      const currentTime = Date.now();
      const tps = (stats.commits + stats.rollbacks) / 60; // Per minute, then divide by 60 for per second
      this.metrics.performance.tps = tps;
      
      // Index usage statistics
      const indexUsageQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          idx_tup_read::float / NULLIF(idx_scan, 0) as avg_tuples_per_scan
        FROM pg_stat_user_indexes 
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 20
      `;
      
      const indexResult = await client.query(indexUsageQuery);
      this.metrics.performance.indexStats = indexResult.rows;
      
      // Table statistics
      const tableStatsQuery = `
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
      
      const tableResult = await client.query(tableStatsQuery);
      this.metrics.performance.tableStats = tableResult.rows;
      
      // Emit metrics update
      this.emit('metricsUpdated', this.metrics);
      
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    } finally {
      client.release();
    }
  }

  async performHealthCheck() {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      // Basic connectivity test
      await client.query('SELECT 1');
      
      // Check for long-running queries
      const longQueriesResult = await client.query(`
        SELECT 
          pid,
          now() - pg_stat_activity.query_start AS duration,
          query,
          state
        FROM pg_stat_activity 
        WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
          AND query != '<IDLE>'
          AND query NOT ILIKE '%pg_stat_activity%'
        ORDER BY duration DESC
      `);
      
      if (longQueriesResult.rows.length > 0) {
        console.warn(`Found ${longQueriesResult.rows.length} long-running queries`);
        this.emit('longRunningQueries', longQueriesResult.rows);
      }
      
      // Check for blocking queries
      const blockingQueriesResult = await client.query(`
        SELECT blocked_locks.pid     AS blocked_pid,
               blocked_activity.usename  AS blocked_user,
               blocking_locks.pid     AS blocking_pid,
               blocking_activity.usename AS blocking_user,
               blocked_activity.query    AS blocked_statement,
               blocking_activity.query   AS current_statement_in_blocking_process
        FROM  pg_catalog.pg_locks         blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity  ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks         blocking_locks 
            ON blocking_locks.locktype = blocked_locks.locktype
            AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
            AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted
      `);
      
      if (blockingQueriesResult.rows.length > 0) {
        console.warn(`Found ${blockingQueriesResult.rows.length} blocking queries`);
        this.emit('blockingQueries', blockingQueriesResult.rows);
      }
      
      const responseTime = Date.now() - startTime;
      
      this.emit('healthCheck', {
        status: 'healthy',
        responseTime,
        connectionPool: this.metrics.connections,
        longRunningQueries: longQueriesResult.rows.length,
        blockingQueries: blockingQueriesResult.rows.length
      });
      
    } catch (error) {
      console.error('Database health check failed:', error);
      this.emit('healthCheck', {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      });
    } finally {
      client.release();
    }
  }

  async analyzeIndexUsage() {
    const client = await this.pool.connect();
    
    try {
      // Find unused indexes
      const unusedIndexesQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          pg_size_pretty(pg_relation_size(i.indexrelid)) as size
        FROM pg_stat_user_indexes ui
        JOIN pg_index i ON ui.indexrelid = i.indexrelid
        WHERE idx_scan = 0
          AND NOT i.indisunique
          AND NOT i.indisprimary
        ORDER BY pg_relation_size(i.indexrelid) DESC
      `;
      
      const unusedResult = await client.query(unusedIndexesQuery);
      
      // Find missing indexes (tables with low index usage)
      const missingIndexesQuery = `
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          seq_tup_read::float / NULLIF(seq_scan, 0) as avg_seq_tuples,
          idx_tup_fetch::float / NULLIF(idx_scan, 0) as avg_idx_tuples
        FROM pg_stat_user_tables
        WHERE seq_scan > 1000
          AND (idx_scan = 0 OR seq_scan::float / NULLIF(idx_scan, 0) > 10)
        ORDER BY seq_scan DESC
        LIMIT 10
      `;
      
      const missingResult = await client.query(missingIndexesQuery);
      
      // Update recommendations
      this.indexRecommendations = [
        ...unusedResult.rows.map(row => ({
          type: 'DROP_UNUSED_INDEX',
          table: row.tablename,
          index: row.indexname,
          impact: 'Reduces storage and maintenance overhead',
          query: `DROP INDEX ${row.schemaname}.${row.indexname};`
        })),
        ...missingResult.rows.map(row => ({
          type: 'ADD_MISSING_INDEX',
          table: row.tablename,
          impact: 'Reduce sequential scans',
          recommendation: `Consider adding indexes for frequently queried columns on ${row.tablename}`
        }))
      ];
      
      this.emit('indexAnalysis', {
        unused: unusedResult.rows,
        missing: missingResult.rows,
        recommendations: this.indexRecommendations
      });
      
    } catch (error) {
      console.error('Index analysis failed:', error);
    } finally {
      client.release();
    }
  }

  // Optimized query execution with monitoring
  async executeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      this.metrics.queries.total++;
      
      // Enable query plan logging for slow query analysis
      if (this.config.optimization.enableQueryPlanAnalysis && options.explain) {
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        const explainResult = await client.query(explainQuery, params);
        
        const responseTime = Date.now() - startTime;
        
        // Log slow queries
        if (responseTime > this.config.optimization.slowQueryThreshold) {
          this.logSlowQuery(query, params, responseTime, explainResult.rows[0]);
        }
        
        return { plan: explainResult.rows[0], responseTime };
      }
      
      // Execute query
      const result = await client.query(query, params);
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.metrics.queries.totalResponseTime += responseTime;
      this.metrics.queries.avgResponseTime = 
        this.metrics.queries.totalResponseTime / this.metrics.queries.total;
      
      // Log slow queries
      if (responseTime > this.config.optimization.slowQueryThreshold) {
        this.logSlowQuery(query, params, responseTime);
        this.metrics.queries.slow++;
      }
      
      return { result, responseTime };
      
    } catch (error) {
      this.metrics.queries.errors++;
      console.error('Query execution error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  logSlowQuery(query, params, responseTime, plan = null) {
    const slowQuery = {
      timestamp: Date.now(),
      query: query.substring(0, 1000), // Truncate long queries
      params: params ? params.slice(0, 10) : [], // Limit params
      responseTime,
      plan
    };
    
    this.slowQueries.push(slowQuery);
    
    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }
    
    console.warn(`Slow query detected (${responseTime}ms):`, query.substring(0, 200));
    this.emit('slowQuery', slowQuery);
  }

  getMetrics() {
    return {
      ...this.metrics,
      slowQueries: this.slowQueries.slice(-10), // Last 10
      indexRecommendations: this.indexRecommendations.slice(0, 5), // Top 5
      poolStatus: {
        total: this.pool?.totalCount || 0,
        idle: this.pool?.idleCount || 0,
        waiting: this.pool?.waitingCount || 0
      }
    };
  }

  async getHealth() {
    try {
      const startTime = Date.now();
      const client = await this.pool.connect();
      
      try {
        await client.query('SELECT 1');
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy',
          responseTime,
          metrics: this.getMetrics()
        };
      } finally {
        client.release();
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async close() {
    console.log('Closing DatabaseOptimizer...');
    
    this.isMonitoring = false;
    
    if (this.pool) {
      await this.pool.end();
    }
    
    this.removeAllListeners();
    console.log('DatabaseOptimizer closed');
  }
}

module.exports = { DatabaseOptimizer };