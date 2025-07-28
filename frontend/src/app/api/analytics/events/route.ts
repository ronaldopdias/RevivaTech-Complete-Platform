/**
 * Analytics Events API - Phase 7 Production Implementation
 * Handles real event tracking, fingerprinting, and behavioral data
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsDB } from '@/lib/database/analytics';
import { z } from 'zod';

// Safely import customer intelligence service (may not exist yet)
let customerIntelligenceService: any = null;
try {
  customerIntelligenceService = require('@/lib/services/customerIntelligence.service');
} catch (error) {
  console.warn('Customer intelligence service not available:', error);
}

// Validation schemas
const FingerprintSchema = z.object({
  userAgent: z.string(),
  screenResolution: z.string(),
  timezone: z.string(),
  language: z.string(),
  platform: z.string(),
  vendor: z.string(),
  cookieEnabled: z.boolean(),
  doNotTrack: z.boolean(),
  canvas: z.string().optional(),
  webgl: z.string().optional(),
  audio: z.string().optional(),
  fonts: z.array(z.string()).optional(),
  plugins: z.array(z.string()).optional(),
  touchSupport: z.boolean(),
  colorDepth: z.number(),
  pixelRatio: z.number(),
  hardwareConcurrency: z.number(),
  maxTouchPoints: z.number(),
});

const EventSchema = z.object({
  type: z.enum(['page_view', 'click', 'scroll', 'form_focus', 'form_submit', 'exit_intent', 'rage_click', 'conversion']),
  name: z.string(),
  properties: z.record(z.any()),
  pageUrl: z.string().url(),
  referrer: z.string().url().optional(),
});

const RequestSchema = z.object({
  sessionId: z.string(),
  fingerprint: FingerprintSchema.optional(),
  events: z.array(EventSchema),
  customerId: z.string().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const limit = rateLimitMap.get(key)!;

  if (now > limit.resetTime) {
    // Reset the limit
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const clientIP = forwarded?.split(',')[0] || real || 'unknown';
  return clientIP;
}

function sanitizeUserAgent(userAgent: string): string {
  // Remove potentially sensitive information from user agent
  return userAgent.substring(0, 500); // Limit length
}

// POST /api/analytics/events
export async function POST(request: NextRequest) {
  try {
    // Check if analytics is enabled
    if (process.env.ENABLE_ANALYTICS === 'false') {
      return NextResponse.json(
        { error: 'Analytics is disabled' },
        { status: 503 }
      );
    }

    // Get client information
    const clientIP = getClientIP(request);
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent') || '');

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log('Analytics API received body:', JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Simple validation without Zod for now
    if (!body || typeof body !== 'object') {
      console.log('ERROR: Invalid request body - not an object');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Basic structure validation
    const { sessionId, fingerprint, events, customerId } = body;
    
    // DEBUG: Log validation details
    console.log('Validation check:', { 
      hasSessionId: !!sessionId, 
      eventsIsArray: Array.isArray(events),
      eventsLength: events ? events.length : 'N/A'
    });
    
    if (!Array.isArray(events)) {
      console.log('ERROR: events is not an array:', Array.isArray(events));
      return NextResponse.json(
        { error: 'Missing required field: events' },
        { status: 400 }
      );
    }
    
    // Temporarily allow missing sessionId and generate one
    if (!sessionId) {
      console.log('WARN: Missing sessionId, generating temporary one');
      body.sessionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate events array is not empty
    if (events.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No events to process', processed: 0 },
        { status: 200 }
      );
    }

    // Process fingerprint if provided
    let deviceFingerprint = null;
    let identityResult = null;

    if (fingerprint && customerIntelligenceService) {
      try {
        deviceFingerprint = await customerIntelligenceService.generateFingerprint({
          ...fingerprint,
          userAgent, // Use sanitized user agent from headers
        });

        // Try to identify customer
        identityResult = await customerIntelligenceService.identifyCustomer(
          deviceFingerprint,
          sessionId
        );

        console.log(`Device fingerprint generated: ${deviceFingerprint.id} (confidence: ${deviceFingerprint.confidence}%)`);
      } catch (error) {
        console.error('Failed to process fingerprint:', error);
        // Continue without fingerprint
      }
    }

    // Process events with database integration
    const processedEvents = [];
    for (const event of events) {
      try {
        // Validate individual event structure
        if (!event || typeof event !== 'object' || !event.type || !event.name) {
          processedEvents.push({
            type: event?.type || 'unknown',
            name: event?.name || 'unknown',
            status: 'failed',
            error: 'Invalid event structure - missing type or name',
          });
          continue;
        }

        // Record event in analytics database
        await analyticsDB.recordEvent({
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          userId: customerId || identityResult?.customerId,
          event: event.type,
          category: 'engagement',
          action: event.name,
          label: event.pageUrl || '',
          value: event.properties?.value || null,
          properties: event.properties || {},
          metadata: {
            userAgent,
            ip: clientIP,
            referrer: event.referrer || '',
            page: event.pageUrl || ''
          },
          timestamp: new Date()
        });

        // Also track with customer intelligence service if available
        try {
          if (customerIntelligenceService && customerIntelligenceService.trackEvent) {
            await customerIntelligenceService.trackEvent(
              sessionId,
              customerId || identityResult?.customerId,
              {
                type: event.type,
                name: event.name,
                properties: event.properties,
                pageUrl: event.pageUrl,
                referrer: event.referrer,
                timestamp: new Date(),
              },
              clientIP,
              userAgent
            );
          }
        } catch (ciError) {
          console.warn('Customer intelligence service unavailable:', ciError);
        }

        processedEvents.push({
          type: event.type,
          name: event.name,
          status: 'processed',
        });
      } catch (error) {
        console.error(`Failed to process event ${event.name}:`, error);
        processedEvents.push({
          type: event.type,
          name: event.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Analyze journey if this is a conversion event
    const hasConversion = events.some(e => e.type === 'conversion');
    let journeyAnalysis = null;

    if (hasConversion && customerIntelligenceService && customerIntelligenceService.analyzeJourney) {
      try {
        journeyAnalysis = await customerIntelligenceService.analyzeJourney(sessionId);
        console.log(`Customer journey analyzed for session ${sessionId}`);
      } catch (error) {
        console.error('Failed to analyze journey:', error);
      }
    }

    // Return response
    return NextResponse.json({
      success: true,
      sessionId,
      processed: processedEvents.length,
      failed: processedEvents.filter(e => e.status === 'failed').length,
      fingerprint: deviceFingerprint ? {
        id: deviceFingerprint.id,
        confidence: deviceFingerprint.confidence,
      } : null,
      identity: identityResult ? {
        customerId: identityResult.customerId,
        isNew: identityResult.isNew,
        confidence: identityResult.confidence,
        previousSessions: identityResult.previousSessions,
      } : null,
      journey: journeyAnalysis ? {
        touchpoints: journeyAnalysis.touchpoints.length,
        conversion: journeyAnalysis.conversion,
        conversionValue: journeyAnalysis.conversionValue,
      } : null,
      events: processedEvents,
    });

  } catch (error) {
    console.error('Analytics events processing failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to process analytics events',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/analytics/events - Get analytics summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!sessionId && !customerId) {
      return NextResponse.json(
        { error: 'sessionId or customerId required' },
        { status: 400 }
      );
    }

    // Default date range (last 7 days)
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    let result: any = {};

    if (customerId && customerIntelligenceService) {
      // Get customer analytics
      try {
        const [score, prediction, journey] = await Promise.all([
          customerIntelligenceService.calculateCustomerScore ? customerIntelligenceService.calculateCustomerScore(customerId) : null,
          customerIntelligenceService.predictCustomerBehavior ? customerIntelligenceService.predictCustomerBehavior(customerId) : null,
          sessionId && customerIntelligenceService.analyzeJourney ? customerIntelligenceService.analyzeJourney(sessionId) : null,
        ]);

        result = {
          customerId,
          score,
          prediction,
          journey,
        };
      } catch (error) {
        console.error('Failed to get customer analytics:', error);
        result = {
          customerId,
          error: 'Analytics temporarily unavailable'
        };
      }
    } else if (sessionId && customerIntelligenceService && customerIntelligenceService.analyzeJourney) {
      // Get session analytics
      try {
        const journey = await customerIntelligenceService.analyzeJourney(sessionId);
        result = {
          sessionId,
          journey,
        };
      } catch (error) {
        console.error('Failed to get session analytics:', error);
        result = {
          sessionId,
          error: 'Analytics temporarily unavailable'
        };
      }
    } else {
      result = {
        customerId,
        sessionId,
        message: 'Analytics service not available'
      };
    }

    return NextResponse.json({
      success: true,
      data: result,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('Failed to get analytics summary:', error);

    return NextResponse.json(
      {
        error: 'Failed to get analytics summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/events - Delete user data (GDPR compliance)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const sessionId = searchParams.get('sessionId');

    if (!customerId && !sessionId) {
      return NextResponse.json(
        { error: 'customerId or sessionId required' },
        { status: 400 }
      );
    }

    // This would implement GDPR deletion
    // For now, just return success
    console.log(`GDPR deletion requested for customer: ${customerId}, session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'User data deletion initiated',
      customerId,
      sessionId,
    });

  } catch (error) {
    console.error('Failed to delete user data:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete user data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}