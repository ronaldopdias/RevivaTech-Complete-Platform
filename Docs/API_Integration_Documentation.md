# API Integration Documentation

## Overview

This document provides comprehensive documentation for all API integrations within the Revivatech computer repair shop ecosystem. It covers customer portal APIs, admin dashboard APIs, Chatwoot integration, CRM synchronization, payment processing, and third-party service integrations.

## API Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│ Authentication  │  Rate Limiting  │  Request Validation    │
│ Authorization   │  Caching       │  Response Formatting   │
│ Logging         │  Monitoring    │  Error Handling        │
├─────────────────────────────────────────────────────────────┤
│ Internal APIs          │ External Integrations            │
│ ├── Customer Portal    │ ├── Chatwoot                     │
│ ├── Admin Dashboard    │ ├── CRM (Salesforce/HubSpot)     │
│ ├── Repair Management  │ ├── Payment (Stripe/PayPal)      │
│ ├── Notifications     │ ├── SMS (Twilio)                 │
│ └── Analytics         │ ├── Email (SendGrid)             │
│                       │ └── Cloud Storage (AWS S3)       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi/Zod schemas
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Testing**: Jest + Supertest
- **Monitoring**: Prometheus + Grafana

## Authentication & Authorization

### JWT Implementation

#### Token Structure
```typescript
// types/auth.ts
export interface AccessTokenPayload {
  sub: string;          // User ID
  email: string;
  role: 'customer' | 'technician' | 'admin';
  permissions: string[];
  iat: number;         // Issued at
  exp: number;         // Expires at
  iss: string;         // Issuer
  aud: string;         // Audience
}

export interface RefreshTokenPayload {
  sub: string;         // User ID
  type: 'refresh';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;         // JWT ID for revocation
}
```

#### Authentication Middleware
```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as AccessTokenPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { permissions: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: payload.role,
      permissions: user.permissions.map(p => p.name)
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles
      });
    }
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permission
      });
    }
    next();
  };
};
```

## Customer Portal APIs

### Authentication Endpoints

#### POST /api/customer/auth/login
```typescript
// routes/customer/auth.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { JWTService } from '@/services/JWTService';
import { prisma } from '@/lib/db/prisma';
import { rateLimiter } from '@/middleware/rate-limiting';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

/**
 * @swagger
 * /api/customer/auth/login:
 *   post:
 *     summary: Customer login
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/Customer'
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', rateLimiter.customerLogin, async (req, res) => {
  try {
    const { email, password, rememberMe } = loginSchema.parse(req.body);

    // Find customer by email
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        preferences: true,
        addresses: { where: { isDefault: true } }
      }
    });

    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!customer.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Generate tokens
    const tokenExpiry = rememberMe ? '30d' : '1d';
    const { accessToken, refreshToken } = JWTService.generateCustomerTokens(
      customer,
      tokenExpiry
    );

    // Create session record
    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        refreshToken,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip
      }
    });

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() }
    });

    // Log activity
    await prisma.customerActivityLog.create({
      data: {
        customerId: customer.id,
        activityType: 'login',
        description: 'Customer logged in',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Return sanitized customer data
    const { passwordHash, ...customerData } = customer;
    
    res.json({
      user: customerData,
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

#### POST /api/customer/auth/refresh
```typescript
/**
 * @swagger
 * /api/customer/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const tokenData = JWTService.verifyRefreshToken(refreshToken);
    
    // Check if session exists and is valid
    const session = await prisma.customerSession.findUnique({
      where: { refreshToken },
      include: { customer: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = 
      JWTService.generateCustomerTokens(session.customer);

    // Update session with new refresh token
    await prisma.customerSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Customer Data APIs

#### GET /api/customer/profile
```typescript
/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerProfile'
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user!.id },
      include: {
        addresses: true,
        preferences: true,
        devices: { where: { isActive: true } },
        _count: {
          select: {
            repairs: true,
            notifications: { where: { isRead: false } }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { passwordHash, ...customerData } = customer;
    res.json(customerData);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### PUT /api/customer/profile
```typescript
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  language: z.enum(['en', 'pt']).optional(),
  timezone: z.string().optional()
});

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [en, pt]
 *               timezone:
 *                 type: string
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updateData = updateProfileSchema.parse(req.body);
    
    const updatedCustomer = await prisma.customer.update({
      where: { id: req.user!.id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        addresses: true,
        preferences: true
      }
    });

    // Log activity
    await prisma.customerActivityLog.create({
      data: {
        customerId: req.user!.id,
        activityType: 'profile_update',
        description: 'Profile information updated',
        metadata: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    const { passwordHash, ...customerData } = updatedCustomer;
    res.json(customerData);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors
      });
    }
    
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Repair Management APIs

#### GET /api/customer/repairs
```typescript
const repairQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed', 'cancelled']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * @swagger
 * /api/customer/repairs:
 *   get:
 *     summary: Get customer repairs
 *     tags: [Customer Repairs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, completed, cancelled]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of customer repairs
 */
