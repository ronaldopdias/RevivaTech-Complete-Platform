// Booking System API
// Complete booking lifecycle management with multi-step flow

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiMiddleware, commonSchemas } from '@/lib/api/middleware';
import { 
  createBookingRepository, 
  createDeviceModelRepository, 
  createPricingRuleRepository,
  createNotificationRepository,
  createUserRepository
} from '@/lib/database';
import { RepairType, UrgencyLevel, BookingStatus, NotificationType, NotificationChannel } from '@/generated/prisma';

// Validation schemas
const createBookingSchema = z.object({
  deviceModelId: z.string().uuid(),
  repairType: z.nativeEnum(RepairType),
  problemDescription: z.string().min(10).max(1000),
  urgencyLevel: z.nativeEnum(UrgencyLevel).optional(),
  preferredDate: z.string().datetime().optional(),
  customerInfo: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(5).max(20),
    address: z.string().min(5).max(200),
  }),
  deviceCondition: z.object({
    physicalDamage: z.string().max(500).optional(),
    functionalIssues: z.string().max(500).optional(),
    accessories: z.array(z.string()).optional(),
  }).optional(),
  photoUrls: z.array(z.string().url()).optional(),
  customerNotes: z.string().max(500).optional(),
});

const bookingSearchSchema = z.object({
  ...commonSchemas.search.shape,
  ...commonSchemas.pagination.shape,
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  repairType: z.nativeEnum(RepairType).optional(),
  urgencyLevel: z.nativeEnum(UrgencyLevel).optional(),
  assignedTechnicianId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  priceMin: z.string().transform(val => parseFloat(val)).optional(),
  priceMax: z.string().transform(val => parseFloat(val)).optional(),
});

const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  scheduledDate: z.string().datetime().optional(),
  estimatedCompletion: z.string().datetime().optional(),
  assignedTechnicianId: z.string().uuid().optional(),
  internalNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(500).optional(),
});

