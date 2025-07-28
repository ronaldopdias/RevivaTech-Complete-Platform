/**
 * Simple Pricing Calculator for RevivaTech
 * Works with the device API structure
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Calculate pricing for device repair
router.post('/calculate', [
  body('device_id').notEmpty().withMessage('Device ID is required'),
  body('issues').isArray().withMessage('Issues must be an array'),
  body('issues.*.id').isString().withMessage('Each issue must have an ID'),
  body('service_type').optional().isIn(['standard', 'express', 'same_day']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('customer_type').optional().isIn(['individual', 'business', 'education']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      device_id, 
      issues, 
      service_type = 'standard',
      priority = 'medium',
      customer_type = 'individual'
    } = req.body;

    // Get device info
    const deviceQuery = `
      SELECT 
        d.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM device_models d
      LEFT JOIN device_brands b ON d."brandId" = b.id
      LEFT JOIN device_categories c ON b."categoryId" = c.id
      WHERE d.id = $1 AND d."isActive" = true
    `;

    const deviceResult = await req.pool.query(deviceQuery, [device_id]);
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = deviceResult.rows[0];

    // Mock common issues (in a real implementation, this would come from a database)
    const commonIssues = {
      'screen-crack': { name: 'Screen Crack', base_cost: 80, time_minutes: 60, difficulty: 'medium' },
      'battery-drain': { name: 'Battery Issues', base_cost: 60, time_minutes: 45, difficulty: 'easy' },
      'keyboard-issues': { name: 'Keyboard Problems', base_cost: 40, time_minutes: 30, difficulty: 'easy' },
      'overheating': { name: 'Overheating', base_cost: 70, time_minutes: 90, difficulty: 'medium' },
      'port-connectivity': { name: 'Port Issues', base_cost: 50, time_minutes: 45, difficulty: 'medium' },
      'screen-flickering': { name: 'Screen Flickering', base_cost: 90, time_minutes: 75, difficulty: 'hard' },
      'camera-issues': { name: 'Camera Problems', base_cost: 85, time_minutes: 60, difficulty: 'medium' },
      'speaker-problems': { name: 'Speaker Issues', base_cost: 45, time_minutes: 30, difficulty: 'easy' },
      'wifi-connectivity': { name: 'WiFi Issues', base_cost: 35, time_minutes: 30, difficulty: 'easy' },
      'slow-performance': { name: 'Slow Performance', base_cost: 30, time_minutes: 60, difficulty: 'easy' }
    };

    // Calculate base costs
    let totalBaseCost = 0;
    let totalTimeMinutes = 0;
    let processedIssues = [];

    for (const issue of issues) {
      const issueId = issue.id;
      const issueData = commonIssues[issueId];
      
      if (issueData) {
        processedIssues.push({
          id: issueId,
          name: issueData.name,
          category: 'repair',
          difficulty: issueData.difficulty,
          base_cost: issueData.base_cost,
          time_minutes: issueData.time_minutes
        });
        
        totalBaseCost += issueData.base_cost;
        totalTimeMinutes += issueData.time_minutes;
      }
    }

    // Apply device-specific adjustments
    let deviceMultiplier = 1.0;
    
    // Year-based pricing (newer devices cost more)
    const deviceAge = new Date().getFullYear() - device.year;
    if (deviceAge <= 1) {
      deviceMultiplier *= 1.3; // 30% more for latest devices
    } else if (deviceAge <= 3) {
      deviceMultiplier *= 1.1; // 10% more for recent devices
    } else if (deviceAge >= 6) {
      deviceMultiplier *= 0.8; // 20% less for older devices
    }

    // Brand-based pricing
    if (device.brand_name === 'Apple') {
      deviceMultiplier *= 1.2; // Apple premium
    } else if (device.brand_name === 'Samsung') {
      deviceMultiplier *= 1.1; // Samsung premium
    }

    // Category-based pricing
    if (device.category_name === 'MacBook' || device.category_name === 'Ultrabook') {
      deviceMultiplier *= 1.15; // Premium laptop surcharge
    } else if (device.category_name === 'iPhone') {
      deviceMultiplier *= 1.1; // iPhone premium
    }

    // Apply device adjustments
    totalBaseCost *= deviceMultiplier;

    // Service type multipliers
    const serviceMultipliers = {
      standard: 1.0,
      express: 1.5,
      same_day: 2.0
    };

    const serviceMultiplier = serviceMultipliers[service_type] || 1.0;
    const finalCost = totalBaseCost * serviceMultiplier;

    // Customer type discounts
    let customerDiscount = 0;
    if (customer_type === 'education') {
      customerDiscount = finalCost * 0.1; // 10% education discount
    } else if (customer_type === 'business') {
      customerDiscount = finalCost * 0.05; // 5% business discount
    }

    const discountedCost = finalCost - customerDiscount;

    // Calculate timing
    const serviceTimeMultipliers = {
      standard: 1.0,
      express: 0.6,
      same_day: 0.3
    };

    const estimatedHours = Math.ceil((totalTimeMinutes * serviceTimeMultipliers[service_type]) / 60);

    // Build adjustments array
    const adjustments = [];
    
    if (deviceMultiplier !== 1.0) {
      adjustments.push({
        name: `${device.brand_name} ${device.category_name} Adjustment`,
        type: 'device_premium',
        adjustment: totalBaseCost - (totalBaseCost / deviceMultiplier),
        method: 'percentage',
        description: `Device-specific pricing adjustment`
      });
    }

    if (serviceMultiplier !== 1.0) {
      adjustments.push({
        name: `${service_type.replace('_', ' ')} Service`,
        type: 'service_multiplier',
        adjustment: finalCost - totalBaseCost,
        method: 'multiplier',
        description: `Service speed adjustment`
      });
    }

    if (customerDiscount > 0) {
      adjustments.push({
        name: `${customer_type} Discount`,
        type: 'discount',
        adjustment: -customerDiscount,
        method: 'percentage',
        description: `Customer type discount`
      });
    }

    // Generate quote
    const quote = {
      quote_id: `RT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      device: {
        id: device.id,
        name: device.name,
        brand: device.brand_name,
        category: device.category_name,
        year: device.year
      },
      issues: processedIssues,
      service: {
        type: service_type,
        priority,
        customer_type
      },
      pricing: {
        base_cost: Math.round(totalBaseCost / deviceMultiplier),
        adjustments: adjustments,
        final_cost: Math.round(discountedCost),
        currency: 'GBP',
        savings: customerDiscount > 0 ? Math.round(customerDiscount) : 0
      },
      timing: {
        estimated_hours: estimatedHours,
        estimated_completion: new Date(Date.now() + estimatedHours * 60 * 60 * 1000).toISOString(),
        service_level: service_type.replace('_', ' ').toUpperCase()
      },
      terms: {
        deposit_required: Math.round(discountedCost * 0.3), // 30% deposit
        warranty_months: 6,
        guarantee: 'No fix, no fee'
      },
      validity: {
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        generated_at: new Date().toISOString()
      }
    };

    res.json(quote);

  } catch (error) {
    req.logger.error('Pricing calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get common issues for a device
router.get('/issues/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Mock common issues based on device category
    // In a real implementation, this would query a database
    const commonIssues = [
      {
        id: 'screen-crack',
        name: 'Screen Crack',
        slug: 'screen-crack',
        description: 'Cracked or damaged display screen',
        category: 'display',
        symptoms: ['Visible cracks', 'Black spots', 'Lines on screen'],
        difficulty_level: 'medium',
        estimated_cost_min: 60,
        estimated_cost_max: 120,
        repair_time_minutes: 60,
        success_rate: 95,
        parts_required: ['Screen assembly', 'Adhesive']
      },
      {
        id: 'battery-drain',
        name: 'Battery Issues',
        slug: 'battery-drain',
        description: 'Poor battery life or charging problems',
        category: 'power',
        symptoms: ['Quick battery drain', 'Won\'t charge', 'Overheating while charging'],
        difficulty_level: 'easy',
        estimated_cost_min: 40,
        estimated_cost_max: 80,
        repair_time_minutes: 45,
        success_rate: 98,
        parts_required: ['Battery']
      },
      {
        id: 'keyboard-issues',
        name: 'Keyboard Problems',
        slug: 'keyboard-issues',
        description: 'Sticky keys, unresponsive keys, or complete keyboard failure',
        category: 'input',
        symptoms: ['Keys not responding', 'Sticky keys', 'Wrong characters'],
        difficulty_level: 'easy',
        estimated_cost_min: 30,
        estimated_cost_max: 60,
        repair_time_minutes: 30,
        success_rate: 90,
        parts_required: ['Keyboard', 'Key switches']
      },
      {
        id: 'overheating',
        name: 'Overheating',
        slug: 'overheating',
        description: 'Device runs hot, thermal throttling, or fan issues',
        category: 'thermal',
        symptoms: ['Hot to touch', 'Fan noise', 'Performance drops'],
        difficulty_level: 'medium',
        estimated_cost_min: 50,
        estimated_cost_max: 100,
        repair_time_minutes: 90,
        success_rate: 85,
        parts_required: ['Thermal paste', 'Fan assembly']
      },
      {
        id: 'port-connectivity',
        name: 'Port Issues',
        slug: 'port-connectivity',
        description: 'USB, charging, or other port connection problems',
        category: 'connectivity',
        symptoms: ['Loose connections', 'Port not working', 'Intermittent charging'],
        difficulty_level: 'medium',
        estimated_cost_min: 40,
        estimated_cost_max: 80,
        repair_time_minutes: 45,
        success_rate: 92,
        parts_required: ['Port assembly', 'Connector']
      }
    ];

    res.json(commonIssues);

  } catch (error) {
    req.logger.error('Issues fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;