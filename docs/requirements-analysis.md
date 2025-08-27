# AIBUILD Requirements Analysis

## 1. Business Context & Problem Statement

### Client Situation:
- **Current State**: Retail client maintains inventory, procurement, and sales data in Excel sheets
- **Problem**: Cannot effectively analyze purchase trends, sales trends, and price changes
- **Goal**: Import Excel data into a system for visualization and trend analysis
- **Timeline**: "Over a few days" (specifically 3 days based on data structure)

### Success Criteria:
- Understand purchase trends over time
- Understand sales trends over time  
- Track price changes over consecutive days
- Compare multiple products simultaneously

## 2. Functional Requirements Breakdown

### 2.1 Data Visualization Dashboard (CORE REQUIREMENT)

#### Input Data Structure (from Excel):
```
- Product ID
- Product Name  
- Opening Inventory on Day 1
- Procurement Quantity and Price on Day 1, 2, 3
- Sales Quantity and Price on Day 1, 2, 3
```

#### Required Charts:
- **Chart Type**: Line chart (explicitly specified)
- **Chart Library**: "Of your choice" (flexibility given)
- **Data Points**: Must show 3 curves on the same chart:
  1. **Inventory for each day** (calculated)
  2. **Procurement Amount** (Qty × Price) 
  3. **Sales Amount** (Qty × Price)

#### Key Chart Features:
- ✅ **MUST**: Display all 3 curves on same line chart per product
- ✅ **MUST**: Show values over "several consecutive days" (3 days from data)
- ✅ **SHOULD**: Allow user to select products to compare (flexibility requirement)

#### Critical Calculations Needed:
```javascript
// Null-safe calculations (handle missing Excel data)
// Day 1
inventory_day1 = opening_inventory + (procurement_qty_day1 ?? 0) - (sales_qty_day1 ?? 0)
procurement_amount_day1 = (procurement_qty_day1 ?? 0) × (procurement_price_day1 ?? 0)  
sales_amount_day1 = (sales_qty_day1 ?? 0) × (sales_price_day1 ?? 0)

// Day 2  
inventory_day2 = inventory_day1 + (procurement_qty_day2 ?? 0) - (sales_qty_day2 ?? 0)
procurement_amount_day2 = (procurement_qty_day2 ?? 0) × (procurement_price_day2 ?? 0)
sales_amount_day2 = (sales_qty_day2 ?? 0) × (sales_price_day2 ?? 0)

// Day 3
inventory_day3 = inventory_day2 + (procurement_qty_day3 ?? 0) - (sales_qty_day3 ?? 0)  
procurement_amount_day3 = (procurement_qty_day3 ?? 0) × (procurement_price_day3 ?? 0)
sales_amount_day3 = (sales_qty_day3 ?? 0) × (sales_price_day3 ?? 0)

// Note: If both qty and price are null, amount should be null (not 0)
// Special handling: amount = (qty != null && price != null) ? qty × price : null
```

### 2.2 User Authentication System (CORE REQUIREMENT)

#### Authentication Requirements:
- ✅ **MUST**: Basic login page
- ✅ **MUST**: Username and password authentication
- ✅ **MUST**: Use your own database (not commercial services)
- ✅ **MUST NOT**: Use Auth0, Clerk, or similar services
- ✅ **NEW**: Staff-only registration with invitation codes
- ✅ **NEW**: Employee lifecycle management (active/suspended/terminated)

#### Staff-Only Registration System:
- **Invitation Code Validation**: Only valid codes allow registration
- **Code Management**: Expiration dates, usage limits, department tracking
- **Employee Security**: Account deactivation when staff leave
- **Audit Trail**: Track who registered with which code and when

#### Technical Implementation:
- Custom authentication system with invitation code validation
- Database storage for user credentials, invitation codes, and audit logs
- Session management with user status checking
- Protected routes for dashboard access
- Admin interface for invitation code management
- Employee lifecycle management (deactivation, suspension)

### 2.3 Excel Import System (CORE REQUIREMENT)

#### Import Requirements:
- ✅ **MUST**: Provide page for Excel file upload
- ✅ **MUST**: Provide API endpoint for file upload
- ✅ **MUST**: Parse uploaded Excel file
- ✅ **MUST**: Store data for visualization
- ✅ **MUST**: Use an ORM library

#### Expected Data Processing:
- Parse Excel with exact column structure from sample
- Validate data integrity with null value detection
- Transform data for storage with import batch tracking
- Handle parsing errors and missing data gracefully
- Report data completeness metrics to user

### 2.4 Deployment (CORE REQUIREMENT)

#### Deployment Requirements:
- ✅ **SHOULD**: Deploy to hosting platform of choice
- ✅ **MUST**: Provide link to deployed site
- Options: Any hosting platform (Vercel, Netlify, Railway, etc.)

## 3. Technical Requirements Analysis

### 3.1 Technology Constraints:
- ✅ **RECOMMENDED** (not required): NextJS, React, TypeORM/Prisma
- ✅ **FLEXIBLE**: Chart library choice
- ✅ **FLEXIBLE**: Database choice (just need ORM)
- ✅ **FLEXIBLE**: Hosting platform choice

### 3.2 Data Scale Expectations:
Based on sample file analysis:
- **990 products** in sample dataset
- **3 days** of historical data per product  
- **~15 columns** per product row
- **Performance consideration**: Dashboard must handle this scale effectively

## 4. Deliverables Requirements

### 4.1 Working Prototype:
- ✅ **MUST**: Deployed OR locally runnable
- ✅ **MUST**: All 4 core requirements implemented
- ✅ **MUST**: Functional end-to-end workflow