router.get('/repairs', authenticateToken, async (req, res) => {
  try {
    const { status, limit, offset, sortBy, sortOrder } = repairQuerySchema.parse(req.query);

    const whereClause: any = {
      customerId: req.user!.id
    };

    if (status !== 'all') {
      switch (status) {
        case 'active':
          whereClause.status = {
            in: ['received', 'diagnosing', 'quoted', 'approved', 'repairing', 'testing']
          };
          break;
        case 'completed':
          whereClause.status = 'completed';
          break;
        case 'cancelled':
          whereClause.status = 'cancelled';
          break;
      }
    }

    const [repairs, totalCount] = await Promise.all([
      prisma.repair.findMany({
        where: whereClause,
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true }
          },
          quotes: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          attachments: {
            where: { isPublic: true },
            orderBy: { createdAt: 'desc' }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.repair.count({ where: whereClause })
    ]);

    res.json({
      repairs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    
    console.error('Get repairs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### GET /api/customer/repairs/:id
```typescript
/**
 * @swagger
 * /api/customer/repairs/{id}:
 *   get:
 *     summary: Get repair details
 *     tags: [Customer Repairs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Repair details
 *       404:
 *         description: Repair not found
 */
router.get('/repairs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const repair = await prisma.repair.findFirst({
      where: {
        id,
        customerId: req.user!.id
      },
      include: {
        technician: {
          select: { 
            id: true, 
            firstName: true, 
            lastName: true,
            avatar: true,
            specializations: true
          }
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            partsBreakdown: true
          }
        },
        attachments: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { firstName: true, lastName: true, role: true }
            }
          }
        },
        warrantyInfo: true
      }
    });

    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }

    res.json(repair);

  } catch (error) {
    console.error('Get repair details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Dashboard APIs

#### GET /api/customer/dashboard/stats
```typescript
/**
 * @swagger
 * /api/customer/dashboard/stats:
 *   get:
 *     summary: Get customer dashboard statistics
 *     tags: [Customer Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRepairs:
 *                   type: integer
 *                 activeRepairs:
 *                   type: integer
 *                 completedRepairs:
 *                   type: integer
 *                 successRate:
 *                   type: number
 *                 totalSpent:
 *                   type: number
 *                 averageCompletionTime:
 *                   type: number
 */
router.get('/dashboard/stats', authenticateToken, cacheMiddleware(300), async (req, res) => {
  try {
    const customerId = req.user!.id;

    const [
      totalRepairs,
      activeRepairs,
      completedRepairs,
      totalSpent,
      averageCompletionTime
    ] = await Promise.all([
      prisma.repair.count({ where: { customerId } }),
      prisma.repair.count({ 
        where: { 
          customerId,
          status: { in: ['received', 'diagnosing', 'quoted', 'approved', 'repairing', 'testing'] }
        }
      }),
      prisma.repair.count({ 
        where: { customerId, status: 'completed' }
      }),
      prisma.repair.aggregate({
        where: { customerId, status: 'completed' },
        _sum: { totalCost: true }
      }),
      prisma.repair.aggregate({
        where: { 
          customerId, 
          status: 'completed',
          actualCompletion: { not: null }
        },
        _avg: {
          completionDays: true
        }
      })
    ]);

    const successRate = totalRepairs > 0 ? completedRepairs / totalRepairs : 0;

    const stats = {
      totalRepairs,
      activeRepairs,
      completedRepairs,
      successRate,
      totalSpent: totalSpent._sum.totalCost || 0,
      averageCompletionTime: averageCompletionTime._avg.completionDays || 0
    };

    res.json(stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Admin Dashboard APIs

### Repair Management APIs

#### GET /api/admin/repairs
```typescript
const adminRepairQuerySchema = z.object({
  status: z.string().optional(),
  technicianId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

/**
 * @swagger
 * /api/admin/repairs:
 *   get:
 *     summary: Get all repairs (admin)
 *     tags: [Admin Repairs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of repairs
 *       403:
 *         description: Insufficient permissions
 */
router.get('/repairs', 
  authenticateToken, 
  requireRole(['admin', 'technician']), 
  async (req, res) => {
    try {
      const query = adminRepairQuerySchema.parse(req.query);
      
      const whereClause: any = {};
      
      if (query.status) {
        whereClause.status = query.status;
      }
      
      if (query.technicianId) {
        whereClause.technicianId = query.technicianId;
      }
      
      if (query.priority) {
        whereClause.priority = query.priority;
      }
      
      if (query.dateFrom || query.dateTo) {
        whereClause.createdAt = {};
        if (query.dateFrom) {
          whereClause.createdAt.gte = new Date(query.dateFrom);
        }
        if (query.dateTo) {
          whereClause.createdAt.lte = new Date(query.dateTo);
        }
      }
      
      if (query.search) {
        whereClause.OR = [
          { repairNumber: { contains: query.search, mode: 'insensitive' } },
          { deviceModel: { contains: query.search, mode: 'insensitive' } },
          { customer: { 
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } }
            ]
          }}
        ];
      }

      const [repairs, totalCount] = await Promise.all([
        prisma.repair.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            quotes: {
              where: { status: 'pending' },
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset
        }),
        prisma.repair.count({ where: whereClause })
      ]);

      res.json({
        repairs,
        pagination: {
          total: totalCount,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < totalCount
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: error.errors
        });
      }
      
      console.error('Get admin repairs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

#### PUT /api/admin/repairs/:id/status
```typescript
const updateStatusSchema = z.object({
  status: z.enum(['received', 'diagnosing', 'quoted', 'approved', 'repairing', 'testing', 'completed', 'cancelled']),
  notes: z.string().optional(),
  notifyCustomer: z.boolean().default(true),
  estimatedCompletion: z.string().datetime().optional()
});

/**
 * @swagger
 * /api/admin/repairs/{id}/status:
 *   put:
 *     summary: Update repair status
 *     tags: [Admin Repairs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [received, diagnosing, quoted, approved, repairing, testing, completed, cancelled]
 *               notes:
 *                 type: string
 *               notifyCustomer:
 *                 type: boolean
 */
router.put('/repairs/:id/status',
  authenticateToken,
  requireRole(['admin', 'technician']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, notifyCustomer, estimatedCompletion } = updateStatusSchema.parse(req.body);

      const repair = await prisma.repair.findUnique({
        where: { id },
        include: { customer: true }
      });

      if (!repair) {
        return res.status(404).json({ error: 'Repair not found' });
      }

      // Check permissions - technicians can only update their assigned repairs
      if (req.user!.role === 'technician' && repair.technicianId !== req.user!.id) {
        return res.status(403).json({ error: 'Can only update assigned repairs' });
      }

      const previousStatus = repair.status;

      // Update repair status
      const updatedRepair = await prisma.repair.update({
        where: { id },
        data: {
          status,
          estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : undefined,
          actualCompletion: status === 'completed' ? new Date() : undefined,
          updatedAt: new Date()
        }
      });

      // Create status history record
      await prisma.repairStatusHistory.create({
        data: {
          repairId: id,
          status,
          previousStatus,
          changedBy: req.user!.id,
          notes,
          customerNotified: notifyCustomer
        }
      });

      // Send notifications if requested
      if (notifyCustomer) {
        await notificationService.sendRepairStatusUpdate(
          repair.customerId,
          repair.id,
          status,
          notes
        );
      }

      // Trigger workflow automation
      await workflowService.processRepairStatusChange(id, status);

      res.json(updatedRepair);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation error',
          details: error.errors
        });
      }
      
      console.error('Update repair status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

### Analytics APIs

#### GET /api/admin/analytics/overview
```typescript
/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Get business analytics overview
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Analytics overview
 */
router.get('/analytics/overview',
  authenticateToken,
  requireRole(['admin']),
  cacheMiddleware(600), // Cache for 10 minutes
  async (req, res) => {
    try {
      const period = req.query.period || '30d';
      const daysBack = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period as string] || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [
        totalRevenue,
        totalRepairs,
        avgCompletionTime,
        customerSatisfaction,
        dailyMetrics
      ] = await Promise.all([
        // Total revenue
        prisma.repair.aggregate({
          where: {
            status: 'completed',
            actualCompletion: { gte: startDate }
          },
          _sum: { totalCost: true }
        }),
        
        // Repair counts by status
        prisma.repair.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: { status: true }
        }),
        
        // Average completion time
        prisma.repair.aggregate({
          where: {
            status: 'completed',
            actualCompletion: { gte: startDate }
          },
          _avg: { completionDays: true }
        }),
        
        // Customer satisfaction
        prisma.repairReview.aggregate({
          where: { createdAt: { gte: startDate } },
          _avg: { rating: true },
          _count: { rating: true }
        }),
        
        // Daily metrics for charts
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as repairs,
            SUM(CASE WHEN status = 'completed' THEN total_cost ELSE 0 END) as revenue,
            AVG(CASE WHEN status = 'completed' AND completion_days IS NOT NULL THEN completion_days END) as avg_completion_time
          FROM repairs 
          WHERE created_at >= ${startDate}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `
      ]);

      const analytics = {
        overview: {
          totalRevenue: totalRevenue._sum.totalCost || 0,
          totalRepairs: totalRepairs.reduce((sum, item) => sum + item._count.status, 0),
          avgCompletionTime: avgCompletionTime._avg.completionDays || 0,
          customerSatisfaction: customerSatisfaction._avg.rating || 0,
          satisfactionCount: customerSatisfaction._count.rating
        },
        repairsByStatus: totalRepairs.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        dailyMetrics,
        period: {
          label: period,
          startDate,
          endDate: new Date()
        }
      };

      res.json(analytics);

    } catch (error) {
      console.error('Get analytics overview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

## Chatwoot Integration APIs

### Webhook Handler

#### POST /api/webhooks/chatwoot
```typescript
import crypto from 'crypto';

/**
 * @swagger
 * /api/webhooks/chatwoot:
 *   post:
 *     summary: Handle Chatwoot webhooks
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid signature
 */
router.post('/webhooks/chatwoot', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-chatwoot-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CHATWOOT_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    switch (event) {
      case 'conversation_created':
        await handleConversationCreated(data);
        break;
        
      case 'conversation_status_changed':
        await handleConversationStatusChanged(data);
        break;
        
      case 'message_created':
        await handleMessageCreated(data);
        break;
        
      case 'conversation_resolved':
        await handleConversationResolved(data);
        break;
        
      default:
        console.log(`Unhandled Chatwoot event: ${event}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Chatwoot webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleConversationCreated(data: any) {
  const { conversation } = data;
  
  try {
    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: conversation.contact.email }
    });

    if (!customer) {
      // Create new customer from chat contact
      customer = await prisma.customer.create({
        data: {
          email: conversation.contact.email,
          firstName: conversation.contact.name?.split(' ')[0] || 'Unknown',
          lastName: conversation.contact.name?.split(' ').slice(1).join(' ') || '',
          phone: conversation.contact.phone_number,
          source: 'chat_widget',
          isActive: true
        }
      });
    }

    // Log conversation in database
    await prisma.chatConversation.create({
      data: {
        chatwootId: conversation.id,
        customerId: customer.id,
        status: conversation.status,
        assigneeId: conversation.assignee?.id,
        createdAt: new Date(conversation.created_at),
        updatedAt: new Date(conversation.updated_at),
        metadata: {
          inboxId: conversation.inbox_id,
          contactId: conversation.contact.id
        }
      }
    });

    // Sync with CRM if configured
    if (process.env.CRM_WEBHOOK_URL) {
      await syncCustomerToCRM(customer);
    }

  } catch (error) {
    console.error('Failed to handle conversation creation:', error);
  }
}

async function handleMessageCreated(data: any) {
  const { conversation } = data;
  const latestMessage = conversation.messages[conversation.messages.length - 1];

  try {
    // Find conversation record
    const chatConversation = await prisma.chatConversation.findUnique({
      where: { chatwootId: conversation.id },
      include: { customer: true }
    });

    if (!chatConversation) {
      console.warn(`No conversation record found for Chatwoot ID ${conversation.id}`);
      return;
    }

    // Store message
    await prisma.chatMessage.create({
      data: {
        conversationId: chatConversation.id,
        chatwootMessageId: latestMessage.id,
        content: latestMessage.content,
        messageType: latestMessage.message_type,
        senderId: latestMessage.sender.id,
        senderName: latestMessage.sender.name,
        createdAt: new Date(latestMessage.created_at),
        metadata: {
          contentType: latestMessage.content_type,
          attachments: latestMessage.attachments || []
        }
      }
    });

    // Send real-time notification to customer if message is from agent
    if (latestMessage.message_type === 'outgoing') {
      await socketService.sendToCustomer(chatConversation.customerId, 'chat:message', {
        conversationId: conversation.id,
        message: latestMessage.content,
        senderName: latestMessage.sender.name,
        timestamp: latestMessage.created_at
      });
    }

  } catch (error) {
    console.error('Failed to handle message creation:', error);
  }
}
```

### Chat API Endpoints

#### GET /api/admin/chat/conversations
```typescript
/**
 * @swagger
 * /api/admin/chat/conversations:
 *   get:
 *     summary: Get active chat conversations
 *     tags: [Admin Chat]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of active conversations
 */
router.get('/chat/conversations',
  authenticateToken,
  requireRole(['admin', 'agent']),
  async (req, res) => {
    try {
      const conversations = await prisma.chatConversation.findMany({
        where: {
          status: { in: ['open', 'pending'] }
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          repair: {
            select: {
              id: true,
              repairNumber: true,
              deviceType: true,
              deviceModel: true,
              status: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Enhance with Chatwoot data
      const enhancedConversations = await Promise.all(
        conversations.map(async (conv) => {
          try {
            const chatwootData = await chatwootService.getConversation(conv.chatwootId);
            return {
              ...conv,
              waitingTime: chatwootData.waiting_since,
              messagesCount: chatwootData.messages.length,
              lastActivity: chatwootData.last_activity_at
            };
          } catch (error) {
            console.error(`Failed to fetch Chatwoot data for conversation ${conv.id}:`, error);
            return conv;
          }
        })
      );

      res.json({ conversations: enhancedConversations });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
```

## CRM Integration APIs

### CRM Sync Service

#### Salesforce Integration
```typescript
// services/crm/SalesforceService.ts
import jsforce from 'jsforce';

export class SalesforceService {
  private conn: jsforce.Connection;
  
  constructor() {
    this.conn = new jsforce.Connection({
      oauth2: {
        loginUrl: process.env.SALESFORCE_LOGIN_URL!,
        clientId: process.env.SALESFORCE_CLIENT_ID!,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET!
      }
    });
  }

  async authenticate(): Promise<void> {
    await this.conn.login(
      process.env.SALESFORCE_USERNAME!,
      process.env.SALESFORCE_PASSWORD! + process.env.SALESFORCE_SECURITY_TOKEN!
    );
  }

  async syncCustomer(customer: Customer): Promise<string> {
    try {
      await this.authenticate();

      // Check if contact already exists
      const existingContacts = await this.conn.sobject('Contact').find({
        Email: customer.email
      });

      const contactData = {
        FirstName: customer.firstName,
        LastName: customer.lastName,
        Email: customer.email,
        Phone: customer.phone,
        External_ID__c: customer.id,
        LeadSource: customer.source || 'Website',
        Customer_Since__c: customer.createdAt,
        Total_Repairs__c: customer.repairCount || 0,
        Total_Spent__c: customer.totalSpent || 0
      };

      if (existingContacts.length > 0) {
        // Update existing contact
        await this.conn.sobject('Contact').update({
          Id: existingContacts[0].Id,
          ...contactData
        });
        return existingContacts[0].Id;
      } else {
        // Create new contact
        const result = await this.conn.sobject('Contact').create(contactData);
        return result.id;
      }

    } catch (error) {
      console.error('Salesforce sync error:', error);
      throw error;
    }
  }

  async createOpportunity(repair: Repair, contactId: string): Promise<string> {
    try {
      await this.authenticate();

      const opportunityData = {
        Name: `${repair.deviceBrand} ${repair.deviceModel} Repair`,
        AccountId: contactId,
        Amount: repair.totalCost || 0,
        CloseDate: repair.estimatedCompletion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        StageName: this.mapRepairStatusToSalesforceStage(repair.status),
        LeadSource: 'Website',
        Type: 'Existing Customer',
        Repair_Number__c: repair.repairNumber,
        Device_Type__c: repair.deviceType,
        Device_Model__c: repair.deviceModel,
        Repair_Type__c: repair.repairType,
        Priority__c: repair.priority,
        External_Repair_ID__c: repair.id
      };

      const result = await this.conn.sobject('Opportunity').create(opportunityData);
      return result.id;

    } catch (error) {
      console.error('Salesforce opportunity creation error:', error);
      throw error;
    }
  }

  private mapRepairStatusToSalesforceStage(status: string): string {
    const stageMap: Record<string, string> = {
      'received': 'Prospecting',
      'diagnosing': 'Qualification',
      'quoted': 'Proposal/Price Quote',
      'approved': 'Negotiation/Review',
      'repairing': 'Closed Won',
      'testing': 'Closed Won',
      'completed': 'Closed Won',
      'cancelled': 'Closed Lost'
    };

    return stageMap[status] || 'Prospecting';
  }
}
```

#### CRM Webhook Endpoints
```typescript
/**
 * @swagger
 * /api/admin/crm/sync/customer:
 *   post:
 *     summary: Manually sync customer to CRM
 *     tags: [Admin CRM]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 */
router.post('/crm/sync/customer',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { customerId } = req.body;

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          repairs: { where: { status: 'completed' } },
          _count: { select: { repairs: true } }
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Calculate totals
      const totalSpent = customer.repairs.reduce((sum, repair) => sum + (repair.totalCost || 0), 0);
      const customerData = {
        ...customer,
        repairCount: customer._count.repairs,
        totalSpent
      };

      // Sync to configured CRM
      let crmId: string;
      
      switch (process.env.CRM_PROVIDER) {
        case 'salesforce':
          const salesforceService = new SalesforceService();
          crmId = await salesforceService.syncCustomer(customerData);
          break;
          
        case 'hubspot':
          const hubspotService = new HubspotService();
          crmId = await hubspotService.syncCustomer(customerData);
          break;
          
        default:
          throw new Error('No CRM provider configured');
      }

      // Update customer with CRM ID
      await prisma.customer.update({
        where: { id: customerId },
        data: { crmId }
      });

      res.json({ 
        success: true, 
        crmId,
        provider: process.env.CRM_PROVIDER
      });

    } catch (error) {
      console.error('Manual CRM sync error:', error);
      res.status(500).json({ error: 'CRM sync failed' });
    }
  }
);
```

## Error Handling & Monitoring

### Global Error Handler
```typescript
// middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: (req as any).user?.id
  });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({
          error: 'Duplicate entry',
          field: error.meta?.target,
          code: 'DUPLICATE_ENTRY'
        });
        return;
        
      case 'P2025':
        res.status(404).json({
          error: 'Record not found',
          code: 'NOT_FOUND'
        });
        return;
        
      default:
        res.status(500).json({
          error: 'Database error',
          code: 'DATABASE_ERROR'
        });
        return;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      details: error.details,
      code: 'VALIDATION_ERROR'
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    error: message,
    code: error.code || 'INTERNAL_ERROR'
  });
};
```

### API Monitoring
```typescript
// middleware/monitoring.ts
import prometheus from 'prom-client';

// Metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections'
});

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
      
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
      
    activeConnections.dec();
  });
  
  next();
};

// Health check endpoint
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        chatwoot: await checkChatwootHealth()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};
```

## Testing Strategy

### API Testing Framework
```typescript
// __tests__/api/customer-auth.test.ts
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcrypt';

describe('Customer Authentication API', () => {
  beforeEach(async () => {
    await prisma.customer.deleteMany();
  });

  describe('POST /api/customer/auth/login', () => {
    beforeEach(async () => {
      // Create test customer
      await prisma.customer.create({
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Customer',
          passwordHash: await bcrypt.hash('password123', 10),
          isActive: true
        }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Customer'
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/customer/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should reject malformed email', async () => {
      const response = await request(app)
        .post('/api/customer/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /api/customer/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const customer = await prisma.customer.create({
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'Customer',
          passwordHash: await bcrypt.hash('password123', 10),
          isActive: true
        }
      });

      const tokens = JWTService.generateCustomerTokens(customer);
      refreshToken = tokens.refreshToken;

      await prisma.customerSession.create({
        data: {
          customerId: customer.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/customer/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: 900
      });
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/customer/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});
```

## API Documentation

### OpenAPI Specification
```yaml
# swagger.yaml
openapi: 3.0.0
info:
  title: Revivatech API
  description: Computer repair shop management API
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@revivatech.com

servers:
  - url: https://api.revivatech.com/v1
    description: Production server
  - url: https://staging-api.revivatech.com/v1
    description: Staging server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Customer:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        phone:
          type: string
        isActive:
          type: boolean
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Repair:
      type: object
      properties:
        id:
          type: string
          format: uuid
        repairNumber:
          type: string
        customerId:
          type: string
          format: uuid
        deviceType:
          type: string
        deviceBrand:
          type: string
        deviceModel:
          type: string
        status:
          type: string
          enum:
            - received
            - diagnosing
            - quoted
            - approved
            - repairing
            - testing
            - completed
            - cancelled
        totalCost:
          type: number
          format: decimal
        createdAt:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: string
        code:
          type: string
        details:
          type: object

security:
  - BearerAuth: []

paths:
  /customer/auth/login:
    post:
      summary: Customer login
      tags:
        - Customer Authentication
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                rememberMe:
                  type: boolean
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/Customer'
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  expiresIn:
                    type: integer
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

This comprehensive API Integration Documentation provides the foundation for building robust, scalable, and well-documented APIs that connect all components of the Revivatech ecosystem while maintaining security, performance, and reliability standards.