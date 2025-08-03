const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'userdb',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationFile = path.join(__dirname, 'migrations', '002_add_firebase_columns.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

    // Execute migration
    console.log('🚀 Running Firebase columns migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('firebase_uid', 'is_email_verified', 'profile_image_url')
      ORDER BY column_name;
    `);

    console.log('📋 Firebase columns added:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();