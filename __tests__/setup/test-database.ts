import { PrismaClient } from '@/generated/prisma';
import { execSync } from 'child_process';
import path from 'path';

// Create a separate test database instance
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL?.replace(/\/[^\/]+$/, '/test_db')
    }
  }
});

export async function setupTestDatabase() {
  try {
    // Run database migrations for test database
    execSync('npx prisma db push --accept-data-loss', {
      cwd: path.resolve(process.cwd()),
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL?.replace(/\/[^\/]+$/, '/test_db'),
      },
      stdio: 'pipe'
    });
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

export async function cleanDatabase() {
  try {
    // Clean up in reverse order of dependencies
    await testDb.registrationAudit.deleteMany({});
    await testDb.dailyData.deleteMany({});
    await testDb.product.deleteMany({});
    await testDb.importBatch.deleteMany({});
    await testDb.user.deleteMany({});
    await testDb.invitationCode.deleteMany({});
    
    // Reset auto-increment counters if using a database that supports it
    if (process.env.DATABASE_URL?.includes('postgresql')) {
      // PostgreSQL sequence reset
      await testDb.$executeRaw`SELECT setval(pg_get_serial_sequence('InvitationCode', 'id'), 1, false);`;
      await testDb.$executeRaw`SELECT setval(pg_get_serial_sequence('User', 'id'), 1, false);`;
    }
  } catch (error) {
    console.warn('Warning: Database cleanup failed:', error);
  }
}

export async function closeDatabase() {
  await testDb.$disconnect();
}

export async function setupTestInvitationCodes() {
  const codes = [
    {
      code: 'STAFF_ACTIVE123',
      maxUses: 5,
      currentUses: 1,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      isActive: true,
      department: 'IT',
      createdBy: 'admin',
    },
    {
      code: 'STAFF_EXPIRED456',
      maxUses: 3,
      currentUses: 0,
      expiresAt: new Date(Date.now() - 86400000), // 24 hours ago (expired)
      isActive: true,
      department: 'HR',
      createdBy: 'admin',
    },
    {
      code: 'STAFF_EXHAUSTED789',
      maxUses: 2,
      currentUses: 2, // Fully used
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
      department: 'Sales',
      createdBy: 'admin',
    },
    {
      code: 'STAFF_INACTIVE000',
      maxUses: 10,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 86400000),
      isActive: false, // Deactivated
      department: 'Marketing',
      createdBy: 'admin',
    },
    {
      code: 'STAFF_AVAILABLE999',
      maxUses: 10,
      currentUses: 0,
      expiresAt: new Date(Date.now() + 86400000),
      isActive: true,
      department: 'Operations',
      createdBy: 'admin',
    },
  ];

  for (const codeData of codes) {
    await testDb.invitationCode.create({
      data: codeData,
    });
  }

  return codes;
}

export async function setupTestUsers() {
  const users = [
    {
      email: 'active@example.com',
      hashedPassword: '$2b$12$dummyhash1234567890123456789012345678901234567890', // bcrypt hash
      status: 'ACTIVE',
      invitationCodeId: null,
    },
    {
      email: 'suspended@example.com',
      hashedPassword: '$2b$12$dummyhash1234567890123456789012345678901234567890',
      status: 'SUSPENDED',
      invitationCodeId: null,
    },
    {
      email: 'terminated@example.com',
      hashedPassword: '$2b$12$dummyhash1234567890123456789012345678901234567890',
      status: 'TERMINATED',
      invitationCodeId: null,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await testDb.user.create({
      data: userData,
    });
    createdUsers.push(user);
  }

  return createdUsers;
}

export async function setupTestProducts(userId: string, batchId: string) {
  const products = [
    {
      name: 'Apple - Gala',
      userId,
      importBatchId: batchId,
    },
    {
      name: 'Banana - Cavendish', 
      userId,
      importBatchId: batchId,
    },
    {
      name: 'Orange - Valencia',
      userId,
      importBatchId: batchId,
    },
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await testDb.product.create({
      data: productData,
    });
    createdProducts.push(product);
  }

  return createdProducts;
}

export async function setupTestImportBatch(userId: string) {
  return await testDb.importBatch.create({
    data: {
      userId,
      filename: 'test-data.xlsx',
      status: 'COMPLETED',
      totalRows: 3,
      processedRows: 3,
      errorRows: 0,
      metadata: {
        fileSize: 1024,
        processingTime: 1500,
      },
    },
  });
}

export async function setupTestDailyData(productId: string) {
  const dailyData = [
    {
      productId,
      day: 1,
      date: new Date('2024-01-01'),
      openingInventory: 100,
      procurementQty: 50,
      procurementPrice: new Decimal(2.5),
      procurementAmount: new Decimal(125.0),
      salesQty: 30,
      salesPrice: new Decimal(3.5),
      salesAmount: new Decimal(105.0),
      inventory: 120,
    },
    {
      productId,
      day: 2,
      date: new Date('2024-01-02'),
      openingInventory: 120,
      procurementQty: 40,
      procurementPrice: new Decimal(2.6),
      procurementAmount: new Decimal(104.0),
      salesQty: 35,
      salesPrice: new Decimal(3.6),
      salesAmount: new Decimal(126.0),
      inventory: 125,
    },
    {
      productId,
      day: 3,
      date: new Date('2024-01-03'),
      openingInventory: 125,
      procurementQty: 30,
      procurementPrice: new Decimal(2.7),
      procurementAmount: new Decimal(81.0),
      salesQty: 45,
      salesPrice: new Decimal(3.7),
      salesAmount: new Decimal(166.5),
      inventory: 110,
    },
  ];

  const createdData = [];
  for (const data of dailyData) {
    const record = await testDb.dailyData.create({
      data,
    });
    createdData.push(record);
  }

  return createdData;
}

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

import { Decimal } from '@prisma/client/runtime/library';