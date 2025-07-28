const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  user: 'revivatech_user',
  host: 'new-database',
  database: 'revivatech_new',
  password: 'revivatech_password',
  port: 5432,
});

async function testBookingCreation() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database');
    
    // Test device model query
    const deviceCheck = await client.query(
      'SELECT id FROM device_models WHERE id = $1',
      ['cmd1rthdh002dlfdcb8ph3oob']
    );
    console.log('Device found:', deviceCheck.rows.length > 0);
    
    // Test booking creation
    const bookingId = crypto.randomBytes(16).toString('hex');
    const customerId = crypto.randomBytes(16).toString('hex');
    
    await client.query('BEGIN');
    
    // Create test customer first
    await client.query(
      'INSERT INTO users (id, email, "firstName", "lastName", phone, role, "isActive", "isVerified") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        customerId,
        'test@example.com',
        'Test',
        'User',
        '+1234567890',
        'CUSTOMER',
        true,
        false
      ]
    );
    console.log('Customer created');
    
    // Create booking
    const bookingQuery = `
      INSERT INTO bookings (
        id, "customerId", "deviceModelId", "repairType", "problemDescription",
        "urgencyLevel", status, "basePrice", "finalPrice", "preferredDate",
        "customerInfo", "deviceCondition", "customerNotes"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await client.query(bookingQuery, [
      bookingId,
      customerId,
      'cmd1rthdh002dlfdcb8ph3oob',
      'SCREEN_REPLACEMENT',
      'Screen is cracked and not responding to touch',
      'STANDARD',
      'PENDING',
      150.00,
      150.00,
      null,
      JSON.stringify({ email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
      JSON.stringify({ physical: 'Fair', screen: 'Cracked' }),
      null
    ]);
    
    console.log('Booking created successfully:', result.rows[0].id);
    
    await client.query('ROLLBACK'); // Don't actually save the test data
    console.log('Transaction rolled back');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Stack:', error.stack);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
}

testBookingCreation();