import { PrismaClient } from '@/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize for serverless environments and large dataset processing
    transactionOptions: {
      maxWait: 15000, // Wait longer for transaction from pool during bulk operations
      timeout: 60000, // Allow longer transaction execution for large imports
      isolationLevel: 'ReadCommitted', // Use read committed for better concurrent performance
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;