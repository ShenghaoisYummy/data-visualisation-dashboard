import { testDb, cleanDatabase, closeDatabase, setupTestInvitationCodes, setupTestUsers } from '../../setup/database';
import { AuthService } from '@/lib/auth';
import { InvitationCodeService } from '@/lib/invitation-codes';
import { UserStatus } from '@/generated/prisma';

describe('Database Operations', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('User Operations', () => {
    it('should create user with invitation code tracking', async () => {
      await setupTestInvitationCodes();
      
      const userData = {
        username: 'test_user',
        email: 'test@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE,
        invitationCodeUsed: 'STORE01_2024'
      };

      const user = await testDb.user.create({
        data: userData
      });

      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.invitationCodeUsed).toBe('STORE01_2024');
      expect(user.registeredAt).toBeInstanceOf(Date);
    });

    it('should enforce unique username constraint', async () => {
      const userData1 = {
        username: 'duplicate_user',
        email: 'user1@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE
      };

      const userData2 = {
        username: 'duplicate_user', // Same username
        email: 'user2@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE
      };

      // First user should be created successfully
      const user1 = await testDb.user.create({ data: userData1 });
      expect(user1).toBeTruthy();

      // Second user with same username should fail
      await expect(testDb.user.create({ data: userData2 })).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData1 = {
        username: 'user1',
        email: 'duplicate@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE
      };

      const userData2 = {
        username: 'user2',
        email: 'duplicate@grocery.com', // Same email
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE
      };

      // First user should be created successfully
      const user1 = await testDb.user.create({ data: userData1 });
      expect(user1).toBeTruthy();

      // Second user with same email should fail
      await expect(testDb.user.create({ data: userData2 })).rejects.toThrow();
    });

    it('should handle user status transitions', async () => {
      const userData = {
        username: 'status_test_user',
        email: 'statustest@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE
      };

      const user = await testDb.user.create({ data: userData });
      expect(user.status).toBe(UserStatus.ACTIVE);

      // Update to SUSPENDED
      const updatedUser1 = await testDb.user.update({
        where: { id: user.id },
        data: { status: UserStatus.SUSPENDED }
      });
      expect(updatedUser1.status).toBe(UserStatus.SUSPENDED);

      // Update to TERMINATED
      const updatedUser2 = await testDb.user.update({
        where: { id: user.id },
        data: { status: UserStatus.TERMINATED }
      });
      expect(updatedUser2.status).toBe(UserStatus.TERMINATED);
    });
  });

  describe('Invitation Code Operations', () => {
    it('should create and manage invitation codes', async () => {
      const codeData = {
        code: 'TEST_CODE_2024',
        department: 'Test Department',
        maxUses: 5,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        description: 'Test invitation code',
        createdBy: 'admin@test.com'
      };

      const invitationCode = await testDb.invitationCode.create({
        data: codeData
      });

      expect(invitationCode).toBeTruthy();
      expect(invitationCode.code).toBe(codeData.code);
      expect(invitationCode.department).toBe(codeData.department);
      expect(invitationCode.maxUses).toBe(codeData.maxUses);
      expect(invitationCode.currentUses).toBe(0); // Default value
      expect(invitationCode.isActive).toBe(true); // Default value
      expect(invitationCode.createdBy).toBe(codeData.createdBy);
    });

    it('should enforce unique code constraint', async () => {
      const codeData1 = {
        code: 'DUPLICATE_CODE',
        maxUses: 5,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdBy: 'admin@test.com'
      };

      const codeData2 = {
        code: 'DUPLICATE_CODE', // Same code
        maxUses: 10,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createdBy: 'admin@test.com'
      };

      // First code should be created successfully
      const code1 = await testDb.invitationCode.create({ data: codeData1 });
      expect(code1).toBeTruthy();

      // Second code with same code should fail
      await expect(testDb.invitationCode.create({ data: codeData2 })).rejects.toThrow();
    });

    it('should track usage correctly', async () => {
      const invitationCode = await testDb.invitationCode.create({
        data: {
          code: 'USAGE_TEST_CODE',
          maxUses: 3,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: 'admin@test.com'
        }
      });

      // Increment usage
      const updatedCode1 = await testDb.invitationCode.update({
        where: { id: invitationCode.id },
        data: { currentUses: { increment: 1 } }
      });
      expect(updatedCode1.currentUses).toBe(1);

      // Increment again
      const updatedCode2 = await testDb.invitationCode.update({
        where: { id: invitationCode.id },
        data: { currentUses: { increment: 1 } }
      });
      expect(updatedCode2.currentUses).toBe(2);
    });

    it('should handle code deactivation', async () => {
      const invitationCode = await testDb.invitationCode.create({
        data: {
          code: 'DEACTIVATE_TEST_CODE',
          maxUses: 5,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: 'admin@test.com',
          isActive: true
        }
      });

      expect(invitationCode.isActive).toBe(true);

      // Deactivate code
      const deactivatedCode = await testDb.invitationCode.update({
        where: { id: invitationCode.id },
        data: { isActive: false }
      });

      expect(deactivatedCode.isActive).toBe(false);
    });
  });

  describe('Registration Audit Operations', () => {
    it('should create registration audit records', async () => {
      await setupTestInvitationCodes();
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const auditData = {
        userId: user!.id,
        invitationCode: 'STORE01_2024',
        userEmail: 'manager@grocery.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser'
      };

      const auditRecord = await testDb.registrationAudit.create({
        data: auditData
      });

      expect(auditRecord).toBeTruthy();
      expect(auditRecord.userId).toBe(user!.id);
      expect(auditRecord.invitationCode).toBe('STORE01_2024');
      expect(auditRecord.userEmail).toBe('manager@grocery.com');
      expect(auditRecord.ipAddress).toBe('192.168.1.100');
      expect(auditRecord.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(auditRecord.registeredAt).toBeInstanceOf(Date);
    });

    it('should link audit records to users', async () => {
      await setupTestInvitationCodes();
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      await testDb.registrationAudit.create({
        data: {
          userId: user!.id,
          invitationCode: 'STORE01_2024',
          userEmail: 'manager@grocery.com'
        }
      });

      // Query with relation
      const userWithAudit = await testDb.user.findFirst({
        where: { id: user!.id },
        include: { registrationAudit: true }
      });

      expect(userWithAudit?.registrationAudit).toHaveLength(1);
      expect(userWithAudit?.registrationAudit[0].invitationCode).toBe('STORE01_2024');
    });
  });

  describe('Product and Daily Data Operations', () => {
    it('should create products with user association', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const productData = {
        productId: '0000001',
        productName: 'Test Product',
        openingInventory: 100,
        userId: user!.id
      };

      const product = await testDb.product.create({
        data: productData
      });

      expect(product).toBeTruthy();
      expect(product.productId).toBe('0000001');
      expect(product.productName).toBe('Test Product');
      expect(product.openingInventory).toBe(100);
      expect(product.userId).toBe(user!.id);
    });

    it('should enforce unique product per user constraint', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const productData1 = {
        productId: '0000001',
        productName: 'Product 1',
        openingInventory: 100,
        userId: user!.id
      };

      const productData2 = {
        productId: '0000001', // Same productId
        productName: 'Product 2',
        openingInventory: 50,
        userId: user!.id // Same user
      };

      // First product should be created successfully
      const product1 = await testDb.product.create({ data: productData1 });
      expect(product1).toBeTruthy();

      // Second product with same productId and user should fail
      await expect(testDb.product.create({ data: productData2 })).rejects.toThrow();
    });

    it('should allow same productId for different users', async () => {
      await setupTestUsers();

      const user1 = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const user2 = await testDb.user.findFirst({
        where: { username: 'suspended_user' }
      });

      const productData1 = {
        productId: '0000001',
        productName: 'Product 1',
        openingInventory: 100,
        userId: user1!.id
      };

      const productData2 = {
        productId: '0000001', // Same productId
        productName: 'Product 2',
        openingInventory: 50,
        userId: user2!.id // Different user
      };

      // Both products should be created successfully
      const product1 = await testDb.product.create({ data: productData1 });
      const product2 = await testDb.product.create({ data: productData2 });

      expect(product1).toBeTruthy();
      expect(product2).toBeTruthy();
      expect(product1.userId).not.toBe(product2.userId);
    });

    it('should create daily data with proper relationships', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const product = await testDb.product.create({
        data: {
          productId: '0000001',
          productName: 'Test Product',
          openingInventory: 100,
          userId: user!.id
        }
      });

      const dailyDataRecord = {
        productId: product.id,
        daySequence: 1,
        procurementQty: 50,
        procurementPrice: 10.5,
        salesQty: 30,
        salesPrice: 15.0,
        inventoryLevel: 120, // 100 + 50 - 30
        procurementAmount: 525.0, // 50 * 10.5
        salesAmount: 450.0 // 30 * 15.0
      };

      const dailyData = await testDb.dailyData.create({
        data: dailyDataRecord
      });

      expect(dailyData).toBeTruthy();
      expect(dailyData.productId).toBe(product.id);
      expect(dailyData.daySequence).toBe(1);
      expect(dailyData.procurementQty).toBe(50);
      expect(Number(dailyData.procurementPrice)).toBe(10.5);
      expect(dailyData.salesQty).toBe(30);
      expect(Number(dailyData.salesPrice)).toBe(15.0);
      expect(dailyData.inventoryLevel).toBe(120);
      expect(Number(dailyData.procurementAmount)).toBe(525.0);
      expect(Number(dailyData.salesAmount)).toBe(450.0);
    });

    it('should handle null values in daily data', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const product = await testDb.product.create({
        data: {
          productId: '0000001',
          productName: 'Test Product',
          openingInventory: 100,
          userId: user!.id
        }
      });

      const dailyDataRecord = {
        productId: product.id,
        daySequence: 2,
        procurementQty: null, // Null procurement
        procurementPrice: null,
        salesQty: 20,
        salesPrice: 15.0,
        inventoryLevel: 80, // Assuming previous level was 100
        procurementAmount: null, // Null because qty is null
        salesAmount: 300.0 // 20 * 15.0
      };

      const dailyData = await testDb.dailyData.create({
        data: dailyDataRecord
      });

      expect(dailyData).toBeTruthy();
      expect(dailyData.procurementQty).toBeNull();
      expect(dailyData.procurementPrice).toBeNull();
      expect(dailyData.salesQty).toBe(20);
      expect(Number(dailyData.salesPrice)).toBe(15.0);
      expect(dailyData.procurementAmount).toBeNull();
      expect(Number(dailyData.salesAmount)).toBe(300.0);
    });

    it('should enforce unique daySequence per product constraint', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const product = await testDb.product.create({
        data: {
          productId: '0000001',
          productName: 'Test Product',
          openingInventory: 100,
          userId: user!.id
        }
      });

      const dailyData1 = {
        productId: product.id,
        daySequence: 1,
        salesQty: 20,
        salesPrice: 15.0,
        inventoryLevel: 80,
        salesAmount: 300.0
      };

      const dailyData2 = {
        productId: product.id,
        daySequence: 1, // Same daySequence
        salesQty: 25,
        salesPrice: 16.0,
        inventoryLevel: 75,
        salesAmount: 400.0
      };

      // First record should be created successfully
      const record1 = await testDb.dailyData.create({ data: dailyData1 });
      expect(record1).toBeTruthy();

      // Second record with same productId and daySequence should fail
      await expect(testDb.dailyData.create({ data: dailyData2 })).rejects.toThrow();
    });
  });

  describe('Import Batch Operations', () => {
    it('should create import batch records', async () => {
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      const importBatchData = {
        userId: user!.id,
        fileName: 'test_data.xlsx',
        fileSize: BigInt(15360),
        totalRows: 100,
        validRows: 95,
        skippedRows: 5,
        status: 'COMPLETED' as const,
        processingTimeMs: 2500
      };

      const importBatch = await testDb.importBatch.create({
        data: importBatchData
      });

      expect(importBatch).toBeTruthy();
      expect(importBatch.userId).toBe(user!.id);
      expect(importBatch.fileName).toBe('test_data.xlsx');
      expect(Number(importBatch.fileSize)).toBe(15360);
      expect(importBatch.totalRows).toBe(100);
      expect(importBatch.validRows).toBe(95);
      expect(importBatch.skippedRows).toBe(5);
      expect(importBatch.status).toBe('COMPLETED');
      expect(importBatch.processingTimeMs).toBe(2500);
    });
  });

  describe('Cascading Deletes', () => {
    it('should cascade delete user data when user is deleted', async () => {
      await setupTestInvitationCodes();
      await setupTestUsers();

      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });

      // Create related data
      const product = await testDb.product.create({
        data: {
          productId: '0000001',
          productName: 'Test Product',
          openingInventory: 100,
          userId: user!.id
        }
      });

      await testDb.dailyData.create({
        data: {
          productId: product.id,
          daySequence: 1,
          salesQty: 20,
          salesPrice: 15.0,
          inventoryLevel: 80,
          salesAmount: 300.0
        }
      });

      await testDb.registrationAudit.create({
        data: {
          userId: user!.id,
          invitationCode: 'STORE01_2024',
          userEmail: 'manager@grocery.com'
        }
      });

      await testDb.importBatch.create({
        data: {
          userId: user!.id,
          fileName: 'test.xlsx',
          fileSize: BigInt(1000),
          totalRows: 10,
          validRows: 10,
          skippedRows: 0,
          status: 'COMPLETED'
        }
      });

      // Delete user
      await testDb.user.delete({ where: { id: user!.id } });

      // Verify related data was cascaded
      const remainingProducts = await testDb.product.findMany({
        where: { userId: user!.id }
      });
      expect(remainingProducts).toHaveLength(0);

      const remainingAuditRecords = await testDb.registrationAudit.findMany({
        where: { userId: user!.id }
      });
      expect(remainingAuditRecords).toHaveLength(0);

      const remainingImportBatches = await testDb.importBatch.findMany({
        where: { userId: user!.id }
      });
      expect(remainingImportBatches).toHaveLength(0);

      const remainingDailyData = await testDb.dailyData.findMany({
        where: { product: { userId: user!.id } }
      });
      expect(remainingDailyData).toHaveLength(0);
    });
  });
});