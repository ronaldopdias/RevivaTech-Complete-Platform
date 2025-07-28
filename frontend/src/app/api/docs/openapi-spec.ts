/**
 * OpenAPI 3.0 Specification for RevivaTech API
 * Complete API documentation with schemas, endpoints, and examples
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'RevivaTech API',
    version: '1.0.0',
    description: 'Professional computer repair booking and management API',
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
      url: 'http://localhost:3010',
      description: 'Development server'
    },
    {
      url: 'https://revivatech.co.uk',
      description: 'Production server'
    }
  ],
  components: {
    schemas: {
      Device: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique device identifier',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Device name',
            example: 'iPhone 15 Pro'
          },
          category: {
            type: 'string',
            enum: ['smartphone', 'laptop', 'tablet', 'desktop', 'gaming', 'wearable'],
            description: 'Device category',
            example: 'smartphone'
          },
          brand: {
            type: 'string',
            description: 'Device brand',
            example: 'Apple'
          },
          model: {
            type: 'string',
            description: 'Device model',
            example: 'iPhone 15 Pro'
          },
          year: {
            type: 'integer',
            description: 'Release year',
            example: 2023
          },
          specifications: {
            type: 'object',
            description: 'Device specifications',
            properties: {
              screenSize: {
                type: 'string',
                example: '6.1"'
              },
              storage: {
                type: 'array',
                items: {
                  type: 'string'
                },
                example: ['128GB', '256GB', '512GB', '1TB']
              },
              colors: {
                type: 'array',
                items: {
                  type: 'string'
                },
                example: ['Natural Titanium', 'Blue Titanium', 'White Titanium']
              }
            }
          },
          repairTypes: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/RepairType'
            },
            description: 'Available repair types for this device'
          },
          imageUrl: {
            type: 'string',
            description: 'Device image URL',
            example: '/images/devices/iphone-15-pro.jpg'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether device is active in catalog',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        },
        required: ['id', 'name', 'category', 'brand', 'model', 'year']
      },
      RepairType: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique repair type identifier',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Repair type name',
            example: 'Screen Repair'
          },
          category: {
            type: 'string',
            enum: ['HARDWARE', 'SOFTWARE', 'DIAGNOSTIC', 'MAINTENANCE'],
            description: 'Repair category',
            example: 'HARDWARE'
          },
          description: {
            type: 'string',
            description: 'Detailed description of the repair',
            example: 'Complete screen replacement including LCD, digitizer, and frame'
          },
          estimatedTime: {
            type: 'integer',
            description: 'Estimated repair time in minutes',
            example: 60
          },
          warranty: {
            type: 'integer',
            description: 'Warranty period in days',
            example: 90
          },
          isActive: {
            type: 'boolean',
            description: 'Whether repair type is active',
            example: true
          }
        },
        required: ['id', 'name', 'category', 'estimatedTime']
      },
      PricingRequest: {
        type: 'object',
        properties: {
          deviceId: {
            type: 'integer',
            description: 'Device ID for pricing',
            example: 1
          },
          repairTypeId: {
            type: 'integer',
            description: 'Repair type ID for pricing',
            example: 1
          },
          serviceLevel: {
            type: 'string',
            enum: ['STANDARD', 'HIGH', 'URGENT', 'EMERGENCY'],
            description: 'Service level',
            example: 'STANDARD'
          },
          urgency: {
            type: 'string',
            enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
            description: 'Urgency level',
            example: 'NORMAL'
          },
          marketFactors: {
            type: 'object',
            description: 'Market adjustment factors',
            properties: {
              demandMultiplier: {
                type: 'number',
                example: 1.1
              },
              seasonalityMultiplier: {
                type: 'number',
                example: 1.0
              },
              competitionMultiplier: {
                type: 'number',
                example: 0.95
              }
            }
          }
        },
        required: ['deviceId', 'repairTypeId', 'serviceLevel']
      },
      PricingResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          pricing: {
            type: 'object',
            properties: {
              basePrice: {
                type: 'number',
                description: 'Base repair price',
                example: 299.99
              },
              adjustedPrice: {
                type: 'number',
                description: 'Price after market adjustments',
                example: 314.99
              },
              totalPrice: {
                type: 'number',
                description: 'Final total price',
                example: 314.99
              },
              breakdown: {
                type: 'object',
                description: 'Price calculation breakdown',
                properties: {
                  basePrice: {
                    type: 'number',
                    example: 299.99
                  },
                  urgencyMultiplier: {
                    type: 'number',
                    example: 1.0
                  },
                  demandAdjustment: {
                    type: 'number',
                    example: 14.99
                  },
                  seasonalAdjustment: {
                    type: 'number',
                    example: 0.0
                  },
                  competitionAdjustment: {
                    type: 'number',
                    example: -15.0
                  }
                }
              },
              currency: {
                type: 'string',
                example: 'GBP'
              },
              estimatedTime: {
                type: 'integer',
                description: 'Estimated repair time in minutes',
                example: 60
              },
              validUntil: {
                type: 'string',
                format: 'date-time',
                description: 'Quote expiration time'
              }
            }
          }
        }
      },
      BookingRequest: {
        type: 'object',
        properties: {
          deviceId: {
            type: 'integer',
            description: 'Device ID to be repaired',
            example: 1
          },
          repairTypeId: {
            type: 'integer',
            description: 'Type of repair needed',
            example: 1
          },
          customerInfo: {
            type: 'object',
            description: 'Customer information',
            properties: {
              firstName: {
                type: 'string',
                example: 'John'
              },
              lastName: {
                type: 'string',
                example: 'Doe'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john.doe@example.com'
              },
              phone: {
                type: 'string',
                example: '+44123456789'
              },
              address: {
                type: 'string',
                example: '123 Test Street, London, UK'
              }
            },
            required: ['firstName', 'lastName', 'email', 'phone']
          },
          issueDescription: {
            type: 'string',
            description: 'Detailed description of the issue',
            example: 'Screen is cracked and not responding to touch'
          },
          serviceLevel: {
            type: 'string',
            enum: ['STANDARD', 'HIGH', 'URGENT', 'EMERGENCY'],
            description: 'Service level',
            example: 'STANDARD'
          },
          urgency: {
            type: 'string',
            enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
            description: 'Urgency level',
            example: 'NORMAL'
          },
          estimatedPrice: {
            type: 'number',
            description: 'Estimated repair cost',
            example: 299.99
          },
          serviceType: {
            type: 'string',
            enum: ['PICKUP', 'DROPOFF', 'ONSITE', 'POSTAL'],
            description: 'Service delivery type',
            example: 'PICKUP'
          },
          images: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Device damage photos',
            example: ['image1.jpg', 'image2.jpg']
          }
        },
        required: ['deviceId', 'repairTypeId', 'customerInfo', 'issueDescription', 'serviceLevel', 'estimatedPrice']
      },
      BookingResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          booking: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique booking identifier',
                example: 'booking-456'
              },
              reference: {
                type: 'string',
                description: 'Human-readable booking reference',
                example: 'REV-1234567890'
              },
              status: {
                type: 'string',
                enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
                description: 'Booking status',
                example: 'PENDING'
              },
              estimatedPrice: {
                type: 'number',
                description: 'Estimated repair cost',
                example: 299.99
              },
              estimatedCompletion: {
                type: 'string',
                format: 'date-time',
                description: 'Estimated completion time'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Booking creation time'
              }
            }
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'user-123'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john.doe@example.com'
              },
              firstName: {
                type: 'string',
                example: 'John'
              },
              lastName: {
                type: 'string',
                example: 'Doe'
              }
            }
          }
        }
      },
      PaymentRequest: {
        type: 'object',
        properties: {
          bookingId: {
            type: 'string',
            description: 'Booking ID for payment',
            example: 'booking-123'
          },
          amount: {
            type: 'integer',
            description: 'Payment amount in pence',
            example: 29999
          },
          currency: {
            type: 'string',
            description: 'Payment currency',
            example: 'gbp'
          },
          paymentMethodId: {
            type: 'string',
            description: 'Stripe payment method ID',
            example: 'pm_test_card'
          }
        },
        required: ['bookingId', 'amount', 'currency', 'paymentMethodId']
      },
      PaymentResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          paymentIntent: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Stripe payment intent ID',
                example: 'pi_test_123'
              },
              amount: {
                type: 'integer',
                description: 'Payment amount in pence',
                example: 29999
              },
              currency: {
                type: 'string',
                description: 'Payment currency',
                example: 'gbp'
              },
              status: {
                type: 'string',
                description: 'Payment status',
                example: 'succeeded'
              },
              client_secret: {
                type: 'string',
                description: 'Client secret for payment confirmation',
                example: 'pi_test_123_secret'
              }
            }
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
            description: 'Error message',
            example: 'Device not found'
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'DEVICE_NOT_FOUND'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      }
    },
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
    }
  },
  paths: {
    '/api/devices': {
      get: {
        tags: ['Devices'],
        summary: 'Get device catalog',
        description: 'Retrieve the complete device catalog with specifications and repair types',
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter by device category',
            required: false,
            schema: {
              type: 'string',
              enum: ['smartphone', 'laptop', 'tablet', 'desktop', 'gaming', 'wearable']
            }
          },
          {
            name: 'brand',
            in: 'query',
            description: 'Filter by device brand',
            required: false,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'year',
            in: 'query',
            description: 'Filter by release year',
            required: false,
            schema: {
              type: 'integer'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of devices to return',
            required: false,
            schema: {
              type: 'integer',
              default: 50,
              maximum: 100
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of devices to skip',
            required: false,
            schema: {
              type: 'integer',
              default: 0
            }
          }
        ],
        responses: {
          200: {
            description: 'Device catalog retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    devices: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Device'
                      }
                    },
                    total: {
                      type: 'integer',
                      description: 'Total number of devices',
                      example: 79
                    },
                    page: {
                      type: 'integer',
                      description: 'Current page number',
                      example: 1
                    },
                    limit: {
                      type: 'integer',
                      description: 'Items per page',
                      example: 50
                    }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/devices/{id}': {
      get: {
        tags: ['Devices'],
        summary: 'Get device details',
        description: 'Retrieve detailed information about a specific device',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Device ID',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          200: {
            description: 'Device details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    device: {
                      $ref: '#/components/schemas/Device'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Device not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/pricing/calculate': {
      post: {
        tags: ['Pricing'],
        summary: 'Calculate repair price',
        description: 'Calculate the total repair cost based on device, repair type, and service level',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PricingRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Pricing calculated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PricingResponse'
                }
              }
            }
          },
          400: {
            description: 'Invalid request parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create new booking',
        description: 'Create a new repair booking with customer information',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BookingRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Booking created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/BookingResponse'
                }
              }
            }
          },
          400: {
            description: 'Invalid booking data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking details',
        description: 'Retrieve detailed information about a specific booking',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Booking ID',
            required: true,
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          200: {
            description: 'Booking details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    booking: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                          example: 'booking-123'
                        },
                        reference: {
                          type: 'string',
                          example: 'REV-1234567890'
                        },
                        status: {
                          type: 'string',
                          enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
                          example: 'IN_PROGRESS'
                        },
                        device: {
                          $ref: '#/components/schemas/Device'
                        },
                        repairType: {
                          $ref: '#/components/schemas/RepairType'
                        },
                        statusHistory: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              status: {
                                type: 'string'
                              },
                              timestamp: {
                                type: 'string',
                                format: 'date-time'
                              },
                              notes: {
                                type: 'string'
                              }
                            }
                          }
                        },
                        estimatedCompletion: {
                          type: 'string',
                          format: 'date-time'
                        },
                        createdAt: {
                          type: 'string',
                          format: 'date-time'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Booking not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/payments/stripe/payment-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create payment intent',
        description: 'Create a Stripe payment intent for booking payment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaymentRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Payment intent created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaymentResponse'
                }
              }
            }
          },
          400: {
            description: 'Invalid payment data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/notifications/push': {
      post: {
        tags: ['Notifications'],
        summary: 'Send push notification',
        description: 'Send a push notification to a specific user',
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'Target user ID',
                    example: 'user-123'
                  },
                  notification: {
                    type: 'object',
                    properties: {
                      title: {
                        type: 'string',
                        description: 'Notification title',
                        example: 'Repair Status Update'
                      },
                      body: {
                        type: 'string',
                        description: 'Notification body',
                        example: 'Your iPhone repair is now complete'
                      },
                      icon: {
                        type: 'string',
                        description: 'Notification icon URL',
                        example: '/icon-192x192.png'
                      },
                      data: {
                        type: 'object',
                        description: 'Additional notification data',
                        properties: {
                          bookingId: {
                            type: 'string',
                            example: 'booking-123'
                          },
                          type: {
                            type: 'string',
                            example: 'repair_status'
                          },
                          url: {
                            type: 'string',
                            example: '/dashboard'
                          }
                        }
                      }
                    },
                    required: ['title', 'body']
                  }
                },
                required: ['userId', 'notification']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Notification sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    message: {
                      type: 'string',
                      example: 'Notification sent successfully'
                    },
                    notificationId: {
                      type: 'string',
                      example: 'notification-456'
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/api/performance': {
      get: {
        tags: ['Performance'],
        summary: 'Get performance metrics',
        description: 'Retrieve system performance metrics and health status',
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          200: {
            description: 'Performance metrics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    metrics: {
                      type: 'object',
                      properties: {
                        averageResponseTime: {
                          type: 'number',
                          description: 'Average API response time in milliseconds',
                          example: 145.7
                        },
                        requestCount: {
                          type: 'integer',
                          description: 'Total number of requests',
                          example: 1542
                        },
                        errorRate: {
                          type: 'number',
                          description: 'Error rate percentage',
                          example: 0.12
                        },
                        cacheHitRate: {
                          type: 'number',
                          description: 'Cache hit rate percentage',
                          example: 87.5
                        },
                        databaseQueryTime: {
                          type: 'number',
                          description: 'Average database query time in milliseconds',
                          example: 23.4
                        },
                        uptime: {
                          type: 'number',
                          description: 'System uptime in seconds',
                          example: 86400
                        },
                        memoryUsage: {
                          type: 'object',
                          properties: {
                            used: {
                              type: 'number',
                              description: 'Used memory in MB',
                              example: 512.7
                            },
                            total: {
                              type: 'number',
                              description: 'Total memory in MB',
                              example: 1024.0
                            },
                            percentage: {
                              type: 'number',
                              description: 'Memory usage percentage',
                              example: 50.1
                            }
                          }
                        }
                      }
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Metrics timestamp'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Devices',
      description: 'Device catalog and specifications'
    },
    {
      name: 'Pricing',
      description: 'Repair pricing and cost calculation'
    },
    {
      name: 'Bookings',
      description: 'Repair booking management'
    },
    {
      name: 'Payments',
      description: 'Payment processing and transactions'
    },
    {
      name: 'Notifications',
      description: 'Push notifications and alerts'
    },
    {
      name: 'Performance',
      description: 'System performance and monitoring'
    }
  ]
};
