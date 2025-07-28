/**
 * Enhanced Pricing Calculator for RevivaTech
 * Comprehensive dynamic pricing with rules engine
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Simple pricing calculation with WebSocket notifications
router.post('/simple', [
  body('deviceModelId').notEmpty().withMessage('Device model ID is required'),
  body('repairType').notEmpty().withMessage('Repair type is required'),
  body('urgencyLevel').optional().isIn(['LOW', 'STANDARD', 'HIGH', 'URGENT', 'EMERGENCY']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceModelId, repairType, urgencyLevel = 'STANDARD' } = req.body;

    // Get device model info from database
    const deviceQuery = `
      SELECT dm.*, db.name as brand_name, dc.name as category_name
      FROM device_models dm
      LEFT JOIN device_brands db ON dm."brandId" = db.id
      LEFT JOIN device_categories dc ON db."categoryId" = dc.id
      WHERE dm.id = $1
    `;

    const deviceResult = await req.pool.query(deviceQuery, [deviceModelId]);
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Device model not found' });
    }

    const device = deviceResult.rows[0];

    // Get pricing rule
    const pricingQuery = `
      SELECT 
        "basePrice",
        "urgencyMultiplier", 
        "complexityMultiplier",
        "marketDemand",
        "seasonalFactor"
      FROM pricing_rules 
      WHERE ("deviceModelId" = $1 OR "deviceModelId" IS NULL)
        AND "repairType" = $2 
        AND "isActive" = true
      ORDER BY "deviceModelId" DESC NULLS LAST, "createdAt" DESC
      LIMIT 1
    `;

    const pricingResult = await req.pool.query(pricingQuery, [deviceModelId, repairType]);
    if (pricingResult.rows.length === 0) {
      return res.status(404).json({ error: `No pricing rule found for ${repairType}` });
    }

    const pricingRule = pricingResult.rows[0];
    
    // Debug: Log the pricing rule to see column names and values
    console.log('🔍 PRICING DEBUG - Full pricingRule object:', JSON.stringify(pricingRule, null, 2));
    console.log('🔍 PRICING DEBUG - pricingRule.basePrice:', pricingRule.basePrice);
    console.log('🔍 PRICING DEBUG - typeof pricingRule.basePrice:', typeof pricingRule.basePrice);

    // Calculate price with urgency multiplier
    const basePrice = parseFloat(pricingRule.basePrice);
    console.log('🔍 PRICING DEBUG - parsed basePrice:', basePrice);
    const urgencyMultipliers = {
      LOW: 0.9,
      STANDARD: 1.0,
      HIGH: 1.2,
      URGENT: 1.5,
      EMERGENCY: 2.0,
    };

    const urgencyMultiplier = urgencyMultipliers[urgencyLevel] || parseFloat(pricingRule.urgencyMultiplier) || 1.0;
    const complexityMultiplier = parseFloat(pricingRule.complexityMultiplier) || 1.0;
    const marketDemand = parseFloat(pricingRule.marketDemand) || 1.0;
    const seasonalFactor = parseFloat(pricingRule.seasonalFactor) || 1.0;

    console.log('🔍 PRICING DEBUG - Before finalPrice calculation:');
    console.log('  basePrice:', basePrice, 'type:', typeof basePrice);
    console.log('  urgencyMultiplier:', urgencyMultiplier);
    console.log('  complexityMultiplier:', complexityMultiplier);
    console.log('  marketDemand:', marketDemand);
    console.log('  seasonalFactor:', seasonalFactor);
    
    const finalPrice = Math.round(
      basePrice * urgencyMultiplier * complexityMultiplier * marketDemand * seasonalFactor
    );
    
    console.log('🔍 PRICING DEBUG - finalPrice calculated:', finalPrice);

    // Calculate quote validity
    const validityHours = urgencyLevel === 'URGENT' || urgencyLevel === 'EMERGENCY' ? 2 : 24;
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validityHours);

    console.log('🔍 PRICING DEBUG - About to create response with:');
    console.log('  basePrice variable:', basePrice, 'type:', typeof basePrice);
    console.log('  finalPrice variable:', finalPrice, 'type:', typeof finalPrice);

    const response = {
      success: true,
      deviceInfo: {
        id: device.id,
        name: `${device.brand_name} ${device.name}`,
        year: device.year,
        category: device.category_name,
      },
      pricing: {
        basePrice,
        finalPrice,
        breakdown: {
          base: basePrice,
          urgencyMultiplier,
          complexityMultiplier,
          marketDemand,
          seasonalFactor,
        },
        currency: 'GBP',
      },
      validity: {
        validUntil: validUntil.toISOString(),
        validityHours,
      },
      repairDetails: {
        type: repairType,
        urgency: urgencyLevel,
        estimatedTime: getEstimatedRepairTime(repairType, urgencyLevel),
      },
      disclaimers: [
        'Price is subject to physical inspection of the device',
        'Additional charges may apply for complex repairs or parts',
        'Quote valid for the specified time period only',
        'Final price may vary based on actual device condition',
      ],
      timestamp: new Date().toISOString(),
    };

    // Emit real-time pricing update via WebSocket
    if (req.app.locals.websocket) {
      const pricingUpdateData = {
        deviceModelId,
        repairType,
        urgencyLevel,
        oldPrice: basePrice,
        newPrice: finalPrice,
        timestamp: new Date().toISOString(),
        reason: 'Live quote request'
      };
      
      req.app.locals.websocket.emitPricingUpdate(pricingUpdateData);
      req.logger.info('Pricing update emitted via WebSocket', pricingUpdateData);
    }

    console.log('🔍 PRICING DEBUG - Final response.pricing:', JSON.stringify(response.pricing, null, 2));
    return res.json(response);

  } catch (error) {
    req.logger.error('Pricing calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate price',
      details: error.message,
    });
  }
});

function getEstimatedRepairTime(repairType, urgencyLevel) {
  const baseTimes = {
    SCREEN_REPAIR: '2-4 hours',
    BATTERY_REPLACEMENT: '1-2 hours',
    WATER_DAMAGE: '1-3 days',
    DATA_RECOVERY: '2-7 days',
    SOFTWARE_ISSUE: '1-4 hours',
    HARDWARE_DIAGNOSTIC: '30-60 minutes',
    MOTHERBOARD_REPAIR: '3-7 days',
    CAMERA_REPAIR: '2-4 hours',
    SPEAKER_REPAIR: '1-3 hours',
    CHARGING_PORT: '2-4 hours',
    BUTTON_REPAIR: '1-2 hours',
    CUSTOM_REPAIR: '1-5 days',
  };

  const baseTime = baseTimes[repairType] || '2-4 hours';
  
  if (urgencyLevel === 'URGENT' || urgencyLevel === 'EMERGENCY') {
    return `${baseTime} (expedited)`;
  }
  
  return baseTime;
}

// Enhanced quote calculation endpoint
router.post('/calculate', [
  body('device_id').isUUID().withMessage('Invalid device ID'),
  body('issues').isArray({ min: 1 }).withMessage('At least one issue must be selected'),
  body('issues.*.id').isUUID().withMessage('Invalid issue ID'),
  body('service_type').optional().isIn(['standard', 'express', 'same_day']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('customer_type').optional().isIn(['individual', 'business', 'education'])
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

    // Get device information
    const deviceQuery = `
      SELECT dm.*, dc.name as category_name, dc.slug as category_slug, 
             db.name as brand_name, db.slug as brand_slug
      FROM device_models dm
      JOIN device_brands db ON dm."brandId" = db.id
      JOIN device_categories dc ON db."categoryId" = dc.id
      WHERE dm.id = $1 AND dm."isActive" = TRUE
    `;

    const deviceResult = await req.pool.query(deviceQuery, [device_id]);
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = deviceResult.rows[0];
    const deviceAge = new Date().getFullYear() - device.year;

    // Initialize pricing calculation
    let baseCost = 0;
    let totalTimeMinutes = 0;
    let issueBreakdown = [];

    // Calculate base costs for each issue
    for (const issueInput of issues) {
      const issueQuery = `
        SELECT 
          di.id,
          di.name,
          di.category,
          di.difficulty_level,
          COALESCE(dim.estimated_cost_min, 0) as estimated_cost_min,
          COALESCE(dim.estimated_cost_max, 0) as estimated_cost_max,
          COALESCE(dim.repair_time_minutes, 60) as repair_time_minutes,
          dim.parts_required
        FROM device_issues di
        LEFT JOIN device_issue_mappings dim ON di.id = dim.issue_id AND dim.device_id = $2
        WHERE di.id = $1 AND di.is_active = TRUE
      `;

      const issueResult = await req.pool.query(issueQuery, [issueInput.id, device_id]);
      
      if (issueResult.rows.length > 0) {
        const issue = issueResult.rows[0];
        
        // Calculate issue base cost (average of min/max or fallback to category default)
        let issueCost = 0;
        
        if (issue.estimated_cost_min > 0 && issue.estimated_cost_max > 0) {
          issueCost = (parseFloat(issue.estimated_cost_min) + parseFloat(issue.estimated_cost_max)) / 2;
        } else {
          // Fallback to category-based pricing
          const categoryDefaults = {
            'screen': 120,
            'battery': 80,
            'charging': 60,
            'camera': 100,
            'audio': 70,
            'hardware': 90,
            'software': 40,
            'connectivity': 50
          };
          issueCost = categoryDefaults[issue.category] || 75;
        }

        issueBreakdown.push({
          id: issue.id,
          name: issue.name,
          category: issue.category,
          difficulty: issue.difficulty_level,
          base_cost: issueCost,
          time_minutes: parseInt(issue.repair_time_minutes),
          parts_required: issue.parts_required || []
        });

        baseCost += issueCost;
        totalTimeMinutes += parseInt(issue.repair_time_minutes);
      }
    }

    // Apply pricing rules in order of priority
    let finalCost = baseCost;
    let appliedRules = [];

    const rulesQuery = `
      SELECT * FROM repair_pricing_rules 
      WHERE is_active = TRUE 
      AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
      ORDER BY priority ASC
    `;

    const rulesResult = await req.pool.query(rulesQuery);

    for (const rule of rulesResult.rows) {
      const conditions = rule.conditions || {};
      let ruleApplies = true;

      // Check rule conditions
      if (conditions.category && conditions.category !== device.category_slug) ruleApplies = false;
      if (conditions.brand && conditions.brand !== device.brand_slug) ruleApplies = false;
      if (conditions.service_type && conditions.service_type !== service_type) ruleApplies = false;
      if (conditions.min_age_years && deviceAge < conditions.min_age_years) ruleApplies = false;
      if (conditions.max_age_years && deviceAge > conditions.max_age_years) ruleApplies = false;
      if (conditions.customer_type && conditions.customer_type !== customer_type) ruleApplies = false;
      
      // Check issue-specific conditions
      if (conditions.issue_category) {
        const hasMatchingIssue = issueBreakdown.some(issue => issue.category === conditions.issue_category);
        if (!hasMatchingIssue) ruleApplies = false;
      }

      if (ruleApplies) {
        let adjustment = 0;
        
        switch (rule.calculation_method) {
          case 'fixed':
            adjustment = parseFloat(rule.base_amount || 0);
            break;
          case 'percentage':
            adjustment = (finalCost * parseFloat(rule.percentage || 0)) / 100;
            break;
          case 'multiplier':
            adjustment = finalCost * (parseFloat(rule.percentage || 0) / 100);
            finalCost = finalCost + adjustment;
            break;
        }

        if (rule.calculation_method !== 'multiplier') {
          finalCost += adjustment;
        }

        appliedRules.push({
          name: rule.name,
          type: rule.rule_type,
          adjustment: Math.round(adjustment * 100) / 100,
          method: rule.calculation_method,
          description: rule.notes || ''
        });
      }
    }

    // Apply service type multipliers
    const serviceMultipliers = {
      'standard': { multiplier: 1.0, name: 'Standard Service' },
      'express': { multiplier: 1.5, name: 'Express Service (24h)' },
      'same_day': { multiplier: 2.0, name: 'Same Day Service' }
    };

    const serviceConfig = serviceMultipliers[service_type];
    if (serviceConfig && serviceConfig.multiplier !== 1.0) {
      const serviceAdjustment = baseCost * (serviceConfig.multiplier - 1.0);
      finalCost += serviceAdjustment;
      
      appliedRules.push({
        name: serviceConfig.name,
        type: 'service_multiplier',
        adjustment: Math.round(serviceAdjustment * 100) / 100,
        method: 'multiplier',
        description: `${Math.round((serviceConfig.multiplier - 1) * 100)}% surcharge for ${service_type} service`
      });
    }

    // Calculate completion time based on service type
    const timeMultipliers = {
      'standard': 1.0,
      'express': 0.6,
      'same_day': 0.3
    };

    const adjustedTimeHours = Math.ceil((totalTimeMinutes * timeMultipliers[service_type]) / 60);
    const completionDate = new Date();
    completionDate.setHours(completionDate.getHours() + adjustedTimeHours);

    // Round final cost to nearest penny
    finalCost = Math.round(finalCost * 100) / 100;

    // Generate quote response
    const quote = {
      quote_id: require('uuid').v4(),
      device: {
        id: device.id,
        name: device.display_name,
        brand: device.brand_name,
        category: device.category_name,
        year: device.year,
        age_years: deviceAge
      },
      issues: issueBreakdown,
      service: {
        type: service_type,
        priority: priority,
        customer_type: customer_type
      },
      pricing: {
        base_cost: Math.round(baseCost * 100) / 100,
        final_cost: finalCost,
        currency: 'GBP',
        adjustments: appliedRules,
        savings: baseCost > finalCost ? Math.round((baseCost - finalCost) * 100) / 100 : 0
      },
      timing: {
        estimated_hours: adjustedTimeHours,
        estimated_completion: completionDate,
        service_level: serviceConfig?.name || 'Standard Service'
      },
      validity: {
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        generated_at: new Date()
      },
      terms: {
        deposit_required: finalCost > 200 ? Math.round(finalCost * 0.3 * 100) / 100 : 0,
        warranty_months: 6,
        guarantee: 'No fix, no fee guarantee applies'
      }
    };

    res.json(quote);

  } catch (error) {
    req.logger.error('Pricing calculation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to calculate quote'
    });
  }
});

// Get pricing rules (admin endpoint)
router.get('/rules', async (req, res) => {
  try {
    const query = `
      SELECT * FROM repair_pricing_rules 
      WHERE is_active = TRUE
      ORDER BY priority ASC, name ASC
    `;
    
    const result = await req.pool.query(query);
    res.json(result.rows);

  } catch (error) {
    req.logger.error('Pricing rules fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Price comparison endpoint
router.post('/compare', [
  body('device_ids').isArray({ min: 2, max: 5 }).withMessage('2-5 devices required for comparison'),
  body('device_ids.*').isUUID().withMessage('Invalid device ID'),
  body('issue_id').isUUID().withMessage('Invalid issue ID'),
  body('service_type').optional().isIn(['standard', 'express', 'same_day'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_ids, issue_id, service_type = 'standard' } = req.body;
    const comparisons = [];

    for (const device_id of device_ids) {
      try {
        // Calculate quote for each device
        const quoteResponse = await calculateQuote(req.pool, req.logger, {
          device_id,
          issues: [{ id: issue_id }],
          service_type
        });

        comparisons.push({
          device_id,
          device_name: quoteResponse.device.name,
          brand: quoteResponse.device.brand,
          final_cost: quoteResponse.pricing.final_cost,
          estimated_hours: quoteResponse.timing.estimated_hours,
          repairability_score: quoteResponse.device.repairability_score || 5
        });

      } catch (error) {
        req.logger.warn(`Failed to calculate quote for device ${device_id}:`, error.message);
        comparisons.push({
          device_id,
          error: 'Quote calculation failed'
        });
      }
    }

    // Sort by price (lowest first)
    const validComparisons = comparisons.filter(c => !c.error);
    validComparisons.sort((a, b) => a.final_cost - b.final_cost);

    res.json({
      comparison: validComparisons,
      best_value: validComparisons[0] || null,
      issue_id,
      service_type,
      generated_at: new Date()
    });

  } catch (error) {
    req.logger.error('Price comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function for quote calculation (reusable)
async function calculateQuote(pool, logger, params) {
  // Implementation would be similar to the main calculate endpoint
  // This is a placeholder for the modular approach
  throw new Error('Not implemented - use main calculate endpoint');
}

module.exports = router;