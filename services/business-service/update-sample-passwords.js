const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../database.env' });

// Database configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'userdb',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function updateSamplePasswords() {
  const client = await pool.connect();

  try {
    console.log('🔐 Updating sample account passwords...\n');

    // Define real passwords for sample accounts
    const accounts = [
      {
        email: 'hr@techsolutions.com',
        password: 'techsolutions123',
        name: 'Nguyễn Thị Mai (Tech Solutions HR)'
      },
      {
        email: 'recruiter@innovatetech.com', 
        password: 'innovate123',
        name: 'Trần Văn Nam (Innovate Tech Recruiter)'
      },
      {
        email: 'hiring@digitalcorp.com',
        password: 'digital123', 
        name: 'Lê Thị Hoa (Digital Corp HR)'
      }
    ];

    // Hash passwords and update database
    for (const account of accounts) {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(account.password, 12);
        
        // Update the user's password
        const updateQuery = `
          UPDATE users 
          SET password_hash = $1, updated_at = NOW()
          WHERE email = $2
          RETURNING email, full_name, role
        `;
        
        const result = await client.query(updateQuery, [hashedPassword, account.email]);
        
        if (result.rows.length > 0) {
          console.log(`✅ Updated password for: ${account.name}`);
          console.log(`   📧 Email: ${account.email}`);
          console.log(`   🔑 Password: ${account.password}`);
          console.log(`   👤 Role: ${result.rows[0].role}\n`);
        } else {
          console.log(`❌ User not found: ${account.email}\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${account.email}:`, error.message);
      }
    }

    // Verify the updates
    console.log('🔍 Verification - Checking updated accounts:');
    const verifyQuery = `
      SELECT email, full_name, role, is_active, created_at
      FROM users 
      WHERE email IN ('hr@techsolutions.com', 'recruiter@innovatetech.com', 'hiring@digitalcorp.com')
      ORDER BY email
    `;
    
    const verifyResult = await client.query(verifyQuery);
    verifyResult.rows.forEach(user => {
      console.log(`   ✓ ${user.email} | ${user.role} | ${user.full_name} | Active: ${user.is_active}`);
    });

    console.log('\n🎉 All sample passwords updated successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('1️⃣ hr@techsolutions.com / techsolutions123');
    console.log('2️⃣ recruiter@innovatetech.com / innovate123'); 
    console.log('3️⃣ hiring@digitalcorp.com / digital123');
    console.log('\n🌐 Test URL: http://localhost:5173/hr');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
updateSamplePasswords()
  .then(() => {
    console.log('\n✨ Password update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to update passwords:', error);
    process.exit(1);
  });
