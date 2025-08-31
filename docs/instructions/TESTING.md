# Comprehensive Testing Guide

This guide shows you how to implement and run the missing tests for your data visualization dashboard project.

## 🧪 Test Types Implemented

### 1. API Integration Tests
**Location**: `__tests__/integration/`  
**Purpose**: Test API endpoints with real HTTP requests and database interactions

```bash
# Run API integration tests
npm run test:integration
```

**Example**: API authentication flow test validates registration → login → protected route access.

### 2. Component Integration Tests  
**Location**: `__tests__/components/`  
**Purpose**: Test UI components with user interactions and API mocking

```bash
# Run component tests (included in integration)
npm run test:integration
```

**Example**: FileUpload component test validates file selection, upload process, error handling, and loading states.

### 3. End-to-End (E2E) Tests
**Location**: `e2e/`  
**Purpose**: Test complete user journeys in a real browser

```bash
# Run E2E tests
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui
```

**Example**: Complete user journey from registration to dashboard visualization.

### 4. Fixed Database Integration Tests
**Location**: `__tests__/unit/lib/invitation-codes.fixed.test.ts`  
**Purpose**: Properly mocked database integration tests without transaction complexity

## 🚀 How to Run All Tests

### Quick Start
```bash
# Install Playwright (if not already installed)
npm install

# Run all tests in sequence
npm run test:all
```

### Individual Test Commands
```bash
# Unit tests only
npm run test:unit

# Integration tests (API + Components)  
npm run test:integration

# API tests only
npm run test:api

# End-to-end tests
npm run test:e2e

# Test with coverage report
npm run test:coverage
```

## 🛠️ Setting Up Tests

### 1. API Integration Tests

Create tests that make real HTTP requests to your API endpoints:

```typescript
// __tests__/integration/api-auth-flow.test.ts
import { NextRequest } from 'next/server';
import { POST as registerPOST } from '@/app/api/auth/register/route';

describe('API Integration Tests', () => {
  it('should complete registration flow', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        invitationCode: 'VALID123',
      }),
    });

    const response = await registerPOST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

### 2. Component Integration Tests

Test React components with user interactions:

```typescript
// __tests__/components/FileUpload.integration.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/FileUpload';

describe('FileUpload Component', () => {
  it('should handle successful file upload', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<FileUpload onUploadComplete={jest.fn()} />);

    const fileInput = screen.getByLabelText(/select excel file/i);
    const mockFile = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    await user.upload(fileInput, mockFile);
    await user.click(screen.getByRole('button', { name: /upload/i }));

    expect(fetch).toHaveBeenCalledWith('/api/upload', expect.any(Object));
  });
});
```

### 3. End-to-End Tests

Test complete user workflows in a browser:

```typescript
// e2e/user-journey.spec.ts  
import { test, expect } from '@playwright/test';

test('complete user journey', async ({ page }) => {
  // Navigate to registration
  await page.goto('/register');
  
  // Fill registration form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Verify success and continue journey...
  await expect(page).toHaveURL('/dashboard');
});
```

## 🔧 Test Configuration

### Jest Configuration
Your `jest.config.js` should include:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest'],
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Playwright Configuration  
Your `playwright.config.ts` should include:

```typescript
export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 🐛 Fixing Common Issues

### Database Integration Tests Failing
- Use proper mocking instead of real database connections
- Mock Prisma client with transaction support
- Use the fixed invitation codes test as a template

### Component Tests Not Finding Elements
- Use `data-testid` attributes for reliable element selection
- Mock external dependencies (Recharts, fetch, etc.)
- Use proper async/await for user interactions

### E2E Tests Timing Out
- Increase timeout values for slow operations
- Use `waitFor` for dynamic content
- Ensure test database is properly seeded

## 📊 Coverage Goals

- **Unit Tests**: 90%+ coverage of business logic
- **Integration Tests**: All API endpoints tested
- **Component Tests**: All interactive components tested  
- **E2E Tests**: Critical user journeys tested

## 🎯 Test Priority

1. **High Priority**: API integration, authentication, Excel processing
2. **Medium Priority**: Component interactions, error handling
3. **Low Priority**: E2E edge cases, cross-browser testing

## 📝 Test Data Management

### Test Fixtures
Create test data files in `e2e/fixtures/`:
- `sample-data.xlsx` - Valid Excel file for testing
- `invalid-file.txt` - Invalid file for error testing

### Database Seeding
Use the test database setup in `__tests__/setup/test-database.ts` for consistent test data.

## 🚀 Running Tests in CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run build
    npm run test:e2e

- name: Generate Coverage
  run: npm run test:coverage
```

This comprehensive testing setup ensures your data visualization dashboard is thoroughly tested and production-ready! 🎉