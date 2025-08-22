/**
 * Analytics Database Initialization Script
 * Phase 7 - Production Analytics Setup
 * 
 * This script creates the necessary database tables and indexes
 * for the analytics system to function properly.
 */

import { Pool } from 'pg';

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5435'),
  database: process.env.DATABASE_NAME || 'revivatech',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

async function initializeAnalyticsDatabase() {
  const client = new Pool(dbConfig);

  try {

    // Create analytics_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255),
        session_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        label VARCHAR(255),
        value DECIMAL(10,2),
        properties JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for analytics_events
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
    `);


    // Create analytics_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15,2) NOT NULL,
        metric_unit VARCHAR(20),
        dimensions JSONB DEFAULT '{}',
        calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        period_start TIMESTAMP WITH TIME ZONE,
        period_end TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create indexes for analytics_metrics
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name ON analytics_metrics(metric_name);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_metrics_calculated_at ON analytics_metrics(calculated_at);
    `);


    // Create customers table if it doesn't exist (for analytics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'UK',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);


    // Create bookings table if it doesn't exist (for analytics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        device_type VARCHAR(100),
        device_model VARCHAR(255),
        repair_type VARCHAR(255),
        issue_description TEXT,
        amount DECIMAL(10,2),
        payment_status VARCHAR(50) DEFAULT 'pending',
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create indexes for bookings
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
    `);


    // Create reviews table for customer satisfaction tracking
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        customer_id INTEGER REFERENCES customers(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for reviews
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
    `);


    // Insert sample data for testing (production environment can skip this)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧪 Inserting sample data for development...');

      // Sample customers
      await client.query(`
        INSERT INTO customers (email, first_name, last_name, phone, city, country) 
        VALUES 
          ('john.smith@example.com', 'John', 'Smith', '+44 7700 900123', 'London', 'UK'),
          ('sarah.jones@example.com', 'Sarah', 'Jones', '+44 7700 900124', 'Manchester', 'UK'),
          ('mike.brown@example.com', 'Mike', 'Brown', '+44 7700 900125', 'Birmingham', 'UK')
        ON CONFLICT (email) DO NOTHING
      `);

      // Sample bookings
      await client.query(`
        INSERT INTO bookings (customer_id, device_type, device_model, repair_type, amount, payment_status, status) 
        VALUES 
          (1, 'iPhone', 'iPhone 15 Pro', 'Screen Replacement', 280.00, 'completed', 'completed'),
          (2, 'MacBook', 'MacBook Air M2', 'Battery Replacement', 220.00, 'completed', 'in_progress'),
          (3, 'iPad', 'iPad Pro 12.9"', 'Water Damage Recovery', 350.00, 'pending', 'diagnostic')
        ON CONFLICT DO NOTHING
      `);

      // Sample reviews
      await client.query(`
        INSERT INTO reviews (booking_id, customer_id, rating, comment) 
        VALUES 
          (1, 1, 5, 'Excellent service! Very professional and quick repair.'),
          (2, 2, 4, 'Good service, but took a bit longer than expected.')
        ON CONFLICT DO NOTHING
      `);

    }

    // Create views for analytics queries
    await client.query(`
      CREATE OR REPLACE VIEW analytics_revenue_daily AS
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as bookings_count,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_order_value
      FROM bookings 
      WHERE payment_status = 'completed' 
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);


    console.log('🎉 Analytics database initialization completed successfully!');
    console.log('');
    console.log('   - analytics_events (event tracking)');
    console.log('   - analytics_metrics (calculated metrics)');
    console.log('   - customers (customer data)');
    console.log('   - bookings (repair bookings)');
    console.log('   - reviews (customer feedback)');
    console.log('');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeAnalyticsDatabase().catch(console.error);
}

export { initializeAnalyticsDatabase };