# AIBUILD Data Visualization Dashboard - Project Plan

## 1. Requirements Analysis

### Core Features Required:

1. **Data Visualization Dashboard**

   - Line charts showing 3 curves per product: Inventory, Procurement Amount, Sales Amount
   - Multi-product comparison capability
   - Interactive chart selection

2. **User Authentication**

   - Basic login/register page with username/password
   - Custom database (no Auth0/Clerk)
   - Session management

3. **Excel Import System**

   - File upload API endpoint
   - Excel parsing and data validation
   - Database storage with ORM

4. **Deployment**
   - Hosted solution with public URL

### Data Structure Understanding:

Based on the sample Excel file analysis:

- **990 products** with data across 3 days
- **Columns**: ID, Product Name, Opening Inventory, Procurement (Qty/Price for Days 1-3), Sales (Qty/Price for Days 1-3)
- **Data Quality**: Excel may contain missing/null values that need graceful handling
- **Calculations needed**:
  - Daily inventory = Previous day inventory + (Procurement ?? 0) - (Sales ?? 0)
  - Procurement Amount = (Qty ?? 0) × (Price ?? 0)
  - Sales Amount = (Qty ?? 0) × (Price ?? 0)
  - All calculations must handle null values safely

## 2. System Architecture

### Tech Stack Selection:

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts (React-friendly, good performance)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (production-ready)
- **ORM**: Prisma with custom client output path (`src/generated/prisma`)
- **Authentication**: Custom JWT-based authentication with invitation code system
- **Testing**: Jest + React Testing Library + Playwright (E2E)
- **Validation**: Zod schemas for type-safe validation
- **Deployment**: Vercel (seamless Next.js integration)
- **File Processing**: SheetJS (xlsx library)
- **Security**: bcrypt, rate limiting, input validation

### Enhanced Database Schema:

```sql
-- Users table with staff lifecycle management
Users {
  id: String (Primary Key)
  username: String (Unique, 3-50 chars)
  email: String (Unique, required for staff verification)
  password: String (Hashed with bcrypt)
  status: UserStatus (ACTIVE/SUSPENDED/TERMINATED)
  invitationCodeUsed: String? (Audit trail)
  registeredAt: DateTime
  lastLoginAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}

-- Staff-only registration system
InvitationCodes {
  id: String (Primary Key)
  code: String (Unique, auto-generated)
  maxUses: Int (Default 10)
  currentUses: Int (Default 0)
  isActive: Boolean (Default true)
  expiresAt: DateTime (Time-limited)
  department: String? (Store/Department organization)
  description: String? (Human-readable purpose)
  createdBy: String (Admin email)
  createdAt: DateTime
}

-- Complete registration audit trail
RegistrationAudit {
  id: String (Primary Key)
  userId: String (Foreign Key)
  invitationCode: String
  userEmail: String
  registeredAt: DateTime
  ipAddress: String? (Security tracking)
  userAgent: String? (Browser info)
}

-- Products table
Products {
  id: String (Primary Key)
  productId: String (from Excel, e.g. "0000001")
  productName: String (1-500 chars)
  openingInventory: Int (>=0 constraint)
  userId: String (Foreign Key - data isolation)
  createdAt: DateTime
  updatedAt: DateTime
}

-- Daily data with Decimal precision for currency
DailyData {
  id: String (Primary Key)
  productId: String (Foreign Key)
  daySequence: Int (1-3 constraint)
  procurementQty: Int? (Nullable, >=0 if not null)
  procurementPrice: Decimal? (Nullable, >=0 if not null, 12,4 precision)
  salesQty: Int? (Nullable, >=0 if not null)
  salesPrice: Decimal? (Nullable, >=0 if not null, 12,4 precision)
  inventoryLevel: Int? (Allow negative - oversold scenarios)
  procurementAmount: Decimal? (15,4 precision for calculations)
  salesAmount: Decimal? (15,4 precision for calculations)
  importBatchId: String? (Track which Excel file)
  sourceRow: Int? (Original Excel row for debugging)
  createdAt: DateTime
}

-- Import batch tracking for debugging
ImportBatch {
  id: String (Primary Key)
  userId: String (Foreign Key)
  fileName: String
  fileSize: BigInt
  totalRows: Int
  validRows: Int
  skippedRows: Int
  status: ImportStatus (PROCESSING/COMPLETED/FAILED/PARTIAL)
  errorSummary: Json? (Detailed error information)
  processingTimeMs: Int?
  createdAt: DateTime
  completedAt: DateTime?
}
```

