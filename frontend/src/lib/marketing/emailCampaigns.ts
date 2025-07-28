/**
 * Email Marketing Campaign System
 * Advanced email marketing automation for RevivaTech
 * 
 * Features:
 * - Campaign creation and management
 * - Template system with personalization
 * - Audience segmentation and targeting
 * - A/B testing capabilities
 * - Analytics and performance tracking
 * - Automated drip campaigns
 * - Trigger-based email sequences
 */

import { z } from 'zod';

// Email Template Schema
export const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.enum(['welcome', 'repair_updates', 'promotional', 'transactional', 'newsletter']),
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string(),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    required: z.boolean().default(false),
    defaultValue: z.string().optional()
  })).default([]),
  preheader: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string().optional()
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// Campaign Schema
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['one_time', 'recurring', 'automated', 'triggered']),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'completed']).default('draft'),
  
  // Email details
  templateId: z.string(),
  subject: z.string(),
  fromName: z.string().default('RevivaTech'),
  fromEmail: z.string().default('hello@revivatech.co.uk'),
  replyTo: z.string().optional(),
  
  // Audience
  audienceType: z.enum(['all', 'segment', 'custom']).default('all'),
  segmentIds: z.array(z.string()).default([]),
  customAudience: z.array(z.string()).default([]), // email addresses
  
  // Scheduling
  sendAt: z.date().optional(),
  timezone: z.string().default('Europe/London'),
  sendNow: z.boolean().default(false),
  
  // A/B Testing
  abTesting: z.object({
    enabled: z.boolean().default(false),
    testType: z.enum(['subject', 'content', 'send_time']).optional(),
    variants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      percentage: z.number(),
      subject: z.string().optional(),
      templateId: z.string().optional()
    })).default([]),
    winnerCriteria: z.enum(['open_rate', 'click_rate', 'conversion_rate']).optional(),
    testDuration: z.number().optional() // hours
  }).optional(),
  
  // Analytics
  analytics: z.object({
    sent: z.number().default(0),
    delivered: z.number().default(0),
    opened: z.number().default(0),
    clicked: z.number().default(0),
    unsubscribed: z.number().default(0),
    bounced: z.number().default(0),
    spam: z.number().default(0),
    openRate: z.number().default(0),
    clickRate: z.number().default(0),
    unsubscribeRate: z.number().default(0),
    bounceRate: z.number().default(0)
  }).default({}),
  
  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  sentAt: z.date().optional(),
  createdBy: z.string().optional()
});

export type Campaign = z.infer<typeof CampaignSchema>;

// Audience Segment Schema
export const AudienceSegmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any()
  })),
  estimatedSize: z.number().default(0),
  lastUpdated: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date())
});

export type AudienceSegment = z.infer<typeof AudienceSegmentSchema>;

// Automation Workflow Schema
export const AutomationWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['signup', 'purchase', 'repair_booked', 'repair_completed', 'date', 'behavior']),
    conditions: z.record(z.any()).optional()
  }),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(['email', 'wait', 'condition', 'action']),
    delay: z.object({
      amount: z.number(),
      unit: z.enum(['minutes', 'hours', 'days', 'weeks'])
    }).optional(),
    templateId: z.string().optional(),
    conditions: z.array(z.any()).optional(),
    actions: z.array(z.any()).optional()
  })),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  analytics: z.object({
    triggered: z.number().default(0),
    completed: z.number().default(0),
    completionRate: z.number().default(0)
  }).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type AutomationWorkflow = z.infer<typeof AutomationWorkflowSchema>;

