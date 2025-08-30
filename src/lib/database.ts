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
    // Optimize for serverless environments
    transactionOptions: {
      maxWait: 10000, // default: 2000
      timeout: 30000, // default: 5000
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;