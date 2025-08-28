# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Data Visualization Dashboard** for an Asian grocery chain to analyze inventory, procurement, and sales trends from Excel imports. The application features staff-only registration with invitation codes, Excel data processing, and interactive multi-product trend charts.

**Core Business Logic**: Transform Excel data with 990+ products across few days into line charts showing inventory levels, procurement amounts, and sales amounts over time, with multi-product comparison capabilities.

## Essential Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack  
npm run start        # Start production server
npm run lint         # Run ESLint

# Database (Prisma)
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio for database inspection
npx prisma migrate dev # Create and apply database migrations
```

## System Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM  
- **Authentication**: Custom system with bcrypt + JWT (no external auth services)
- **Charts**: Recharts for data visualization
- **File Processing**: SheetJS (xlsx) for Excel parsing
- **Styling**: Tailwind CSS v4
- **Deployment**: Designed for Vercel

### Database Schema Concept
The system implements a **staff-only registration model** with invitation codes:

- **Users**: Staff accounts with status tracking (ACTIVE/SUSPENDED/TERMINATED)
- **InvitationCodes**: Time-limited codes with usage tracking and department organization
- **Products**: User-owned product data from Excel imports
- **DailyData**: 3-day time series data (inventory, procurement, sales) per product
- **ImportBatch**: Tracks Excel file imports for debugging and audit
- **RegistrationAudit**: Complete registration audit trail

**Key Schema Features**:
- Multi-user data isolation (each user sees only their products)
- Prisma client generates to `src/generated/prisma` (custom output location)
- Uses Decimal types for currency precision instead of Float
- Comprehensive business rule constraints and performance indexes

### Critical Data Processing Logic
Excel imports transform from wide format (Day 1, Day 2, Day 3 columns) to normalized daily records:

```
Excel Row → Multiple DailyData Records
Opening Inventory + Daily Procurement - Daily Sales = Running Inventory Level
(Qty × Price) calculations with null-safe arithmetic
```

**Null Handling**: Excel may contain empty cells - treat as null, not zero, which affects amount calculations.

## Project Structure Philosophy

- **App Router Pattern**: Next.js 13+ app directory structure
- **API-First Design**: All data operations through `/api` routes
- **Component Isolation**: Separate authentication, dashboard, and admin interfaces
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Security Focus**: Custom authentication with invitation code system

## Key Implementation Notes

### Authentication Flow
Custom credential-based system (NOT NextAuth despite dependency):
1. Staff registers with invitation code validation
2. bcrypt password hashing + JWT session tokens
3. Middleware protects routes based on user status
4. Employee lifecycle management (active/suspended/terminated)

### Excel Processing Pipeline
1. Client uploads Excel file
2. Server validates file structure and data types  
3. Parse using xlsx library with null-safe transformations
4. Calculate running inventory and amounts per day
5. Batch insert with import tracking for debugging

### Chart Architecture
- **Single Product**: 3 curves (inventory, procurement amount, sales amount)
- **Multi-Product Comparison**: User selects products for overlay comparison
- **Data Aggregation**: API endpoints pre-calculate chart data for performance
- **Responsive Design**: Charts adapt to different screen sizes

## Documentation Structure

Comprehensive project documentation in `/docs/`:
- `requirements-analysis.md`: Business requirements and edge cases
- `system-architecture-design.md`: Technical architecture with enhanced database schema  
- `testing-strategy.md`: TDD-lite testing approach prioritizing high-risk components
- `project-plan.md`: 7-day implementation timeline

## Development Patterns

### Data Validation Strategy
- **Frontend**: React Hook Form + Zod schemas
- **Backend**: Zod validation on all API endpoints
- **Database**: Prisma constraints + custom check constraints
- **Business Rules**: Prevent negative quantities/prices, enforce day sequence bounds (1-3)

### Error Handling Approach
- **Excel Import**: Detailed error reporting with row-level feedback
- **Authentication**: Rate limiting to prevent abuse
- **Database**: Graceful constraint violation handling
- **UI**: Loading states and error boundaries

### Performance Considerations  
- **Large Dataset**: 990+ products require pagination and optimized queries
- **Chart Rendering**: Lazy loading and virtualization for product lists
- **Database**: Strategic indexing for user isolation and time-series queries
- **File Processing**: Streaming for large Excel files
