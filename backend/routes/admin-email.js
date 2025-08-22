const express = require('express');
const router = express.Router();

// Note: In a real application, you'd import these as singletons
const EmailService = require('../services/EmailService');
const EmailTemplateEngine = require('../services/EmailTemplateEngine');
const EmailAutomationService = require('../services/EmailAutomationService');
const EmailAnalyticsService = require('../services/EmailAnalyticsService');

// Initialize services (mock - these would be shared instances)
const emailService = new EmailService();
const templateEngine = new EmailTemplateEngine();
const automationService = new EmailAutomationService();
const analyticsService = new EmailAnalyticsService();

// Admin authentication middleware (placeholder)
const requireAdmin = (req, res, next) => {
  // In production, implement proper admin authentication
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.includes('admin')) {
    return res.status(401).json({
      success: false,
      error: 'Admin authentication required'
    });
  }
  next();
};

// Apply admin auth to all routes except analytics (for testing)
router.use((req, res, next) => {
  // Skip auth for analytics endpoint during development  
  // TODO: Remove this bypass in production
  if (req.path.includes('/analytics/')) {
    return next();
  }
  return requireAdmin(req, res, next);
});

// =========================
// TEMPLATE MANAGEMENT
// =========================

// List all templates
router.get('/templates', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const search = req.query.search;

    // Mock template list - replace with database query
    const templates = [
      {
        id: 'welcome_series_1',
        name: 'Welcome Email - New Customer',
        subject: 'Welcome to RevivaTech, {{user.first_name}}!',
        category: 'onboarding',
        template_type: 'transactional',
        is_active: true,
        usage_count: 245,
        last_used_at: '2025-07-16T10:30:00Z',
        created_at: '2025-07-01T09:00:00Z',
        performance: {
          open_rate: 0.65,
          click_rate: 0.12,
          conversion_rate: 0.08
        }
      },
      {
        id: 'repair_complete',
        name: 'Repair Completion Notification',
        subject: 'Your {{repair.device}} repair is complete!',
        category: 'repair',
        template_type: 'transactional',
        is_active: true,
        usage_count: 189,
        last_used_at: '2025-07-17T14:20:00Z',
        created_at: '2025-06-15T11:00:00Z',
        performance: {
          open_rate: 0.78,
          click_rate: 0.34,
          conversion_rate: 0.15
        }
      },
      {
        id: 'booking_reminder',
        name: 'Appointment Reminder',
        subject: 'Reminder: Your appointment tomorrow at {{booking.time_slot}}',
        category: 'booking',
        template_type: 'transactional',
        is_active: true,
        usage_count: 156,
        last_used_at: '2025-07-17T08:45:00Z',
        created_at: '2025-06-20T15:30:00Z',
        performance: {
          open_rate: 0.82,
          click_rate: 0.28,
          conversion_rate: 0.92
        }
      },
      {
        id: 'reactivation_campaign',
        name: 'Customer Reactivation Special Offer',
        subject: 'We miss you! 20% off your next repair',
        category: 'marketing',
        template_type: 'marketing',
        is_active: false,
        usage_count: 67,
        last_used_at: '2025-07-10T16:00:00Z',
        created_at: '2025-06-01T12:00:00Z',
        performance: {
          open_rate: 0.35,
          click_rate: 0.08,
          conversion_rate: 0.03
        }
      }
    ];

    // Apply filters
    let filteredTemplates = templates;
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    if (search) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const total = filteredTemplates.length;
    const offset = (page - 1) * limit;
    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Templates retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Template list failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve templates'
    });
  }
});

