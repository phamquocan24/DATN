const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Load config từ database.env (same as business service)
require('dotenv').config({ path: '../../database.env' });

// Database configuration matching business service
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'userdb',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function createAdminAccounts() {
  const client = await pool.connect();

  try {
    console.log('Creating admin and HR accounts in userdb...\n');
    console.log(`Connecting to: ${process.env.POSTGRES_DB || 'userdb'} database`);
    console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}`);
    console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}\n`);

    // Test connection first
    const testResult = await client.query('SELECT NOW()');
    console.log(`Connected to database at: ${testResult.rows[0].now}\n`);

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('Table "users" does not exist in userdb database');
      console.log('You need to run database migrations first.');
      console.log('Try running: cd database && node run-migration.js');
      return;
    }

    console.log('Users table exists, proceeding with account creation...\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123!@#', 12);
    const hrPassword = await bcrypt.hash('hr123!@#', 12);

    // Create Admin account
    const adminQuery = `
      INSERT INTO users (
        email, 
        password_hash, 
        phone, 
        full_name, 
        role, 
        auth_provider, 
        is_active,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING user_id, email, role;
    `;

    const adminResult = await client.query(adminQuery, [
      'admin@topcv.com',
      adminPassword,
      '+84901234567',
      'System Administrator',
      'ADMIN',
      'LOCAL',
      true
    ]);

    console.log('Admin account created/updated:');
    console.log(`Email: admin@topcv.com`);
    console.log(`Password: admin123!@#`);
    console.log(`Role: ADMIN`);
    console.log(`User ID: ${adminResult.rows[0].user_id}\n`);

    // Create HR account  
    const hrResult = await client.query(adminQuery, [
      'hr@topcv.com',
      hrPassword,
      '+84901234568',
      'HR Manager',
      'RECRUITER',
      'LOCAL',
      true
    ]);

    console.log('HR account created/updated:');
    console.log(`Email: hr@topcv.com`);
    console.log(`Password: hr123!@#`);
    console.log(`Role: RECRUITER (HR)`);
    console.log(`User ID: ${hrResult.rows[0].user_id}\n`);

    // Create user profiles if user_profile table exists
    const profileTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_profile'
    `);

    if (profileTableCheck.rows.length > 0) {
      const profileQuery = `
        INSERT INTO user_profile (
          user_id,
          profile_completed,
          account_status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          profile_completed = EXCLUDED.profile_completed,
          account_status = EXCLUDED.account_status,
          updated_at = NOW();
      `;

      await client.query(profileQuery, [adminResult.rows[0].user_id, true, 'ACTIVE']);
      await client.query(profileQuery, [hrResult.rows[0].user_id, true, 'ACTIVE']);

      console.log('User profiles created for both accounts\n');
    } else {
      console.log('user_profile table not found, skipping profile creation\n');
    }

    // Verify accounts were created
    const verifyQuery = `
      SELECT email, role, full_name, is_active 
      FROM users 
      WHERE email IN ('admin@topcv.com', 'hr@topcv.com')
      ORDER BY role
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('🔍 Verification - Created accounts:');
    verifyResult.rows.forEach(user => {
      console.log(`   ✓ ${user.email} | ${user.role} | ${user.full_name} | Active: ${user.is_active}`);
    });

    console.log('\nAll accounts created successfully!\n');
    console.log('Login Credentials:');
    console.log('1️ADMIN: admin@topcv.com / admin123!@#');
    console.log('2️HR: hr@topcv.com / hr123!@#'); 
    console.log('\nTest URLs:');
    console.log('   Admin Dashboard: http://localhost:5173/admin');
    console.log('   HR Dashboard: http://localhost:5173/hr\n');

  } catch (error) {
    console.error('Error creating accounts:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nDatabase connection failed. Please check:');
      console.log('   1. PostgreSQL is running');
      console.log('   2. Database userdb exists'); 
      console.log('   3. User postgres has access');
      console.log('   4. Connection details in database.env are correct');
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createAdminAccounts()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = createAdminAccounts;