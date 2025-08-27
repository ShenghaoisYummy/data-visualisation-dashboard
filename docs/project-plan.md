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

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (React-friendly, good performance)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (production-ready)
- **ORM**: Prisma (excellent TypeScript support)
- **Authentication**: NextAuth.js with custom credentials
- **Deployment**: Vercel (seamless Next.js integration)
- **File Processing**: SheetJS (xlsx library)

### Database Schema:

```sql
-- Users table
Users {
  id: String (Primary Key)
  username: String (Unique)
  password: String (Hashed)
  createdAt: DateTime
}

-- Products table
Products {
  id: String (Primary Key)
  productId: String (from Excel)
  productName: String
  openingInventory: Int
  userId: String (Foreign Key)
  createdAt: DateTime
}

-- Daily data table
ProductDailyData {
  id: String (Primary Key)
  productId: String (Foreign Key)
  date: DateTime (Actual date instead of day number)
  daySequence: Int (1, 2, 3 for ordering within batch)
  procurementQty: Int? (Nullable - handle missing values)
  procurementPrice: Float? (Nullable - handle missing values)
  salesQty: Int? (Nullable - handle missing values)
  salesPrice: Float? (Nullable - handle missing values)
  inventoryLevel: Int? (Nullable if can't be calculated)
  procurementAmount: Float? (Nullable - handle null prices)
  salesAmount: Float? (Nullable - handle null prices)
  importBatchId: String? (Track which Excel file)
  sourceRow: Int? (Original Excel row for debugging)
  createdAt: DateTime
}
```

### System Flow:

1. **Authentication Flow**: Login → Session → Dashboard Access
2. **Data Import Flow**: Upload Excel → Parse → Validate → Store → Confirmation
3. **Visualization Flow**: Select Products → Fetch Data → Generate Charts → Interactive Display

## 3. Implementation Plan

### Phase 1: Project Setup & Authentication (Day 1-2)

- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure Prisma with PostgreSQL
- [ ] Create database schema
- [ ] Implement user registration/login system
- [ ] Set up session management
- [ ] Create protected route middleware

### Phase 2: Excel Import System (Day 2-3)

- [ ] Create file upload component
- [ ] Build Excel parsing API endpoint
- [ ] Implement data validation logic with null handling
- [ ] Create database insertion logic with import batch tracking
- [ ] Add error handling and user feedback
- [ ] Implement missing data detection and reporting
- [ ] Test with sample data file including edge cases

### Phase 3: Data Visualization Dashboard (Day 3-5)

- [ ] Design dashboard layout
- [ ] Create product selection interface
- [ ] Implement data fetching API
- [ ] Build line charts with Recharts
- [ ] Add multi-product comparison
- [ ] Implement responsive design
- [ ] Add loading states and error handling

### Phase 4: Testing & Polish (Day 5-6)

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] UI/UX refinements
- [ ] Data validation improvements
- [ ] Error handling enhancements

### Phase 5: Deployment & Documentation (Day 6-7)

- [ ] Deploy to Vercel
- [ ] Set up production database
- [ ] Environment configuration
- [ ] Create documentation
- [ ] Final testing on production

## 4. Key Technical Decisions

### Chart Implementation Strategy:

- **Single Product View**: Show all 3 curves (Inventory, Procurement Amount, Sales Amount)
- **Multi-Product Comparison**: Allow selection of multiple products with toggle options
- **Data Calculations**:
  - Day 1 Inventory = Opening Inventory + Procurement Qty - Sales Qty
  - Day 2 Inventory = Day 1 Inventory + Day 2 Procurement - Day 2 Sales
  - Day 3 Inventory = Day 2 Inventory + Day 3 Procurement - Day 3 Sales

### Authentication Approach:

- Custom credential-based authentication
- Bcrypt for password hashing
- JWT tokens for session management
- Middleware for protected routes

### File Processing Strategy:

- Client-side file selection
- Server-side processing with validation
- Batch database insertion
- Progress feedback to user

## 5. Assumptions & Limitations

### Assumptions:

- Excel files follow the exact format provided in sample
- Maximum 3 days of data per import
- Single currency for all prices
- Users manage their own product data (no sharing between users)
- Excel files may contain missing/empty cells which will be handled as null values
- Import batches will be tracked for data lineage and debugging

### Limitations:

- Fixed 3-day analysis period
- No real-time data updates
- Basic authentication (no password reset, email verification)
- No data export functionality
- Limited to Excel file imports only

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

- [ ] All 4 core requirements implemented
- [ ] Working deployed application
- [ ] Clean, maintainable code
- [ ] Proper error handling

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
