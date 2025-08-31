# Data Visualization Dashboard

A comprehensive data visualization dashboard for an Asian grocery chain to analyze inventory, procurement, and sales trends from Excel imports. The application features staff-only registration with invitation codes, Excel data processing, and interactive multi-product trend charts.

## Features

- **Staff-Only Registration**: Invitation code-based user registration system
- **Excel Data Processing**: Import and transform Excel files with 990+ products
- **Interactive Charts**: Multi-product trend analysis with Recharts
- **Time Series Analysis**: Track inventory, procurement, and sales over time
- **Multi-User Support**: Data isolation per user account
- **Audit Trail**: Complete registration and import tracking

## Technology Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom bcrypt + JWT system
- **Charts**: Recharts for data visualization
- **File Processing**: SheetJS (xlsx) for Excel parsing
- **Styling**: Tailwind CSS v4
- **Testing**: Jest with React Testing Library
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker (for PostgreSQL database)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Start PostgreSQL with Docker
npm run db:start

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database (optional)
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
npm run db:start     # Start PostgreSQL container
npm run db:stop      # Stop PostgreSQL container
npm run db:restart   # Restart PostgreSQL container
npm run db:reset     # Reset database with fresh data
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema changes to database
```

### Testing
```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:unit    # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:api     # Run API tests only
```

### Production Deployment
```bash
npm run seed:production    # Seed production database
npm run deploy:production  # Run production setup script
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                # Utility functions and configurations
├── generated/prisma/   # Generated Prisma client
└── types/              # TypeScript type definitions

prisma/
├── schema.prisma       # Database schema
├── migrations/         # Database migration files
└── seed.ts            # Database seeding script

docs/                   # Project documentation
├── requirements-analysis.md
├── system-architecture-design.md
├── testing-strategy.md
└── project-plan.md
```

## Key Features

### Excel Data Import
Transform Excel files with wide format (Day 1, Day 2, Day 3 columns) into normalized daily records with inventory calculations:
- Opening Inventory + Daily Procurement - Daily Sales = Running Inventory Level
- Null-safe arithmetic for empty Excel cells
- Batch processing with import tracking

### Authentication System
- Custom invitation code system for staff registration
- bcrypt password hashing with JWT session tokens
- User lifecycle management (active/suspended/terminated)
- Route protection middleware

### Data Visualization
- **Single Product Charts**: 3 curves showing inventory, procurement, and sales amounts
- **Multi-Product Comparison**: Overlay multiple products for trend analysis
- **Responsive Design**: Charts adapt to different screen sizes
- **Performance Optimized**: Pre-calculated chart data for large datasets

## Environment Configuration

Create a `.env.local` file with:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Documentation

Comprehensive documentation is available in the `/docs/` directory:
- Business requirements and edge cases
- Technical architecture design
- Testing strategies and approaches
- Implementation timeline and project plan

## Contributing

1. Follow the existing code patterns and conventions
2. Run tests before submitting changes
3. Update documentation as needed
4. Follow the TypeScript and ESLint configurations

## License

Private project for Asian grocery chain inventory analysis.
