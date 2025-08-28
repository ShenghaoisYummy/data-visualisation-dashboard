import { UserStatus } from '@/generated/prisma';

export const validInvitationCodes = [
  {
    code: 'STORE01_2024',
    department: 'Store 01',
    maxUses: 10,
    currentUses: 3,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    description: 'Active code for Store 01 staff',
    createdBy: 'admin@grocery.com'
  },
  {
    code: 'MANAGER_2024',
    department: 'Management',
    maxUses: 5,
    currentUses: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isActive: true,
    description: 'Management team access code',
    createdBy: 'admin@grocery.com'
  }
];

export const invalidInvitationCodes = [
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

export const testUsers = [
  {
    username: 'store01_manager',
    email: 'manager@grocery.com',
    password: 'SecurePass123',
    status: UserStatus.ACTIVE,
    invitationCodeUsed: 'STORE01_2024'
  },
  {
    username: 'suspended_user',
    email: 'suspended@grocery.com',
    password: 'SecurePass456',
    status: UserStatus.SUSPENDED,
    invitationCodeUsed: 'MANAGER_2024'
  },
  {
    username: 'former_employee',
    email: 'former@grocery.com',
    password: 'OldPass123',
    status: UserStatus.TERMINATED,
    invitationCodeUsed: 'OLD_CODE_2023'
  }
];

// Valid registration request data
export const validRegistrationData = {
  username: 'new_employee',
  email: 'new.employee@grocery.com',
  password: 'NewSecurePass123',
  confirmPassword: 'NewSecurePass123',
  invitationCode: 'STORE01_2024'
};

// Valid login request data
export const validLoginData = {
  username: 'store01_manager',
  password: 'SecurePass123'
};

// Invalid registration data (various edge cases)
export const invalidRegistrationData = [
  {
    username: '', // Empty username
    email: 'test@grocery.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    invitationCode: 'STORE01_2024',
    expectedError: 'Username is required'
  },
  {
    username: 'testuser',
    email: 'invalid-email', // Invalid email format
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    invitationCode: 'STORE01_2024',
    expectedError: 'Invalid email format'
  },
  {
    username: 'testuser',
    email: 'test@grocery.com',
    password: 'weak', // Weak password
    confirmPassword: 'weak',
    invitationCode: 'STORE01_2024',
    expectedError: 'Password must be at least 8 characters'
  },
  {
    username: 'testuser',
    email: 'test@grocery.com',
    password: 'SecurePass123',
    confirmPassword: 'DifferentPass123', // Password mismatch
    invitationCode: 'STORE01_2024',
    expectedError: 'Passwords must match'
  },
  {
    username: 'testuser',
    email: 'test@grocery.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    invitationCode: 'INVALID_CODE', // Non-existent code
    expectedError: 'Invalid invitation code'
  },
  {
    username: 'testuser',
    email: 'test@grocery.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    invitationCode: 'EXPIRED_CODE', // Expired code
    expectedError: 'Invitation code has expired'
  }
];

// Invalid login data
export const invalidLoginData = [
  {
    username: '', // Empty username
    password: 'SecurePass123',
    expectedError: 'Username is required'
  },
  {
    username: 'nonexistent_user',
    password: 'SecurePass123',
    expectedError: 'Invalid credentials'
  },
  {
    username: 'store01_manager',
    password: 'WrongPassword123',
    expectedError: 'Invalid credentials'
  },
  {
    username: 'suspended_user',
    password: 'SecurePass456',
    expectedError: 'Your account has been suspended'
  },
  {
    username: 'former_employee',
    password: 'OldPass123',
    expectedError: 'Your account has been terminated'
  }
];

// Rate limiting test data
export const rateLimitTestData = {
  registrationAttempts: 4, // Should trigger rate limit (max 3 per hour)
  loginAttempts: 6, // Should trigger rate limit (max 5 per 15 minutes)
  testIP: '192.168.1.100'
};