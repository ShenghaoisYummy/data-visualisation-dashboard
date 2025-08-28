import { AuthService } from '@/lib/auth';
import { UserStatus } from '@/generated/prisma';

// Mock the database
jest.mock('@/lib/database', () => ({
  db: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    registrationAudit: {
      create: jest.fn(),
    },
  },
}));

// Mock the invitation code service
jest.mock('@/lib/invitation-codes', () => ({
  InvitationCodeService: {
    validateCode: jest.fn(),
    useCode: jest.fn(),
  },
}));

import { db } from '@/lib/database';
import { InvitationCodeService } from '@/lib/invitation-codes';

const mockDb = db as jest.Mocked<typeof db>;
const mockInvitationCodeService = InvitationCodeService as jest.Mocked<typeof InvitationCodeService>;

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
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

    it('should handle hashing errors', async () => {
      // Mock bcrypt to throw an error
      const bcrypt = require('bcryptjs');
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error('Hash error'));
      
      await expect(AuthService.hashPassword('password')).rejects.toThrow('Failed to hash password');
      
      // Restore original
      bcrypt.hash = originalHash;
    });
  });

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await AuthService.hashPassword(password);
      
      const isValid = await AuthService.comparePassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle comparison errors gracefully', async () => {
      const isValid = await AuthService.comparePassword('password', 'invalid-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      const user = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      } as any;

      const token = AuthService.generateToken(user);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should require JWT_SECRET environment variable', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const user = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      } as any;
      
      expect(() => AuthService.generateToken(user)).toThrow('JWT_SECRET environment variable is not set');
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', () => {
      const user = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
      } as any;

      const token = AuthService.generateToken(user);
      const payload = AuthService.verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload!.userId).toBe(user.id);
      expect(payload!.username).toBe(user.username);
      expect(payload!.email).toBe(user.email);
      expect(payload!.status).toBe(user.status);
    });

    it('should reject invalid tokens', () => {
      const payload = AuthService.verifyToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should require JWT_SECRET environment variable', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const payload = AuthService.verifyToken('some.token.here');
      expect(payload).toBeNull();
      
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        password: await AuthService.hashPassword('password123'),
        status: UserStatus.ACTIVE,
      };

      mockDb.user.findFirst.mockResolvedValue(mockUser);
      mockDb.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      const result = await AuthService.login('testuser', 'password123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.user).toBeTruthy();
      expect(result.token).toBeTruthy();
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should reject non-existent user', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await AuthService.login('nonexistent', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    it('should reject suspended user', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        password: await AuthService.hashPassword('password123'),
        status: UserStatus.SUSPENDED,
      };

      mockDb.user.findFirst.mockResolvedValue(mockUser);

      const result = await AuthService.login('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Your account has been suspended. Please contact your administrator.');
    });

    it('should reject terminated user', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        password: await AuthService.hashPassword('password123'),
        status: UserStatus.TERMINATED,
      };

      mockDb.user.findFirst.mockResolvedValue(mockUser);

      const result = await AuthService.login('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Your account has been terminated. Please contact your administrator.');
    });

    it('should reject invalid password', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        password: await AuthService.hashPassword('correctpassword'),
        status: UserStatus.ACTIVE,
      };

      mockDb.user.findFirst.mockResolvedValue(mockUser);

      const result = await AuthService.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should handle database errors', async () => {
      mockDb.user.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.login('testuser', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred during login');
    });
  });

  describe('register', () => {
    it('should register user with valid invitation code', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        invitationCode: 'VALID_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockCodeValidation = {
        valid: true,
        codeData: {
          id: 'code-id-123',
          code: 'VALID_CODE_2024'
        }
      };

      const mockNewUser = {
        id: 'user-id-456',
        username: 'newuser',
        email: 'new@example.com',
        status: UserStatus.ACTIVE,
        invitationCodeUsed: 'VALID_CODE_2024'
      };

      mockInvitationCodeService.validateCode.mockResolvedValue(mockCodeValidation);
      mockDb.user.findFirst.mockResolvedValue(null); // No existing user
      mockDb.user.create.mockResolvedValue(mockNewUser);
      mockInvitationCodeService.useCode.mockResolvedValue(undefined);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
      expect(result.user).toBeTruthy();
      expect(result.token).toBeTruthy();
      expect(mockInvitationCodeService.validateCode).toHaveBeenCalledWith('VALID_CODE_2024');
      expect(mockInvitationCodeService.useCode).toHaveBeenCalledWith('code-id-123', 'new@example.com');
      expect(mockDb.registrationAudit.create).toHaveBeenCalled();
    });

    it('should reject invalid invitation code', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        invitationCode: 'INVALID_CODE',
      };

      mockInvitationCodeService.validateCode.mockResolvedValue({
        valid: false,
        reason: 'Invalid invitation code'
      });

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid invitation code');
      expect(result.errors?.invitationCode).toBe('Invalid invitation code');
    });

    it('should reject duplicate username', async () => {
      const registrationData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
        invitationCode: 'VALID_CODE_2024',
      };

      mockInvitationCodeService.validateCode.mockResolvedValue({
        valid: true,
        codeData: { id: 'code-id', code: 'VALID_CODE_2024' }
      });

      mockDb.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        username: 'existinguser',
        email: 'existing@example.com'
      } as any);

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Username already exists');
      expect(result.errors?.username).toBe('This username is already taken');
    });

    it('should reject duplicate email', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        invitationCode: 'VALID_CODE_2024',
      };

      mockInvitationCodeService.validateCode.mockResolvedValue({
        valid: true,
        codeData: { id: 'code-id', code: 'VALID_CODE_2024' }
      });

      mockDb.user.findFirst.mockResolvedValue({
        id: 'existing-user',
        username: 'existinguser',
        email: 'existing@example.com'
      } as any);

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already exists');
      expect(result.errors?.email).toBe('This email is already taken');
    });

    it('should handle registration errors', async () => {
      const registrationData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        invitationCode: 'VALID_CODE_2024',
      };

      mockInvitationCodeService.validateCode.mockResolvedValue({
        valid: true,
        codeData: { id: 'code-id', code: 'VALID_CODE_2024' }
      });

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('An error occurred during registration');
    });
  });

  describe('getActiveUser', () => {
    it('should return active user', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'activeuser',
        status: UserStatus.ACTIVE
      };

      mockDb.user.findFirst.mockResolvedValue(mockUser);

      const result = await AuthService.getActiveUser('user-id-123');

      expect(result).toEqual(mockUser);
      expect(mockDb.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-id-123',
          status: UserStatus.ACTIVE
        }
      });
    });

    it('should return null for non-existent user', async () => {
      mockDb.user.findFirst.mockResolvedValue(null);

      const result = await AuthService.getActiveUser('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDb.user.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.getActiveUser('user-id-123');

      expect(result).toBeNull();
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      mockDb.user.update.mockResolvedValue({} as any);

      const result = await AuthService.updateUserStatus('user-id-123', UserStatus.SUSPENDED);

      expect(result).toBe(true);
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { 
          status: UserStatus.SUSPENDED,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle update errors', async () => {
      mockDb.user.update.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.updateUserStatus('user-id-123', UserStatus.SUSPENDED);

      expect(result).toBe(false);
    });
  });

  describe('bulkDeactivateByCode', () => {
    it('should bulk deactivate users by invitation code', async () => {
      mockDb.user.updateMany.mockResolvedValue({ count: 3 });

      const result = await AuthService.bulkDeactivateByCode('TEST_CODE_2024');

      expect(result).toBe(3);
      expect(mockDb.user.updateMany).toHaveBeenCalledWith({
        where: { 
          invitationCodeUsed: 'TEST_CODE_2024',
          status: UserStatus.ACTIVE
        },
        data: { 
          status: UserStatus.SUSPENDED,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle bulk update errors', async () => {
      mockDb.user.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.bulkDeactivateByCode('TEST_CODE_2024');

      expect(result).toBe(0);
    });
  });
});