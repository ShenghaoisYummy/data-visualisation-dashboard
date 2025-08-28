const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
  
  // Clean up any existing test database
  const dbPath = path.join(process.cwd(), 'test.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  // Generate Prisma client for testing
  try {
    console.log('Generating Prisma client for testing...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Pushing database schema to test database...');
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });
    
    console.log('Test environment setup complete.');
  } catch (error) {
    console.error('Failed to set up test database:', error);
    throw error;
  }
};