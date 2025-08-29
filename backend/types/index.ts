/**
 * RevivaTech Backend Types - Main Export File
 * 
 * This file exports all shared types, API contracts, and utilities
 * for use throughout the backend and potentially the frontend.
 */

// Export all shared types
export * from './shared';

// Export all API contracts
export * from './api-contracts';

// Re-export Prisma types for convenience
export type { Prisma } from '@prisma/client';

// Export commonly used Prisma client types
export type {
  User as PrismaUser,
  Booking as PrismaBooking,
  DeviceCategory as PrismaDeviceCategory,
  DeviceBrand as PrismaDeviceBrand,
  DeviceModel as PrismaDeviceModel,
  PricingRule as PrismaPricingRule,
  Account as PrismaAccount,
  Session as PrismaSession,
  VerificationToken as PrismaVerificationToken,
  email_templates as PrismaEmailTemplate,
} from '@prisma/client';