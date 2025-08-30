# Deployment Guide

This guide covers deploying the Data Visualization Dashboard to Vercel with Neon PostgreSQL database.

## Prerequisites

- Vercel account
- Neon database account with a PostgreSQL instance
- Valid database connection string from Neon

## Environment Configuration

### Development Environment
Uses local PostgreSQL database via Docker:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/data_viz_dashboard"
```

### Production Environment  
Uses Neon PostgreSQL database:
```bash
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
```

## Deployment Steps

### 1. Prepare Database Connection

1. **Verify Neon Database Connection**
   ```bash
   # Test the connection string
   psql "your_neon_connection_string" -c "SELECT version();"
   ```

2. **Update Connection String**
   - Ensure the connection string format is correct
   - Verify credentials are active
   - Test connectivity from your local environment

### 2. Set up Production Database

1. **Using the automated script:**
   ```bash
   # Set your production DATABASE_URL
   export DATABASE_URL="your_neon_connection_string"
   
   # Run the production setup script
   npm run deploy:production
   ```

2. **Manual setup (if script fails):**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to production database
   DATABASE_URL="your_connection_string" npx prisma db push
   
   # Seed production data
   DATABASE_URL="your_connection_string" npm run seed:production
   ```

### 3. Configure Vercel Environment Variables

Set these environment variables in your Vercel project dashboard:

**Required Variables:**
```bash
DATABASE_URL="your_neon_connection_string"
JWT_SECRET="generate_32_character_secret"
NEXTAUTH_SECRET="generate_different_32_character_secret"
NEXTAUTH_URL="https://your-app-name.vercel.app"
NODE_ENV="production"
```

**Generate Secure Secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate NextAuth secret  
openssl rand -base64 32
```

### 4. Deploy to Vercel

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Import the project

2. **Configure Build Settings**
   - Framework: Next.js
   - Build command: `npm run build`
   - Install command: `npm install`
   - Root directory: `./`

3. **Deploy**
   - Deploy and monitor build logs
   - Verify successful deployment

## Post-Deployment Verification

### 1. Test Application Access
- Visit your deployed URL
- Test user registration with invitation codes
- Test login functionality

### 2. Test Database Operations
- Upload Excel file via the dashboard
- Verify data visualization charts
- Test multi-product comparisons

### 3. Test Admin Functions
- Login as admin user
- Manage invitation codes
- View user management interface

## Default Accounts

The seeded database includes these test accounts:

**Admin Account:**
- Username: `admin`
- Email: `admin@grocery.com`  
- Password: `AdminPass123`

**Store Manager:**
- Username: `store01_manager`
- Email: `manager@store01.grocery.com`
- Password: `StorePass123`

**Warehouse Supervisor:**
- Username: `warehouse_supervisor`
- Email: `supervisor@warehouse.grocery.com`
- Password: `WarePass123`

## Available Invitation Codes

- `ADMIN_BOOTSTRAP` - Admin access (4 uses left, expires in 1 year)
- `STORE01_2024` - Store staff (9 uses left, expires in 30 days)  
- `MANAGER_2024` - Management (4 uses left, expires in 60 days)
- `WAREHOUSE_2024` - Warehouse staff (14 uses left, expires in 45 days)

## Troubleshooting

### Database Connection Issues

1. **Authentication Failed**
   - Verify username and password in connection string
   - Ensure database user has proper permissions
   - Check if database is active in Neon console

2. **Connection Timeout**
   - Verify hostname and port in connection string
   - Check SSL requirements (`sslmode=require`)
   - Test from different network location

3. **Schema Sync Issues**
   - Run `npx prisma db push` to sync schema
   - Check for migration conflicts
   - Verify Prisma client is generated

### Build/Deployment Issues

1. **Environment Variable Missing**
   - Ensure all required variables are set in Vercel
   - Check for typos in variable names
   - Verify secrets are properly generated

2. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are installed
   - Test build locally: `npm run build`

3. **Runtime Errors**
   - Check function logs in Vercel
   - Verify database connectivity from production
   - Test API endpoints individually

## Security Notes

- **Never commit secrets to repository**
- **Use strong, unique secrets for production**
- **Regularly rotate JWT and auth secrets**
- **Monitor database access logs**
- **Keep dependencies updated**

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variable configuration
3. Test database connectivity
4. Review application error logs

For database issues:
1. Check Neon dashboard for database status
2. Verify connection string format
3. Test connectivity with psql
4. Review Prisma schema compatibility