const express = require('express');
const router = express.Router();
const TemplateScanner = require('../services/TemplateScanner');

// Initialize template scanner
const templateScanner = new TemplateScanner();

// =========================
// SMS TEMPLATE ROUTES
// =========================

// Get all SMS templates
router.get('/', async (req, res) => {
  try {
    // Scan for SMS templates in file system
    const scannedTemplates = await templateScanner.scanSMSTemplates();
    
    // Add some default SMS templates for now
    const defaultTemplates = [
      {
        id: 'booking_confirmation_sms',
        name: 'Booking Confirmation SMS',
        type: 'sms',
        format: 'text',
        content: 'Hi {{customer_name}}! Your {{device}} repair booking #{{booking_id}} is confirmed. We\'ll contact you within 2 hours. Track: {{tracking_url}} - RevivaTech',
        character_count: 147,
        estimated_cost: 0.05,
        variables: ['customer_name', 'device', 'booking_id', 'tracking_url'],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'repair_ready_sms',
        name: 'Repair Ready SMS',
        type: 'sms',
        format: 'text',
        content: 'Great news {{customer_name}}! Your {{device}} repair is complete. Total: £{{total_cost}}. Collect from RevivaTech when ready. Call: {{phone}}',
        character_count: 134,
        estimated_cost: 0.05,
        variables: ['customer_name', 'device', 'total_cost', 'phone'],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'appointment_reminder_sms',
        name: 'Appointment Reminder SMS',
        type: 'sms',
        format: 'text',
        content: 'Reminder: {{customer_name}}, your {{device}} repair appointment is tomorrow at {{time}}. Bring charger & ID. RevivaTech - {{address}}',
        character_count: 128,
        estimated_cost: 0.05,
        variables: ['customer_name', 'device', 'time', 'address'],
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    // Combine scanned and default templates
    const allTemplates = [...defaultTemplates, ...scannedTemplates];

    res.json({
      success: true,
      data: {
        templates: allTemplates,
        count: allTemplates.length,
        total_character_count: allTemplates.reduce((sum, t) => sum + (t.character_count || 0), 0),
        total_estimated_cost: allTemplates.reduce((sum, t) => sum + (t.estimated_cost || 0), 0)
      },
      message: 'SMS templates retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to retrieve SMS templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SMS templates',
      message: error.message
    });
  }
});

// Get specific SMS template
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // For now, return mock template data
    const template = {
      id: templateId,
      name: templateId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: 'sms',
      format: 'text',
      content: `Hi {{customer_name}}! Your repair update: {{message}}. Contact us: {{phone}} - RevivaTech`,
      character_count: 89,
      estimated_cost: 0.05,
      variables: ['customer_name', 'message', 'phone'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: template,
      message: 'SMS template retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to retrieve SMS template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SMS template',
      message: error.message
    });
  }
});

// Send SMS using template
router.post('/:templateId/send', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { recipient, variables = {} } = req.body;
    
    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient required',
        message: 'SMS recipient phone number is required'
      });
    }

    // Mock SMS sending (in real implementation, integrate with SMS service)
    const result = {
      sms_id: `sms_${Date.now()}`,
      template_id: templateId,
      recipient,
      status: 'sent',
      character_count: 142,
      cost: 0.05,
      sent_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result,
      message: 'SMS sent successfully using template'
    });
  } catch (error) {
    console.error('Failed to send SMS template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SMS template',
      message: error.message
    });
  }
});

// Get SMS template analytics
router.get('/:templateId/analytics', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Mock analytics data
    const analytics = {
      template_id: templateId,
      total_sent: 156,
      total_delivered: 152,
      delivery_rate: 0.974,
      total_cost: 7.80,
      average_character_count: 138,
      recent_sends: [
        { date: '2025-08-22', sent: 12, delivered: 12, cost: 0.60 },
        { date: '2025-08-21', sent: 8, delivered: 8, cost: 0.40 },
        { date: '2025-08-20', sent: 15, delivered: 14, cost: 0.75 }
      ]
    };

    res.json({
      success: true,
      data: analytics,
      message: 'SMS template analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get SMS template analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS template analytics',
      message: error.message
    });
  }
});

// Get SMS capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      max_character_count: 160,
      character_encoding: 'GSM 7-bit',
      cost_per_sms: 0.05,
      currency: 'GBP',
      supported_variables: [
        'customer_name', 'device', 'booking_id', 'repair_status',
        'cost', 'phone', 'address', 'time', 'date'
      ],
      features: [
        'Template variable substitution',
        'Character count estimation',
        'Cost calculation',
        'Delivery tracking',
        'Unicode support'
      ]
    };

    res.json({
      success: true,
      data: capabilities,
      message: 'SMS capabilities retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get SMS capabilities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS capabilities',
      message: error.message
    });
  }
});

module.exports = router;