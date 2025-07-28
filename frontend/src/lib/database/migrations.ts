// Database Migration Helper
// Utilities for managing database schema changes and data migrations

import { PrismaClient } from '@/generated/prisma';
import { db } from './client';

export class MigrationHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = db;
  }

  // Check if database is accessible
  async checkConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Get current database version/state
  async getDatabaseInfo(): Promise<{
    version: string;
    tableCount: number;
    recordCounts: Record<string, number>;
  }> {
    try {
      const versionResult = await this.prisma.$queryRaw<[{ version: string }]>`SELECT version();`;
      const version = versionResult[0]?.version || 'Unknown';

      // Get table information
      const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      const tableCount = tables.length;
      const recordCounts: Record<string, number> = {};

      // Get record counts for each table
      for (const table of tables) {
        try {
          const countResult = await this.prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${table.table_name}";`
          ) as [{ count: bigint }];
          recordCounts[table.table_name] = Number(countResult[0].count);
        } catch (error) {
          recordCounts[table.table_name] = -1; // Error accessing table
        }
      }

      return { version, tableCount, recordCounts };
    } catch (error) {
      throw new Error(`Failed to get database info: ${error}`);
    }
  }

  // Create database schema manually (for when migrations can't run)
  async createSchemaManually(): Promise<void> {
    console.log('🔨 Creating database schema manually...');

    const schemas = [
      // Users table
      `CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "username" TEXT,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "phone" TEXT,
        "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );`,

      // User sessions table
      `CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
      );`,

      // Device categories table
      `CREATE TABLE IF NOT EXISTS "device_categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "iconName" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
      );`,

      // Device brands table
      `CREATE TABLE IF NOT EXISTS "device_brands" (
        "id" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "logoUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "device_brands_pkey" PRIMARY KEY ("id")
      );`,

      // Device models table
      `CREATE TABLE IF NOT EXISTS "device_models" (
        "id" TEXT NOT NULL,
        "brandId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "year" INTEGER NOT NULL,
        "screenSize" DOUBLE PRECISION,
        "specs" JSONB,
        "imageUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "device_models_pkey" PRIMARY KEY ("id")
      );`,

      // Pricing rules table
      `CREATE TABLE IF NOT EXISTS "pricing_rules" (
        "id" TEXT NOT NULL,
        "deviceModelId" TEXT,
        "repairType" TEXT NOT NULL,
        "basePrice" DECIMAL(10,2) NOT NULL,
        "urgencyMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
        "complexityMultiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
        "marketDemand" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "seasonalFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "validUntil" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
      );`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS "bookings" (
        "id" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "deviceModelId" TEXT NOT NULL,
        "repairType" TEXT NOT NULL,
        "problemDescription" TEXT NOT NULL,
        "urgencyLevel" TEXT NOT NULL DEFAULT 'STANDARD',
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "basePrice" DECIMAL(10,2) NOT NULL,
        "finalPrice" DECIMAL(10,2) NOT NULL,
        "priceCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "preferredDate" TIMESTAMP(3),
        "scheduledDate" TIMESTAMP(3),
        "estimatedCompletion" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "customerInfo" JSONB NOT NULL,
        "deviceCondition" JSONB,
        "photoUrls" TEXT[],
        "assignedTechnicianId" TEXT,
        "internalNotes" TEXT,
        "customerNotes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
      );`,

      // Booking status history table
      `CREATE TABLE IF NOT EXISTS "booking_status_history" (
        "id" TEXT NOT NULL,
        "bookingId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "notes" TEXT,
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
      );`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "bookingId" TEXT,
        "type" TEXT NOT NULL,
        "channel" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "sentAt" TIMESTAMP(3),
        "scheduledFor" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "maxRetries" INTEGER NOT NULL DEFAULT 3,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      );`,

      // WebSocket sessions table
      `CREATE TABLE IF NOT EXISTS "websocket_sessions" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "sessionId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastPingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "websocket_sessions_pkey" PRIMARY KEY ("id")
      );`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "resource" TEXT NOT NULL,
        "resourceId" TEXT,
        "details" JSONB,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
      );`,
    ];

    // Create unique constraints and indexes
    const constraints = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_token_key" ON "user_sessions"("token");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "device_categories_name_key" ON "device_categories"("name");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "device_categories_slug_key" ON "device_categories"("slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "device_brands_categoryId_slug_key" ON "device_brands"("categoryId", "slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "device_models_brandId_slug_key" ON "device_models"("brandId", "slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "websocket_sessions_sessionId_key" ON "websocket_sessions"("sessionId");`,
      
      // Foreign key constraints
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "device_brands" ADD CONSTRAINT "device_brands_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "device_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "device_models" ADD CONSTRAINT "device_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "device_brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "device_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "bookings" ADD CONSTRAINT "bookings_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "device_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
      `ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`,
      `ALTER TABLE "notifications" ADD CONSTRAINT "notifications_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;`,
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;`,
    ];

    try {
      // Create tables
      for (const schema of schemas) {
        await this.prisma.$executeRawUnsafe(schema);
      }

      // Create constraints (with error handling)
      for (const constraint of constraints) {
        try {
          await this.prisma.$executeRawUnsafe(constraint);
        } catch (error) {
          // Ignore constraint errors if they already exist
          console.log(`Constraint already exists or failed: ${constraint}`);
        }
      }

      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.error('❌ Failed to create database schema:', error);
      throw error;
    }
  }

  // Run seeding
  async runSeeding(): Promise<void> {
    try {
      // Import and run the seed script
      const { main: seedMain } = await import('../../prisma/seed');
      await seedMain();
      console.log('✅ Database seeding completed');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  // Reset database (development only)
  async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database reset is not allowed in production');
    }

    console.log('🔄 Resetting database...');
    
    try {
      // Drop all tables
      const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
      `;

      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE;`);
      }

      // Recreate schema
      await this.createSchemaManually();
      
      // Run seeding
      await this.runSeeding();
      
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }

  // Health check with detailed information
  async healthCheck(): Promise<{
    connected: boolean;
    info?: any;
    error?: string;
  }> {
    try {
      const connected = await this.checkConnection();
      if (!connected) {
        return { connected: false, error: 'Cannot connect to database' };
      }

      const info = await this.getDatabaseInfo();
      return { connected: true, info };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}