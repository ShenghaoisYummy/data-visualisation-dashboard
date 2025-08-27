# Testing Strategy for AIBUILD Data Visualization Dashboard

## Overview

This testing strategy follows a **TDD-lite approach** optimized for the 1-week AIBUILD challenge timeline. We prioritize testing for high-risk, critical functionality while allowing lower-risk UI components to be tested after feature completion.

## Testing Framework & Tools

- **Test Framework**: Jest + React Testing Library
- **API Testing**: Supertest for Next.js API routes
- **Database Testing**: In-memory SQLite for fast test execution
- **E2E Testing**: Playwright (minimal, post-feature complete)
- **Coverage**: Istanbul/NYC for code coverage reporting

## Risk-Based Testing Priorities

### 🔴 TEST IMMEDIATELY (High Risk/Critical)
*Write tests during development alongside implementation*

#### 1. Excel Parsing Logic
```typescript
// __tests__/lib/excel-parser.test.ts
describe('Excel Parser', () => {
  test('should parse valid Excel data correctly', () => {
    // Test happy path with complete data
  });
  
  test('should handle missing/null values gracefully', () => {
    // Test null quantity, null price, missing cells
    // Test calculated amounts when qty or price is null
  });
  
  test('should validate Excel structure', () => {
    // Test wrong columns, missing headers
    // Test invalid product IDs, empty product names
    // Test negative quantities/prices (should reject)
  });
  
  test('should handle edge case data types', () => {
    // Test string numbers, floating point precision
    // Test very large numbers, currency symbols
    // Test special characters in product names
  });
});
```

**Rationale**: Excel parsing is complex, error-prone, and critical for the entire application. Bugs here affect all downstream functionality.

#### 2. Inventory Calculation Formulas
```typescript
// __tests__/lib/inventory-calculations.test.ts
describe('Inventory Calculations', () => {
  test('should calculate daily inventory correctly', () => {
    // Day 1: Opening + Procurement - Sales
    // Day 2: Day 1 result + Day 2 Procurement - Day 2 Sales
    // Day 3: Day 2 result + Day 3 Procurement - Day 3 Sales
  });
  
  test('should handle null values in calculations', () => {
    // Null procurement qty/price, null sales qty/price
    // Test that null qty or price results in null amount (not 0)
  });
  
  test('should allow negative inventory levels', () => {
    // Test oversold scenarios where sales > inventory + procurement
  });
  
  test('should use Decimal precision for currency', () => {
    // Test floating-point precision with currency calculations
    // Verify Decimal arithmetic prevents precision errors
  });
  
  test('should validate business rule constraints', () => {
    // Test rejection of negative quantities/prices
    // Test daySequence bounds (1-3 only)
  });
});
```

**Rationale**: Mathematical accuracy is core to the business value. Incorrect calculations render the entire dashboard meaningless.

#### 3. Authentication/Session Management
```typescript
// __tests__/api/auth.test.ts
describe('Authentication API', () => {
  test('should register new user with valid invitation code', () => {
    // Test user creation with invitation code validation
    // Test password hashing, code usage tracking
  });
  
  test('should reject registration with invalid invitation code', () => {
    // Test expired codes, exhausted codes, non-existent codes
    // Test deactivated codes, case sensitivity
  });
  
  test('should login with valid credentials (active users only)', () => {
    // Test JWT generation with user status
    // Test session creation for active users
  });
  
  test('should reject login for suspended/terminated users', () => {
    // Test account status validation during login
    // Test appropriate error messages
  });
  
  test('should protect authenticated routes', () => {
    // Test middleware functionality with user status checking
    // Test route protection for different user statuses
  });
  
  test('should track invitation code usage correctly', () => {
    // Test code usage increments, max usage enforcement
    // Test audit trail creation
  });
});
```

**Rationale**: Security is non-negotiable. Authentication bugs can compromise the entire application.

