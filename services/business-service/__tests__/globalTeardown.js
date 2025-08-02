const { Pool } = require('pg');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // If using real test database, clean up test data
    if (process.env.TEST_DATABASE_URL) {
      const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
        max: 1,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 2000,
      });

      try {
        // Clean up test data (be careful with this in real environments!)
        await pool.query('TRUNCATE TABLE test_results, applications, jobs, candidate_profiles, recruiter_profiles, companies, users CASCADE');
        console.log('✅ Test data cleaned up');
      } catch (error) {
        console.warn('⚠️  Could not clean up test data:', error.message);
      }

      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Test cleanup failed:', error.message);
  }
  
  console.log('✅ Test environment cleanup complete');
}; 