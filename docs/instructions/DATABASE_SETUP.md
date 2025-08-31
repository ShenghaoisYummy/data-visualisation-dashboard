# Database Setup Guide

This project uses PostgreSQL with Prisma ORM. Follow these steps to set up the database for local development.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed

## Quick Start

1. **Start the database:**
   ```bash
   npm run db:start
   ```

2. **Initialize the schema:**
   ```bash
   npm run db:migrate
   ```

3. **Verify the setup:**
   ```bash
   npm run db:studio
   ```

## Available Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start PostgreSQL containers |
| `npm run db:stop` | Stop PostgreSQL containers |
| `npm run db:restart` | Restart PostgreSQL containers |
| `npm run db:reset` | Complete reset (destroys all data) |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:push` | Push schema changes without migrations |

## Database Configuration

- **Development DB:** `localhost:5432` - `data_viz_dashboard`
- **Test DB:** `localhost:5433` - `data_viz_dashboard_test`
- **Username:** `postgres`
- **Password:** `password`

## Troubleshooting

### Port Already in Use
If port 5432 is already in use:
```bash
# Stop any existing PostgreSQL services
sudo service postgresql stop
# Or change the port in docker-compose.yml
```

### Connection Issues
1. Ensure Docker containers are running: `docker ps`
2. Check container logs: `docker-compose logs postgres`
3. Verify environment variables in `.env` file

### Reset Everything
To completely reset the database:
```bash
npm run db:reset
```

## Development Workflow

1. Start database: `npm run db:start`
2. Make schema changes in `prisma/schema.prisma`
3. Create migration: `npm run db:migrate`
4. Start development: `npm run dev`

## Testing

The test database runs on a separate port (5433) to avoid conflicts with development data.

- Unit tests use mocked database
- Integration tests use the test database
- Run tests: `npm test`