#### 4. Database Operations (CRUD)
```typescript
// __tests__/lib/database.test.ts
describe('Database Operations', () => {
  test('should create users with invitation code tracking', () => {
    // Test user creation with invitation code reference
    // Test registration audit log creation
  });
  
  test('should create and manage invitation codes', () => {
    // Test code creation, expiration, usage tracking
    // Test department assignment, description storage
  });
  
  test('should enforce database constraints', () => {
    // Test unique constraints, required fields
    // Test check constraints (non-negative values, string lengths)
    // Test daySequence bounds (1-3), username length limits
    // Test invitation code format constraints
  });
  
  test('should handle user status transitions', () => {
    // Test status changes (ACTIVE -> SUSPENDED -> TERMINATED)
    // Test cascade effects of status changes
  });
  
  test('should track registration audit trail', () => {
    // Test audit log creation with IP, user agent, timestamp
    // Test linking audit records to users and codes
  });
  
  test('should handle invitation code lifecycle', () => {
    // Test code expiration, usage limits, deactivation
    // Test bulk operations (deactivate by department)
  });
});
```

**Rationale**: Data integrity is crucial. Database issues can cause data loss or corruption.

#### 5. API Endpoint Core Functionality
```typescript
// __tests__/api/upload.test.ts
describe('Upload API', () => {
  test('should process valid Excel file', () => {
    // Test complete flow: upload → parse → store → response
    // Test ImportBatch creation and status tracking
  });
  
  test('should reject invalid file formats', () => {
    // Test .txt, .pdf, corrupted files
    // Test files with wrong Excel structure
  });
  
  test('should handle data validation edge cases', () => {
    // Test files with negative values (should reject)
    // Test files with missing required fields
    // Test files with invalid data types
  });
  
  test('should handle import conflicts', () => {
    // Test uploading same file twice
    // Test partial import failures with rollback
    // Test concurrent uploads by same user
  });
  
  test('should track import metrics', () => {
    // Test validRows, skippedRows, errorSummary
    // Test processing time tracking
    // Test file size and row count tracking
  });
});
```

**Rationale**: API endpoints are the integration points. Failures here break the user experience.

### 🟡 TEST AFTER FEATURE COMPLETE (Medium Risk)
*Test once the feature is working end-to-end*

#### 1. Registration & Authentication UI
```typescript
// __tests__/components/RegistrationForm.test.tsx
describe('Registration Form Component', () => {
  test('should render invitation code input field', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/invitation code/i)).toBeInTheDocument();
  });
  
  test('should show error for invalid invitation code', () => {
    render(<RegistrationForm />);
    // Test form submission with invalid code
    expect(screen.getByText(/invalid invitation code/i)).toBeInTheDocument();
  });
  
  test('should handle registration success', () => {
    render(<RegistrationForm />);
    // Test successful registration flow
  });
});

// __tests__/components/AdminCodeManagement.test.tsx
describe('Admin Code Management', () => {
  test('should display invitation codes list', () => {
    render(<AdminCodeManagement />);
    // Test code list rendering, usage statistics
  });
  
  test('should allow code creation', () => {
    render(<AdminCodeManagement />);
    // Test new code generation form
  });
  
  test('should allow emergency code deactivation', () => {
    render(<AdminCodeManagement />);
    // Test instant code deactivation
  });
});
```

#### 2. React Component Rendering
```typescript
// __tests__/components/ProductChart.test.tsx
describe('ProductChart Component', () => {
  test('should render chart with product data', () => {
    render(<ProductChart productData={mockData} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
  
  test('should handle empty data gracefully', () => {
    render(<ProductChart productData={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
```

#### 2. Chart Data Formatting
```typescript
// __tests__/lib/chart-helpers.test.ts
describe('Chart Data Helpers', () => {
  test('should format data for Recharts', () => {
    // Test data transformation for chart consumption
  });
});
```

#### 3. Form Validation
```typescript
// __tests__/components/LoginForm.test.tsx
describe('Login Form', () => {
  test('should validate required fields', () => {
    // Test empty username, empty password
  });
  
  test('should show validation errors', () => {
    // Test error message display
  });
  
  test('should show account status messages', () => {
    // Test suspended/terminated account messages
  });
});

// __tests__/components/RegistrationForm.test.tsx
describe('Registration Form Validation', () => {
  test('should validate invitation code format', () => {
    // Test code format requirements
  });
  
  test('should enforce password complexity', () => {
    // Test uppercase, lowercase, number requirements
  });
  
  test('should validate email format', () => {
    // Test email format validation
  });
});
```