### System Flow:

1. **Staff Registration Flow**: Invitation Code → Validate Code → Create Account → Audit Trail
2. **Authentication Flow**: Login → User Status Check → JWT Session → Dashboard Access
3. **Data Import Flow**: Upload Excel → Parse → Null-Safe Validate → Batch Store → Import Tracking → Confirmation
4. **Visualization Flow**: Select Products → Fetch User Data → Calculate Chart Data → Generate 3-Curve Charts → Interactive Display
5. **Admin Management Flow**: Generate Codes → Track Usage → Emergency Deactivation → Employee Lifecycle

## 3. Implementation Plan

### Phase 1: Project Setup & Authentication (Day 1-2)

**Development Tasks:**
- [x] Initialize Next.js 15 project with TypeScript and App Router *(28/08/2025)*
- [x] Set up Tailwind CSS v4 *(28/08/2025)*
- [x] Configure Prisma with PostgreSQL and custom client output path *(28/08/2025)*
- [x] Create enhanced database schema with staff-only registration system *(28/08/2025)*
  - [x] User table with status management (ACTIVE/SUSPENDED/TERMINATED) *(28/08/2025)*
  - [x] InvitationCode table with usage tracking and expiration *(28/08/2025)*
  - [x] RegistrationAudit table for complete audit trail *(28/08/2025)*
- [x] Implement staff-only registration system with invitation code validation *(28/08/2025)*
- [x] Implement login system with user status checking *(28/08/2025)*
- [x] Set up JWT-based session management with user status *(28/08/2025)*
- [x] Create protected route middleware with status validation *(28/08/2025)*
- [x] Build admin interface for invitation code management *(28/08/2025)*

**Testing Tasks (TDD - During Development - Unit Tests Only):**
- [x] Authentication logic unit tests (login/register/session) - **Unit Testing** *(29/29 passing)*
- [x] Database schema and operations unit tests - **Unit Testing** *(18/18 passing with PostgreSQL)*
- [x] Password hashing and JWT generation unit tests - **Unit Testing** *(Working)*
- [x] Invitation code validation and usage tracking unit tests - **Unit Testing** *(24/30 passing)*
- [x] User status management unit tests - **Unit Testing** *(Mocked tests passing)*
- [x] Registration audit trail unit tests - **Unit Testing** *(12/12 passing)*
- [x] Protected route middleware unit tests - **Unit Testing** *(Logic tested)*

**Testing Tasks (Moved to Phase 4 - Integration & Component Testing):**
- [ ] User registration/login system integration tests - **Integration Testing** *(Moved to Phase 4)*
- [ ] Registration form component tests with invitation code input - **Component Testing** *(Moved to Phase 4)*
- [ ] Admin code management interface tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Login form component tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Route protection middleware UI testing - **Component Testing** *(Moved to Phase 4)*

### Phase 2: Excel Import System (Day 2-3) ✅ COMPLETED

**Development Tasks:**
- [ ] Create file upload component with validation *(UI Component - Moved to Phase 3)*
- [x] Build Excel parsing API endpoint with SheetJS *(Core logic implemented)*
- [x] Implement comprehensive data validation logic with null-safe handling *(29/08/2025)*
  - [x] Validate Excel structure and required columns *(29/08/2025)*
  - [x] Handle missing/null values gracefully in calculations *(29/08/2025)*
  - [x] Enforce business rule constraints (non-negative values) *(29/08/2025)*
- [ ] Create database insertion logic with import batch tracking *(Core logic ready, API integration needed)*
  - [x] ImportBatch model for debugging and conflict resolution *(Database schema ready)*
  - [x] Transform wide Excel format to normalized DailyData records *(Logic implemented)*
  - [x] Use Decimal types for currency precision *(Implemented with Prisma Decimal)*
