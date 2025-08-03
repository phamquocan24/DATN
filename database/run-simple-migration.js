const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - trying different common configurations
const dbConfigs = [
  {
    user: process.env.POSTGRES_USER || 'cv_user',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'cv_recruitment',
    password: process.env.POSTGRES_PASSWORD || 'cv_password',
    port: process.env.POSTGRES_PORT || 5432,
  },
  {
    user: 'postgres',
    host: 'localhost',
    database: 'cv_recruitment',
    password: 'password',
    port: 5432,
  },
  {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  }
];

let pool = null;

async function connectDatabase() {
  console.log('🔍 Trying to connect to database...\n');
  
  for (let i = 0; i < dbConfigs.length; i++) {
    const config = dbConfigs[i];
    console.log(`🔗 Attempting connection ${i + 1}:`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    
    try {
      const testPool = new Pool(config);
      const client = await testPool.connect();
      client.release();
      
      console.log(`✅ Connection successful!\n`);
      pool = testPool;
      return config;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}\n`);
      continue;
    }
  }
  
  throw new Error('❌ All database connection attempts failed');
}

async function runMigration() {
  try {
    // Connect to database
    const config = await connectDatabase();
    console.log(`📊 Connected to database: ${config.database}\n`);

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_create_schema.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Execute migration
    console.log('🚀 Running migration...\n');
    const client = await pool.connect();
    
    try {
      await client.query(migrationSQL);
      console.log('✅ Migration executed successfully!\n');
      
      // Check if tables were created
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      
      console.log('📋 Tables created:');
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;