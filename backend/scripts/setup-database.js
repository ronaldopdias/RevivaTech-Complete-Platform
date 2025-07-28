#!/usr/bin/env node

/**
 * RevivaTech Database Setup Script
 * Comprehensive database initialization for development and production
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Configuration
const config = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5435,
    user: process.env.DB_USER || 'revivatech_user',
    password: process.env.DB_PASSWORD || 'revivatech_secure_password_2024',
    database: process.env.DB_NAME || 'revivatech',
    adminDatabase: 'postgres'
  },
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'revivatech_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'revivatech_prod',
    adminDatabase: 'postgres'
  }
};

// Get environment from command line or default to development
const environment = process.argv[2] || 'development';
const dbConfig = config[environment];

if (!dbConfig) {
  console.error(`❌ Unknown environment: ${environment}`);
  console.log('Available environments: development, production');
  process.exit(1);
}

console.log(`🚀 Setting up RevivaTech database for ${environment} environment`);
console.log(`📍 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('');

async function setupDatabase() {
  let adminClient;
  let userClient;

  try {
    // ===================================
    // 1. CONNECT AS ADMIN
    // ===================================
    
    console.log('🔗 Connecting to PostgreSQL as admin...');
    adminClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: 'postgres', // Assume postgres admin user
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: dbConfig.adminDatabase
    });
    
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // ===================================
    // 2. CREATE DATABASE AND USER
    // ===================================
    
    console.log(`🏗️  Creating database and user...`);
    
    // Create user if doesn't exist
    try {
      await adminClient.query(`
        CREATE USER ${dbConfig.user} WITH 
        ENCRYPTED PASSWORD '${dbConfig.password}'
        CREATEDB
        LOGIN;
      `);
      console.log(`✅ Created user: ${dbConfig.user}`);
    } catch (error) {
      if (error.code === '42710') { // User already exists
        console.log(`ℹ️  User ${dbConfig.user} already exists`);
      } else {
        throw error;
      }
    }
    
    // Create database if doesn't exist
    try {
      await adminClient.query(`CREATE DATABASE ${dbConfig.database} OWNER ${dbConfig.user};`);
      console.log(`✅ Created database: ${dbConfig.database}`);
    } catch (error) {
      if (error.code === '42P04') { // Database already exists
        console.log(`ℹ️  Database ${dbConfig.database} already exists`);
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.user};`);
    console.log(`✅ Granted privileges to ${dbConfig.user}`);
    
    await adminClient.end();
    
    // ===================================
    // 3. CONNECT AS APPLICATION USER
    // ===================================
    
    console.log('🔗 Connecting as application user...');
    userClient = new Client({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    await userClient.connect();
    console.log('✅ Connected as application user');
    
    // ===================================
    // 4. RUN MIGRATIONS
    // ===================================
    
    console.log('🔄 Running database migrations...');
    
    const knex = require('knex');
    const knexConfig = require('../knexfile.js')[environment];
    
    const db = knex(knexConfig);
    
    try {
      // Run migrations
      console.log('📦 Running schema migrations...');
      const [batchNo, migrationFiles] = await db.migrate.latest();
      
      if (migrationFiles.length === 0) {
        console.log('ℹ️  Database is already up to date');
      } else {
        console.log(`✅ Migrated ${migrationFiles.length} files:`);
        migrationFiles.forEach(file => {
          console.log(`   - ${file}`);
        });
      }
      
      // Verify table creation
      console.log('🔍 Verifying database schema...');
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      
      console.log(`✅ Found ${tables.rows.length} tables:`);
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
    } finally {
      await db.destroy();
    }
    
    await userClient.end();
    
    // ===================================
    // 5. VERIFY CONFIGURATION
    // ===================================
    
    console.log('');
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Configuration Summary:');
    console.log(`   Environment: ${environment}`);
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Update your .env file with database credentials');
    console.log('   2. Run seed data: npm run db:seed');
    console.log('   3. Start your application server');
    console.log('');
    console.log('📖 Environment variables needed:');
    console.log(`   DB_HOST=${dbConfig.host}`);
    console.log(`   DB_PORT=${dbConfig.port}`);
    console.log(`   DB_NAME=${dbConfig.database}`);
    console.log(`   DB_USER=${dbConfig.user}`);
    console.log(`   DB_PASSWORD=${dbConfig.password}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Ensure PostgreSQL is running');
    console.error('   2. Check admin credentials');
    console.error('   3. Verify network connectivity');
    console.error('   4. Check PostgreSQL logs for details');
    
    process.exit(1);
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

async function checkConnection() {
  console.log('🔍 Testing database connection...');
  
  const testClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });
  
  try {
    await testClient.connect();
    const result = await testClient.query('SELECT version();');
    console.log(`✅ Connection successful - PostgreSQL ${result.rows[0].version}`);
    await testClient.end();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function showDatabaseInfo() {
  console.log('📊 Database information:');
  
  const infoClient = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });
  
  try {
    await infoClient.connect();
    
    // Get database size
    const sizeResult = await infoClient.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `);
    
    // Get table count
    const tableResult = await infoClient.query(`
      SELECT count(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    // Get extension info
    const extensionResult = await infoClient.query(`
      SELECT extname FROM pg_extension ORDER BY extname;
    `);
    
    console.log(`   Database size: ${sizeResult.rows[0].size}`);
    console.log(`   Tables: ${tableResult.rows[0].table_count}`);
    console.log(`   Extensions: ${extensionResult.rows.map(r => r.extname).join(', ')}`);
    
    await infoClient.end();
    
  } catch (error) {
    console.error(`❌ Could not retrieve database info: ${error.message}`);
  }
}

// ===================================
// COMMAND LINE INTERFACE
// ===================================

async function main() {
  const command = process.argv[3];
  
  switch (command) {
    case 'test':
      await checkConnection();
      break;
      
    case 'info':
      await showDatabaseInfo();
      break;
      
    case 'reset':
      console.log('⚠️  This will completely reset the database!');
      console.log('⚠️  All data will be lost!');
      console.log('');
      // Could implement reset functionality here
      console.log('Reset functionality not implemented for safety');
      break;
      
    default:
      await setupDatabase();
      break;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Setup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Setup terminated');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  setupDatabase,
  checkConnection,
  showDatabaseInfo
};