### 🟢 TEST AFTER PROJECT COMPLETE (Nice-to-Have)
*Test these if time permits after all features are working*

#### 1. Integration Tests
```typescript
// __tests__/integration/user-flow.test.ts
describe('Complete User Flow', () => {
  test('should complete login → upload → view dashboard flow', () => {
    // Test full application workflow
  });
});
```

#### 2. Performance Tests
```typescript
// __tests__/performance/large-dataset.test.ts
describe('Performance Tests', () => {
  test('should handle 990 products efficiently', () => {
    // Test dashboard performance with full dataset
  });
});
```

#### 3. Browser Compatibility Tests
```typescript
// Use Playwright for cross-browser testing
// Test in Chrome, Firefox, Safari if time permits
```

## Timeline Integration

### Days 1-2: Setup & Authentication
**Test During Development:**
- [ ] Authentication logic (login/register/session)
- [ ] Database schema and operations
- [ ] Password hashing and JWT generation

**After Feature Complete:**
- [ ] Login/Register form components
- [ ] Route protection middleware

### Days 2-3: Excel Import System
**Test During Development:**
- [ ] Excel parsing with null handling
- [ ] Data validation and error detection
- [ ] Inventory calculation formulas
- [ ] Database insertion with batch tracking

**After Feature Complete:**
- [ ] File upload component
- [ ] Upload API error handling
- [ ] User feedback and progress indicators

### Days 3-5: Dashboard & Visualization
**Test During Development:**
- [ ] Chart data aggregation API
- [ ] Product selection logic
- [ ] Data fetching operations

**After Feature Complete:**
- [ ] Chart component rendering
- [ ] Product selector component
- [ ] Dashboard layout and responsive design
- [ ] Multi-product comparison

### Days 5-7: Polish & Deploy
**Test After Project Complete:**
- [ ] Integration tests for complete workflows
- [ ] Performance tests with full dataset
- [ ] Deployment pipeline testing
- [ ] Browser compatibility validation

## Test Data Strategy

### Test Fixtures
Create reusable test data with invitation codes and user scenarios:

```typescript
// __tests__/fixtures/auth-data.ts
export const validInvitationCodes = [
  {
    code: "STORE01_2024",
    department: "Store 01",
    maxUses: 10,
    currentUses: 3,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true
  },
  {
    code: "MANAGER_2024",
    department: "Management",
    maxUses: 5,
    currentUses: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    isActive: true
  }
];

export const invalidInvitationCodes = [
  {
    code: "EXPIRED_CODE",
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    isActive: true
  },
  {
    code: "EXHAUSTED_CODE",
    maxUses: 5,
    currentUses: 5, // Fully used
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    code: "DEACTIVATED_CODE",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: false // Manually deactivated
  }
];

export const testUsers = [
  {
    username: "store01_manager",
    email: "manager@grocery.com",
    password: "SecurePass123",
    status: "ACTIVE",
    invitationCodeUsed: "STORE01_2024"
  },
  {
    username: "former_employee",
    email: "former@grocery.com",
    password: "OldPass123",
    status: "TERMINATED",
    invitationCodeUsed: "OLD_CODE_2023"
  }
];

// __tests__/fixtures/excel-data.ts
export const validExcelData = [
  {
    ID: "0000001",
    "Product Name": "Product A",
    "Opening Inventory": 100,
    "Procurement Qty (Day 1)": 50,
    "Procurement Price (Day 1)": 10.5,
    // ... complete structure
  }
];

export const edgeCaseExcelData = [
  // Null/empty values in various combinations
  { ID: "0000002", "Product Name": "Product B", "Opening Inventory": 50,
    "Procurement Qty (Day 1)": null, "Procurement Price (Day 1)": 15.75 },
  
  // Special characters and unicode
  { ID: "0000003", "Product Name": "CAFÉ AU LAIT 测试", "Opening Inventory": 25 },
  
  // Large numbers and precision
  { ID: "0000004", "Product Name": "High Value Item", "Opening Inventory": 999999,
    "Procurement Price (Day 1)": 1234.5678 },
  
  // Zero values
  { ID: "0000005", "Product Name": "Zero Stock Item", "Opening Inventory": 0 }
];
```

