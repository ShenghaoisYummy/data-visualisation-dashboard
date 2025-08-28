import { InvitationCodeService } from '@/lib/invitation-codes';
import { testDb, cleanDatabase, closeDatabase, setupTestInvitationCodes } from '../../setup/database';

describe('InvitationCodeService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('generateCode', () => {
    it('should generate code with default prefix', () => {
      const code = InvitationCodeService.generateCode();
      
      expect(code).toMatch(/^STAFF_[A-Z0-9]+$/);
      expect(code).toContain('STAFF_');
      expect(code.length).toBeGreaterThan(10);
    });

    it('should generate code with custom prefix', () => {
      const code = InvitationCodeService.generateCode('STORE01');
      
      expect(code).toMatch(/^STORE01_[A-Z0-9]+$/);
      expect(code).toContain('STORE01_');
    });

    it('should generate unique codes', () => {
      const codes = new Set();
      
      for (let i = 0; i < 100; i++) {
        const code = InvitationCodeService.generateCode();
        codes.add(code);
      }
      
      // All codes should be unique
      expect(codes.size).toBe(100);
    });

    it('should generate codes in uppercase', () => {
      const code = InvitationCodeService.generateCode('store01');
      
      expect(code).toMatch(/^[A-Z0-9_]+$/);
    });
  });

  describe('validateCode', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should validate active, unexpired code with uses remaining', async () => {
      const result = await InvitationCodeService.validateCode('STORE01_2024');
      
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.codeData).toBeTruthy();
      expect(result.codeData?.code).toBe('STORE01_2024');
      expect(result.codeData?.isActive).toBe(true);
    });

    it('should handle case-insensitive validation', async () => {
      const result = await InvitationCodeService.validateCode('store01_2024');
      
      expect(result.valid).toBe(true);
      expect(result.codeData?.code).toBe('STORE01_2024');
    });

    it('should trim whitespace from code', async () => {
      const result = await InvitationCodeService.validateCode('  STORE01_2024  ');
      
      expect(result.valid).toBe(true);
      expect(result.codeData?.code).toBe('STORE01_2024');
    });

    it('should reject non-existent code', async () => {
      const result = await InvitationCodeService.validateCode('NONEXISTENT_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid invitation code');
      expect(result.codeData).toBeUndefined();
    });

    it('should reject deactivated code', async () => {
      const result = await InvitationCodeService.validateCode('DEACTIVATED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has been deactivated');
      expect(result.codeData).toBeUndefined();
    });

    it('should reject expired code', async () => {
      const result = await InvitationCodeService.validateCode('EXPIRED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has expired');
      expect(result.codeData).toBeUndefined();
    });

    it('should reject exhausted code', async () => {
      const result = await InvitationCodeService.validateCode('EXHAUSTED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has reached maximum uses');
      expect(result.codeData).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalFindFirst = testDb.invitationCode.findFirst;
      testDb.invitationCode.findFirst = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await InvitationCodeService.validateCode('STORE01_2024');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Error validating invitation code');
      
      // Restore original method
      testDb.invitationCode.findFirst = originalFindFirst;
    });
  });

  describe('useCode', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should increment usage count', async () => {
      const code = await testDb.invitationCode.findUnique({
        where: { code: 'STORE01_2024' }
      });
      
      const initialUses = code!.currentUses;
      
      await InvitationCodeService.useCode(code!.id, 'test@grocery.com');
      
      const updatedCode = await testDb.invitationCode.findUnique({
        where: { id: code!.id }
      });
      
      expect(updatedCode!.currentUses).toBe(initialUses + 1);
    });

    it('should handle database errors', async () => {
      // Mock database error
      const originalUpdate = testDb.invitationCode.update;
      testDb.invitationCode.update = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(InvitationCodeService.useCode('invalid-id', 'test@grocery.com'))
        .rejects.toThrow('Failed to update invitation code usage');
      
      // Restore original method
      testDb.invitationCode.update = originalUpdate;
    });
  });

  describe('createCode', () => {
    it('should create new invitation code with default values', async () => {
      const codeData = {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: 'admin@test.com'
      };
      
      const result = await InvitationCodeService.createCode(codeData);
      
      expect(result).toBeTruthy();
      expect(result.code).toMatch(/^STAFF_[A-Z0-9]+$/);
      expect(result.maxUses).toBe(10); // Default value
      expect(result.currentUses).toBe(0);
      expect(result.isActive).toBe(true);
      expect(result.expiresAt).toEqual(codeData.expiresAt);
      expect(result.createdBy).toBe(codeData.createdBy);
    });

    it('should create code with custom values', async () => {
      const codeData = {
        department: 'Custom Department',
        maxUses: 15,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        description: 'Custom test code',
        createdBy: 'admin@test.com',
        prefix: 'CUSTOM'
      };
      
      const result = await InvitationCodeService.createCode(codeData);
      
      expect(result.code).toMatch(/^CUSTOM_[A-Z0-9]+$/);
      expect(result.department).toBe('Custom Department');
      expect(result.maxUses).toBe(15);
      expect(result.description).toBe('Custom test code');
    });

    it('should handle database errors', async () => {
      const originalCreate = testDb.invitationCode.create;
      testDb.invitationCode.create = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(InvitationCodeService.createCode({
        expiresAt: new Date(),
        createdBy: 'admin@test.com'
      })).rejects.toThrow('Failed to create invitation code');
      
      testDb.invitationCode.create = originalCreate;
    });
  });

  describe('deactivateCode', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should deactivate active code', async () => {
      const code = await testDb.invitationCode.findUnique({
        where: { code: 'STORE01_2024' }
      });
      
      expect(code!.isActive).toBe(true);
      
      await InvitationCodeService.deactivateCode(code!.id);
      
      const updatedCode = await testDb.invitationCode.findUnique({
        where: { id: code!.id }
      });
      
      expect(updatedCode!.isActive).toBe(false);
    });

    it('should handle database errors', async () => {
      const originalUpdate = testDb.invitationCode.update;
      testDb.invitationCode.update = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(InvitationCodeService.deactivateCode('invalid-id'))
        .rejects.toThrow('Failed to deactivate invitation code');
      
      testDb.invitationCode.update = originalUpdate;
    });
  });

  describe('getCodes', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should return all codes when activeOnly is false', async () => {
      const codes = await InvitationCodeService.getCodes(false);
      
      expect(codes.length).toBeGreaterThan(0);
      
      // Should include both active and inactive codes
      const activeCodes = codes.filter(code => code.isActive);
      const inactiveCodes = codes.filter(code => !code.isActive);
      
      expect(activeCodes.length).toBeGreaterThan(0);
      expect(inactiveCodes.length).toBeGreaterThan(0);
    });

    it('should return only active codes when activeOnly is true', async () => {
      const codes = await InvitationCodeService.getCodes(true);
      
      expect(codes.length).toBeGreaterThan(0);
      
      // All returned codes should be active
      const allActive = codes.every(code => code.isActive);
      expect(allActive).toBe(true);
    });

    it('should return codes ordered by creation date (newest first)', async () => {
      const codes = await InvitationCodeService.getCodes(false);
      
      expect(codes.length).toBeGreaterThan(1);
      
      // Check that codes are ordered by createdAt desc
      for (let i = 0; i < codes.length - 1; i++) {
        expect(codes[i].createdAt.getTime()).toBeGreaterThanOrEqual(codes[i + 1].createdAt.getTime());
      }
    });

    it('should handle database errors', async () => {
      const originalFindMany = testDb.invitationCode.findMany;
      testDb.invitationCode.findMany = jest.fn().mockRejectedValue(new Error('Database error'));
      
      await expect(InvitationCodeService.getCodes())
        .rejects.toThrow('Failed to fetch invitation codes');
      
      testDb.invitationCode.findMany = originalFindMany;
    });
  });

  describe('cleanupExpiredCodes', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should mark expired codes as inactive', async () => {
      const result = await InvitationCodeService.cleanupExpiredCodes();
      
      expect(result).toBeGreaterThan(0);
      
      // Check that the expired code was deactivated
      const expiredCode = await testDb.invitationCode.findUnique({
        where: { code: 'EXPIRED_CODE' }
      });
      
      expect(expiredCode!.isActive).toBe(false);
    });

    it('should not affect non-expired codes', async () => {
      await InvitationCodeService.cleanupExpiredCodes();
      
      // Check that non-expired codes remain active
      const activeCode = await testDb.invitationCode.findUnique({
        where: { code: 'STORE01_2024' }
      });
      
      expect(activeCode!.isActive).toBe(true);
    });

    it('should return count of cleaned up codes', async () => {
      // We know from setup that there's at least one expired code
      const result = await InvitationCodeService.cleanupExpiredCodes();
      
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should handle database errors gracefully', async () => {
      const originalUpdateMany = testDb.invitationCode.updateMany;
      testDb.invitationCode.updateMany = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await InvitationCodeService.cleanupExpiredCodes();
      
      expect(result).toBe(0);
      
      testDb.invitationCode.updateMany = originalUpdateMany;
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await setupTestInvitationCodes();
    });

    it('should handle concurrent usage increments correctly', async () => {
      const code = await testDb.invitationCode.findUnique({
        where: { code: 'STORE01_2024' }
      });
      
      const initialUses = code!.currentUses;
      
      // Simulate concurrent usage increments
      const promises = [
        InvitationCodeService.useCode(code!.id, 'user1@test.com'),
        InvitationCodeService.useCode(code!.id, 'user2@test.com'),
        InvitationCodeService.useCode(code!.id, 'user3@test.com')
      ];
      
      await Promise.all(promises);
      
      const finalCode = await testDb.invitationCode.findUnique({
        where: { id: code!.id }
      });
      
      expect(finalCode!.currentUses).toBe(initialUses + 3);
    });

    it('should validate code at maximum usage boundary', async () => {
      // Get a code that's at maximum usage
      const exhaustedCode = await testDb.invitationCode.findUnique({
        where: { code: 'EXHAUSTED_CODE' }
      });
      
      expect(exhaustedCode!.currentUses).toBe(exhaustedCode!.maxUses);
      
      const result = await InvitationCodeService.validateCode('EXHAUSTED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has reached maximum uses');
    });

    it('should handle validation of code exactly at expiration', async () => {
      // Create a code that expires right now
      const now = new Date();
      const codeData = {
        code: 'EXPIRING_NOW',
        expiresAt: now,
        maxUses: 5,
        createdBy: 'admin@test.com'
      };
      
      await testDb.invitationCode.create({ data: codeData });
      
      // Wait a moment to ensure we're past expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await InvitationCodeService.validateCode('EXPIRING_NOW');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has expired');
    });
  });
});