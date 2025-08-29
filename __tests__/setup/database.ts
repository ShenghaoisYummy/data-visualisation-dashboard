import { PrismaClient } from '@/generated/prisma';
import { AuthService } from '@/lib/auth';

// Create a test database client
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL || 'postgresql://postgres:password@localhost:5433/data_viz_dashboard_test'
    }
  }
});

/**
 * Clean up all database tables before each test
 */
export const cleanDatabase = async () => {
  // Delete in reverse dependency order to avoid foreign key constraints
  await testDb.registrationAudit.deleteMany();
  await testDb.importBatch.deleteMany();
  await testDb.dailyData.deleteMany();
  await testDb.product.deleteMany();
  await testDb.user.deleteMany();
  await testDb.invitationCode.deleteMany();
};

/**
 * Close database connection after tests
 */
export const closeDatabase = async () => {
  await testDb.$disconnect();
};

/**
 * Set up test invitation codes
 */
export const setupTestInvitationCodes = async () => {
  const codes = [
    {
      code: 'STORE01_2024',
      department: 'Store 01',
      maxUses: 10,
      currentUses: 3,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      description: 'Active code for Store 01',
      createdBy: 'admin@grocery.com'
    },
    {
      code: 'MANAGER_2024',
      department: 'Management',
      maxUses: 5,
      currentUses: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      description: 'Management team code',
      createdBy: 'admin@grocery.com'
    },
    {
      code: 'EXPIRED_CODE',
      department: 'Test',
      maxUses: 10,
      currentUses: 2,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      isActive: true,
      description: 'Expired test code',
      createdBy: 'admin@grocery.com'
    },
    {
      code: 'EXHAUSTED_CODE',
      department: 'Test',
      maxUses: 5,
      currentUses: 5, // Fully used
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      description: 'Exhausted test code',
      createdBy: 'admin@grocery.com'
    },
    {
      code: 'DEACTIVATED_CODE',
      department: 'Test',
      maxUses: 10,
      currentUses: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: false, // Manually deactivated
      description: 'Deactivated test code',
      createdBy: 'admin@grocery.com'
    }
  ];

  return await testDb.invitationCode.createMany({
    data: codes
  });
};

/**
 * Set up test users with different statuses
 */
export const setupTestUsers = async () => {
  const users = [
    {
      username: 'store01_manager',
      email: 'manager@grocery.com',
      password: await AuthService.hashPassword('SecurePass123'),
      status: 'ACTIVE' as const,
      invitationCodeUsed: 'STORE01_2024'
    },
    {
      username: 'suspended_user',
      email: 'suspended@grocery.com',
      password: await AuthService.hashPassword('SecurePass456'),
      status: 'SUSPENDED' as const,
      invitationCodeUsed: 'MANAGER_2024'
    },
    {
      username: 'former_employee',
      email: 'former@grocery.com',
      password: await AuthService.hashPassword('OldPass123'),
      status: 'TERMINATED' as const,
      invitationCodeUsed: 'OLD_CODE_2023'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await testDb.user.create({
      data: userData
    });
    createdUsers.push(user);
  }

  return createdUsers;
};

/**
 * Test constraint violations
 */
export const testConstraintViolations = async () => {
  const violations = [];

  // Test negative opening inventory (should fail)
  try {
    await testDb.product.create({
      data: {
        productId: 'TEST001',
        productName: 'Test Product',
        openingInventory: -5,
        userId: 'test-user-id'
      }
    });
    violations.push('Negative opening inventory should have failed');
  } catch (error) {
    // Expected to fail
  }

  // Test empty product name (should fail)
  try {
    await testDb.product.create({
      data: {
        productId: 'TEST002',
        productName: '',
        openingInventory: 10,
        userId: 'test-user-id'
      }
    });
    violations.push('Empty product name should have failed');
  } catch (error) {
    // Expected to fail
  }

  return violations;
};

/**
 * Create sample product data for testing
 */
export const createSampleProducts = async (userId: string) => {
  const products = [
    {
      productId: '0000001',
      productName: 'Product A',
      openingInventory: 100,
      userId
    },
    {
      productId: '0000002', 
      productName: 'Product B',
      openingInventory: 50,
      userId
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await testDb.product.create({
      data: productData
    });
    createdProducts.push(product);
  }

  return createdProducts;
};

/**
 * Create sample daily data for testing
 */
export const createSampleDailyData = async (productId: string) => {
  const dailyData = [
    {
      productId,
      daySequence: 1,
      procurementQty: 50,
      procurementPrice: 10.5,
      salesQty: 30,
      salesPrice: 15.0,
      inventoryLevel: 120, // 100 + 50 - 30
      procurementAmount: 525.0, // 50 * 10.5
      salesAmount: 450.0 // 30 * 15.0
    },
    {
      productId,
      daySequence: 2,
      procurementQty: 25,
      procurementPrice: 11.0,
      salesQty: 40,
      salesPrice: 15.5,
      inventoryLevel: 105, // 120 + 25 - 40
      procurementAmount: 275.0, // 25 * 11.0
      salesAmount: 620.0 // 40 * 15.5
    },
    {
      productId,
      daySequence: 3,
      procurementQty: null, // Test null handling
      procurementPrice: null,
      salesQty: 20,
      salesPrice: 16.0,
      inventoryLevel: 85, // 105 + 0 - 20
      procurementAmount: null, // null because qty is null
      salesAmount: 320.0 // 20 * 16.0
    }
  ];

  const createdData = [];
  for (const data of dailyData) {
    const record = await testDb.dailyData.create({
      data
    });
    createdData.push(record);
  }

  return createdData;
};