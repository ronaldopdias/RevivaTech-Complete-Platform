import { Pool, PoolConfig } from 'pg';
import { getConfig } from './environment';

const config = getConfig();

// Database connection configuration
const dbConfig: PoolConfig = {
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  max: config.DATABASE_POOL_SIZE,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
  
  // Connection retry configuration
  ...(config.NODE_ENV === 'production' && {
    statement_timeout: 30000,
    query_timeout: 30000,
    connectionTimeoutMillis: 5000,
  }),
};

// Create connection pool
const pool = new Pool(dbConfig);

// Connection event handlers
pool.on('connect', (client) => {
  console.log('New database client connected');
  
  // Set up client for optimal performance
  client.query('SET timezone TO UTC');
  
  if (config.NODE_ENV === 'production') {
    client.query('SET statement_timeout TO 30000');
    client.query('SET lock_timeout TO 10000');
  }
});

pool.on('error', (err, client) => {
  console.error('Database pool error:', err);
  console.error('Client:', client);
});

pool.on('acquire', (client) => {
  console.log('Database client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('Database client removed from pool');
});

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: any;
}> {
  try {
    const client = await pool.connect();
    
    const start = Date.now();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    const duration = Date.now() - start;
    
    client.release();
    
    return {
      status: 'healthy',
      details: {
        responseTime: duration,
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        poolTotal: pool.totalCount,
        poolIdle: pool.idleCount,
        poolWaiting: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        poolTotal: pool.totalCount,
        poolIdle: pool.idleCount,
        poolWaiting: pool.waitingCount,
      },
    };
  }
}

// Database migration utilities
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add any startup migrations here
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Query helper with automatic retry
export async function query(
  text: string, 
  params?: any[], 
  retries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (config.LOG_LEVEL === 'debug') {
        console.log('Query executed:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration,
          rows: result.rows.length,
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Query attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  console.log('Closing database connections...');
  await pool.end();
  console.log('Database connections closed');
}

// Handle process termination
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

export { pool };
export default pool;