// Email Marketing Service
export class EmailMarketingService {
  private templates: EmailTemplate[] = [];
  private campaigns: Campaign[] = [];
  private segments: AudienceSegment[] = [];
  private workflows: AutomationWorkflow[] = [];

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample templates
    this.templates = [
      {
        id: 'welcome-template',
        name: 'Welcome Email',
        category: 'welcome',
        subject: 'Welcome to RevivaTech, {{firstName}}!',
        htmlContent: this.getWelcomeEmailHTML(),
        textContent: this.getWelcomeEmailText(),
        variables: [
          { name: 'firstName', description: 'Customer first name', required: true },
          { name: 'lastName', description: 'Customer last name', required: false },
          { name: 'email', description: 'Customer email', required: true }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'repair-update-template',
        name: 'Repair Status Update',
        category: 'repair_updates',
        subject: 'Update on your {{deviceModel}} repair',
        htmlContent: this.getRepairUpdateEmailHTML(),
        textContent: this.getRepairUpdateEmailText(),
        variables: [
          { name: 'firstName', description: 'Customer first name', required: true },
          { name: 'deviceModel', description: 'Device model', required: true },
          { name: 'repairStatus', description: 'Current repair status', required: true },
          { name: 'estimatedCompletion', description: 'Estimated completion date', required: false }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Initialize with sample segments
    this.segments = [
      {
        id: 'new-customers',
        name: 'New Customers',
        description: 'Customers who signed up in the last 30 days',
        conditions: [
          { field: 'signupDate', operator: 'greater_than', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        ],
        estimatedSize: 245,
        lastUpdated: new Date(),
        createdAt: new Date()
      },
      {
        id: 'repeat-customers',
        name: 'Repeat Customers',
        description: 'Customers with 2+ completed repairs',
        conditions: [
          { field: 'completedRepairs', operator: 'greater_than', value: 1 }
        ],
        estimatedSize: 156,
        lastUpdated: new Date(),
        createdAt: new Date()
      }
    ];

    // Initialize with sample automation workflows
    this.workflows = [
      {
        id: 'welcome-series',
        name: 'Welcome Email Series',
        description: 'Automated welcome series for new customers',
        trigger: {
          type: 'signup'
        },
        steps: [
          {
            id: 'step1',
            type: 'email',
            templateId: 'welcome-template'
          },
          {
            id: 'step2',
            type: 'wait',
            delay: { amount: 3, unit: 'days' }
          },
          {
            id: 'step3',
            type: 'email',
            templateId: 'getting-started-template'
          }
        ],
        status: 'active',
        analytics: {
          triggered: 245,
          completed: 198,
          completionRate: 80.8
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Template Management
  async createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const template: EmailTemplate = {
      ...templateData,
      id: `template_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedTemplate = EmailTemplateSchema.parse(template);
    this.templates.push(validatedTemplate);
    return validatedTemplate;
  }

  async getTemplates(category?: EmailTemplate['category']): Promise<EmailTemplate[]> {
    if (category) {
      return this.templates.filter(template => template.category === category);
    }
    return this.templates;
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    return this.templates.find(template => template.id === id) || null;
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    const updatedTemplate = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date()
    };

    const validatedTemplate = EmailTemplateSchema.parse(updatedTemplate);
    this.templates[index] = validatedTemplate;
    return validatedTemplate;
  }

  // Campaign Management
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const campaign: Campaign = {
      ...campaignData,
      id: `campaign_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedCampaign = CampaignSchema.parse(campaign);
    this.campaigns.push(validatedCampaign);
    return validatedCampaign;
  }

  async getCampaigns(status?: Campaign['status']): Promise<Campaign[]> {
    if (status) {
      return this.campaigns.filter(campaign => campaign.status === status);
    }
    return this.campaigns;
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    return this.campaigns.find(campaign => campaign.id === id) || null;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const index = this.campaigns.findIndex(campaign => campaign.id === id);
    if (index === -1) return null;

    const updatedCampaign = {
      ...this.campaigns[index],
      ...updates,
      updatedAt: new Date()
    };

    const validatedCampaign = CampaignSchema.parse(updatedCampaign);
    this.campaigns[index] = validatedCampaign;
    return validatedCampaign;
  }

  // Send campaign
  async sendCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    const campaign = await this.getCampaign(campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return { success: false, message: 'Campaign cannot be sent in current status' };
    }

    // Update campaign status
    await this.updateCampaign(campaignId, {
      status: 'sending',
      sentAt: new Date()
    });

    // Simulate sending process
    setTimeout(async () => {
      // Simulate analytics
      const mockAnalytics = {
        sent: 1000,
        delivered: 950,
        opened: 380,
        clicked: 76,
        unsubscribed: 5,
        bounced: 50,
        spam: 2,
        openRate: 40,
        clickRate: 8,
        unsubscribeRate: 0.5,
        bounceRate: 5
      };

      await this.updateCampaign(campaignId, {
        status: 'completed',
        analytics: mockAnalytics
      });
    }, 5000);

    return { success: true, message: 'Campaign is being sent' };
  }

  // Audience Segments
  async createSegment(segmentData: Omit<AudienceSegment, 'id' | 'createdAt' | 'lastUpdated'>): Promise<AudienceSegment> {
    const segment: AudienceSegment = {
      ...segmentData,
      id: `segment_${Date.now()}`,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    const validatedSegment = AudienceSegmentSchema.parse(segment);
    this.segments.push(validatedSegment);
    return validatedSegment;
  }

  async getSegments(): Promise<AudienceSegment[]> {
    return this.segments;
  }

  async getSegment(id: string): Promise<AudienceSegment | null> {
    return this.segments.find(segment => segment.id === id) || null;
  }

  // Automation Workflows
  async createWorkflow(workflowData: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<AutomationWorkflow> {
    const workflow: AutomationWorkflow = {
      ...workflowData,
      id: `workflow_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validatedWorkflow = AutomationWorkflowSchema.parse(workflow);
    this.workflows.push(validatedWorkflow);
    return validatedWorkflow;
  }

  async getWorkflows(status?: AutomationWorkflow['status']): Promise<AutomationWorkflow[]> {
    if (status) {
      return this.workflows.filter(workflow => workflow.status === status);
    }
    return this.workflows;
  }

  // Analytics
  async getCampaignAnalytics(campaignId: string): Promise<Campaign['analytics'] | null> {
    const campaign = await this.getCampaign(campaignId);
    return campaign?.analytics || null;
  }

  async getOverallAnalytics(): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalEmailsSent: number;
    averageOpenRate: number;
    averageClickRate: number;
  }> {
    const totalCampaigns = this.campaigns.length;
    const activeCampaigns = this.campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
    const totalEmailsSent = this.campaigns.reduce((sum, c) => sum + c.analytics.sent, 0);
    const avgOpenRate = this.campaigns.reduce((sum, c) => sum + c.analytics.openRate, 0) / totalCampaigns || 0;
    const avgClickRate = this.campaigns.reduce((sum, c) => sum + c.analytics.clickRate, 0) / totalCampaigns || 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalEmailsSent,
      averageOpenRate: Math.round(avgOpenRate * 100) / 100,
      averageClickRate: Math.round(avgClickRate * 100) / 100
    };
  }

  // Email Template Content
  private getWelcomeEmailHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to RevivaTech</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007AFF;">Welcome to RevivaTech, {{firstName}}!</h1>
          <p>Thank you for choosing RevivaTech for your device repair needs. We're excited to help you get your devices back in perfect working condition.</p>
          <p>Here's what you can expect:</p>
          <ul>
            <li>Fast, professional repairs</li>
            <li>Genuine parts and components</li>
            <li>Real-time repair tracking</li>
            <li>12-month warranty on all repairs</li>
          </ul>
          <p>Need help getting started? Our team is here to assist you.</p>
          <a href="https://revivatech.co.uk/contact" style="background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact Us</a>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailText(): string {
    return `
      Welcome to RevivaTech, {{firstName}}!
      
      Thank you for choosing RevivaTech for your device repair needs. We're excited to help you get your devices back in perfect working condition.
      
      Here's what you can expect:
      - Fast, professional repairs
      - Genuine parts and components
      - Real-time repair tracking
      - 12-month warranty on all repairs
      
      Need help getting started? Our team is here to assist you.
      Contact us at: https://revivatech.co.uk/contact
    `;
  }

  private getRepairUpdateEmailHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Repair Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007AFF;">Repair Update for {{firstName}}</h1>
          <p>Your {{deviceModel}} repair has been updated!</p>
          <p><strong>Current Status:</strong> {{repairStatus}}</p>
          {{#if estimatedCompletion}}
          <p><strong>Estimated Completion:</strong> {{estimatedCompletion}}</p>
          {{/if}}
          <p>Track your repair progress in real-time through your customer dashboard.</p>
          <a href="https://revivatech.co.uk/dashboard" style="background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
        </div>
      </body>
      </html>
    `;
  }

  private getRepairUpdateEmailText(): string {
    return `
      Repair Update for {{firstName}}
      
      Your {{deviceModel}} repair has been updated!
      
      Current Status: {{repairStatus}}
      {{#if estimatedCompletion}}
      Estimated Completion: {{estimatedCompletion}}
      {{/if}}
      
      Track your repair progress in real-time through your customer dashboard.
      Visit: https://revivatech.co.uk/dashboard
    `;
  }
}

// Global email marketing service instance
export const emailMarketing = new EmailMarketingService();