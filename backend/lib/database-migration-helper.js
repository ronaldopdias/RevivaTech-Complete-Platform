/**
 * Database Migration Helper for Prisma Migration
 * 
 * This utility provides helper functions to migrate from raw SQL pool.query()
 * calls to Prisma Client operations while maintaining the same functionality.
 */

const { prisma } = require('./prisma');

/**
 * Migration helper class to provide common database operation patterns
 */
class DatabaseMigrationHelper {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Find user by email (commonly used in auth)
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmail(email) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { 
          email: email.toLowerCase() 
        },
        include: {
          accounts: true // Include account data if needed
        }
      });
      return user;
    } catch (error) {
      console.error('[DB Migration] findUserByEmail error:', error);
      throw error;
    }
  }

  /**
   * Find user by ID (commonly used in auth)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserById(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: true
        }
      });
      return user;
    } catch (error) {
      console.error('[DB Migration] findUserById error:', error);
      throw error;
    }
  }

  /**
   * Create user with account (replaces complex auth registration SQL)
   * @param {Object} userData - User data
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created user
   */
  async createUserWithAccount(userData, accountData) {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            id: userData.id,
            email: userData.email.toLowerCase(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            role: userData.role || 'CUSTOMER',
            emailVerified: userData.emailVerified || null,
            isActive: userData.isActive !== false,
            isVerified: userData.isVerified !== false
          }
        });

        // Create associated account if provided
        if (accountData) {
          await tx.account.create({
            data: {
              userId: newUser.id,
              providerId: accountData.providerId,
              accountId: accountData.accountId,
              accessToken: accountData.accessToken,
              refreshToken: accountData.refreshToken
            }
          });
        }

        return newUser;
      });

      return user;
    } catch (error) {
      console.error('[DB Migration] createUserWithAccount error:', error);
      throw error;
    }
  }

  /**
   * Update user session (commonly used in auth)
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Updated session
   */
  async updateUserSession(userId, sessionData) {
    try {
      const session = await this.prisma.session.upsert({
        where: {
          token: sessionData.token
        },
        update: {
          expiresAt: sessionData.expiresAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent
        },
        create: {
          id: sessionData.id,
          userId: userId,
          token: sessionData.token,
          expiresAt: sessionData.expiresAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent
        }
      });

      return session;
    } catch (error) {
      console.error('[DB Migration] updateUserSession error:', error);
      throw error;
    }
  }

  /**
   * Get bookings with pagination (commonly used in many routes)
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Bookings with count
   */
  async getBookingsWithPagination(filters = {}, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {};
    
    // Build dynamic where clause
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.deviceModelId) where.deviceModelId = filters.deviceModelId;
    if (filters.dateFrom) {
      where.createdAt = { gte: new Date(filters.dateFrom) };
    }
    if (filters.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
    }

    try {
      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
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
            deviceModel: {
              include: {
                brand: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.booking.count({ where })
      ]);

      return {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[DB Migration] getBookingsWithPagination error:', error);
      throw error;
    }
  }

  /**
   * Execute raw query with Prisma (for complex queries that need gradual migration)
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Query results
   */
  async executeRawQuery(query, params = []) {
    try {
      // Replace $1, $2, etc. with Prisma's ? placeholders if needed
      const prismaQuery = query.replace(/\$(\d+)/g, '?');
      const result = await this.prisma.$queryRawUnsafe(prismaQuery, ...params);
      return { rows: result }; // Maintain compatibility with pool.query format
    } catch (error) {
      console.error('[DB Migration] executeRawQuery error:', error);
      throw error;
    }
  }

  /**
   * Test database connectivity
   */
  async testConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1 as status`;
      return { rows: [{ status: 1 }] };
    } catch (error) {
      console.error('[DB Migration] testConnection error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const dbHelper = new DatabaseMigrationHelper();

module.exports = {
  DatabaseMigrationHelper,
  dbHelper,
  prisma
};