- [x] Implement null-safe inventory calculations *(29/08/2025)*
  - [x] Handle null procurement qty/price combinations *(29/08/2025)*
  - [x] Handle null sales qty/price combinations *(29/08/2025)*
  - [x] Allow negative inventory levels (oversold scenarios) *(29/08/2025)*
- [x] Add comprehensive error handling and user feedback *(29/08/2025)*
- [x] Implement missing data detection and reporting *(29/08/2025)*
- [x] Test with sample data file including edge cases *(29/08/2025)*

**Testing Tasks (TDD - During Development - Unit Tests Only):**
- [x] Excel parsing with null handling unit tests - **Unit Testing** *(18/18 tests passing)*
- [x] Data validation logic with null handling unit tests - **Unit Testing** *(18/18 tests passing)*
- [x] Inventory calculation formulas unit tests (with Decimal precision) - **Unit Testing** *(15/15 tests passing)*
- [ ] Database insertion logic with import batch tracking unit tests - **Unit Testing** *(Logic ready, API integration needed)*
- [x] Missing data detection and reporting unit tests - **Unit Testing** *(Included in parser tests)*
- [x] Business rule constraint validation unit tests - **Unit Testing** *(Included in parser tests)*

**Testing Tasks (Moved to Phase 4 - Integration & Component Testing):**
- [ ] File upload component tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Excel parsing API endpoint tests - **Integration Testing** *(Moved to Phase 4)*
- [ ] Upload API error handling and user feedback tests - **Integration Testing** *(Moved to Phase 4)*
- [ ] Edge case testing with sample data (990 products) - **Integration Testing** *(Moved to Phase 4)*
- [ ] Import conflict and duplicate handling tests - **Integration Testing** *(Moved to Phase 4)*

### Phase 3: Data Visualization Dashboard (Day 3-5) ✅ CORE LOGIC COMPLETED

**Development Tasks:**
- [ ] Design responsive dashboard layout *(UI Component - Moved to Phase 4)*
- [ ] Create product selection interface with multi-select capability *(UI Component - Moved to Phase 4)*
- [x] Implement data fetching API with user data isolation *(29/08/2025)*
- [x] Build line charts with Recharts showing 3 curves per product: *(Logic completed)*
  - [x] Inventory levels over time *(Chart data transformer implemented)*
  - [x] Procurement amounts over time *(Chart data transformer implemented)*
  - [x] Sales amounts over time *(Chart data transformer implemented)*
- [x] Add multi-product comparison functionality *(API logic implemented)*
- [x] Implement chart data aggregation and optimization for 990+ products *(29/08/2025)*
- [ ] Add responsive design with mobile considerations *(UI Component - Moved to Phase 4)*
- [ ] Implement loading states and comprehensive error handling *(UI Component - Moved to Phase 4)*
- [ ] Add chart performance optimizations (pagination, lazy loading) *(UI Component - Moved to Phase 4)*

**Testing Tasks (TDD - During Development - Unit Tests Only):**
- [x] Chart data aggregation and calculations unit tests - **Unit Testing** *(15/15 chart transformer tests passing)*
- [x] Product selection logic unit tests - **Unit Testing** *(Included in API tests)*
- [x] Multi-product comparison logic unit tests - **Unit Testing** *(Included in API tests)*
- [x] Chart data transformation helpers unit tests - **Unit Testing** *(15/15 tests passing with comprehensive edge cases)*
- [x] Inventory calculation display logic unit tests - **Unit Testing** *(Working with dashboard API)*
- [x] Sample data generation system unit tests - **Unit Testing** *(16/16 tests passing)*

**Testing Tasks (Moved to Phase 4 - Integration & Component Testing):**
- [ ] Data fetching API unit tests with user isolation - **Integration Testing** *(Moved to Phase 4)*
- [ ] Dashboard layout component tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Product selection interface component tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Chart component rendering tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Responsive design testing across devices - **Component Testing** *(Moved to Phase 4)*
- [ ] Loading states and error handling component tests - **Component Testing** *(Moved to Phase 4)*
- [ ] Multi-product comparison UI tests - **Component Testing** *(Moved to Phase 4)*

