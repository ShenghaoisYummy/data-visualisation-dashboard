import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.DATABASE_URL = 'file:./test.db';

// Mock fetch for API testing
global.fetch = require('jest-fetch-mock');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Map([
    ['x-forwarded-for', '127.0.0.1'],
    ['user-agent', 'test-user-agent'],
    ['x-user-id', 'test-user-id'],
    ['x-user-email', 'test@example.com'],
    ['x-user-status', 'ACTIVE'],
  ])),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore console errors/warnings in tests
  // error: jest.fn(),
  // warn: jest.fn(),
};

// Increase timeout for database operations
jest.setTimeout(30000);