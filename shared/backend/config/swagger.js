const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basic swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'RevivaTech API',
    version: '2.0.0',
    description: 'Comprehensive API documentation for RevivaTech computer repair platform',
    contact: {
      name: 'RevivaTech Support',
      email: 'support@revivatech.co.uk',
      url: 'https://revivatech.co.uk'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3011',
      description: 'Development server'
    },
    {
      url: 'https://api.revivatech.co.uk',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Booking: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique booking identifier'
          },
          customerId: {
            type: 'string',
            description: 'Customer ID'
          },
          deviceModelId: {
            type: 'string',
            description: 'Device model ID'
          },
          repairType: {
            type: 'string',
            enum: ['SCREEN_REPAIR', 'BATTERY_REPLACEMENT', 'DATA_RECOVERY', 'VIRUS_REMOVAL', 'HARDWARE_REPAIR'],
            description: 'Type of repair requested'
          },
          problemDescription: {
            type: 'string',
            description: 'Detailed description of the problem'
          },
          urgencyLevel: {
            type: 'string',
            enum: ['LOW', 'STANDARD', 'HIGH', 'URGENT'],
            description: 'Urgency level of the repair'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
            description: 'Current status of the booking'
          },
          finalPrice: {
            type: 'number',
            format: 'decimal',
            description: 'Final price for the repair'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Booking creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Device: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Device identifier'
          },
          name: {
            type: 'string',
            description: 'Device name'
          },
          categoryId: {
            type: 'string',
            description: 'Device category ID'
          },
          brandId: {
            type: 'string',
            description: 'Device brand ID'
          },
          specifications: {
            type: 'object',
            description: 'Device specifications'
          },
          basePrice: {
            type: 'number',
            format: 'decimal',
            description: 'Base repair price'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User identifier'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          role: {
            type: 'string',
            enum: ['CUSTOMER', 'TECHNICIAN', 'ADMIN'],
            description: 'User role'
          },
          profile: {
            type: 'object',
            description: 'User profile information'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'string',
            description: 'Detailed error information'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Bookings',
      description: 'Repair booking management'
    },
    {
      name: 'Devices',
      description: 'Device catalog and specifications'
    },
    {
      name: 'Pricing',
      description: 'Dynamic pricing calculations'
    },
    {
      name: 'Email',
      description: 'Email service and notifications'
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints and analytics'
    },
    {
      name: 'WebSocket',
      description: 'Real-time communication'
    }
  ]
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  // Path to the API docs
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Custom CSS for swagger UI
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #6366f1; }
  .swagger-ui .info .description { color: #4b5563; }
  .swagger-ui .scheme-container { background: #f8fafc; }
  .swagger-ui .opblock.opblock-post { border-color: #6366f1; }
  .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #6366f1; }
  .swagger-ui .opblock.opblock-get { border-color: #10b981; }
  .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #10b981; }
  .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
  .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #f59e0b; }
  .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
  .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #ef4444; }
`;

const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'RevivaTech API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
  }
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};