### 4.2 Repository:
- ✅ **MUST**: Provide link to code repository
- ✅ **IMPLIED**: Clean, readable code
- ✅ **IMPLIED**: Proper version control

### 4.3 Documentation:
- ✅ **MUST**: Short document describing:
  - Your understanding of requirements
  - System architecture (data flow, backend, frontend, database)
  - Any assumptions or limitations

## 5. Evaluation Criteria Analysis

### What They're Looking For:
1. **Requirements Analysis Clarity**: How well you understand what they asked for
2. **System Design**: How you organize data and design the system architecture  
3. **Delivery Execution**: Ability to deliver working solution
4. **Communication**: Explain your thought process clearly

### Success Indicators:
- All 4 core features work as specified
- Clean, logical system architecture
- Thoughtful handling of edge cases
- Clear documentation of decisions made

## 6. Critical Assumptions & Clarifications Needed

### 6.1 Confirmed Assumptions:
- Excel file structure matches sample exactly
- 3-day analysis period is sufficient (simplified to daySequence 1,2,3)
- Multi-user system with proper data isolation
- Real-time updates not required
- Import batches tracked for debugging and conflict resolution

### 6.2 Business Logic Clarifications:
- **Inventory Calculation**: Assume inventory carries forward day-to-day
- **Zero Values**: Sample data shows zeros - must handle gracefully
- **Null Values**: Missing Excel cells treated as null, not zero (affects calculations)
- **Negative Inventory**: Possible if sales > (inventory + procurement) - allow negative inventory levels
- **Price Units**: Assume consistent currency/units (use Decimal for precision)
- **Missing Data**: If critical fields are null, skip calculations but preserve raw data
- **Calculated Field Consistency**: Procurement/Sales amounts must match qty × price when both values exist
- **Data Validation**: Products must have valid IDs and names; quantities/prices cannot be negative

### 6.3 Staff Access & Security Logic:
- **Registration Restriction**: Only company staff can create accounts using invitation codes
- **Code Distribution**: Store managers receive codes to share with their team members
- **Employee Lifecycle**: Accounts remain active until manually deactivated by admin
- **Data Isolation**: Each user sees only their own uploaded data and analysis
- **Code Security**: Codes expire automatically, have usage limits, and can be emergency-deactivated
- **Audit Requirements**: Full tracking of who registered when, with which code, and from what location

### 6.3 UI/UX Assumptions:
- **Product Selection**: Multi-select interface for comparison
- **Chart Scaling**: Auto-scale Y-axis for different metrics (inventory vs amounts)
- **Responsive Design**: Should work on desktop (mobile not specified)

## 7. Risk Areas & Mitigation

### 7.1 High-Risk Areas:
1. **Excel Parsing**: Complex data structure with multiple day columns + null handling
   - *Mitigation*: Comprehensive validation pipeline with error reporting
2. **Chart Performance**: 990 products could impact rendering
   - *Mitigation*: Pagination, lazy loading, and optimized data structures
3. **Data Calculations**: Inventory math must be accurate with null-safe operations
   - *Mitigation*: Use Decimal types, business rule constraints, calculation validation
4. **Authentication Security**: Custom auth implementation
   - *Mitigation*: bcrypt hashing, JWT tokens, input validation, rate limiting
5. **Data Completeness**: Missing Excel data could break visualizations
   - *Mitigation*: Graceful degradation, null-safe calculations, user feedback

### 7.2 Medium-Risk Areas:
1. **Import Conflicts**: Multiple uploads, duplicate data, partial failures
   - *Mitigation*: Import batch tracking, conflict resolution strategies
2. **Database Constraints**: Schema violations, data type mismatches
   - *Mitigation*: Check constraints, proper data types, migration strategies
3. **File Upload Edge Cases**: Large files, corrupted data, wrong formats
   - *Mitigation*: File size limits, format validation, timeout handling
4. **Concurrent Access**: Multiple users, simultaneous imports
   - *Mitigation*: Database transactions, optimistic locking, user isolation
5. **Performance Degradation**: Large datasets, complex queries, memory usage
   - *Mitigation*: Database indexing, query optimization, resource monitoring
6. **Invitation Code Security**: Code sharing, unauthorized access, code theft
   - *Mitigation*: Time-limited codes, usage limits, audit logging, emergency deactivation
7. **Employee Departure**: Former employees retaining access, leaked codes
   - *Mitigation*: Regular account audits, code rotation, bulk deactivation by code

## 8. Definition of Done

### Feature Complete Criteria:
- [ ] Staff can register with valid invitation codes only
- [ ] User can login successfully (active accounts only)
- [ ] Admin can generate and manage invitation codes
- [ ] User can upload Excel file and see confirmation
- [ ] Dashboard shows products with 3-curve line charts
- [ ] User can select multiple products for comparison  
- [ ] All calculations are mathematically correct
- [ ] System is deployed and accessible via URL
- [ ] Documentation explains architecture and decisions

### Security Criteria:
- [ ] Registration blocked without valid invitation code
- [ ] Expired/exhausted codes rejected appropriately
- [ ] Suspended/terminated accounts cannot login
- [ ] Admin can deactivate codes in emergency situations
- [ ] Audit trail tracks all registration activities
- [ ] Rate limiting prevents registration/login abuse

### Quality Criteria:
- [ ] No critical bugs in happy path workflow
- [ ] Reasonable error handling for common issues
- [ ] Clean, maintainable code structure
- [ ] Performance acceptable for 990 products dataset
- [ ] Security measures don't impact user experience significantly

This analysis confirms that the project scope is substantial but achievable in one week with focused execution on the 4 core requirements.