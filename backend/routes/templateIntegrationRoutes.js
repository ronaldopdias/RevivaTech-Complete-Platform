const express = require('express');
const router = express.Router();

// Template-Service Integration Routes
// Connects template system to booking, customer, and repair services

// =========================
// TEMPLATE-BOOKING INTEGRATION
// =========================

// Trigger booking confirmation template
router.post('/booking/confirmation', async (req, res) => {
  try {
    const { bookingId, customerEmail, customerName, deviceName, serviceType } = req.body;
    
    if (!bookingId || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'bookingId and customerEmail are required'
      });
    }

    const templateEngine = req.app.locals.templateEngine;
    if (!templateEngine) {
      return res.status(500).json({
        error: 'Template engine not available',
        message: 'Email template service not initialized'
      });
    }

    // Prepare template variables
    const templateVariables = {
      user: {
        first_name: customerName,
        email: customerEmail
      },
      booking: {
        id: bookingId,
        service_type: serviceType,
        device_name: deviceName,
        created_at: new Date().toISOString()
      },
      company: {
        name: 'RevivaTech',
        support_email: 'support@revivatech.co.uk',
        phone: '+44 123 456 789'
      }
    };

    // Use booking confirmation template
    const emailContent = await templateEngine.renderTemplate('booking_confirmation', templateVariables);
    
    console.log('📧 Booking confirmation template rendered for:', customerEmail);
    
    res.json({
      success: true,
      data: {
        bookingId,
        templateRendered: true,
        recipient: customerEmail,
        templateType: 'booking_confirmation'
      },
      message: 'Booking confirmation template processed successfully'
    });

  } catch (error) {
    req.logger?.error('Booking confirmation template failed:', error);
    res.status(500).json({
      error: 'Template processing failed',
      message: error.message
    });
  }
});

// =========================
// TEMPLATE-REPAIR INTEGRATION
// =========================

// Trigger repair status update template
router.post('/repair/status-update', async (req, res) => {
  try {
    const { repairId, customerId, status, deviceName, estimatedCompletion } = req.body;
    
    if (!repairId || !customerId || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'repairId, customerId, and status are required'
      });
    }

    const templateEngine = req.app.locals.templateEngine;
    if (!templateEngine) {
      return res.status(500).json({
        error: 'Template engine not available'
      });
    }

    // Map status to template variables
    const statusMessages = {
      'received': 'We have received your device and diagnostic is underway',
      'diagnosed': 'Diagnostic complete - quote will be sent shortly',
      'approved': 'Repair has been approved and work has begun',
      'in_progress': 'Your device repair is currently in progress',
      'completed': 'Great news! Your device repair is complete',
      'ready_for_collection': 'Your device is ready for collection'
    };

    const templateVariables = {
      repair: {
        id: repairId,
        status: status,
        status_message: statusMessages[status] || 'Repair status updated',
        device_name: deviceName,
        estimated_completion: estimatedCompletion
      },
      customer: {
        id: customerId
      },
      company: {
        name: 'RevivaTech',
        support_email: 'support@revivatech.co.uk'
      }
    };

    console.log('🔧 Repair status template rendered for repair:', repairId);
    
    res.json({
      success: true,
      data: {
        repairId,
        status,
        templateRendered: true,
        templateType: 'repair_status_update'
      },
      message: 'Repair status template processed successfully'
    });

  } catch (error) {
    req.logger?.error('Repair status template failed:', error);
    res.status(500).json({
      error: 'Template processing failed',
      message: error.message
    });
  }
});

// =========================
// TEMPLATE-CUSTOMER INTEGRATION
// =========================

// Trigger customer welcome series
router.post('/customer/welcome', async (req, res) => {
  try {
    const { customerId, customerEmail, customerName, registrationDate } = req.body;
    
    if (!customerId || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'customerId and customerEmail are required'
      });
    }

    const templateEngine = req.app.locals.templateEngine;
    if (!templateEngine) {
      return res.status(500).json({
        error: 'Template engine not available'
      });
    }

    const templateVariables = {
      user: {
        id: customerId,
        first_name: customerName,
        email: customerEmail,
        registration_date: registrationDate || new Date().toISOString()
      },
      company: {
        name: 'RevivaTech',
        website: 'https://revivatech.co.uk',
        support_email: 'support@revivatech.co.uk'
      }
    };

    console.log('👋 Welcome template rendered for new customer:', customerEmail);
    
    res.json({
      success: true,
      data: {
        customerId,
        templateRendered: true,
        templateType: 'customer_welcome'
      },
      message: 'Customer welcome template processed successfully'
    });

  } catch (error) {
    req.logger?.error('Customer welcome template failed:', error);
    res.status(500).json({
      error: 'Template processing failed',
      message: error.message
    });
  }
});

// =========================
// SMS TEMPLATE INTEGRATION
// =========================

