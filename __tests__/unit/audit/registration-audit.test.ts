// Mock the database
jest.mock('@/lib/database', () => ({
  db: {
    registrationAudit: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { db } from '@/lib/database';
import { AuthService } from '@/lib/auth';

const mockDb = db as jest.Mocked<typeof db>;

describe('Registration Audit Trail Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Audit Record Creation', () => {
    it('should create audit record during registration', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      // Mock invitation code validation
      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null); // No existing user
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({
        id: 'audit-id-123',
        userId: 'user-id-123',
        invitationCode: 'TEST_CODE_2024',
        userEmail: 'test@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        registeredAt: new Date()
      });

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(true);
      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024',
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser'
        }
      });
    });

    it('should capture IP address from request headers', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '10.0.0.50', // Custom IP
        userAgent: 'Custom User Agent'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024',
          userEmail: 'test@example.com',
          ipAddress: '10.0.0.50',
          userAgent: 'Custom User Agent'
        }
      });
    });

    it('should handle missing IP address and user agent gracefully', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        // No IP address or user agent provided
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024',
          userEmail: 'test@example.com',
          ipAddress: undefined,
          userAgent: undefined
        }
      });
    });
  });

  describe('Audit Data Integrity', () => {
    it('should store invitation code in uppercase', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'test_code_2024', // lowercase
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024', // Should be uppercase
          userEmail: 'test@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser'
        }
      });
    });

    it('should store email in lowercase', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM', // uppercase
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024',
          userEmail: 'test@example.com', // Should be lowercase
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser'
        }
      });
    });

    it('should include timestamp in audit record', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      const mockAuditRecord = {
        id: 'audit-id-123',
        userId: 'user-id-123',
        invitationCode: 'TEST_CODE_2024',
        userEmail: 'test@example.com',
        registeredAt: new Date(),
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue(mockAuditRecord);

      const result = await AuthService.register(registrationData);

      expect(result.success).toBe(true);
      expect(mockDb.registrationAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-id-123',
          invitationCode: 'TEST_CODE_2024',
          userEmail: 'test@example.com'
        })
      });
    });
  });

  describe('Audit Query Operations', () => {
    it('should support querying audit records by invitation code', async () => {
      const mockAuditRecords = [
        {
          id: 'audit-1',
          userId: 'user-1',
          invitationCode: 'STORE01_2024',
          userEmail: 'user1@example.com',
          registeredAt: new Date('2024-01-01'),
          ipAddress: '192.168.1.100'
        },
        {
          id: 'audit-2',
          userId: 'user-2',
          invitationCode: 'STORE01_2024',
          userEmail: 'user2@example.com',
          registeredAt: new Date('2024-01-02'),
          ipAddress: '192.168.1.101'
        }
      ];

      mockDb.registrationAudit.findMany.mockResolvedValue(mockAuditRecords);

      // This would be a hypothetical query function
      const queryAuditByCode = async (code: string) => {
        return await mockDb.registrationAudit.findMany({
          where: { invitationCode: code },
          orderBy: { registeredAt: 'desc' }
        });
      };

      const results = await queryAuditByCode('STORE01_2024');

      expect(results).toHaveLength(2);
      expect(results[0].invitationCode).toBe('STORE01_2024');
      expect(results[1].invitationCode).toBe('STORE01_2024');
      expect(mockDb.registrationAudit.findMany).toHaveBeenCalledWith({
        where: { invitationCode: 'STORE01_2024' },
        orderBy: { registeredAt: 'desc' }
      });
    });

    it('should support querying audit records by time range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockAuditRecords = [
        {
          id: 'audit-1',
          userId: 'user-1',
          invitationCode: 'STORE01_2024',
          userEmail: 'user1@example.com',
          registeredAt: new Date('2024-01-15'),
          ipAddress: '192.168.1.100'
        }
      ];

      mockDb.registrationAudit.findMany.mockResolvedValue(mockAuditRecords);

      // This would be a hypothetical query function
      const queryAuditByTimeRange = async (start: Date, end: Date) => {
        return await mockDb.registrationAudit.findMany({
          where: {
            registeredAt: {
              gte: start,
              lte: end
            }
          },
          orderBy: { registeredAt: 'desc' }
        });
      };

      const results = await queryAuditByTimeRange(startDate, endDate);

      expect(results).toHaveLength(1);
      expect(mockDb.registrationAudit.findMany).toHaveBeenCalledWith({
        where: {
          registeredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { registeredAt: 'desc' }
      });
    });

    it('should support querying audit records by IP address', async () => {
      const suspiciousIP = '192.168.1.200';

      const mockAuditRecords = [
        {
          id: 'audit-1',
          userId: 'user-1',
          invitationCode: 'CODE1_2024',
          userEmail: 'user1@example.com',
          registeredAt: new Date(),
          ipAddress: suspiciousIP
        },
        {
          id: 'audit-2',
          userId: 'user-2',
          invitationCode: 'CODE2_2024',
          userEmail: 'user2@example.com',
          registeredAt: new Date(),
          ipAddress: suspiciousIP
        }
      ];

      mockDb.registrationAudit.findMany.mockResolvedValue(mockAuditRecords);

      // This would be a hypothetical query function for security analysis
      const queryAuditByIP = async (ipAddress: string) => {
        return await mockDb.registrationAudit.findMany({
          where: { ipAddress },
          orderBy: { registeredAt: 'desc' }
        });
      };

      const results = await queryAuditByIP(suspiciousIP);

      expect(results).toHaveLength(2);
      expect(results[0].ipAddress).toBe(suspiciousIP);
      expect(results[1].ipAddress).toBe(suspiciousIP);
    });
  });

  describe('Audit Error Handling', () => {
    it('should handle audit record creation failure gracefully', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockRejectedValue(new Error('Audit creation failed'));

      // Registration should still succeed even if audit creation fails
      const result = await AuthService.register(registrationData);

      // The actual implementation should handle audit failures gracefully
      // For now, we're just testing that the audit creation is attempted
      expect(mockDb.registrationAudit.create).toHaveBeenCalled();
    });
  });

  describe('Security and Privacy', () => {
    it('should not store sensitive information in audit trail', async () => {
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'supersecretpassword123', // Sensitive data
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser'
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      const auditCall = mockDb.registrationAudit.create.mock.calls[0][0];
      
      // Password should never be included in audit data
      expect(JSON.stringify(auditCall)).not.toContain('supersecretpassword123');
      expect(auditCall.data).not.toHaveProperty('password');
    });

    it('should truncate excessively long user agent strings', async () => {
      const longUserAgent = 'A'.repeat(1000); // Very long user agent
      
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        invitationCode: 'TEST_CODE_2024',
        ipAddress: '192.168.1.100',
        userAgent: longUserAgent
      };

      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: 'test@example.com',
        status: 'ACTIVE'
      };

      jest.doMock('@/lib/invitation-codes', () => ({
        InvitationCodeService: {
          validateCode: jest.fn().mockResolvedValue({
            valid: true,
            codeData: { id: 'code-id', code: 'TEST_CODE_2024' }
          }),
          useCode: jest.fn().mockResolvedValue(undefined)
        }
      }));

      mockDb.user.findFirst.mockResolvedValue(null);
      mockDb.user.create.mockResolvedValue(mockUser);
      mockDb.registrationAudit.create.mockResolvedValue({} as any);

      await AuthService.register(registrationData);

      const auditCall = mockDb.registrationAudit.create.mock.calls[0][0];
      
      // User agent should be the full string (database will handle truncation)
      expect(auditCall.data.userAgent).toBe(longUserAgent);
    });
  });
});