// Get template details
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Mock template detail - replace with database query
    const template = {
      id: templateId,
      name: 'Welcome Email - New Customer',
      subject: 'Welcome to RevivaTech, {{user.first_name}}!',
      html_template: `<html><body><h1>Welcome {{user.first_name}}!</h1><p>Thank you for choosing RevivaTech...</p></body></html>`,
      text_template: `Welcome {{user.first_name}}!\n\nThank you for choosing RevivaTech...`,
      category: 'onboarding',
      template_type: 'transactional',
      is_active: true,
      variables: {
        'user.first_name': { type: 'string', required: true, description: 'Customer first name' },
        'user.email': { type: 'string', required: true, description: 'Customer email address' }
      },
      personalization_rules: {
        greeting_time: { enabled: true, description: 'Time-based greeting' },
        customer_segment: { enabled: true, description: 'Segment-based personalization' }
      },
      compliance_settings: {
        gdpr_compliant: true,
        can_spam_compliant: true,
        unsubscribe_link: true
      },
      created_at: '2025-07-01T09:00:00Z',
      updated_at: '2025-07-15T14:30:00Z',
      usage_count: 245,
      last_used_at: '2025-07-16T10:30:00Z'
    };

    res.json({
      success: true,
      data: template,
      message: 'Template retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Template detail failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve template'
    });
  }
});

// Create new template
router.post('/templates', async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      created_by: req.user?.id || 1, // Mock admin ID
      created_at: new Date().toISOString()
    };

    const template = await templateEngine.createTemplate(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('❌ Template creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create template'
    });
  }
});

// Update template
router.put('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    // Mock update - replace with database update
    const updatedTemplate = {
      id: templateId,
      ...updateData
    };

    res.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('❌ Template update failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to update template'
    });
  }
});

// Delete template
router.delete('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    // Mock deletion - replace with database deletion

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('❌ Template deletion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to delete template'
    });
  }
});

// Test template with sample data
router.post('/templates/:templateId/test', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { sampleData = {}, testEmail } = req.body;

    const preview = await templateEngine.getTemplatePreview(templateId, sampleData);
    
    if (testEmail) {
      // Send test email
      const emailData = {
        id: `test_${templateId}_${Date.now()}`,
        to: testEmail,
        subject: `[TEST] ${preview.subject}`,
        html: preview.html,
        text: preview.text,
        metadata: { test: true, templateId }
      };

      await emailService.sendEmail(emailData);
    }

    res.json({
      success: true,
      data: {
        preview,
        testEmailSent: !!testEmail
      },
      message: testEmail ? 'Test email sent successfully' : 'Template preview generated'
    });
  } catch (error) {
    console.error('❌ Template test failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to test template'
    });
  }
});

// =========================
// CAMPAIGN MANAGEMENT
// =========================

// List campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    // Mock campaigns - replace with database query
    const campaigns = [
      {
        id: 'camp_001',
        name: 'Welcome Series 2025',
        description: 'Onboarding campaign for new customers',
        template_id: 'welcome_series_1',
        campaign_type: 'automated',
        status: 'active',
        start_date: '2025-07-01T00:00:00Z',
        end_date: null,
        total_sent: 245,
        total_opened: 159,
        total_clicked: 29,
        open_rate: 0.649,
        click_rate: 0.118,
        created_at: '2025-06-28T10:00:00Z'
      },
      {
        id: 'camp_002',
        name: 'Summer Repair Promotion',
        description: '20% off summer repair special',
        template_id: 'reactivation_campaign',
        campaign_type: 'one_time',
        status: 'completed',
        start_date: '2025-07-10T09:00:00Z',
        end_date: '2025-07-10T18:00:00Z',
        total_sent: 1250,
        total_opened: 438,
        total_clicked: 87,
        open_rate: 0.350,
        click_rate: 0.070,
        created_at: '2025-07-08T15:30:00Z'
      }
    ];

    let filteredCampaigns = campaigns;
    if (status) {
      filteredCampaigns = campaigns.filter(c => c.status === status);
    }

    const total = filteredCampaigns.length;
    const offset = (page - 1) * limit;
    const paginatedCampaigns = filteredCampaigns.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        campaigns: paginatedCampaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      message: 'Campaigns retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Campaign list failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve campaigns'
    });
  }
});

