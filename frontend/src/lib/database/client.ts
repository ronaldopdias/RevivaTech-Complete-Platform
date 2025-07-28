// Database Client Configuration
// Singleton Prisma client with optimized connection pooling

import { PrismaClient } from '@/generated/prisma';

declare global {
  var __prismaClient: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaClient = new PrismaClient({
    log: ['error'],
    errorFormat: 'pretty',
  });
} else {
  if (!global.__prismaClient) {
    global.__prismaClient = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }
  prismaClient = global.__prismaClient;
}

export const db = prismaClient;

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
}

// Transaction utility
export async function transaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await db.$transaction(callback);
}