// User Repository
// Specialized repository for user management with authentication support

import { User, UserRole, UserSession } from '@/generated/prisma';
import { BaseRepository, FilterOptions, PaginationOptions, PaginatedResult } from '../database/repository.base';

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  username?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface UserSearchFilters {
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  email?: string;
  name?: string;
}

export class UserRepository extends BaseRepository<User> {
  protected readonly modelName = 'user';

  // User-specific create methods
  async createUser(data: CreateUserData): Promise<User> {
    return await this.create({
      ...data,
      role: data.role || UserRole.CUSTOMER,
    });
  }

  // Authentication-related methods
  async findByEmail(email: string): Promise<User | null> {
    return await this.findFirst({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.findFirst({ username });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return await this.findFirst({
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    });
  }

  // Session management
  async createSession(userId: string, token: string, expiresAt: Date): Promise<UserSession> {
    return await this.db.userSession.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findValidSession(token: string): Promise<UserSession | null> {
    return await this.db.userSession.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async invalidateSession(token: string): Promise<void> {
    await this.db.userSession.delete({
      where: { token },
    });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.db.userSession.deleteMany({
      where: { userId },
    });
  }

  // User verification
  async verifyUser(id: string): Promise<User> {
    return await this.update(id, { 
      isVerified: true,
      lastLoginAt: new Date(),
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return await this.update(id, {
      lastLoginAt: new Date(),
    });
  }

  // Role management
  async updateUserRole(id: string, role: UserRole): Promise<User> {
    return await this.update(id, { role });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return await this.findMany({
      where: { role, isActive: true },
      orderBy: [{ field: 'firstName', direction: 'asc' }],
    });
  }

  // Advanced user queries
  async findActiveUsers(pagination?: PaginationOptions): Promise<User[] | PaginatedResult<User>> {
    const options = {
      where: { isActive: true },
      orderBy: [{ field: 'createdAt', direction: 'desc' as const }],
    };

    if (pagination) {
      return await this.findPaginated(pagination, options);
    }

    return await this.findMany(options);
  }

  async findUnverifiedUsers(olderThanDays: number = 7): Promise<User[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await this.findMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  // Search with filters
  async searchUsers(
    query: string,
    filters?: UserSearchFilters,
    pagination?: PaginationOptions
  ): Promise<User[] | PaginatedResult<User>> {
    const whereConditions: any = {};

    if (filters?.role) whereConditions.role = filters.role;
    if (filters?.isActive !== undefined) whereConditions.isActive = filters.isActive;
    if (filters?.isVerified !== undefined) whereConditions.isVerified = filters.isVerified;

    const searchOptions = {
      where: whereConditions,
      orderBy: [{ field: 'firstName', direction: 'asc' as const }],
      pagination,
    };

    return await this.search(
      query,
      ['firstName', 'lastName', 'email', 'username'],
      searchOptions
    );
  }

  // User statistics
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, verified, ...roleCounts] = await Promise.all([
      this.count(),
      this.count({ isActive: true }),
      this.count({ isVerified: true }),
      ...Object.values(UserRole).map(role => 
        this.count({ role: role as UserRole })
      ),
    ]);

    const byRole = Object.values(UserRole).reduce(
      (acc, role, index) => {
        acc[role as UserRole] = roleCounts[index];
        return acc;
      },
      {} as Record<UserRole, number>
    );

    return { total, active, verified, byRole };
  }

  // User with relationships
  async findUserWithBookings(id: string): Promise<User | null> {
    return await this.findById(id, {
      bookings: {
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
        orderBy: {
          createdAt: 'desc',
        },
      },
    });
  }

  async findUserWithNotifications(id: string, limit: number = 10): Promise<User | null> {
    return await this.findById(id, {
      notifications: {
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      },
    });
  }

  // Bulk operations
  async deactivateInactiveUsers(daysInactive: number = 365): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    return await this.updateMany(
      {
        lastLoginAt: {
          lt: cutoffDate,
        },
        isActive: true,
      },
      { isActive: false }
    );
  }

  async deleteUnverifiedUsers(olderThanDays: number = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await this.deleteMany({
      isVerified: false,
      createdAt: {
        lt: cutoffDate,
      },
    });
  }
}