// Create campaign
router.post('/campaigns', async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      id: `camp_${Date.now()}`,
      created_by: req.user?.id || 1,
      created_at: new Date().toISOString(),
      status: 'draft'
    };

    // Mock creation - replace with database insertion
    console.log('📧 Creating campaign:', campaignData.name);

    res.status(201).json({
      success: true,
      data: campaignData,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('❌ Campaign creation failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'Failed to create campaign'
    });
  }
});

// Get campaign details
router.get('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const analytics = await analyticsService.getCampaignAnalytics(campaignId);
    
    res.json({
      success: true,
      data: analytics,
      message: 'Campaign details retrieved'
    });
  } catch (error) {
    console.error('❌ Campaign details failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve campaign details'
    });
  }
});

// =========================
// AUTOMATION WORKFLOWS
// =========================

// List workflows
router.get('/workflows', async (req, res) => {
  try {
    // Mock workflows - replace with database query
    const workflows = [
      {
        id: 'booking_abandoned',
        name: 'Booking Abandonment Recovery',
        trigger_type: 'booking_abandoned',
        is_active: true,
        total_triggered: 45,
        total_sent: 127,
        steps: 3,
        created_at: '2025-06-15T12:00:00Z'
      },
      {
        id: 'repair_status_updates',
        name: 'Repair Status Updates',
        trigger_type: 'repair_status_changed',
        is_active: true,
        total_triggered: 189,
        total_sent: 189,
        steps: 1,
        created_at: '2025-06-20T09:30:00Z'
      },
      {
        id: 'welcome_series',
        name: 'Customer Welcome Series',
        trigger_type: 'customer_registered',
        is_active: true,
        total_triggered: 78,
        total_sent: 156,
        steps: 3,
        created_at: '2025-07-01T14:15:00Z'
      }
    ];

    res.json({
      success: true,
      data: workflows,
      message: 'Workflows retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Workflow list failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve workflows'
    });
  }
});

// Get workflow details
router.get('/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    // Mock workflow detail - replace with database query
    const workflow = {
      id: workflowId,
      name: 'Booking Abandonment Recovery',
      description: 'Recover abandoned bookings with targeted follow-up emails',
      trigger_type: 'booking_abandoned',
      trigger_conditions: {
        stage: { operator: '>=', value: 2 },
        timeElapsed: { operator: '>=', value: 1800000 }
      },
      is_active: true,
      steps: [
        {
          step_order: 1,
          template_id: 'booking_recovery_immediate',
          delay_minutes: 0,
          conditions: {},
          total_sent: 45
        },
        {
          step_order: 2,
          template_id: 'booking_recovery_followup',
          delay_minutes: 1440, // 24 hours
          conditions: { bookingNotCompleted: true },
          total_sent: 23
        },
        {
          step_order: 3,
          template_id: 'booking_recovery_final',
          delay_minutes: 4320, // 3 days
          conditions: { bookingNotCompleted: true },
          total_sent: 12
        }
      ],
      performance: {
        triggered: 45,
        completed: 12,
        conversion_rate: 0.267,
        total_sent: 80
      },
      created_at: '2025-06-15T12:00:00Z',
      updated_at: '2025-07-10T16:45:00Z'
    };

    res.json({
      success: true,
      data: workflow,
      message: 'Workflow details retrieved'
    });
  } catch (error) {
    console.error('❌ Workflow details failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve workflow details'
    });
  }
});

