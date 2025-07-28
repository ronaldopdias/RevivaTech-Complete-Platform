// CRM Webhook Management API
// Comprehensive webhook management for CRM integration

import { NextRequest } from 'next/server';
import { ApiMiddleware } from '@/lib/api/middleware';
import crmWebhookService from '@/lib/services/crmWebhookService';

// Webhook queue management (in production, this would use a real database)
let webhookQueue: any[] = [];
let webhookHistory: any[] = [];

// GET /api/crm/webhooks - Get webhook queue and history
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type') || 'all';
      const limit = parseInt(searchParams.get('limit') || '50');
      const status = searchParams.get('status');

      // Filter webhooks based on parameters
      let filteredHistory = webhookHistory;
      
      if (type !== 'all') {
        filteredHistory = filteredHistory.filter(webhook => webhook.type === type);
      }
      
      if (status) {
        filteredHistory = filteredHistory.filter(webhook => webhook.status === status);
      }

      // Sort by timestamp (newest first) and limit results
      filteredHistory = filteredHistory
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      const statistics = {
        queueSize: webhookQueue.length,
        historySize: webhookHistory.length,
        successfulWebhooks: webhookHistory.filter(w => w.status === 'success').length,
        failedWebhooks: webhookHistory.filter(w => w.status === 'failed').length,
        pendingWebhooks: webhookQueue.length,
        lastProcessed: webhookHistory.length > 0 
          ? webhookHistory[webhookHistory.length - 1].timestamp 
          : null
      };

      return ApiMiddleware.createResponse({
        queue: webhookQueue,
        history: filteredHistory,
        statistics,
        filters: { type, status, limit }
      });
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 30 },
  }
);

// POST /api/crm/webhooks - Manually queue a webhook
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { type, data, priority = 'normal' } = body;

      if (!type || !data) {
        return ApiMiddleware.createResponse(
          { error: 'Type and data are required' },
          'Invalid request',
          400
        );
      }

      const webhook = {
        id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        priority,
        status: 'queued',
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3
      };

      // Add to queue (in production, this would use a real queue system)
      webhookQueue.push(webhook);

      // Process immediately for high priority webhooks
      if (priority === 'high') {
        processWebhook(webhook);
      }

      return ApiMiddleware.createResponse(
        { webhook, message: 'Webhook queued successfully' },
        'Webhook queued'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }
);

// DELETE /api/crm/webhooks - Clear webhook queue or history
export const DELETE = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const target = searchParams.get('target'); // 'queue', 'history', or 'failed'

      let cleared = 0;

      switch (target) {
        case 'queue':
          cleared = webhookQueue.length;
          webhookQueue = [];
          break;
        case 'history':
          cleared = webhookHistory.length;
          webhookHistory = [];
          break;
        case 'failed':
          const failedCount = webhookHistory.filter(w => w.status === 'failed').length;
          webhookHistory = webhookHistory.filter(w => w.status !== 'failed');
          cleared = failedCount;
          break;
        default:
          return ApiMiddleware.createResponse(
            { error: 'Invalid target. Use: queue, history, or failed' },
            'Invalid request',
            400
          );
      }

      return ApiMiddleware.createResponse(
        { 
          message: `Cleared ${cleared} webhooks from ${target}`,
          cleared,
          target
        },
        'Webhooks cleared'
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 10 },
  }
);

