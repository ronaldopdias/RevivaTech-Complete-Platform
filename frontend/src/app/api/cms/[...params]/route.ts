/**
 * CMS API Routes
 * Phase 4: Content Management System - API endpoints with caching and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/lib/cms/contentProvider';
import { contentValidator } from '@/lib/cms/contentConfig';
import { cacheService } from '@/lib/services/cacheService';

// Rate limiting setup
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_REQUESTS = 100;

// API response helpers
function createResponse(data: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

function createErrorResponse(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Rate limiting middleware
function checkRateLimit(request: NextRequest): boolean {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Authentication middleware
function checkAuth(request: NextRequest): { authorized: boolean; user?: any } {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true, user: { id: 'dev', role: 'admin' } };
  }
  
  // Check API key
  if (apiKey && apiKey === process.env.CMS_API_KEY) {
    return { authorized: true, user: { id: 'api', role: 'admin' } };
  }
  
  // Check JWT token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT token (simplified - use proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { authorized: true, user: payload };
    } catch {
      return { authorized: false };
    }
  }
  
  return { authorized: false };
}

// GET /api/cms/[type] - Get content list
// GET /api/cms/[type]/[id] - Get content by ID
// GET /api/cms/[type]/slug/[slug] - Get content by slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const params = await context.params;
    const [type, idOrAction, slugOrId] = params.params;
    
    if (!type) {
      return createErrorResponse('Content type is required');
    }

    // Validate content type
    const contentType = contentValidator.getContentType(type);
    if (!contentType) {
      return createErrorResponse(`Invalid content type: ${type}`, 404);
    }

    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';
    
    // Cache key generation
    const cacheKey = `cms:${type}:${idOrAction || 'list'}:${slugOrId || ''}:${locale}:${url.search}`;
    
    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return createResponse(cached);
    }

    let result: any;

    if (!idOrAction) {
      // Get content list with filters
      const filters = {
        locale,
        status: url.searchParams.getAll('status'),
        search: url.searchParams.get('search') || undefined,
        category: url.searchParams.get('category') || undefined,
        tags: url.searchParams.getAll('tags'),
        limit: parseInt(url.searchParams.get('limit') || '10'),
        offset: parseInt(url.searchParams.get('offset') || '0'),
        orderBy: url.searchParams.get('orderBy') || 'updatedAt',
        orderDirection: (url.searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc'
      };

      result = await contentService.getContentList(type, filters);
    } else if (idOrAction === 'slug' && slugOrId) {
      // Get content by slug
      result = await contentService.getContentBySlug(type, slugOrId, locale);
      
      if (!result) {
        return createErrorResponse(`Content not found: ${type}/${slugOrId}`, 404);
      }
    } else {
      // Get content by ID
      result = await contentService.getContent(type, idOrAction, locale);
      
      if (!result) {
        return createErrorResponse(`Content not found: ${type}/${idOrAction}`, 404);
      }
    }

    // Cache the result
    await cacheService.set(cacheKey, result, {
      ttl: 5 * 60 * 1000, // 5 minutes
      tags: [`cms:${type}`, `cms:${type}:${idOrAction || 'list'}`]
    });

    return createResponse(result);
  } catch (error) {
    console.error('CMS GET error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// POST /api/cms/[type] - Create content
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // Authentication
    const { authorized, user } = checkAuth(request);
    if (!authorized) {
      return createErrorResponse('Unauthorized', 401);
    }

    const params = await context.params;
    const [type] = params.params;
    
    if (!type) {
      return createErrorResponse('Content type is required');
    }

    // Validate content type
    const contentType = contentValidator.getContentType(type);
    if (!contentType) {
      return createErrorResponse(`Invalid content type: ${type}`, 404);
    }

    const body = await request.json();
    
    // Add user information
    body.createdBy = user?.id;
    body.updatedBy = user?.id;

    // Validate content
    const validation = contentValidator.validateContent(type, body);
    if (!validation.valid) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    const result = await contentService.createContent(type, body);
    
    if (!result) {
      return createErrorResponse('Failed to create content', 500);
    }

    // Invalidate related cache
    await cacheService.invalidateByTags([`cms:${type}`]);

    return createResponse(result, 201);
  } catch (error) {
    console.error('CMS POST error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PUT /api/cms/[type]/[id] - Update content
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // Authentication
    const { authorized, user } = checkAuth(request);
    if (!authorized) {
      return createErrorResponse('Unauthorized', 401);
    }

    const params = await context.params;
    const [type, id] = params.params;
    
    if (!type || !id) {
      return createErrorResponse('Content type and ID are required');
    }

    // Validate content type
    const contentType = contentValidator.getContentType(type);
    if (!contentType) {
      return createErrorResponse(`Invalid content type: ${type}`, 404);
    }

    const body = await request.json();
    
    // Add user information
    body.updatedBy = user?.id;

    // Validate content
    const validation = contentValidator.validateContent(type, body);
    if (!validation.valid) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    const result = await contentService.updateContent(type, id, body);
    
    if (!result) {
      return createErrorResponse('Content not found or update failed', 404);
    }

    // Invalidate related cache
    await cacheService.invalidateByTags([`cms:${type}`, `cms:${type}:${id}`]);

    return createResponse(result);
  } catch (error) {
    console.error('CMS PUT error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// DELETE /api/cms/[type]/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // Authentication
    const { authorized } = checkAuth(request);
    if (!authorized) {
      return createErrorResponse('Unauthorized', 401);
    }

    const params = await context.params;
    const [type, id] = params.params;
    
    if (!type || !id) {
      return createErrorResponse('Content type and ID are required');
    }

    // Validate content type
    const contentType = contentValidator.getContentType(type);
    if (!contentType) {
      return createErrorResponse(`Invalid content type: ${type}`, 404);
    }

    const success = await contentService.deleteContent(type, id);
    
    if (!success) {
      return createErrorResponse('Content not found or delete failed', 404);
    }

    // Invalidate related cache
    await cacheService.invalidateByTags([`cms:${type}`, `cms:${type}:${id}`]);

    return createResponse({ deleted: true });
  } catch (error) {
    console.error('CMS DELETE error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// PATCH /api/cms/[type]/[id]/[action] - Content actions (publish, unpublish, etc.)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ params: string[] }> }
) {
  try {
    // Rate limiting
    if (!checkRateLimit(request)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // Authentication
    const { authorized } = checkAuth(request);
    if (!authorized) {
      return createErrorResponse('Unauthorized', 401);
    }

    const params = await context.params;
    const [type, id, action] = params.params;
    
    if (!type || !id || !action) {
      return createErrorResponse('Content type, ID, and action are required');
    }

    const contentType = contentValidator.getContentType(type);
    if (!contentType) {
      return createErrorResponse(`Invalid content type: ${type}`, 404);
    }

    let result: any;

    switch (action) {
      case 'publish':
        result = await contentService.getContent(type, id);
        if (result) {
          await contentService.updateContent(type, id, {
            status: 'published',
            publishedAt: new Date()
          });
        }
        break;

      case 'unpublish':
        result = await contentService.getContent(type, id);
        if (result) {
          await contentService.updateContent(type, id, {
            status: 'draft',
            publishedAt: null
          });
        }
        break;

      case 'duplicate':
        const original = await contentService.getContent(type, id);
        if (original) {
          const { id: _, createdAt, updatedAt, ...contentData } = original as any;
          result = await contentService.createContent(type, {
            ...contentData,
            title: `${contentData.title} (Copy)`,
            slug: `${contentData.slug}-copy-${Date.now()}`,
            status: 'draft'
          });
        }
        break;

      default:
        return createErrorResponse(`Invalid action: ${action}`, 400);
    }

    if (!result) {
      return createErrorResponse('Content not found or action failed', 404);
    }

    // Invalidate related cache
    await cacheService.invalidateByTags([`cms:${type}`, `cms:${type}:${id}`]);

    return createResponse(result);
  } catch (error) {
    console.error('CMS PATCH error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}