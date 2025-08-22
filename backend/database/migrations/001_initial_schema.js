/**
 * RevivaTech Database Migration: Initial Schema
 * Creates the complete database schema for the repair booking system
 */

const fs = require('fs');
const path = require('path');

exports.up = async function(knex) {
  
  try {
    // Read and execute the schema SQL file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await knex.raw(statement);
      }
    }
    
    console.log('   - Device Catalog: device_brands, device_categories, devices, device_variants');
    console.log('   - Repair Services: repair_categories, repair_types, repair_device_compatibility');
    console.log('   - Pricing Engine: pricing_factors, pricing_rules');
    console.log('   - Customer Management: customers');
    console.log('   - Booking System: bookings, booking_state_transitions');
    console.log('   - Scheduling: business_hours, availability_slots, special_dates');
    console.log('   - Communications: notification_templates, notifications');
    console.log('   - Analytics: booking_analytics');
    console.log('   - Configuration: app_configuration');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

exports.down = async function(knex) {
  
  try {
    // Drop all tables in reverse dependency order
    const tables = [
      'booking_analytics',
      'notifications',
      'notification_templates',
      'special_dates',
      'availability_slots',
      'business_hours',
      'booking_state_transitions',
      'bookings',
      'customers',
      'pricing_rules',
      'pricing_factors',
      'repair_device_compatibility',
      'repair_types',
      'repair_categories',
      'device_variants',
      'devices',
      'device_categories',
      'device_brands',
      'app_configuration'
    ];
    
    // Drop triggers and functions first
    await knex.raw('DROP TRIGGER IF EXISTS track_booking_events_trigger ON bookings');
    await knex.raw('DROP TRIGGER IF EXISTS generate_booking_number_trigger ON bookings');
    await knex.raw('DROP FUNCTION IF EXISTS track_booking_event()');
    await knex.raw('DROP FUNCTION IF EXISTS generate_booking_number()');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
    
    // Drop all updated_at triggers
    for (const table of tables) {
      await knex.raw(`DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table}`);
    }
    
    // Drop tables
    for (const table of tables) {
      await knex.schema.dropTableIfExists(table);
    }
    
    // Drop extensions
    await knex.raw('DROP EXTENSION IF EXISTS pg_trgm');
    await knex.raw('DROP EXTENSION IF EXISTS pgcrypto');
    await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
    
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
};