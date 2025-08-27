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
  });
  
  test('should validate Excel structure', () => {
    // Test wrong columns, missing headers
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
  });
  
  test('should calculate procurement and sales amounts', () => {
    // (qty ?? 0) × (price ?? 0) with null handling
  });
});
```

**Rationale**: Mathematical accuracy is core to the business value. Incorrect calculations render the entire dashboard meaningless.

#### 3. Authentication/Session Management
```typescript
// __tests__/api/auth.test.ts
describe('Authentication API', () => {
  test('should register new user with hashed password', () => {
    // Test user creation, password hashing
  });
  
  test('should login with valid credentials', () => {
    // Test JWT generation, session creation
  });
  
  test('should reject invalid credentials', () => {
    // Test wrong username/password combinations
  });
  
  test('should protect authenticated routes', () => {
    // Test middleware functionality
  });
});
```

**Rationale**: Security is non-negotiable. Authentication bugs can compromise the entire application.

#### 4. Database Operations (CRUD)
```typescript
// __tests__/lib/database.test.ts
describe('Database Operations', () => {
  test('should create products and daily data', () => {
    // Test Prisma operations, foreign key relationships
  });
  
  test('should handle database constraints', () => {
    // Test unique constraints, required fields
  });
  
  test('should cascade delete operations', () => {
    // Test user deletion removes products and daily data
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
  });
  
  test('should reject invalid file formats', () => {
    // Test .txt, .pdf, corrupted files
  });
  
  test('should handle large files gracefully', () => {
    // Test file size limits, timeout handling
  });
});
```

**Rationale**: API endpoints are the integration points. Failures here break the user experience.

### 🟡 TEST AFTER FEATURE COMPLETE (Medium Risk)
*Test once the feature is working end-to-end*

#### 1. React Component Rendering
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
Create reusable test data that mirrors real Excel structure:

```typescript
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

export const invalidExcelData = [
  // Missing required fields
  // Null values in various combinations
  // Edge cases
];
```

### Database Test Setup
```typescript
// __tests__/setup/database.ts
beforeEach(async () => {
  await db.user.deleteMany();
  await db.product.deleteMany();
  await db.dailyData.deleteMany();
});
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
2. **Excel parsing tests** - Core functionality must work
3. **Calculation tests** - Business logic must be accurate
4. **API tests** - Integration points must be reliable
5. **UI tests** - Visual components are lower priority

This strategy ensures that even with time constraints, the most critical and error-prone parts of the application are thoroughly tested, while allowing flexibility for less critical components.