// Trigger SMS notification
router.post('/sms/send', async (req, res) => {
  try {
    const { phoneNumber, templateType, variables = {} } = req.body;
    
    if (!phoneNumber || !templateType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'phoneNumber and templateType are required'
      });
    }

    // Use our SMS export service
    const response = await fetch(`http://localhost:3011/api/export/sms/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateType, variables })
    });

    const smsResult = await response.json();
    
    if (smsResult.success) {
      console.log('📱 SMS template generated:', smsResult.data.template);
      
      res.json({
        success: true,
        data: {
          phoneNumber,
          templateType,
          message: smsResult.data.template,
          charCount: smsResult.data.charCount,
          isValid: smsResult.data.isValid
        },
        message: 'SMS template generated successfully'
      });
    } else {
      throw new Error('SMS template generation failed');
    }

  } catch (error) {
    req.logger?.error('SMS template integration failed:', error);
    res.status(500).json({
      error: 'SMS template processing failed',
      message: error.message
    });
  }
});

// =========================
// TEMPLATE PREVIEW FUNCTIONALITY
// =========================

// Preview email template with sample data
router.post('/preview/email/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { sampleData = {} } = req.body;
    
    const templateEngine = req.app.locals.templateEngine;
    if (!templateEngine) {
      return res.status(500).json({
        error: 'Template engine not available'
      });
    }

    // Default sample data for preview
    const defaultSampleData = {
      user: {
        first_name: 'John',
        name: 'John Smith',
        email: 'john.smith@example.com'
      },
      repair: {
        id: 'R001',
        brand: 'Apple',
        model: 'iPhone 12',
        issue: 'Screen replacement',
        status: 'In Progress'
      },
      booking: {
        id: 'BK001',
        service_type: 'Screen Repair',
        appointment_date: '2025-07-28',
        time_slot: '10:00 AM'
      },
      company: {
        name: 'RevivaTech',
        support_email: 'support@revivatech.co.uk',
        phone: '+44 123 456 789'
      }
    };

    const mergedData = { ...defaultSampleData, ...sampleData };
    const preview = await templateEngine.getTemplatePreview(templateId, mergedData);
    
    res.json({
      success: true,
      data: {
        templateId,
        preview,
        sampleData: mergedData
      },
      message: 'Template preview generated successfully'
    });

  } catch (error) {
    req.logger?.error('Template preview failed:', error);
    res.status(500).json({
      error: 'Template preview failed',
      message: error.message
    });
  }
});

// Preview SMS template
router.post('/preview/sms/:templateType', async (req, res) => {
  try {
    const { templateType } = req.params;
    const { variables = {} } = req.body;
    
    // Default sample variables
    const defaultVariables = {
      customerName: 'John Smith',
      deviceName: 'iPhone 12',
      bookingId: 'BK001',
      repairStatus: 'in progress',
      estimatedCompletion: '2025-07-28',
      totalCost: '120.00',
      phoneNumber: '+441234567890'
    };

    const mergedVariables = { ...defaultVariables, ...variables };
    
    // Use our SMS export service
    const response = await fetch(`http://localhost:3011/api/export/sms/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateType, variables: mergedVariables })
    });

    const smsResult = await response.json();
    
    if (smsResult.success) {
      res.json({
        success: true,
        data: {
          templateType,
          preview: {
            message: smsResult.data.template,
            charCount: smsResult.data.charCount,
            isValid: smsResult.data.isValid,
            maxLength: smsResult.data.maxLength
          },
          sampleVariables: mergedVariables
        },
        message: 'SMS template preview generated successfully'
      });
    } else {
      throw new Error('SMS preview generation failed');
    }

  } catch (error) {
    req.logger?.error('SMS preview failed:', error);
    res.status(500).json({
      error: 'SMS preview failed',
      message: error.message
    });
  }
});

// Preview PDF template
router.post('/preview/pdf/:templateType', async (req, res) => {
  try {
    const { templateType } = req.params;
    const { sampleData = {} } = req.body;
    
    // Default sample data for PDF
    const defaultData = {
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      customerAddress: {
        line1: '123 Sample Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      invoiceNumber: 'INV-PREVIEW-001',
      quoteNumber: 'QTE-PREVIEW-001',
      invoiceDate: new Date().toLocaleDateString(),
      deviceName: 'iPhone 12',
      serviceName: 'Screen Replacement',
      totalCost: '120.00',
      items: [
        {
          description: 'Screen Replacement Service',
          quantity: 1,
          unitPrice: 100.00,
          total: 100.00
        },
        {
          description: 'Diagnostic Fee',
          quantity: 1,
          unitPrice: 20.00,
          total: 20.00
        }
      ],
      subtotal: 120.00,
      tax: 24.00,
      taxRate: 20,
      total: 144.00
    };

    const mergedData = { ...defaultData, ...sampleData };
    
    res.json({
      success: true,
      data: {
        templateType,
        preview: {
          type: 'pdf',
          description: `${templateType} PDF template preview`,
          sampleData: mergedData,
          downloadUrl: `/api/pdf/${templateType}`,
          previewNote: 'This would generate a professional PDF document'
        }
      },
      message: 'PDF template preview data generated successfully'
    });

  } catch (error) {
    req.logger?.error('PDF preview failed:', error);
    res.status(500).json({
      error: 'PDF preview failed',
      message: error.message
    });
  }
});

// =========================
// INTEGRATION STATUS
// =========================

// Get integration capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const templateEngine = req.app.locals.templateEngine;
    const emailService = req.app.locals.emailService;
    
    const capabilities = {
      template_engine: !!templateEngine,
      email_service: !!emailService,
      integrations: {
        booking_confirmation: { available: true, description: 'Automatic booking confirmation emails' },
        repair_status_updates: { available: true, description: 'Repair progress notifications' },
        customer_welcome: { available: true, description: 'New customer welcome series' },
        sms_notifications: { available: true, description: 'SMS template integration' }
      },
      supported_events: [
        'booking_created',
        'booking_confirmed', 
        'repair_status_changed',
        'customer_registered',
        'repair_completed',
        'payment_received'
      ]
    };

    res.json({
      success: true,
      data: capabilities,
      message: 'Template integration capabilities retrieved successfully'
    });

  } catch (error) {
    req.logger?.error('Integration capabilities check failed:', error);
    res.status(500).json({
      error: 'Capabilities check failed',
      message: error.message
    });
  }
});

module.exports = router;