// PATCH /api/crm/webhooks - Retry failed webhooks
export const PATCH = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { action, webhookId } = body;

      if (action === 'retry') {
        if (webhookId) {
          // Retry specific webhook
          const webhook = webhookHistory.find(w => w.id === webhookId);
          if (!webhook) {
            return ApiMiddleware.createResponse(
              { error: 'Webhook not found' },
              'Webhook not found',
              404
            );
          }

          if (webhook.status !== 'failed') {
            return ApiMiddleware.createResponse(
              { error: 'Can only retry failed webhooks' },
              'Invalid webhook status',
              400
            );
          }

          // Move back to queue for retry
          webhook.status = 'queued';
          webhook.attempts = 0;
          webhookQueue.push(webhook);

          // Remove from history temporarily
          webhookHistory = webhookHistory.filter(w => w.id !== webhookId);

          return ApiMiddleware.createResponse(
            { message: 'Webhook queued for retry', webhook },
            'Webhook retry queued'
          );
        } else {
          // Retry all failed webhooks
          const failedWebhooks = webhookHistory.filter(w => w.status === 'failed');
          
          failedWebhooks.forEach(webhook => {
            webhook.status = 'queued';
            webhook.attempts = 0;
            webhookQueue.push(webhook);
          });

          // Remove failed webhooks from history
          webhookHistory = webhookHistory.filter(w => w.status !== 'failed');

          return ApiMiddleware.createResponse(
            { 
              message: `Retrying ${failedWebhooks.length} failed webhooks`,
              retriedCount: failedWebhooks.length
            },
            'Failed webhooks queued for retry'
          );
        }
      } else if (action === 'process') {
        // Manually process queue
        const processed = await processQueue();
        
        return ApiMiddleware.createResponse(
          { 
            message: `Processed ${processed.success} webhooks successfully, ${processed.failed} failed`,
            ...processed
          },
          'Queue processed'
        );
      } else {
        return ApiMiddleware.createResponse(
          { error: 'Invalid action. Use: retry or process' },
          'Invalid action',
          400
        );
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: { windowMs: 60000, maxRequests: 15 },
  }
);

// Helper function to process a single webhook
async function processWebhook(webhook: any): Promise<boolean> {
  try {
    webhook.status = 'processing';
    webhook.attempts += 1;
    webhook.lastAttempt = new Date().toISOString();

    let result;
    
    // Route to appropriate webhook method based on type
    switch (webhook.type) {
      case 'customer_registration':
        result = await crmWebhookService.notifyCustomerRegistration(webhook.data);
        break;
      case 'booking_created':
        result = await crmWebhookService.notifyBookingCreated(
          webhook.data.booking, 
          webhook.data.customer
        );
        break;
      case 'payment_status':
        result = await crmWebhookService.notifyPaymentStatus(
          webhook.data.payment, 
          webhook.data.booking, 
          webhook.data.customer
        );
        break;
      default:
        throw new Error(`Unknown webhook type: ${webhook.type}`);
    }

    webhook.status = 'success';
    webhook.response = result;
    webhook.completedAt = new Date().toISOString();
    
    // Move to history
    webhookHistory.push({ ...webhook });
    
    return true;
  } catch (error: any) {
    webhook.status = 'failed';
    webhook.error = {
      message: error.message,
      timestamp: new Date().toISOString()
    };

    // If max attempts reached, move to history as failed
    if (webhook.attempts >= webhook.maxAttempts) {
      webhookHistory.push({ ...webhook });
    } else {
      // Put back in queue for retry (with exponential backoff in production)
      setTimeout(() => {
        webhookQueue.push(webhook);
      }, 5000 * webhook.attempts); // 5s, 10s, 15s delays
    }
    
    return false;
  }
}

// Helper function to process the entire queue
async function processQueue(): Promise<{ success: number; failed: number; total: number }> {
  const queueSnapshot = [...webhookQueue];
  webhookQueue = []; // Clear queue
  
  let success = 0;
  let failed = 0;

  for (const webhook of queueSnapshot) {
    const processed = await processWebhook(webhook);
    if (processed) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed, total: queueSnapshot.length };
}

// Auto-process queue every 30 seconds (in production, use a proper job queue)
if (typeof global !== 'undefined') {
  setInterval(async () => {
    if (webhookQueue.length > 0) {
      console.log(`Processing ${webhookQueue.length} webhooks...`);
      await processQueue();
    }
  }, 30000);
}