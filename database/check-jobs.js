const { Pool } = require('pg');
require('dotenv').config({ path: '../database.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'userdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkJobs() {
  try {
    const client = await pool.connect();
    
    // Check total jobs by status
    console.log('🔍 Checking jobs by status...');
    const statusStats = await client.query('SELECT COUNT(*) as total, status FROM jobs GROUP BY status ORDER BY total DESC');
    console.log('📊 Jobs by status:');
    statusStats.rows.forEach(r => {
      console.log(`  ${r.status}: ${r.total} jobs`);
    });
    
    // Check latest jobs
    console.log('\n🔍 Latest 10 jobs in database:');
    const latest = await client.query(`
      SELECT j.title, j.status, j.created_at, c.company_name 
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.company_id
      ORDER BY j.created_at DESC 
      LIMIT 10
    `);
    
    latest.rows.forEach((r, index) => {
      console.log(`${index + 1}. ${r.created_at.toISOString()} - "${r.title}" at ${r.company_name || 'Unknown'} (${r.status})`);
    });
    
    // Check jobs from our seeded companies
    console.log('\n🔍 Jobs from seeded companies:');
    const seededJobs = await client.query(`
      SELECT j.title, j.status, j.created_at, c.company_name 
      FROM jobs j
      JOIN companies c ON j.company_id = c.company_id
      WHERE c.company_name IN ('VNG Corporation Ltd', 'FPT Corporation', 'Vingroup Joint Stock Company', 'Samsung Electronics Vietnam Co., Ltd.', 'Shopee Vietnam Limited')
      ORDER BY j.created_at DESC
      LIMIT 20
    `);
    
    console.log(`📈 Found ${seededJobs.rowCount} jobs from seeded companies:`);
    seededJobs.rows.forEach((r, index) => {
      console.log(`${index + 1}. "${r.title}" at ${r.company_name} (${r.status}) - ${r.created_at.toISOString()}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  }
}

checkJobs();