// =========================
// ANALYTICS DASHBOARD
// =========================

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    
    const overview = {
      summary: {
        emails_sent_today: 156,
        emails_sent_week: 1089,
        emails_sent_month: 4567,
        open_rate_week: 0.67,
        click_rate_week: 0.14,
        bounce_rate_week: 0.03,
        unsubscribe_rate_week: 0.008
      },
      recent_campaigns: [
        {
          id: 'camp_001',
          name: 'Welcome Series 2025',
          status: 'active',
          sent: 245,
          open_rate: 0.649,
          click_rate: 0.118
        },
        {
          id: 'camp_002',
          name: 'Summer Repair Promotion',
          status: 'completed',
          sent: 1250,
          open_rate: 0.350,
          click_rate: 0.070
        }
      ],
      top_templates: [
        {
          id: 'booking_reminder',
          name: 'Appointment Reminder',
          sent: 156,
          open_rate: 0.82,
          click_rate: 0.28
        },
        {
          id: 'repair_complete',
          name: 'Repair Completion',
          sent: 89,
          open_rate: 0.78,
          click_rate: 0.34
        }
      ],
      active_workflows: [
        {
          id: 'booking_abandoned',
          name: 'Booking Recovery',
          triggered_today: 3,
          sent_today: 8
        },
        {
          id: 'welcome_series',
          name: 'Welcome Series',
          triggered_today: 5,
          sent_today: 12
        }
      ],
      performance_trends: {
        daily_volume: [
          { date: '2025-07-11', sent: 145, opened: 97, clicked: 18 },
          { date: '2025-07-12', sent: 167, opened: 112, clicked: 22 },
          { date: '2025-07-13', sent: 134, opened: 89, clicked: 15 },
          { date: '2025-07-14', sent: 189, opened: 127, clicked: 28 },
          { date: '2025-07-15', sent: 156, opened: 104, clicked: 19 },
          { date: '2025-07-16', sent: 178, opened: 119, clicked: 25 },
          { date: '2025-07-17', sent: 120, opened: 78, clicked: 14 }
        ]
      }
    };

    res.json({
      success: true,
      data: overview,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Dashboard data failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// Performance analytics - Connected to real EmailAnalyticsService
router.get('/analytics/performance', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const templateId = req.query.templateId;
    const campaignId = req.query.campaignId;

    // Get real analytics data from EmailAnalyticsService
    const metrics = await analyticsService.getEmailMetrics(timeRange, { templateId, campaignId });
    const realtimeMetrics = analyticsService.getRealtimeMetrics();
    
    // Transform data to match frontend expectations
    const performance = {
      timeRange,
      summary: {
        emails_sent_today: realtimeMetrics.emailsSentToday || metrics.totalSent,
        emails_sent_week: metrics.totalSent,
        emails_sent_month: Math.floor(metrics.totalSent * 4.3), // rough monthly estimate
        open_rate_week: metrics.openRate,
        click_rate_week: metrics.clickRate,
        bounce_rate_week: metrics.bounceRate,
        unsubscribe_rate_week: metrics.unsubscribeRate
      },
      performance_trends: {
        daily_volume: metrics.dailyBreakdown.map(day => ({
          date: day.date,
          sent: day.sent,
          opened: day.opens,
          clicked: day.clicks
        }))
      },
      top_templates: metrics.topTemplates.map(template => ({
        id: template.templateId,
        name: template.name,
        sent: Math.floor(Math.random() * 200) + 50, // Would come from real data
        open_rate: template.openRate,
        click_rate: template.clickRate
      })),
      device_breakdown: metrics.deviceBreakdown,
      overview: {
        total_sent: metrics.totalSent,
        total_delivered: metrics.totalDelivered,
        unique_opens: metrics.uniqueOpens,
        total_opens: metrics.totalOpens,
        unique_clicks: metrics.uniqueClicks,
        total_clicks: metrics.totalClicks,
        bounces: metrics.bounces,
        spam_complaints: metrics.spamComplaints,
        unsubscribes: metrics.unsubscribes,
        conversions: metrics.conversions,
        revenue: metrics.revenue
      },
      rates: {
        delivery_rate: metrics.deliveryRate,
        open_rate: metrics.openRate,
        click_rate: metrics.clickRate,
        click_to_open_rate: metrics.clickToOpenRate,
        bounce_rate: metrics.bounceRate,
        spam_rate: metrics.spamRate,
        unsubscribe_rate: metrics.unsubscribeRate,
        conversion_rate: metrics.conversionRate
      }
    };

    res.json({
      success: true,
      data: performance,
      message: 'Performance analytics retrieved from EmailAnalyticsService',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Performance analytics failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve performance analytics'
    });
  }
});

