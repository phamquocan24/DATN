/**
 * Script to run Migration 004: Fix match_score column compatibility
 * This fixes the "column a.match_score does not exist" error
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running Migration 004: Fix match_score column compatibility...\n');

  // Database connection config
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'userdb'
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '004_fix_match_score_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration 004 completed successfully!');
    console.log('\n📊 Verifying database structure...');

    // Verify columns exist
    const checkColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications' 
      AND column_name IN ('match_score', 'ai_match_score')
      ORDER BY column_name
    `);

    if (checkColumns.rows.length === 2) {
      console.log('✅ Both match_score and ai_match_score columns exist:');
      checkColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Column verification incomplete. Found columns:');
      checkColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    }

    // Test the problematic query that was failing
    console.log('\n🧪 Testing the problematic query...');
    try {
      const testQuery = await client.query(`
        SELECT 
          a.application_id,
          COALESCE(a.ai_match_score, a.match_score) as match_score
        FROM applications a 
        LIMIT 1
      `);
      console.log('✅ COALESCE query works correctly');
    } catch (error) {
      console.log('❌ COALESCE query still failing:', error.message);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n📋 Next steps:');
    console.log('1. Restart business-service: cd services/business-service && npm start');
    console.log('2. Test the endpoint: GET /api/v1/applications/my-applications');
    console.log('3. Test CV loading: GET /api/v1/cvs/my-cvs');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
