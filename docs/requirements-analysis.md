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
// Day 1
inventory_day1 = opening_inventory + procurement_qty_day1 - sales_qty_day1
procurement_amount_day1 = procurement_qty_day1 × procurement_price_day1  
sales_amount_day1 = sales_qty_day1 × sales_price_day1

// Day 2  
inventory_day2 = inventory_day1 + procurement_qty_day2 - sales_qty_day2
procurement_amount_day2 = procurement_qty_day2 × procurement_price_day2
sales_amount_day2 = sales_qty_day2 × sales_price_day2

// Day 3
inventory_day3 = inventory_day2 + procurement_qty_day3 - sales_qty_day3  
procurement_amount_day3 = procurement_qty_day3 × procurement_price_day3
sales_amount_day3 = sales_qty_day3 × sales_price_day3
```

### 2.2 User Authentication System (CORE REQUIREMENT)

#### Authentication Requirements:
- ✅ **MUST**: Basic login page
- ✅ **MUST**: Username and password authentication
- ✅ **MUST**: Use your own database (not commercial services)
- ✅ **MUST NOT**: Use Auth0, Clerk, or similar services

#### Technical Implementation:
- Custom authentication system
- Database storage for user credentials
- Session management
- Protected routes for dashboard access

### 2.3 Excel Import System (CORE REQUIREMENT)

#### Import Requirements:
- ✅ **MUST**: Provide page for Excel file upload
- ✅ **MUST**: Provide API endpoint for file upload
- ✅ **MUST**: Parse uploaded Excel file
- ✅ **MUST**: Store data for visualization
- ✅ **MUST**: Use an ORM library

#### Expected Data Processing:
- Parse Excel with exact column structure from sample
- Validate data integrity
- Transform data for storage
- Handle parsing errors gracefully

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
- 3-day analysis period is sufficient
- Single user system (no multi-tenancy mentioned)
- Real-time updates not required

### 6.2 Business Logic Clarifications:
- **Inventory Calculation**: Assume inventory carries forward day-to-day
- **Zero Values**: Sample data shows zeros - must handle gracefully
- **Negative Inventory**: Possible if sales > (inventory + procurement)
- **Price Units**: Assume consistent currency/units

### 6.3 UI/UX Assumptions:
- **Product Selection**: Multi-select interface for comparison
- **Chart Scaling**: Auto-scale Y-axis for different metrics (inventory vs amounts)
- **Responsive Design**: Should work on desktop (mobile not specified)

## 7. Risk Areas & Mitigation

### 7.1 High-Risk Areas:
1. **Excel Parsing**: Complex data structure with multiple day columns
2. **Chart Performance**: 990 products could impact rendering
3. **Data Calculations**: Inventory math must be accurate
4. **Authentication Security**: Custom auth implementation

### 7.2 Medium-Risk Areas:
1. **Deployment Configuration**: Environment setup
2. **Database Performance**: Queries for chart data
3. **File Upload Handling**: Large Excel files
4. **Cross-browser Compatibility**: Chart rendering

## 8. Definition of Done

### Feature Complete Criteria:
- [ ] User can register and login successfully
- [ ] User can upload Excel file and see confirmation
- [ ] Dashboard shows products with 3-curve line charts
- [ ] User can select multiple products for comparison  
- [ ] All calculations are mathematically correct
- [ ] System is deployed and accessible via URL
- [ ] Documentation explains architecture and decisions

### Quality Criteria:
- [ ] No critical bugs in happy path workflow
- [ ] Reasonable error handling for common issues
- [ ] Clean, maintainable code structure
- [ ] Performance acceptable for 990 products dataset

This analysis confirms that the project scope is substantial but achievable in one week with focused execution on the 4 core requirements.