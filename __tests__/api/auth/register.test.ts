import { POST } from '@/app/api/auth/register/route';
import { testDb, cleanDatabase, setupTestInvitationCodes, closeDatabase } from '../../setup/database';
import { validRegistrationData, invalidRegistrationData } from '../../fixtures/auth-data';
import { NextRequest } from 'next/server';

// Mock the headers function
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Map([
    ['x-forwarded-for', '192.168.1.100'],
    ['user-agent', 'test-user-agent']
  ]))
}));

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await setupTestInvitationCodes();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Valid Registration', () => {
    it('should register a new user with valid invitation code', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Registration successful');
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe(validRegistrationData.username.toLowerCase());
      expect(data.user.email).toBe(validRegistrationData.email.toLowerCase());
      expect(data.user.status).toBe('ACTIVE');

      // Check that password is not included in response
      expect(data.user.password).toBeUndefined();

      // Verify user was created in database
      const createdUser = await testDb.user.findUnique({
        where: { email: validRegistrationData.email.toLowerCase() }
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.invitationCodeUsed).toBe(validRegistrationData.invitationCode.toUpperCase());
    });

    it('should create registration audit record', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });

      await POST(request);

      // Verify audit record was created
      const auditRecord = await testDb.registrationAudit.findFirst({
        where: { userEmail: validRegistrationData.email.toLowerCase() }
      });
      
      expect(auditRecord).toBeTruthy();
      expect(auditRecord?.invitationCode).toBe(validRegistrationData.invitationCode.toUpperCase());
      expect(auditRecord?.ipAddress).toBe('192.168.1.100');
      expect(auditRecord?.userAgent).toBe('test-user-agent');
    });

    it('should increment invitation code usage count', async () => {
      // Get initial usage count
      const initialCode = await testDb.invitationCode.findUnique({
        where: { code: validRegistrationData.invitationCode.toUpperCase() }
      });
      const initialUsageCount = initialCode?.currentUses || 0;

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });

      await POST(request);

      // Check that usage count was incremented
      const updatedCode = await testDb.invitationCode.findUnique({
        where: { code: validRegistrationData.invitationCode.toUpperCase() }
      });
      expect(updatedCode?.currentUses).toBe(initialUsageCount + 1);
    });

    it('should set secure HTTP-only cookie with JWT token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });

      const response = await POST(request);
      
      // Check for Set-Cookie header
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('auth-token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Strict');
      expect(setCookieHeader).toContain('Path=/');
    });
  });

  describe('Invalid Registration', () => {
    it('should reject registration with non-existent invitation code', async () => {
      const invalidData = {
        ...validRegistrationData,
        invitationCode: 'NONEXISTENT_CODE'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid invitation code');
      expect(data.errors?.invitationCode).toBe('Invalid invitation code');
    });

    it('should reject registration with expired invitation code', async () => {
      const invalidData = {
        ...validRegistrationData,
        invitationCode: 'EXPIRED_CODE'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invitation code has expired');
    });

    it('should reject registration with exhausted invitation code', async () => {
      const invalidData = {
        ...validRegistrationData,
        invitationCode: 'EXHAUSTED_CODE'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invitation code has reached maximum uses');
    });

    it('should reject registration with deactivated invitation code', async () => {
      const invalidData = {
        ...validRegistrationData,
        invitationCode: 'DEACTIVATED_CODE'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invitation code has been deactivated');
    });

    it('should reject registration with duplicate username', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });
      await POST(request1);

      // Second registration with same username
      const duplicateData = {
        ...validRegistrationData,
        email: 'different@grocery.com'
      };

      const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(duplicateData)
      });

      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Username already exists');
      expect(data.errors?.username).toBe('This username is already taken');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      const request1 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegistrationData)
      });
      await POST(request1);

      // Second registration with same email
      const duplicateData = {
        ...validRegistrationData,
        username: 'different_user'
      };

      const request2 = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(duplicateData)
      });

      const response = await POST(request2);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Email already exists');
      expect(data.errors?.email).toBe('This email is already taken');
    });
  });

  describe('Input Validation', () => {
    it.each(invalidRegistrationData)('should reject invalid registration data: $expectedError', async (testCase) => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: testCase.username,
          email: testCase.email,
          password: testCase.password,
          confirmPassword: testCase.confirmPassword,
          invitationCode: testCase.invitationCode
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('An internal error occurred during registration');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting after 3 attempts per IP', async () => {
      const requestData = {
        ...validRegistrationData,
        invitationCode: 'NONEXISTENT_CODE' // Use invalid code to avoid successful registrations
      };

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: { 'x-forwarded-for': '192.168.1.200' }
        });
        
        const response = await POST(request);
        expect(response.status).toBe(400); // Should fail due to invalid code
      }

      // 4th attempt should be rate limited
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'x-forwarded-for': '192.168.1.200' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Too many registration attempts. Please try again later.');
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle invitation codes case-insensitively', async () => {
      const lowerCaseData = {
        ...validRegistrationData,
        invitationCode: validRegistrationData.invitationCode.toLowerCase()
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(lowerCaseData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should normalize username and email to lowercase', async () => {
      const mixedCaseData = {
        ...validRegistrationData,
        username: 'MixedCase_User',
        email: 'MixedCase@Grocery.COM'
      };

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(mixedCaseData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.username).toBe('mixedcase_user');
      expect(data.user.email).toBe('mixedcase@grocery.com');
    });
  });
});