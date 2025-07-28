/**
 * Knex.js configuration for RevivaTech database migrations
 * Supports development, staging, and production environments
 */

require('dotenv').config();

const path = require('path');

// Database configuration from environment variables
const databaseConfig = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5435,
    database: process.env.DB_NAME || 'revivatech',
    user: process.env.DB_USER || 'revivatech_user',
    password: process.env.DB_PASSWORD || 'revivatech_secure_password_2024',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  migrations: {
    directory: path.join(__dirname, 'database', 'migrations'),
    tableName: 'knex_migrations',
    extension: 'js',
    loadExtensions: ['.js']
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds'),
    loadExtensions: ['.js']
  },
  acquireConnectionTimeout: 30000,
  debug: process.env.NODE_ENV === 'development'
};

module.exports = {
  development: {
    ...databaseConfig,
    connection: {
      ...databaseConfig.connection,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5435,
      database: process.env.DB_NAME || 'revivatech_dev'
    },
    debug: true
  },

  staging: {
    ...databaseConfig,
    connection: {
      ...databaseConfig.connection,
      database: process.env.DB_NAME || 'revivatech_staging'
    },
    debug: false
  },

  production: {
    ...databaseConfig,
    connection: {
      ...databaseConfig.connection,
      database: process.env.DB_NAME || 'revivatech_prod',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      ...databaseConfig.pool,
      min: 5,
      max: 30
    },
    debug: false,
    // Enable connection timeout and retry logic for production
    acquireConnectionTimeout: 60000,
    asyncStackTraces: false
  },

  // Testing configuration
  test: {
    ...databaseConfig,
    connection: {
      ...databaseConfig.connection,
      database: process.env.DB_NAME || 'revivatech_test'
    },
    pool: {
      min: 1,
      max: 1
    },
    debug: false
  }
};