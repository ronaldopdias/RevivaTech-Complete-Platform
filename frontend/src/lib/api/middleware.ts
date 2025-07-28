// API Middleware
// Request/response middleware for validation, authentication, and error handling

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse, ApiError, ValidationError } from './types';

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface MiddlewareConfig {
  requireAuth?: boolean;
  roles?: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  validateBody?: z.ZodSchema;
  validateQuery?: z.ZodSchema;
}

export class ApiMiddleware {
  // Create standardized API response
  static createResponse<T>(
    data?: T,
    message?: string,
    status: number = 200
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: status < 400,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status });
  }

  // Create error response
  static createErrorResponse(
    error: string | ApiError,
    status: number = 500
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
    };

    if (typeof error === 'object' && error.details) {
      (response as any).details = error.details;
    }

    return NextResponse.json(response, { status });
  }

  // CORS middleware
  static setCorsHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Rate limiting middleware
  static rateLimit(config: { windowMs: number; maxRequests: number }) {
    return (request: NextRequest): NextResponse | null => {
      const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      const key = `rate_limit:${clientIp}`;
      
      // Clean up expired entries
      if (now % 1000 === 0) { // Cleanup every ~1000 requests
        for (const [k, v] of rateLimitStore.entries()) {
          if (v.resetTime < now) {
            rateLimitStore.delete(k);
          }
        }
      }

      const entry = rateLimitStore.get(key);
      
      if (!entry || entry.resetTime < now) {
        // New window
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return null; // Allow request
      }

      if (entry.count >= config.maxRequests) {
        // Rate limit exceeded
        const response = this.createErrorResponse(
          'Rate limit exceeded',
          429
        );
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
        response.headers.set('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
        return response;
      }

      // Increment count
      entry.count++;
      rateLimitStore.set(key, entry);

      return null; // Allow request
    };
  }

  // Authentication middleware
  static async authenticate(request: NextRequest): Promise<{
    user?: any;
    error?: NextResponse;
  }> {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: this.createErrorResponse('Missing or invalid authorization header', 401),
      };
    }

    const token = authHeader.substring(7);
    
    try {
      // Import here to avoid circular dependencies
      const { createUserRepository } = await import('../database');
      const userRepo = createUserRepository();
      
      const session = await userRepo.findValidSession(token);
      
      if (!session || !session.user) {
        return {
          error: this.createErrorResponse('Invalid or expired token', 401),
        };
      }

      // Update last login
      await userRepo.updateLastLogin(session.user.id);

      return { user: session.user };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        error: this.createErrorResponse('Authentication failed', 401),
      };
    }
  }

  // Role-based authorization
  static authorize(user: any, requiredRoles: string[]): NextResponse | null {
    if (!user) {
      return this.createErrorResponse('Authentication required', 401);
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return this.createErrorResponse('Insufficient permissions', 403);
    }

    return null;
  }

  // Request validation middleware
  static validateRequest(schema: z.ZodSchema, data: any): {
    valid: boolean;
    data?: any;
    errors?: ValidationError[];
  } {
    try {
      const validData = schema.parse(data);
      return { valid: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
        }));
        return { valid: false, errors };
      }
      
      return {
        valid: false,
        errors: [{ field: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  // Error handling middleware
  static handleError(error: any): NextResponse {
    console.error('API Error:', error);

    // Handle known error types
    if (error.code === 'P2002') {
      // Prisma unique constraint violation
      return this.createErrorResponse('Duplicate entry found', 409);
    }

    if (error.code === 'P2025') {
      // Prisma record not found
      return this.createErrorResponse('Record not found', 404);
    }

    if (error.name === 'ValidationError') {
      return this.createErrorResponse('Validation failed', 400);
    }

    // Generic server error
    return this.createErrorResponse(
      process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error',
      500
    );
  }

  // Complete middleware wrapper
  static withMiddleware(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
    config: MiddlewareConfig = {}
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
          const response = new NextResponse(null, { status: 200 });
          return this.setCorsHeaders(response);
        }

        // Rate limiting
        if (config.rateLimit) {
          const rateLimitResponse = this.rateLimit(config.rateLimit)(request);
          if (rateLimitResponse) {
            return this.setCorsHeaders(rateLimitResponse);
          }
        }

        // Authentication
        let user: any = null;
        if (config.requireAuth) {
          const authResult = await this.authenticate(request);
          if (authResult.error) {
            return this.setCorsHeaders(authResult.error);
          }
          user = authResult.user;

          // Authorization
          if (config.roles && config.roles.length > 0) {
            const authzResponse = this.authorize(user, config.roles);
            if (authzResponse) {
              return this.setCorsHeaders(authzResponse);
            }
          }
        }

        // Request validation
        if (config.validateBody && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await request.json();
            const validation = this.validateRequest(config.validateBody, body);
            
            if (!validation.valid) {
              return this.setCorsHeaders(
                this.createErrorResponse({
                  code: 'VALIDATION_ERROR',
                  message: 'Request validation failed',
                  details: validation.errors,
                } as ApiError, 400)
              );
            }

            // Add validated data to request context
            (request as any).validatedBody = validation.data;
          } catch (error) {
            return this.setCorsHeaders(
              this.createErrorResponse('Invalid JSON in request body', 400)
            );
          }
        }

        if (config.validateQuery) {
          const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
          const validation = this.validateRequest(config.validateQuery, searchParams);
          
          if (!validation.valid) {
            return this.setCorsHeaders(
              this.createErrorResponse({
                code: 'VALIDATION_ERROR',
                message: 'Query validation failed',
                details: validation.errors,
              } as ApiError, 400)
            );
          }

          (request as any).validatedQuery = validation.data;
        }

        // Add user to request context
        (request as any).user = user;

        // Execute handler
        const response = await handler(request, context);
        
        // Add rate limit headers if configured
        if (config.rateLimit) {
          const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
          const entry = rateLimitStore.get(`rate_limit:${clientIp}`);
          
          if (entry) {
            response.headers.set('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', Math.max(0, config.rateLimit.maxRequests - entry.count).toString());
            response.headers.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
          }
        }

        return this.setCorsHeaders(response);
      } catch (error) {
        const errorResponse = this.handleError(error);
        return this.setCorsHeaders(errorResponse);
      }
    };
  }
}

// Validation schemas for common use cases
export const commonSchemas = {
  pagination: z.object({
    page: z.string().transform(val => parseInt(val, 10)).optional(),
    limit: z.string().transform(val => parseInt(val, 10)).optional(),
  }),

  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),

  search: z.object({
    query: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
};