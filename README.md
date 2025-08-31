# Data Visualization Dashboard

A comprehensive data visualization dashboard for an Asian grocery chain to analyze inventory, procurement, and sales trends from Excel imports. The application features staff-only registration with invitation codes, Excel data processing, and interactive multi-product trend charts.

## 🚀 Features

- **🔐 Staff-Only Registration**: Invitation code-based user registration system with lifecycle management
- **📊 Excel Data Processing**: Import and transform Excel files with 990+ products across multiple days
- **📈 Interactive Charts**: Multi-product trend analysis with Recharts visualization library
- **⏰ Time Series Analysis**: Track inventory levels, procurement amounts, and sales amounts over time
- **👥 Multi-User Support**: Complete data isolation per user account with role-based access
- **🔍 Audit Trail**: Complete registration and import tracking with detailed error reporting
- **🏗️ Enterprise Architecture**: Built with Next.js 15, TypeScript, and PostgreSQL for scalability
- **🧪 Comprehensive Testing**: Unit, integration, API, and E2E tests with 87% coverage

## 🛠️ Technology Stack

### Core Framework

- **Framework**: Next.js 15 (App Router) with TypeScript 5.x
- **Runtime**: Node.js 18+ with Turbopack for development
- **Package Manager**: npm with lock file for reproducible builds

### Database & ORM

- **Database**: PostgreSQL 15 with Docker containerization
- **ORM**: Prisma 6.14+ with custom client generation to `src/generated/prisma`
- **Migrations**: Prisma migrate with development and production workflows
- **Data Types**: Decimal precision for currency, proper null handling

### Authentication & Security

- **Authentication**: Custom bcrypt + JWT system (no external auth providers)
- **Authorization**: Role-based middleware with user lifecycle management
- **Security**: Rate limiting, input validation with Zod schemas
- **Session Management**: HTTP-only cookies with secure token storage

### Frontend & UI

- **Charts**: Recharts 3.1+ for responsive data visualization
- **Styling**: Tailwind CSS v4 with Inter font family
- **Forms**: React Hook Form with Zod resolvers
- **Components**: Custom UI components with TypeScript interfaces

### File Processing & Data

- **Excel Processing**: SheetJS (xlsx) 0.18+ with streaming support
- **Data Validation**: Zod 4.1+ for runtime type checking
- **File Upload**: Custom upload handling with batch processing
- **Data Transformation**: Null-safe arithmetic for inventory calculations

### Testing & Quality

- **Unit Testing**: Jest 30+ with React Testing Library
- **Integration Testing**: Custom API test suite with Supertest
- **E2E Testing**: Playwright with multi-browser support
- **Code Coverage**: 87% coverage with detailed reporting
- **Linting**: ESLint 9 with Next.js configuration

### Deployment & DevOps

- **Deployment**: Vercel-optimized with custom build configuration
- **Containerization**: Docker Compose for local PostgreSQL
- **CI/CD**: Comprehensive test scripts with parallel execution
- **Monitoring**: Import batch tracking and error reporting

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.0+ (LTS recommended)
- **Docker**: Latest version for PostgreSQL containerization
- **Package Manager**: npm (included with Node.js)
- **Git**: For version control and cloning

### Quick Start

1. **Clone the repository**

```bash
git clone <repository-url>
cd data-visualisation-dashboard
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/data_viz_dashboard"

# Authentication Secrets (generate secure random strings)
JWT_SECRET="your-super-secure-jwt-secret-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Test Database
DATABASE_TEST_URL="postgresql://postgres:password@localhost:5433/data_viz_dashboard_test"
```

4. **Database Setup**

```bash
# Start PostgreSQL containers (development + test)
npm run db:start

# Wait for containers to be ready, then run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database with sample data (optional)
npm run db:seed
```

5. **Start Development Server**

```bash
npm run dev
```

6. **Access the Application**