// GET /api/bookings - Search and list bookings
export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const bookingRepo = createBookingRepository();
    const user = (request as any).user;
    const searchParams = (request as any).validatedQuery as z.infer<typeof bookingSearchSchema>;

    const {
      query = '',
      customerId,
      status,
      repairType,
      urgencyLevel,
      assignedTechnicianId,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = searchParams;

    try {
      let effectiveCustomerId = customerId;
      
      // Customers can only see their own bookings
      if (user.role === 'CUSTOMER') {
        effectiveCustomerId = user.id;
      }

      const filters = {
        customerId: effectiveCustomerId,
        status,
        repairType,
        urgencyLevel,
        assignedTechnicianId,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        priceMin,
        priceMax,
      };

      const pagination = { page, limit };

      let result;
      if (query) {
        result = await bookingRepo.searchBookings(query, filters, pagination);
      } else if (effectiveCustomerId) {
        result = await bookingRepo.findBookingsByCustomer(effectiveCustomerId, pagination);
      } else if (status) {
        result = await bookingRepo.findBookingsByStatus(status, pagination);
      } else {
        // General search with filters
        result = await bookingRepo.searchBookings('', filters, pagination);
      }

      if ('data' in result) {
        return ApiMiddleware.createResponse({
          bookings: result.data,
          pagination: result.pagination,
        });
      } else {
        return ApiMiddleware.createResponse({
          bookings: result,
          pagination: {
            page: 1,
            limit: result.length,
            total: result.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    validateQuery: bookingSearchSchema,
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }
);

// POST /api/bookings - Create new booking
export const POST = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const bookingRepo = createBookingRepository();
    const deviceRepo = createDeviceModelRepository();
    const pricingRepo = createPricingRuleRepository();
    const notificationRepo = createNotificationRepository();
    const userRepo = createUserRepository();
    
    const user = (request as any).user;
    const bookingData = (request as any).validatedBody as z.infer<typeof createBookingSchema>;

    try {
      // Validate device model exists
      const deviceModel = await deviceRepo.findModelWithBrandAndCategory(bookingData.deviceModelId);
      if (!deviceModel) {
        return ApiMiddleware.createErrorResponse('Device model not found', 404);
      }

      // Calculate pricing
      const priceCalculation = await pricingRepo.calculatePrice(
        bookingData.deviceModelId,
        bookingData.repairType,
        {
          urgencyLevel: bookingData.urgencyLevel || 'STANDARD',
        }
      );

      // Determine customer (either authenticated user or create new customer)
      let customerId = user.id;
      
      if (user.role !== 'CUSTOMER') {
        // Admin/technician creating booking for customer
        // Check if customer exists by email
        let customer = await userRepo.findByEmail(bookingData.customerInfo.email);
        
        if (!customer) {
          // Create new customer
          const [firstName, ...lastNameParts] = bookingData.customerInfo.name.split(' ');
          const lastName = lastNameParts.join(' ') || firstName;
          
          customer = await userRepo.createUser({
            email: bookingData.customerInfo.email,
            firstName,
            lastName,
            phone: bookingData.customerInfo.phone,
            role: 'CUSTOMER',
          });
        }
        
        customerId = customer.id;
      }

      // Create booking
      const createBookingPayload = {
        customerId,
        deviceModelId: bookingData.deviceModelId,
        repairType: bookingData.repairType,
        problemDescription: bookingData.problemDescription,
        urgencyLevel: bookingData.urgencyLevel || UrgencyLevel.STANDARD,
        basePrice: priceCalculation.basePrice,
        finalPrice: priceCalculation.finalPrice,
        customerInfo: bookingData.customerInfo,
        deviceCondition: bookingData.deviceCondition,
        photoUrls: bookingData.photoUrls || [],
        preferredDate: bookingData.preferredDate ? new Date(bookingData.preferredDate) : undefined,
        customerNotes: bookingData.customerNotes,
      };

      const booking = await bookingRepo.createBooking(createBookingPayload);

      // Send confirmation notification
      await notificationRepo.createNotification({
        userId: customerId,
        bookingId: booking.id,
        type: NotificationType.BOOKING_CONFIRMATION,
        channel: NotificationChannel.EMAIL,
        title: 'Booking Confirmation',
        message: `Your repair booking for ${deviceModel.brand.name} ${deviceModel.name} has been confirmed. Booking ID: ${booking.id}`,
        data: {
          bookingId: booking.id,
          deviceName: `${deviceModel.brand.name} ${deviceModel.name}`,
          repairType: bookingData.repairType,
          finalPrice: priceCalculation.finalPrice,
        },
      });

      // Send notification to CRM
      try {
        // Prepare customer data for CRM
        const customerForCRM = await userRepo.findById(customerId);
        
        // Prepare booking data for CRM
        const bookingForCRM = {
          id: booking.id,
          bookingNumber: booking.id, // Use booking ID as booking number for now
          deviceType: `${deviceModel.brand.name} ${deviceModel.name}`,
          deviceModel: deviceModel.name,
          issueDescription: bookingData.problemDescription,
          serviceType: bookingData.repairType,
          urgency: bookingData.urgencyLevel || 'STANDARD',
          language: 'en',
          serviceLocation: bookingData.customerInfo.address,
          additionalNotes: bookingData.customerNotes,
          estimatedPrice: priceCalculation.finalPrice,
          photos: bookingData.photoUrls || [],
          createdAt: new Date().toISOString(),
        };

        // Import and use CRM webhook service
        const crmWebhookService = (await import('@/lib/services/crmWebhookService')).default;
        await crmWebhookService.notifyBookingCreated(bookingForCRM, customerForCRM);
        
        console.log('CRM webhook notification sent for booking:', booking.id);
      } catch (webhookError) {
        console.error('Failed to send CRM webhook notification for booking:', {
          error: webhookError.message,
          bookingId: booking.id
        });
        // Don't fail the booking creation if webhook fails
      }

      // Fetch complete booking data for response
      const completeBooking = await bookingRepo.findBookingWithDetails(booking.id);

      return ApiMiddleware.createResponse(
        {
          booking: completeBooking,
          pricing: priceCalculation,
        },
        'Booking created successfully',
        201
      );
    } catch (error) {
      return ApiMiddleware.handleError(error);
    }
  },
  {
    requireAuth: true,
    validateBody: createBookingSchema,
    rateLimit: { windowMs: 60000, maxRequests: 10 },
  }
);