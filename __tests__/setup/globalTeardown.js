const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('Cleaning up test environment...');
  
  // Clean up test database
  const dbPath = path.join(process.cwd(), 'test.db');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log('Test database cleaned up.');
    } catch (error) {
      console.warn('Failed to clean up test database:', error.message);
    }
  }
  
  console.log('Test environment cleanup complete.');
};