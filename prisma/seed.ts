import { PrismaClient } from '../src/generated/prisma';
import { AuthService } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in correct order to avoid foreign key constraints)
  console.log('🧹 Cleaning existing data...');
  await prisma.registrationAudit.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.dailyData.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.invitationCode.deleteMany();

  // Create invitation codes
  console.log('📝 Creating invitation codes...');
  const invitationCodes = await prisma.invitationCode.createMany({
    data: [
      {
        code: 'ADMIN_BOOTSTRAP',
        department: 'Administration',
        maxUses: 5,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        description: 'Bootstrap admin account creation - valid for 1 year',
        createdBy: 'system@bootstrap'
      },
      {
        code: 'STORE01_2024',
        department: 'Store 01',
        maxUses: 10,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        description: 'Active code for Store 01 staff',
        createdBy: 'admin@grocery.com'
      },
      {
        code: 'MANAGER_2024',
        department: 'Management',
        maxUses: 5,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        description: 'Management team invitation code',
        createdBy: 'admin@grocery.com'
      },
      {
        code: 'WAREHOUSE_2024',
        department: 'Warehouse',
        maxUses: 15,
        currentUses: 0,
        isActive: true,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        description: 'Warehouse staff code for inventory management',
        createdBy: 'admin@grocery.com'
      },
      // Test codes for different scenarios
      {
        code: 'EXPIRED_TEST',
        department: 'Testing',
        maxUses: 10,
        currentUses: 2,
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        description: 'Expired test code for testing validation',
        createdBy: 'admin@grocery.com'
      },
      {
        code: 'EXHAUSTED_TEST',
        department: 'Testing',
        maxUses: 3,
        currentUses: 3, // Fully used
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Exhausted test code for testing limits',
        createdBy: 'admin@grocery.com'
      },
      {
        code: 'DEACTIVATED_TEST',
        department: 'Testing',
        maxUses: 10,
        currentUses: 1,
        isActive: false, // Manually deactivated
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Deactivated test code for testing admin controls',
        createdBy: 'admin@grocery.com'
      }
    ]
  });

  console.log(`✅ Created ${invitationCodes.count} invitation codes`);

  // Create users with different statuses
  console.log('👥 Creating user accounts...');
  
  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@grocery.com',
      password: await AuthService.hashPassword('AdminPass123'),
      status: 'ACTIVE',
      invitationCodeUsed: 'ADMIN_BOOTSTRAP'
    }
  });

  // Store manager
  const storeManager = await prisma.user.create({
    data: {
      username: 'store01_manager',
      email: 'manager@store01.grocery.com',
      password: await AuthService.hashPassword('StorePass123'),
      status: 'ACTIVE',
      invitationCodeUsed: 'STORE01_2024'
    }
  });

  // Warehouse supervisor
  const warehouseSupervisor = await prisma.user.create({
    data: {
      username: 'warehouse_supervisor',
      email: 'supervisor@warehouse.grocery.com',
      password: await AuthService.hashPassword('WarePass123'),
      status: 'ACTIVE',
      invitationCodeUsed: 'WAREHOUSE_2024'
    }
  });

  // Test users with different statuses
  const suspendedUser = await prisma.user.create({
    data: {
      username: 'suspended_staff',
      email: 'suspended@grocery.com',
      password: await AuthService.hashPassword('SuspendPass123'),
      status: 'SUSPENDED',
      invitationCodeUsed: 'MANAGER_2024'
    }
  });

  const terminatedUser = await prisma.user.create({
    data: {
      username: 'former_employee',
      email: 'former@grocery.com',
      password: await AuthService.hashPassword('FormerPass123'),
      status: 'TERMINATED',
      invitationCodeUsed: 'OLD_CODE_2023'
    }
  });

  console.log('✅ Created 5 user accounts');

  // Update invitation code usage counters
  await prisma.invitationCode.updateMany({
    where: { code: 'ADMIN_BOOTSTRAP' },
    data: { currentUses: 1 }
  });

  await prisma.invitationCode.updateMany({
    where: { code: 'STORE01_2024' },
    data: { currentUses: 1 }
  });

  await prisma.invitationCode.updateMany({
    where: { code: 'WAREHOUSE_2024' },
    data: { currentUses: 1 }
  });

  await prisma.invitationCode.updateMany({
    where: { code: 'MANAGER_2024' },
    data: { currentUses: 1 }
  });

  // Create registration audit records
  console.log('📋 Creating registration audit records...');
  const auditRecords = await prisma.registrationAudit.createMany({
    data: [
      {
        userId: adminUser.id,
        invitationCode: 'ADMIN_BOOTSTRAP',
        userEmail: adminUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seed Script'
      },
      {
        userId: storeManager.id,
        invitationCode: 'STORE01_2024',
        userEmail: storeManager.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seed Script'
      },
      {
        userId: warehouseSupervisor.id,
        invitationCode: 'WAREHOUSE_2024',
        userEmail: warehouseSupervisor.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seed Script'
      },
      {
        userId: suspendedUser.id,
        invitationCode: 'MANAGER_2024',
        userEmail: suspendedUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seed Script'
      },
      {
        userId: terminatedUser.id,
        invitationCode: 'OLD_CODE_2023',
        userEmail: terminatedUser.email,
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seed Script'
      }
    ]
  });

  console.log(`✅ Created ${auditRecords.count} audit records`);

  // Create sample products for testing
  console.log('📦 Creating sample products...');
  const sampleProducts = await prisma.product.createMany({
    data: [
      {
        productId: '0000001',
        productName: 'Organic Bananas - 1kg',
        openingInventory: 150,
        userId: storeManager.id
      },
      {
        productId: '0000002',
        productName: 'Fresh Milk - 2L',
        openingInventory: 80,
        userId: storeManager.id
      },
      {
        productId: '0000003',
        productName: 'White Bread - Sliced',
        openingInventory: 120,
        userId: storeManager.id
      },
      {
        productId: '0000004',
        productName: 'Premium Rice - 5kg',
        openingInventory: 45,
        userId: warehouseSupervisor.id
      },
      {
        productId: '0000005',
        productName: 'Olive Oil - Extra Virgin 500ml',
        openingInventory: 60,
        userId: warehouseSupervisor.id
      }
    ]
  });

  console.log(`✅ Created ${sampleProducts.count} sample products`);

  // Get created products for daily data
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { userId: storeManager.id },
        { userId: warehouseSupervisor.id }
      ]
    }
  });

  // Create sample daily data for the first 3 products
  console.log('📊 Creating sample daily data...');
  let dailyDataCount = 0;

  for (const product of products.slice(0, 3)) {
    // Day 1 data
    await prisma.dailyData.create({
      data: {
        productId: product.id,
        daySequence: 1,
        procurementQty: 30,
        procurementPrice: 2.50,
        procurementAmount: 75.00,
        salesQty: 45,
        salesPrice: 3.99,
        salesAmount: 179.55,
        inventoryLevel: product.openingInventory + 30 - 45,
        sourceRow: 2
      }
    });

    // Day 2 data
    await prisma.dailyData.create({
      data: {
        productId: product.id,
        daySequence: 2,
        procurementQty: 25,
        procurementPrice: 2.45,
        procurementAmount: 61.25,
        salesQty: 38,
        salesPrice: 4.25,
        salesAmount: 161.50,
        inventoryLevel: product.openingInventory + 30 - 45 + 25 - 38,
        sourceRow: 2
      }
    });

    // Day 3 data (with some null values for testing)
    await prisma.dailyData.create({
      data: {
        productId: product.id,
        daySequence: 3,
        procurementQty: product.productName.includes('Milk') ? null : 20, // Milk has no procurement on day 3
        procurementPrice: product.productName.includes('Milk') ? null : 2.60,
        procurementAmount: product.productName.includes('Milk') ? null : 52.00,
        salesQty: 42,
        salesPrice: 4.50,
        salesAmount: 189.00,
        inventoryLevel: product.openingInventory + 30 - 45 + 25 - 38 + (product.productName.includes('Milk') ? 0 : 20) - 42,
        sourceRow: 2
      }
    });

    dailyDataCount += 3;
  }

  console.log(`✅ Created ${dailyDataCount} daily data records`);

  // Create a sample import batch
  console.log('📥 Creating sample import batch...');
  const importBatch = await prisma.importBatch.create({
    data: {
      userId: storeManager.id,
      fileName: 'sample_inventory_data.xlsx',
      fileSize: BigInt(256000), // 256KB
      totalRows: 3,
      validRows: 3,
      skippedRows: 0,
      status: 'COMPLETED',
      processingTimeMs: 1250,
      completedAt: new Date(),
      errorSummary: undefined
    }
  });

  console.log('✅ Created sample import batch');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary of created data:');
  console.log(`   • ${invitationCodes.count} invitation codes`);
  console.log('   • 5 user accounts (1 admin, 2 active staff, 1 suspended, 1 terminated)');
  console.log(`   • ${auditRecords.count} audit records`);
  console.log(`   • ${sampleProducts.count} sample products`);
  console.log(`   • ${dailyDataCount} daily data records`);
  console.log('   • 1 import batch record');

  console.log('\n🔐 Login Credentials:');
  console.log('   Admin Account:');
  console.log('   • Username: admin');
  console.log('   • Email: admin@grocery.com');
  console.log('   • Password: AdminPass123');
  console.log('');
  console.log('   Store Manager:');
  console.log('   • Username: store01_manager');
  console.log('   • Email: manager@store01.grocery.com');
  console.log('   • Password: StorePass123');
  console.log('');
  console.log('   Warehouse Supervisor:');
  console.log('   • Username: warehouse_supervisor');
  console.log('   • Email: supervisor@warehouse.grocery.com');
  console.log('   • Password: WarePass123');

  console.log('\n📨 Available Invitation Codes:');
  console.log('   • ADMIN_BOOTSTRAP (admin, 4 uses left, expires in 1 year)');
  console.log('   • STORE01_2024 (store staff, 9 uses left, expires in 30 days)');
  console.log('   • MANAGER_2024 (management, 4 uses left, expires in 60 days)');
  console.log('   • WAREHOUSE_2024 (warehouse, 14 uses left, expires in 45 days)');

  console.log('\n🌐 You can now:');
  console.log('   • Login at http://localhost:3000/login with any of the above accounts');
  console.log('   • Register new accounts at http://localhost:3000/register with invitation codes');
  console.log('   • Manage codes at http://localhost:3000/admin (admin account required)');
  console.log('   • Test Excel uploads with existing sample data visible in dashboard');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });