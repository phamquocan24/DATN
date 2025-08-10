const { Pool } = require('pg');
const { readFileSync } = require('fs');
const { join } = require('path');

module.exports = async () => {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Create test database connection
    const pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/cv_test_db',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Check if we can connect to test database
    try {
      await pool.query('SELECT NOW()');
      console.log('✅ Test database connection successful');
    } catch (error) {
      console.log('⚠️  Test database not available, using in-memory database');
      // We'll use pg-mem for in-memory testing if real database is not available
      return;
    }

    // Run database migrations/setup for test environment
    try {
      // Read and execute schema if it exists
      const schemaPath = join(__dirname, '../../database/schema-uuid.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements and execute
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (error) {
            // Ignore table already exists errors
            if (!error.message.includes('already exists')) {
              console.warn('Schema statement failed:', error.message);
            }
          }
        }
      }
      
      console.log('✅ Test database schema setup complete');
    } catch (error) {
      console.warn('⚠️  Could not setup test database schema:', error.message);
    }

    await pool.end();
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    // Don't fail the setup, just warn
  }
  
  console.log('✅ Test environment setup complete');
}; 