// A/B test management
router.get('/ab-tests', async (req, res) => {
  try {
    const tests = [
      {
        id: 'test_001',
        name: 'Welcome Email Subject Line Test',
        campaign_id: 'camp_001',
        status: 'running',
        template_a: 'Welcome to RevivaTech!',
        template_b: 'Your device repair journey starts here',
        start_date: '2025-07-15T09:00:00Z',
        significance_level: 0.05,
        current_winner: 'B',
        confidence: 0.78,
        variants: {
          A: { sent: 125, opens: 81, clicks: 15, conversions: 8 },
          B: { sent: 120, opens: 89, clicks: 22, conversions: 12 }
        }
      }
    ];

    res.json({
      success: true,
      data: tests,
      message: 'A/B tests retrieved successfully'
    });
  } catch (error) {
    console.error('❌ A/B test list failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve A/B tests'
    });
  }
});

// =========================
// EMAIL QUEUE MANAGEMENT
// =========================

// Get email queue status
router.get('/queue', async (req, res) => {
  try {
    const metrics = emailService.getMetrics();
    
    const queueStatus = {
      current_queue_length: metrics.queueLength || 0,
      failed_emails: metrics.failedEmailsCount || 0,
      emails_sent_today: metrics.emailsSent || 0,
      emails_failed_today: metrics.emailsFailed || 0,
      average_response_time: metrics.averageResponseTime || 0,
      last_sent_at: metrics.lastSentAt,
      provider_status: metrics.provider || 'unknown',
      recent_errors: metrics.errors?.slice(-5) || []
    };

    res.json({
      success: true,
      data: queueStatus,
      message: 'Queue status retrieved'
    });
  } catch (error) {
    console.error('❌ Queue status failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve queue status'
    });
  }
});

// Retry failed emails
router.post('/queue/retry', async (req, res) => {
  try {
    const { emailIds } = req.body;
    
    // Mock retry implementation
    
    res.json({
      success: true,
      data: {
        retried: emailIds?.length || 5,
        timestamp: Date.now()
      },
      message: 'Failed emails queued for retry'
    });
  } catch (error) {
    console.error('❌ Email retry failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retry emails'
    });
  }
});

// =========================
// COMPLIANCE & PREFERENCES
// =========================

// Get unsubscribe statistics
router.get('/compliance/unsubscribes', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    
    const stats = {
      timeRange,
      total_unsubscribes: 45,
      unsubscribe_rate: 0.008,
      reasons: [
        { reason: 'too_frequent', count: 18, percentage: 40 },
        { reason: 'not_relevant', count: 12, percentage: 27 },
        { reason: 'user_request', count: 8, percentage: 18 },
        { reason: 'other', count: 7, percentage: 15 }
      ],
      trends: [
        { date: '2025-07-10', unsubscribes: 2 },
        { date: '2025-07-11', unsubscribes: 1 },
        { date: '2025-07-12', unsubscribes: 3 },
        { date: '2025-07-13', unsubscribes: 0 },
        { date: '2025-07-14', unsubscribes: 2 },
        { date: '2025-07-15', unsubscribes: 1 },
        { date: '2025-07-16', unsubscribes: 4 },
        { date: '2025-07-17', unsubscribes: 1 }
      ]
    };

    res.json({
      success: true,
      data: stats,
      message: 'Unsubscribe statistics retrieved'
    });
  } catch (error) {
    console.error('❌ Unsubscribe stats failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve unsubscribe statistics'
    });
  }
});

// Export data for compliance
router.get('/compliance/export', async (req, res) => {
  try {
    const type = req.query.type || 'unsubscribes'; // unsubscribes, preferences, gdpr
    const format = req.query.format || 'csv';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Mock export data
    const exportData = {
      type,
      format,
      generated_at: new Date().toISOString(),
      records: 145,
      file_url: `https://revivatech.co.uk/exports/${type}-${Date.now()}.${format}`
    };

    res.json({
      success: true,
      data: exportData,
      message: 'Compliance export generated'
    });
  } catch (error) {
    console.error('❌ Compliance export failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate compliance export'
    });
  }
});

module.exports = router;