- Open [http://localhost:3000](http://localhost:3000) in your browser
- Register using an invitation code (check seeded data or create one via admin)
- Upload Excel files and visualize your data

### Docker Database Management

The project uses Docker Compose to manage PostgreSQL instances:

```bash
# Start both development and test databases
npm run db:start

# Stop databases
npm run db:stop

# Restart databases
npm run db:restart

# Reset database with fresh schema and data
npm run db:reset
```

### First-Time Setup Verification

After setup, verify everything works:

```bash
# Run all tests to ensure setup is correct
npm run test

# Check database connection
npm run db:studio  # Opens Prisma Studio at http://localhost:5555

# Verify build process
npm run build
```

## 📋 Available Scripts

### Development Commands

```bash
npm run dev          # Start development server with Turbopack (fast refresh)
npm run build        # Build for production with optimizations
npm run start        # Start production server
npm run lint         # Run ESLint with Next.js configuration
```

### Database Management

```bash
# Container Management
npm run db:start     # Start PostgreSQL containers (dev + test)
npm run db:stop      # Stop PostgreSQL containers
npm run db:restart   # Restart PostgreSQL containers
npm run db:reset     # Reset database with fresh schema and data

# Schema & Data Management
npm run db:migrate   # Create and apply Prisma migrations
npm run db:generate  # Generate Prisma client after schema changes
npm run db:push      # Push schema changes directly to database
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:seed      # Seed database with sample data
```

### Testing Suite

```bash
# Jest Testing
npm run test              # Run all Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:api          # Run API tests only

# End-to-End Testing
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run E2E tests with UI mode
npm run test:all          # Run comprehensive test suite (all types)
```

### Production & Deployment

```bash
npm run seed:production    # Seed production database
npm run deploy:production  # Run production setup script
```

### Utility Commands

```bash
npx prisma studio         # Alternative way to open Prisma Studio
npx prisma db push        # Direct schema push (development only)
npx playwright test --ui  # Interactive E2E test runner
```

## 🏗️ Project Structure

```
data-visualisation-dashboard/
├── src/                          # Application source code
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/              # Authentication routes group
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   ├── admin/               # Admin dashboard
│   │   ├── api/                 # API routes
│   │   │   ├── admin/           # Admin API endpoints
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── dashboard/       # Dashboard data endpoints
│   │   │   └── upload/          # File upload endpoint
│   │   ├── dashboard/           # Main dashboard page
│   │   ├── upload/              # File upload page
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   ├── ConfirmationDialog.tsx
│   │   ├── FileUpload.tsx       # Excel file upload component
│   │   ├── ProductChart.tsx     # Chart visualization component
│   │   └── ProductSelector.tsx  # Multi-product selection
│   ├── lib/                     # Utility functions and services
│   │   ├── auth.ts              # Authentication service
│   │   ├── database.ts          # Database connection
│   │   ├── excel-parser.ts      # Excel file processing
│   │   ├── chart-data-transformer.ts # Chart data preparation
│   │   ├── inventory-calculator.ts   # Business logic
│   │   ├── invitation-codes.ts  # Invitation code management
│   │   ├── data-validator.ts    # Input validation
│   │   └── utils.ts             # General utilities
│   ├── generated/               # Generated code
│   │   └── prisma/              # Prisma client (custom location)
│   └── middleware.ts            # Route protection middleware
├── prisma/                      # Database configuration
│   ├── schema.prisma            # Database schema definition
│   ├── migrations/              # Database migration history
│   └── seed.ts                  # Database seeding script
├── __tests__/                   # Test suites
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── api/                     # API endpoint tests
│   ├── e2e/                     # End-to-end tests
│   ├── fixtures/                # Test data and mocks
│   └── setup/                   # Test configuration
├── docs/                        # Project documentation
│   ├── requirements-analysis.md # Business requirements
│   ├── system-architecture-design.md # Technical architecture
│   ├── testing-strategy.md      # Testing approach
│   ├── project-plan.md          # Implementation timeline
│   └── deployment-guide.md      # Deployment instructions
├── scripts/                     # Utility scripts
├── coverage/                    # Test coverage reports
├── docker-compose.yml           # PostgreSQL container setup
├── vercel.json                  # Vercel deployment configuration
├── jest.config.js               # Jest testing configuration
├── playwright.config.ts         # Playwright E2E configuration
├── next.config.ts               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

### Key Architecture Decisions

- **App Router**: Uses Next.js 15 App Router for file-based routing
- **Custom Prisma Location**: Client generated to `src/generated/prisma` for better organization
- **Route Groups**: Authentication routes grouped with `(auth)` for clean URLs
- **Middleware Protection**: Centralized route protection and user context injection
- **Component Isolation**: Separate UI components from business logic components
- **Test Organization**: Structured by test type with shared fixtures and setup

## 🔑 Key Features Deep Dive

### 📊 Excel Data Import & Processing

Transform Excel files with wide format into normalized time-series data:

**Data Transformation Pipeline:**

- **Input**: Excel files with Day 1, Day 2, Day 3 columns (990+ products)
- **Processing**: Wide format → Normalized daily records
- **Calculations**: `Opening Inventory + Daily Procurement - Daily Sales = Running Inventory Level`
- **Precision**: Decimal arithmetic for currency calculations (no floating-point errors)
- **Null Handling**: Proper null-safe arithmetic for empty Excel cells
- **Batch Tracking**: Complete import audit trail with error reporting
- **Performance**: Streaming processing for large files

**Business Logic:**

```
Product Row → Multiple DailyData Records
├── Day 1: Inventory Level, Procurement Amount, Sales Amount
├── Day 2: Updated Inventory Level, Procurement Amount, Sales Amount
└── Day 3: Final Inventory Level, Procurement Amount, Sales Amount

Amount Calculations:
├── Procurement Amount = Procurement Qty × Procurement Price
├── Sales Amount = Sales Qty × Sales Price
└── Inventory Level = Previous Level + Procurement Qty - Sales Qty
```

### 🔐 Staff-Only Authentication System

Enterprise-grade authentication with invitation-based registration:

**Registration Flow:**

- **Invitation Codes**: Time-limited codes with usage tracking
- **Department Organization**: Codes linked to specific departments/stores
- **Usage Limits**: Configurable max uses per code (default: 10)
- **Expiration**: Automatic code expiration with cleanup
- **Audit Trail**: Complete registration tracking with IP and user agent

**User Lifecycle Management:**

- **ACTIVE**: Full system access
- **SUSPENDED**: Temporary access restriction
- **TERMINATED**: Account disabled, data preserved

**Security Features:**

- **bcrypt**: Password hashing with salt rounds
- **JWT**: Secure session tokens with expiration
- **Middleware**: Route-level protection and user context injection
- **Rate Limiting**: Prevent brute force attacks

### 📈 Advanced Data Visualization

Interactive charts built with Recharts for comprehensive data analysis:

**Chart Types:**

- **Single Product View**: 3-curve analysis (inventory, procurement, sales)
- **Multi-Product Comparison**: Overlay up to N products for trend analysis
- **Time Series**: Day-by-day progression with smooth curves
- **Responsive Design**: Adaptive layouts for mobile and desktop

**Performance Optimizations:**

- **Pre-calculated Data**: API endpoints aggregate chart data
- **Lazy Loading**: Components load on demand
- **Virtualization**: Handle large product lists efficiently
- **Caching**: Optimized database queries with proper indexing

**Interactive Features:**

- **Product Selection**: Multi-select dropdown with search
- **Zoom & Pan**: Detailed time period analysis
- **Tooltips**: Hover data with precise values
- **Export**: Chart data export capabilities

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/data_viz_dashboard"

# Authentication Secrets (generate secure random strings)
JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"
NEXTAUTH_SECRET="your-nextauth-secret-for-compatibility"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Test Database (for running tests)
DATABASE_TEST_URL="postgresql://postgres:password@localhost:5433/data_viz_dashboard_test"

# Optional: Development Settings
NODE_ENV="development"
SKIP_ENV_VALIDATION="false"
```

### Environment Variable Details

| Variable            | Required | Description                                 | Example                                |
| ------------------- | -------- | ------------------------------------------- | -------------------------------------- |
| `DATABASE_URL`      | ✅       | PostgreSQL connection string                | `postgresql://user:pass@host:port/db`  |
| `JWT_SECRET`        | ✅       | Secret for JWT token signing (min 32 chars) | `your-super-secure-random-string-here` |
| `NEXTAUTH_SECRET`   | ✅       | NextAuth compatibility secret               | `another-secure-random-string`         |
| `NEXTAUTH_URL`      | ✅       | Application base URL                        | `http://localhost:3000`                |
| `DATABASE_TEST_URL` | ❌       | Test database connection                    | `postgresql://...test_db`              |
| `NODE_ENV`          | ❌       | Environment mode                            | `development` / `production`           |

### Security Best Practices

1. **Generate Strong Secrets**: Use `openssl rand -base64 32` for secure random strings
2. **Never Commit Secrets**: Add `.env.local` to `.gitignore`
3. **Production Secrets**: Use environment-specific secret management
4. **Rotate Regularly**: Update JWT secrets periodically in production

### Docker Environment

The Docker Compose setup automatically configures:

- **Development DB**: `localhost:5432` → `data_viz_dashboard`
- **Test DB**: `localhost:5433` → `data_viz_dashboard_test`
- **Credentials**: `postgres` / `password` (development only)

## 📚 Documentation

Comprehensive project documentation is available in the `/docs/` directory:

| Document                                                              | Description                                 | Key Topics                               |
| --------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| [`requirements-analysis.md`](docs/requirements-analysis.md)           | Business requirements and edge cases        | User stories, data flow, business rules  |
| [`system-architecture-design.md`](docs/system-architecture-design.md) | Technical architecture and design decisions | Database schema, API design, security    |
| [`testing-strategy.md`](docs/testing-strategy.md)                     | Testing approach and methodologies          | Unit tests, integration tests, E2E tests |
| [`project-plan.md`](docs/project-plan.md)                             | Implementation timeline and milestones      | 7-day development plan, deliverables     |
| [`deployment-guide.md`](docs/deployment-guide.md)                     | Production deployment instructions          | Vercel setup, environment configuration  |

### Additional Resources

- **[CLAUDE.md](CLAUDE.md)**: AI assistant guidance for code development
- **API Documentation**: Available via code comments and TypeScript interfaces
- **Database Schema**: Documented in `prisma/schema.prisma` with detailed comments
- **Test Coverage**: View reports in `coverage/lcov-report/index.html` after running tests

## 📄 License

Private project for Asian grocery chain inventory analysis. All rights reserved.

---

**Built with ❤️ using Next.js 15, TypeScript, and PostgreSQL**