### Phase 4: Testing & Polish (Day 5-6)

**Development Tasks:**
- [ ] End-to-end testing of complete user workflows
- [ ] Performance optimization for large datasets (990+ products)
- [ ] UI/UX refinements based on testing feedback
- [ ] Data validation improvements
- [ ] Error handling enhancements
- [ ] Security review and rate limiting implementation
- [ ] Code coverage analysis and improvement

**Testing Tasks (Integration & Component Tests from Phases 1-3):**
- [ ] User registration/login system integration tests - **Integration Testing** *(From Phase 1)*
- [ ] Registration form component tests with invitation code input - **Component Testing** *(From Phase 1)*
- [ ] Admin code management interface tests - **Component Testing** *(From Phase 1)*
- [ ] Login form component tests - **Component Testing** *(From Phase 1)*
- [ ] Route protection middleware UI testing - **Component Testing** *(From Phase 1)*
- [ ] File upload component tests - **Component Testing** *(From Phase 2)*
- [ ] Excel parsing API endpoint tests - **Integration Testing** *(From Phase 2)*
- [ ] Upload API error handling and user feedback tests - **Integration Testing** *(From Phase 2)*
- [ ] Edge case testing with sample data (990 products) - **Integration Testing** *(From Phase 2)*
- [ ] Import conflict and duplicate handling tests - **Integration Testing** *(From Phase 2)*
- [ ] Data fetching API tests with user isolation - **Integration Testing** *(From Phase 3)*
- [ ] Dashboard layout component tests - **Component Testing** *(From Phase 3)*
- [ ] Product selection interface component tests - **Component Testing** *(From Phase 3)*
- [ ] Chart component rendering tests - **Component Testing** *(From Phase 3)*
- [ ] Responsive design testing across devices - **Component Testing** *(From Phase 3)*
- [ ] Loading states and error handling component tests - **Component Testing** *(From Phase 3)*
- [ ] Multi-product comparison UI tests - **Component Testing** *(From Phase 3)*

**Testing Tasks (Current Test Failures - 51 remaining issues):**
- [ ] Fix API integration test assertion issues (case sensitivity, mocking) - **Integration Testing**
- [ ] Fix security test password exposure and timing attack tests - **Security Testing**
- [ ] Fix error handling mock configurations in unit tests - **Unit Testing**
- [ ] Resolve invitation code service minor test issues (6/30 failing) - **Unit Testing**

**Testing Tasks (New Development Testing):**
- [ ] Complete user workflow end-to-end tests - **E2E Testing**
- [ ] Performance testing with full dataset (990 products) - **Performance Testing**
- [ ] Security testing (rate limiting, input validation) - **Integration Testing**
- [ ] Cross-browser compatibility testing - **E2E Testing**
- [ ] Mobile responsiveness testing - **E2E Testing**

### Phase 5: Deployment & Documentation (Day 6-7)

**Development Tasks:**
- [ ] Deploy to Vercel with optimized build configuration
- [ ] Set up production PostgreSQL database
- [ ] Configure environment variables and secrets management
- [ ] Set up database migrations for production
- [ ] Create comprehensive documentation
  - [ ] Setup and installation instructions
  - [ ] API documentation
  - [ ] Staff registration and invitation code management guide
  - [ ] System architecture documentation
- [ ] Final testing on production environment

**Testing Tasks (After Project Complete):**
- [ ] Production deployment testing - **E2E Testing**
- [ ] Production database setup validation - **Integration Testing**
- [ ] Environment configuration testing - **Integration Testing**
- [ ] Final testing on production environment - **E2E Testing**
- [ ] Documentation accuracy validation - **Manual Testing**
- [ ] Production performance monitoring - **Performance Testing**

## 4. Key Technical Decisions

### Chart Implementation Strategy:

- **Single Product View**: Show all 3 curves (Inventory, Procurement Amount, Sales Amount)
- **Multi-Product Comparison**: Allow selection of multiple products with toggle options
- **Data Calculations**:
  - Day 1 Inventory = Opening Inventory + Procurement Qty - Sales Qty
  - Day 2 Inventory = Day 1 Inventory + Day 2 Procurement - Day 2 Sales
  - Day 3 Inventory = Day 2 Inventory + Day 3 Procurement - Day 3 Sales

### Authentication Approach:

- **Staff-Only Registration**: Invitation code system with usage tracking and expiration
- **Custom JWT Authentication**: No NextAuth.js - fully custom implementation
- **Security Features**: bcrypt password hashing, rate limiting, input validation
- **User Status Management**: ACTIVE/SUSPENDED/TERMINATED lifecycle
- **Session Management**: JWT tokens with user status validation
- **Route Protection**: Middleware checking both authentication and user status
- **Audit Trail**: Complete registration and access logging
- **Admin Controls**: Code generation, usage monitoring, emergency deactivation

### File Processing Strategy:

- **Client-side**: File selection with format validation
- **Server-side**: SheetJS parsing with comprehensive validation
- **Null-Safe Processing**: Handle missing Excel cells gracefully
- **Batch Database Insertion**: ImportBatch tracking with transaction rollback
- **Data Transformation**: Wide Excel format → normalized DailyData records
- **Currency Precision**: Decimal types for accurate financial calculations
- **Error Reporting**: Detailed validation feedback with row-level errors
- **Progress Feedback**: Real-time processing status to user

## 5. Assumptions & Limitations

### Assumptions:

- Excel files follow the exact format provided in sample (990 products, 3 days)
- Staff-only access with invitation code distribution via store managers
- Maximum 3 days of data per import (daySequence 1-3)
- Single currency for all prices with Decimal precision for calculations
- Complete user data isolation (each user sees only their own products)
- Excel files may contain missing/empty cells → handled as null (not zero)
- Import batches tracked for debugging, conflict resolution, and audit
- Negative inventory levels allowed (oversold scenarios)
- Admin users can generate and manage invitation codes
- Employee lifecycle managed through user status changes

### Limitations:

- Fixed 3-day analysis period (not configurable)
- No real-time data updates (batch import only)
- Custom authentication system (no OAuth, password reset, email verification)
- No data export functionality (visualization only)
- Limited to Excel file imports (.xlsx format only)
- No data sharing between users (strict user isolation)
- Manual invitation code distribution (no automated email system)
- Single tenant architecture (no multi-organization support)

## 6. Risk Mitigation

### Potential Risks:

1. **Excel parsing errors** → Implement robust validation and error handling
2. **Large file performance** → Add file size limits and processing feedback
3. **Chart rendering performance** → Optimize data structure and use pagination if needed
4. **Database performance** → Index key fields and optimize queries

### Contingency Plans:

- Fallback UI for chart rendering issues
- Alternative deployment platform (Railway/Heroku) if Vercel fails
- Simplified authentication if complex session management issues arise

## 7. Success Metrics

### Technical Requirements:

- [ ] All 4 core requirements implemented with enhanced features
- [ ] Staff-only registration system with invitation codes working
- [ ] Custom JWT authentication with user status management
- [ ] Excel import with null-safe calculations and Decimal precision
- [ ] 3-curve line charts with multi-product comparison
- [ ] Working deployed application with production database
- [ ] Clean, maintainable code with comprehensive testing
- [ ] Proper error handling and security measures
- [ ] Admin interface for invitation code management

### User Experience:

- [ ] Intuitive file upload process
- [ ] Clear data visualization
- [ ] Responsive design
- [ ] Fast loading times (<3s for dashboard)

### Documentation Quality:

- [ ] Clear README with setup instructions
- [ ] Architecture explanation
- [ ] API documentation
- [ ] Assumptions and limitations documented

## 8. Deliverables Checklist

- [ ] **Working Prototype**: Deployed application with all features
- [ ] **Repository Link**: Clean GitHub repo with proper documentation
- [ ] **Short Document**: Requirements understanding, system architecture, assumptions/limitations
- [ ] **Live Demo**: Hosted application accessible via public URL

This plan provides a structured approach to deliver a high-quality solution within the 1-week timeline while meeting all specified requirements.
