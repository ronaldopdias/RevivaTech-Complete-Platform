import { ApiClient } from './apiClient';
import {
  BookingService,
  BookingSubmission,
  BookingResponse,
  Booking,
  BookingStatus,
  TimeSlot,
  ApiResponse,
  ServiceHealthCheck,
} from './types';

export class BookingServiceImpl extends ApiClient implements BookingService {
  async submitBooking(bookingData: BookingSubmission): Promise<ApiResponse<BookingResponse>> {
    return this.post<BookingResponse>('/', bookingData, {
      timeout: 45000, // Extended timeout for booking submission
    });
  }

  async getBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.get<Booking>(`/${bookingId}`, {
      cache: true,
      cacheTtl: 300, // Cache for 5 minutes
    });
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<ApiResponse<Booking>> {
    return this.patch<Booking>(`/${bookingId}/status`, { status });
  }

  async getBookingHistory(customerId: string): Promise<ApiResponse<Booking[]>> {
    return this.get<Booking[]>(`/customer/${customerId}/history`, {
      cache: true,
      cacheTtl: 600, // Cache for 10 minutes
    });
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<boolean>> {
    const response = await this.delete<{ success: boolean }>(`/${bookingId}`);
    return {
      ...response,
      data: response.data.success,
    };
  }

  async getAvailableSlots(date: string, serviceType: string): Promise<ApiResponse<TimeSlot[]>> {
    return this.get<TimeSlot[]>('/availability', {
      params: { date, serviceType },
      cache: true,
      cacheTtl: 300, // Cache for 5 minutes
    });
  }

  // Additional booking-specific methods
  async getBookingEstimate(
    deviceModel: string,
    repairType: string,
    urgency: string
  ): Promise<ApiResponse<{ estimatedCost: number; estimatedDuration: string }>> {
    return this.get('/estimate', {
      params: { deviceModel, repairType, urgency },
      cache: true,
      cacheTtl: 1800, // Cache estimates for 30 minutes
    });
  }

  async uploadBookingAttachment(
    bookingId: string,
    file: File,
    description?: string
  ): Promise<ApiResponse<{ attachmentId: string; url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.post(`/${bookingId}/attachments`, formData, {
      timeout: 60000, // Extended timeout for file uploads
    });
  }

  async addBookingNote(
    bookingId: string,
    content: string,
    isPrivate: boolean = false
  ): Promise<ApiResponse<{ noteId: string }>> {
    return this.post(`/${bookingId}/notes`, {
      content,
      isPrivate,
    });
  }

  async getBookingNotes(bookingId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/${bookingId}/notes`, {
      cache: true,
      cacheTtl: 300,
    });
  }

  async approveBookingQuote(
    bookingId: string,
    approved: boolean,
    notes?: string
  ): Promise<ApiResponse<Booking>> {
    return this.post(`/${bookingId}/quote/approve`, {
      approved,
      notes,
    });
  }

  async getBookingTimeline(bookingId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/${bookingId}/timeline`, {
      cache: true,
      cacheTtl: 300,
    });
  }

  async searchBookings(
    query: string,
    filters?: {
      status?: BookingStatus[];
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      technicianId?: string;
    }
  ): Promise<ApiResponse<Booking[]>> {
    return this.get('/search', {
      params: { query, ...filters },
      cache: true,
      cacheTtl: 300,
    });
  }

  async getBookingStatistics(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    totalBookings: number;
    completedBookings: number;
    averageRepairTime: number;
    revenueGenerated: number;
    customerSatisfaction: number;
  }>> {
    return this.get('/stats/overview', {
      cache: true,
      cacheTtl: 300, // Cache for 5 minutes for real-time feel
    });
  }

  async rescheduleBooking(
    bookingId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    return this.patch(`/${bookingId}/reschedule`, {
      newDate,
      newTime,
      reason,
    });
  }

  async getBookingInvoice(bookingId: string): Promise<ApiResponse<{
    invoiceId: string;
    invoiceUrl: string;
    amount: number;
    currency: string;
    dueDate: string;
  }>> {
    return this.get(`/${bookingId}/invoice`, {
      cache: true,
      cacheTtl: 3600,
    });
  }

  async healthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic endpoint access (will return auth error but confirms service is up)
      await this.get('/', {
        timeout: 5000,
        retryAttempts: 0,
        cache: false,
      });

      return {
        service: 'booking-service',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      // If it's an auth error, service is still healthy
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return {
          service: 'booking-service',
          status: 'healthy',
          responseTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }
      return {
        service: 'booking-service',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Factory function to create booking service instance
export const createBookingService = (config: any): BookingService => {
  return new BookingServiceImpl(config);
};

export default BookingServiceImpl;