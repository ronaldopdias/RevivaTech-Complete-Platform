/**
 * Better Auth Configuration for CLI Schema Generation
 * This file is used by the Better Auth CLI to generate the correct Prisma schema
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  secret: process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || "demo-secret-key",
  
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3011",
  
  trustHost: true,
  
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
      },
      firstName: {
        type: 'string',
        required: false,
      },
      lastName: {
        type: 'string',
        required: false,
      },
      phone: {
        type: 'string',
        required: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      isVerified: {
        type: 'boolean',
        required: false,
        defaultValue: false,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
      }
    }
  }
});