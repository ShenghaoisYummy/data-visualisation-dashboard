import { NextRequest, NextResponse } from 'next/server';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { GET as productsGET } from '@/app/api/dashboard/products/route';
import { PrismaClient } from '@/generated/prisma';

// Mock Prisma client
jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    invitationCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    registrationAudit: {
      create: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('API Integration Tests - Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration → Login → Protected Route Flow', () => {
    it('should complete full authentication flow', async () => {
      // 1. Mock valid invitation code
      mockPrisma.invitationCode.findUnique.mockResolvedValueOnce({
        id: 'test-code-id',
        code: 'VALID123',
        maxUses: 5,
        currentUses: 0,
        expiresAt: new Date(Date.now() + 86400000), // 24 hours
        isActive: true,
        department: 'IT',
        createdBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'test-user-id',
        email: 'test@example.com',
        hashedPassword: 'hashed-password',
        status: 'ACTIVE',
        invitationCodeId: 'test-code-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 2. Test Registration
      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          invitationCode: 'VALID123',
        }),
      });

      const registerResponse = await registerPOST(registerRequest);
      const registerData = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerData.success).toBe(true);
      expect(registerData.message).toBe('Registration successful');

      // 3. Test Login with created user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'test-user-id',
        email: 'test@example.com',
        hashedPassword: '$2b$12$validhashedpassword', // Mock bcrypt hash
        status: 'ACTIVE',
        invitationCodeId: 'test-code-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      });

      // Mock bcrypt.compare to return true
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const loginResponse = await loginPOST(loginRequest);
      const loginData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginData.success).toBe(true);
      expect(loginData.user).toBeDefined();
      expect(loginData.user.email).toBe('test@example.com');

      // 4. Test Protected Route Access
      const authToken = loginResponse.headers.get('set-cookie')?.match(/auth-token=([^;]+)/)?.[1];
      
      mockPrisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'product-1',
          name: 'Test Product',
          userId: 'test-user-id',
          importBatchId: 'batch-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const protectedRequest = new NextRequest('http://localhost:3000/api/dashboard/products', {
        method: 'GET',
        headers: {
          'Cookie': `auth-token=${authToken}`,
        },
      });

      const protectedResponse = await productsGET(protectedRequest);
      const protectedData = await protectedResponse.json();

      expect(protectedResponse.status).toBe(200);
      expect(protectedData.success).toBe(true);
      expect(Array.isArray(protectedData.products)).toBe(true);
    });

    it('should reject invalid invitation codes', async () => {
      mockPrisma.invitationCode.findUnique.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          invitationCode: 'INVALID123',
        }),
      });

      const response = await registerPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid invitation code');
    });
  });
});