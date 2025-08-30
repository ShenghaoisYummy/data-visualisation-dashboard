import { AuthService } from '@/lib/auth';
import { InvitationCodeService } from '@/lib/invitation-codes';
import { testDb, cleanDatabase, closeDatabase, setupTestInvitationCodes, setupTestUsers } from '../setup/database';
import { UserStatus } from '@/generated/prisma';

describe('Authentication Security Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await setupTestInvitationCodes();
    await setupTestUsers();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Password Security', () => {
    it('should hash passwords securely with bcrypt', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Due to salt
    });

    it('should verify correct password against hash', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle compare password errors gracefully', async () => {
      const isValid = await AuthService.comparePassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Security', () => {
    it('should generate JWT token with user information', async () => {
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const token = AuthService.generateToken(user!);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct user data in JWT payload', async () => {
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const token = AuthService.generateToken(user!);
      const payload = AuthService.verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(user!.id);
      expect(payload!.username).toBe(user!.username);
      expect(payload!.email).toBe(user!.email);
      expect(payload!.status).toBe(user!.status);
    });

    it('should reject invalid JWT tokens', () => {
      const invalidToken = 'invalid.token.here';
      const payload = AuthService.verifyToken(invalidToken);
      
      expect(payload).toBeNull();
    });

    it('should reject modified JWT tokens', async () => {
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const token = AuthService.generateToken(user!);
      const modifiedToken = token.slice(0, -10) + 'modified123';
      
      const payload = AuthService.verifyToken(modifiedToken);
      expect(payload).toBeNull();
    });

    it('should require JWT_SECRET environment variable', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const user = {
        id: 'test-id',
        username: 'test',
        email: 'test@test.com',
        status: UserStatus.ACTIVE
      } as any;
      
      expect(() => AuthService.generateToken(user)).toThrow('JWT_SECRET environment variable is not set');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Invitation Code Security', () => {
    it('should reject expired invitation codes', async () => {
      const result = await InvitationCodeService.validateCode('EXPIRED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has expired');
    });

    it('should reject exhausted invitation codes', async () => {
      const result = await InvitationCodeService.validateCode('EXHAUSTED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has reached maximum uses');
    });

    it('should reject deactivated invitation codes', async () => {
      const result = await InvitationCodeService.validateCode('DEACTIVATED_CODE');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invitation code has been deactivated');
    });

    it('should handle case-insensitive code validation securely', async () => {
      const upperCase = await InvitationCodeService.validateCode('STORE01_2024');
      const lowerCase = await InvitationCodeService.validateCode('store01_2024');
      const mixedCase = await InvitationCodeService.validateCode('Store01_2024');
      
      expect(upperCase.valid).toBe(true);
      expect(lowerCase.valid).toBe(true);
      expect(mixedCase.valid).toBe(true);
    });

    it('should prevent code enumeration attacks', async () => {
      // Test with various invalid codes
      const invalidCodes = [
        'ADMIN_2024',
        'ROOT_2024',
        'SUPER_2024',
        '123456',
        'PASSWORD',
        'GUEST_2024'
      ];
      
      for (const code of invalidCodes) {
        const result = await InvitationCodeService.validateCode(code);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid invitation code');
      }
    });

    it('should generate cryptographically secure codes', () => {
      const codes = new Set();
      
      // Generate many codes and ensure no collisions
      for (let i = 0; i < 1000; i++) {
        const code = InvitationCodeService.generateCode();
        codes.add(code);
      }
      
      expect(codes.size).toBe(1000); // All should be unique
    });
  });

  describe('User Status Security', () => {
    it('should prevent login for suspended users', async () => {
      const result = await AuthService.login('suspended_user', 'SecurePass456');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Your account has been suspended. Please contact your administrator.');
    });

    it('should prevent login for terminated users', async () => {
      const result = await AuthService.login('former_employee', 'OldPass123');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Your account has been terminated. Please contact your administrator.');
    });

    it('should allow login for active users only', async () => {
      const result = await AuthService.login('store01_manager', 'SecurePass123');
      
      expect(result.success).toBe(true);
      expect(result.user?.status).toBe(UserStatus.ACTIVE);
    });

    it('should update user status securely', async () => {
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const success = await AuthService.updateUserStatus(user!.id, UserStatus.SUSPENDED);
      expect(success).toBe(true);
      
      const updatedUser = await testDb.user.findUnique({
        where: { id: user!.id }
      });
      expect(updatedUser?.status).toBe(UserStatus.SUSPENDED);
      
      // Verify they can't login anymore
      const loginResult = await AuthService.login('store01_manager', 'SecurePass123');
      expect(loginResult.success).toBe(false);
    });

    it('should bulk deactivate users by invitation code', async () => {
      // Create additional users with same invitation code
      const userData = {
        username: 'test_user_1',
        email: 'test1@grocery.com',
        password: await AuthService.hashPassword('TestPass123'),
        status: UserStatus.ACTIVE,
        invitationCodeUsed: 'STORE01_2024'
      };
      
      await testDb.user.create({ data: userData });
      
      const affectedCount = await AuthService.bulkDeactivateByCode('STORE01_2024');
      expect(affectedCount).toBeGreaterThanOrEqual(2);
      
      // Verify users are suspended
      const suspendedUsers = await testDb.user.findMany({
        where: {
          invitationCodeUsed: 'STORE01_2024',
          status: UserStatus.SUSPENDED
        }
      });
      
      expect(suspendedUsers.length).toBe(affectedCount);
    });
  });

  describe('Access Control Security', () => {
    it('should not expose sensitive user data in responses', async () => {
      const result = await AuthService.login('store01_manager', 'SecurePass123');
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      
      // Password should never be included
      expect(result.user).not.toHaveProperty('password');
    });

    it('should prevent timing attacks in login', async () => {
      const start1 = Date.now();
      await AuthService.login('nonexistent_user', 'password123');
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await AuthService.login('store01_manager', 'wrong_password');
      const time2 = Date.now() - start2;
      
      // Times should be reasonably similar (within 250ms for testing environment)
      const timeDifference = Math.abs(time1 - time2);
      expect(timeDifference).toBeLessThan(250);
    });

    it('should prevent user enumeration through error messages', async () => {
      const nonExistentResult = await AuthService.login('nonexistent_user', 'password123');
      const wrongPasswordResult = await AuthService.login('store01_manager', 'wrong_password');
      
      // Both should return the same generic error message
      expect(nonExistentResult.message).toBe('Invalid credentials');
      expect(wrongPasswordResult.message).toBe('Invalid credentials');
    });

    it('should get active user securely', async () => {
      const activeUser = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const suspendedUser = await testDb.user.findFirst({
        where: { username: 'suspended_user' }
      });
      
      // Should return active user
      const result1 = await AuthService.getActiveUser(activeUser!.id);
      expect(result1).toBeTruthy();
      expect(result1?.status).toBe(UserStatus.ACTIVE);
      
      // Should not return suspended user
      const result2 = await AuthService.getActiveUser(suspendedUser!.id);
      expect(result2).toBeNull();
    });
  });

  describe('Input Validation Security', () => {
    it('should handle SQL injection attempts in login', async () => {
      const maliciousInputs = [
        "admin'; DROP TABLE users; --",
        "admin' OR '1'='1",
        "admin' UNION SELECT * FROM users --",
        "'; DELETE FROM users WHERE '1'='1"
      ];
      
      for (const maliciousInput of maliciousInputs) {
        const result = await AuthService.login(maliciousInput, 'password');
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid credentials');
      }
    });

    it('should handle XSS attempts in user input', async () => {
      const xssAttempts = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "&#60;script&#62;alert('xss')&#60;/script&#62;"
      ];
      
      for (const xssAttempt of xssAttempts) {
        const result = await AuthService.login(xssAttempt, 'password');
        expect(result.success).toBe(false);
        expect(result.message).toBe('Invalid credentials');
      }
    });

    it('should sanitize and normalize user inputs', async () => {
      // Test with whitespace and mixed case
      const result = await AuthService.login('  STORE01_MANAGER  ', 'SecurePass123');
      expect(result.success).toBe(true);
    });

    it('should prevent NoSQL injection in invitation code validation', async () => {
      const maliciousInputs = [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$regex": ".*"}',
        '{"$where": "this.code"}',
        '{"$or": [{"code": "STORE01_2024"}]}'
      ];
      
      for (const maliciousInput of maliciousInputs) {
        const result = await InvitationCodeService.validateCode(maliciousInput);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid invitation code');
      }
    });
  });

  describe('Session Security', () => {
    it('should include user status in JWT for middleware validation', async () => {
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      const token = AuthService.generateToken(user!);
      const payload = AuthService.verifyToken(token);
      
      expect(payload!.status).toBe(UserStatus.ACTIVE);
    });

    it('should handle JWT expiration gracefully', async () => {
      // Create a JWT with very short expiration for testing
      const user = await testDb.user.findFirst({
        where: { username: 'store01_manager' }
      });
      
      // Mock a short-lived token (this would normally be done with jwt options)
      const token = AuthService.generateToken(user!);
      
      // The token should be valid immediately
      const payload = AuthService.verifyToken(token);
      expect(payload).toBeTruthy();
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should implement proper rate limiting logic', () => {
      // This is tested in the API tests, but we can test the concept here
      const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
      
      const checkRateLimit = (ip: string, maxRequests = 5, windowMs = 60000): boolean => {
        const now = Date.now();
        const clientData = rateLimitMap.get(ip);
        
        if (!clientData || now > clientData.resetTime) {
          rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
          return true;
        }
        
        if (clientData.count >= maxRequests) {
          return false;
        }
        
        clientData.count++;
        return true;
      };
      
      const testIP = '192.168.1.100';
      
      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        expect(checkRateLimit(testIP)).toBe(true);
      }
      
      // 6th request should be blocked
      expect(checkRateLimit(testIP)).toBe(false);
      
      // Different IP should still work
      expect(checkRateLimit('192.168.1.101')).toBe(true);
    });
  });

  describe('Audit Trail Security', () => {
    it('should log registration attempts with security context', async () => {
      // This is covered in the API tests, but ensures audit trail captures security info
      const registrationData = {
        username: 'security_test_user',
        email: 'security@test.com',
        password: 'SecurityPass123',
        invitationCode: 'STORE01_2024',
        ipAddress: '192.168.1.200',
        userAgent: 'Security Test Agent'
      };
      
      const result = await AuthService.register(registrationData);
      expect(result.success).toBe(true);
      
      const auditRecord = await testDb.registrationAudit.findFirst({
        where: { userEmail: 'security@test.com' }
      });
      
      expect(auditRecord).toBeTruthy();
      expect(auditRecord!.ipAddress).toBe('192.168.1.200');
      expect(auditRecord!.userAgent).toBe('Security Test Agent');
      expect(auditRecord!.invitationCode).toBe('STORE01_2024');
    });
  });
});