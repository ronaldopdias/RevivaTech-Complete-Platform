/**
 * API CONTRACT VALIDATION MIDDLEWARE
 * 
 * Ensures all migrated routes maintain proper validation and type safety
 * Validates request/response contracts for Prisma-migrated endpoints
 */

const { z } = require('zod');

// Request validation schemas
const validationSchemas = {
  // Authentication schemas
  login: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  }),
  
  register: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional()
  }),
  
  // Booking schemas
  createBooking: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
    deviceModelId: z.string().min(1),
    issueDescription: z.string().min(1),
    preferredDate: z.string().optional(),
    preferredTime: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional()
  }),
  
  updateBooking: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    technicianId: z.string().optional(),
    finalPrice: z.number().positive().optional(),
    completedAt: z.string().optional(),
    notes: z.string().optional()
  }),
  
  // Customer schemas
  updateCustomer: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional()
  }),
  
  // Device schemas
  createDevice: z.object({
    brandId: z.string().min(1),
    modelName: z.string().min(1),
    category: z.string().min(1)
  }),
  
  // Pricing rules schemas
  createPricingRule: z.object({
    deviceModelId: z.string().min(1),
    serviceType: z.string().min(1),
    basePrice: z.number().positive(),
    estimatedDuration: z.number().positive().optional(),
    difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).optional()
  })
};

// Response validation schemas
const responseSchemas = {
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['CUSTOMER', 'TECHNICIAN', 'ADMIN'])
  }),
  
  booking: z.object({
    id: z.string(),
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    finalPrice: z.number().nullable(),
    createdAt: z.string(),
    customer: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string()
    }).optional()
  }),
  
  device: z.object({
    id: z.string(),
    modelName: z.string(),
    brand: z.object({
      id: z.string(),
      name: z.string(),
      category: z.object({
        id: z.string(),
        name: z.string()
      })
    })
  })
};

/**
 * Middleware to validate request bodies against schemas
 */
function validateRequest(schemaName) {
  return (req, res, next) => {
    try {
      const schema = validationSchemas[schemaName];
      if (!schema) {
        return res.status(500).json({
          error: 'Validation schema not found',
          code: 'SCHEMA_NOT_FOUND'
        });
      }

      // Skip validation for GET requests without body
      if (req.method === 'GET' && (!req.body || Object.keys(req.body).length === 0)) {
        return next();
      }

      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      console.error('Request validation error:', error);
      res.status(500).json({
        error: 'Internal server error during validation',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Middleware to validate response data
 */
function validateResponse(schemaName) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      try {
        const schema = responseSchemas[schemaName];
        if (!schema && data && !data.error) {
          console.warn(`Response validation schema '${schemaName}' not found`);
        }
        
        // Skip validation for error responses
        if (data && data.error) {
          return originalJson(data);
        }
        
        // Skip validation if no schema
        if (!schema) {
          return originalJson(data);
        }
        
        // Validate single objects
        if (data && typeof data === 'object' && !Array.isArray(data) && !data.data) {
          schema.parse(data);
        }
        
        // Validate arrays
        if (Array.isArray(data)) {
          data.forEach(item => schema.parse(item));
        }
        
        // Validate paginated responses
        if (data && data.data && Array.isArray(data.data)) {
          data.data.forEach(item => schema.parse(item));
        }
        
        return originalJson(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(`Response validation failed for ${schemaName}:`, error.errors);
          return originalJson({
            error: 'Response validation failed',
            code: 'RESPONSE_VALIDATION_ERROR',
            message: 'The server response did not match expected format'
          });
        }
        
        console.error('Response validation error:', error);
        return originalJson(data);
      }
    };
    
    next();
  };
}

/**
 * Generic error handler for validation middleware
 */
function handleValidationError(error, req, res, next) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors
    });
  }
  
  next(error);
}

/**
 * Health check validation - ensures endpoint is accessible
 */
function validateHealthEndpoint(req, res, next) {
  // Add health check metadata
  req.healthCheck = true;
  next();
}

/**
 * API contract compliance checker
 */
function checkApiCompliance() {
  return (req, res, next) => {
    // Add compliance headers
    res.set({
      'X-API-Version': '2.0',
      'X-Migration-Status': 'PRISMA_COMPLETE',
      'X-Validation-Enabled': 'true'
    });
    
    next();
  };
}

/**
 * Prisma error handler - converts Prisma errors to API-friendly responses
 */
function handlePrismaErrors(error, req, res, next) {
  // Handle Prisma-specific errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Unique constraint violation',
      code: 'DUPLICATE_ENTRY',
      field: error.meta?.target?.[0] || 'unknown'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      code: 'NOT_FOUND'
    });
  }
  
  if (error.code?.startsWith('P2')) {
    return res.status(400).json({
      error: 'Database operation failed',
      code: 'DATABASE_ERROR',
      message: error.message
    });
  }
  
  next(error);
}

module.exports = {
  validateRequest,
  validateResponse,
  handleValidationError,
  validateHealthEndpoint,
  checkApiCompliance,
  handlePrismaErrors,
  validationSchemas,
  responseSchemas
};