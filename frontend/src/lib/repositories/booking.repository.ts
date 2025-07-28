// Booking Repository
// Repository for booking management with status tracking and pricing

import { 
  Booking, 
  BookingStatus, 
  BookingStatusHistory,
  RepairType,
  UrgencyLevel 
} from '@/generated/prisma';
import { BaseRepository, PaginationOptions, PaginatedResult } from '../database/repository.base';

export interface CreateBookingData {
  customerId: string;
  deviceModelId: string;
  repairType: RepairType;
  problemDescription: string;
  urgencyLevel?: UrgencyLevel;
  basePrice: number;
  finalPrice: number;
  customerInfo: any;
  deviceCondition?: any;
  photoUrls?: string[];
  preferredDate?: Date;
  customerNotes?: string;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  scheduledDate?: Date;
  estimatedCompletion?: Date;
  assignedTechnicianId?: string;
  internalNotes?: string;
  customerNotes?: string;
}

export interface BookingSearchFilters {
  status?: BookingStatus;
  repairType?: RepairType;
  urgencyLevel?: UrgencyLevel;
  customerId?: string;
  assignedTechnicianId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
}

export class BookingRepository extends BaseRepository<Booking> {
  protected readonly modelName = 'booking';

  async createBooking(data: CreateBookingData): Promise<Booking> {
    return await this.transaction(async (tx) => {
      const booking = await tx.booking.create({
        data,
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Create initial status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          status: BookingStatus.PENDING,
          notes: 'Booking created',
          createdBy: data.customerId,
        },
      });

      return booking;
    });
  }

  async updateBookingStatus(
    id: string, 
    status: BookingStatus, 
    notes?: string, 
    updatedBy?: string
  ): Promise<Booking> {
    return await this.transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          deviceModel: {
            include: {
              brand: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // Add status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status,
          notes,
          createdBy: updatedBy || booking.customerId,
        },
      });

      return booking;
    });
  }

  async findBookingWithDetails(id: string): Promise<Booking | null> {
    return await this.findById(id, {
      customer: true,
      deviceModel: {
        include: {
          brand: {
            include: {
              category: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      notifications: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    });
  }

  async findBookingsByCustomer(
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<Booking[] | PaginatedResult<Booking>> {
    const options = {
      where: { customerId },
      include: {
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }],
    };

    if (pagination) {
      return await this.findPaginated(pagination, options);
    }

    return await this.findMany(options);
  }

  async findBookingsByStatus(
    status: BookingStatus,
    pagination?: PaginationOptions
  ): Promise<Booking[] | PaginatedResult<Booking>> {
    const options = {
      where: { status },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { field: 'urgencyLevel', direction: 'desc' as const },
        { field: 'createdAt', direction: 'asc' as const },
      ],
    };

    if (pagination) {
      return await this.findPaginated(pagination, options);
    }

    return await this.findMany(options);
  }

  async findBookingsByTechnician(
    technicianId: string,
    pagination?: PaginationOptions
  ): Promise<Booking[] | PaginatedResult<Booking>> {
    const options = {
      where: { assignedTechnicianId: technicianId },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { field: 'urgencyLevel', direction: 'desc' as const },
        { field: 'scheduledDate', direction: 'asc' as const },
      ],
    };

    if (pagination) {
      return await this.findPaginated(pagination, options);
    }

    return await this.findMany(options);
  }

  async searchBookings(
    query: string,
    filters?: BookingSearchFilters,
    pagination?: PaginationOptions
  ): Promise<Booking[] | PaginatedResult<Booking>> {
    const whereConditions: any = {};

    if (filters?.status) whereConditions.status = filters.status;
    if (filters?.repairType) whereConditions.repairType = filters.repairType;
    if (filters?.urgencyLevel) whereConditions.urgencyLevel = filters.urgencyLevel;
    if (filters?.customerId) whereConditions.customerId = filters.customerId;
    if (filters?.assignedTechnicianId) whereConditions.assignedTechnicianId = filters.assignedTechnicianId;

    if (filters?.dateFrom || filters?.dateTo) {
      whereConditions.createdAt = {};
      if (filters.dateFrom) whereConditions.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) whereConditions.createdAt.lte = filters.dateTo;
    }

    if (filters?.priceMin || filters?.priceMax) {
      whereConditions.finalPrice = {};
      if (filters.priceMin) whereConditions.finalPrice.gte = filters.priceMin;
      if (filters.priceMax) whereConditions.finalPrice.lte = filters.priceMax;
    }

    const searchOptions = {
      where: whereConditions,
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }],
      pagination,
    };

    return await this.search(
      query,
      ['problemDescription', 'customerNotes', 'internalNotes'],
      searchOptions
    );
  }

  async getBookingStats(): Promise<{
    total: number;
    byStatus: Record<BookingStatus, number>;
    byRepairType: Record<RepairType, number>;
    byUrgencyLevel: Record<UrgencyLevel, number>;
    averagePrice: number;
    totalRevenue: number;
  }> {
    const bookings = await this.findMany({});
    
    const total = bookings.length;
    const byStatus: Record<BookingStatus, number> = {} as any;
    const byRepairType: Record<RepairType, number> = {} as any;
    const byUrgencyLevel: Record<UrgencyLevel, number> = {} as any;
    
    let totalRevenue = 0;

    // Initialize counters
    Object.values(BookingStatus).forEach(status => byStatus[status as BookingStatus] = 0);
    Object.values(RepairType).forEach(type => byRepairType[type as RepairType] = 0);
    Object.values(UrgencyLevel).forEach(level => byUrgencyLevel[level as UrgencyLevel] = 0);

    bookings.forEach(booking => {
      byStatus[booking.status]++;
      byRepairType[booking.repairType]++;
      byUrgencyLevel[booking.urgencyLevel]++;
      totalRevenue += Number(booking.finalPrice);
    });

    const averagePrice = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      byStatus,
      byRepairType,
      byUrgencyLevel,
      averagePrice,
      totalRevenue,
    };
  }

  async getBookingsByDateRange(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; count: number; revenue: number }>> {
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    return await this.rawQuery(`
      SELECT 
        TO_CHAR(created_at, ?) as date,
        COUNT(*)::int as count,
        SUM(final_price)::float as revenue
      FROM bookings
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY TO_CHAR(created_at, ?)
      ORDER BY date
    `, dateFormat, startDate, endDate, dateFormat);
  }

  async findOverdueBookings(): Promise<Booking[]> {
    const now = new Date();
    
    return await this.findMany({
      where: {
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
        estimatedCompletion: {
          lt: now,
        },
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'estimatedCompletion', direction: 'asc' }],
    });
  }

  async findUpcomingBookings(days: number = 7): Promise<Booking[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.findMany({
      where: {
        scheduledDate: {
          gte: now,
          lte: futureDate,
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS],
        },
      },
      include: {
        customer: true,
        deviceModel: {
          include: {
            brand: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: [{ field: 'scheduledDate', direction: 'asc' }],
    });
  }

  async assignTechnician(bookingId: string, technicianId: string): Promise<Booking> {
    return await this.updateBookingStatus(
      bookingId,
      BookingStatus.CONFIRMED,
      `Assigned to technician`,
      technicianId
    );
  }

  async completeBooking(bookingId: string, completedBy: string): Promise<Booking> {
    return await this.transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: BookingStatus.COMPLETED,
          notes: 'Repair completed',
          createdBy: completedBy,
        },
      });

      return booking;
    });
  }

  async cancelBooking(bookingId: string, reason: string, cancelledBy: string): Promise<Booking> {
    return await this.updateBookingStatus(
      bookingId,
      BookingStatus.CANCELLED,
      `Cancelled: ${reason}`,
      cancelledBy
    );
  }
}

export class BookingStatusHistoryRepository extends BaseRepository<BookingStatusHistory> {
  protected readonly modelName = 'bookingStatusHistory';

  async findHistoryByBooking(bookingId: string): Promise<BookingStatusHistory[]> {
    return await this.findMany({
      where: { bookingId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  async getLatestStatusChange(bookingId: string): Promise<BookingStatusHistory | null> {
    return await this.findFirst(
      { bookingId },
      {
        orderBy: {
          createdAt: 'desc',
        },
      }
    );
  }
}