### Database Test Setup
```typescript
// __tests__/setup/database.ts
beforeEach(async () => {
  await db.registrationAudit.deleteMany();
  await db.importBatch.deleteMany();
  await db.dailyData.deleteMany();
  await db.product.deleteMany();
  await db.invitationCode.deleteMany();
  await db.user.deleteMany();
});

// Test constraint violations
const testConstraintViolations = async () => {
  // Test check constraints
  await expect(db.product.create({
    data: { productId: "TEST", productName: "", openingInventory: -5, userId: "test" }
  })).rejects.toThrow(); // Should fail due to constraints
};

// Setup invitation codes for testing
const setupTestInvitationCodes = async () => {
  await db.invitationCode.createMany({
    data: validInvitationCodes
  });
};

// Setup test users with different statuses
const setupTestUsers = async () => {
  for (const userData of testUsers) {
    await db.user.create({
      data: {
        ...userData,
        password: await hashPassword(userData.password)
      }
    });
  }
};
```

## Coverage Targets

- **Critical Functions**: 90%+ coverage
  - Excel parsing
  - Inventory calculations
  - Authentication
  - Database operations

- **UI Components**: 70%+ coverage
  - Chart components
  - Form components
  - Layout components

- **Integration**: 50%+ coverage
  - API routes
  - Complete user flows

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
```

## Success Metrics

### Must Pass Before Deployment
- [ ] All critical functionality tests passing
- [ ] No authentication security gaps
- [ ] Excel parsing handles all edge cases
- [ ] Mathematical calculations are accurate

### Quality Goals
- [ ] 85%+ overall test coverage
- [ ] All API endpoints tested
- [ ] Key user journeys covered
- [ ] Performance acceptable under load

## Emergency Fallback Strategy

If time runs short, prioritize in this order:
1. **Authentication tests** - Security cannot be compromised
2. **Excel parsing tests** - Core functionality must work, including edge case handling
3. **Calculation tests** - Business logic must be accurate, especially null-safe operations
4. **Database constraint tests** - Data integrity must be maintained
5. **Import conflict tests** - Multi-user scenarios must work correctly
6. **API tests** - Integration points must be reliable
7. **UI tests** - Visual components are lower priority

## Edge Case Testing Checklist

### Critical Edge Cases to Validate:
- [ ] Null/empty values in Excel data don't break calculations
- [ ] Negative inventory levels are allowed (oversold scenarios)
- [ ] Decimal precision maintained in currency calculations
- [ ] Database constraints prevent invalid data entry
- [ ] Import batch tracking works for debugging
- [ ] Duplicate uploads handled gracefully
- [ ] Large file processing doesn't timeout
- [ ] Special characters in product names preserved
- [ ] User data isolation maintained across imports

### Security & Access Control Edge Cases:
- [ ] Registration blocked without valid invitation code
- [ ] Expired invitation codes rejected appropriately
- [ ] Exhausted invitation codes (maxUses reached) rejected
- [ ] Deactivated invitation codes rejected immediately
- [ ] Suspended/terminated users cannot login
- [ ] JWT tokens include user status for route protection
- [ ] Admin can deactivate codes in emergency situations
- [ ] Rate limiting prevents registration/login abuse
- [ ] Audit trail captures all registration attempts
- [ ] Case-insensitive invitation code validation
- [ ] Code usage tracking increments correctly
- [ ] Bulk user deactivation by invitation code works
- [ ] Password complexity requirements enforced
- [ ] Email format validation works correctly

This enhanced strategy ensures comprehensive testing of edge cases while maintaining focus on the most critical system components.