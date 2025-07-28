const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Debug endpoint to test booking creation
router.post('/test', async (req, res) => {
  const client = await req.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Log request body
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      deviceModelId,
      repairType,
      problemDescription,
      urgencyLevel = 'STANDARD',
      customerInfo
    } = req.body;
    
    // Check device model
    const deviceCheck = await client.query(
      'SELECT id, name FROM device_models WHERE id = $1',
      [deviceModelId]
    );
    console.log('Device check result:', deviceCheck.rows);
    
    if (deviceCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Invalid device model',
        code: 'INVALID_DEVICE_MODEL'
      });
    }
    
    // Generate IDs
    const bookingId = crypto.randomBytes(16).toString('hex');
    const customerId = crypto.randomBytes(16).toString('hex');
    
    // Create customer
    console.log('Creating customer with email:', customerInfo.email);
    const userQuery = `
      INSERT INTO users (
        id, email, "firstName", "lastName", phone, 
        role, "isActive", "isVerified", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, email
    `;
    
    const userResult = await client.query(userQuery, [
      customerId,
      customerInfo.email.toLowerCase(),
      customerInfo.firstName || 'Guest',
      customerInfo.lastName || 'Customer',
      customerInfo.phone || null,
      'CUSTOMER',
      true,
      false
    ]);
    console.log('Customer created:', userResult.rows[0]);
    
    // Create booking
    console.log('Creating booking...');
    const bookingQuery = `
      INSERT INTO bookings (
        id, "customerId", "deviceModelId", "repairType", "problemDescription",
        "urgencyLevel", status, "basePrice", "finalPrice", "customerInfo", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id, status, "basePrice"
    `;
    
    const bookingResult = await client.query(bookingQuery, [
      bookingId,
      customerId,
      deviceModelId,
      repairType,
      problemDescription,
      urgencyLevel,
      'PENDING',
      150.00,
      150.00,
      JSON.stringify(customerInfo)
    ]);
    console.log('Booking created:', bookingResult.rows[0]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      booking: {
        id: bookingId,
        customerId: customerId,
        status: 'PENDING',
        device: deviceCheck.rows[0].name
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Debug booking error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      column: error.column,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Debug booking failed',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail
      }
    });
  } finally {
    client.release();
  }
});

module.exports = router;