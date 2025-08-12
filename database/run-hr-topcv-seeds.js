#!/usr/bin/env node

/**
 * Database Seed Runner for HR@TopCV.com Jobs
 * Creates sample jobs for the HR Manager account
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file in database directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🌱 TopCV HR Jobs Seed Runner');
console.log('==========================\n');

// Database configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'userdb',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function runSeed() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Connecting to database...');
    console.log(`Database: ${process.env.POSTGRES_DB || 'userdb'}`);
    console.log(`Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
    console.log(`User: ${process.env.POSTGRES_USER || 'postgres'}\n`);

    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log(`✅ Connected successfully at: ${testResult.rows[0].now}\n`);

    // Check if required tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'companies', 'jobs', 'recruiter_profiles', 'job_skills', 'skills')
      ORDER BY table_name
    `);

    const existingTables = tablesCheck.rows.map(row => row.table_name);
    const requiredTables = ['users', 'companies', 'jobs', 'recruiter_profiles', 'job_skills', 'skills'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:', missingTables.join(', '));
      console.log('Please run database migrations first:');
      console.log('  cd database && node setup.js');
      return;
    }

    console.log('✅ All required tables exist\n');

    // Check if HR user exists
    const hrUserCheck = await client.query('SELECT user_id, email, full_name FROM users WHERE email = $1', ['hr@topcv.com']);
    
    if (hrUserCheck.rows.length === 0) {
      console.log('❌ HR user hr@topcv.com not found!');
      console.log('Please create HR account first:');
      console.log('  cd services/business-service && node create-admin-userdb.js');
      return;
    }

    const hrUser = hrUserCheck.rows[0];
    console.log('✅ Found HR user:');
    console.log(`   Email: ${hrUser.email}`);
    console.log(`   Name: ${hrUser.full_name}`);
    console.log(`   ID: ${hrUser.user_id}\n`);

    // Read and execute seed file
    console.log('📝 Running HR@TopCV jobs seed...');
    const seedFile = path.join(__dirname, 'seeds', '003_hr_topcv_jobs.sql');
    
    if (!fs.existsSync(seedFile)) {
      console.log('❌ Seed file not found:', seedFile);
      return;
    }

    const seedSQL = fs.readFileSync(seedFile, 'utf8');
    
    // Execute seed
    await client.query('BEGIN');
    
    try {
      await client.query(seedSQL);
      await client.query('COMMIT');
      
      console.log('✅ Seed executed successfully!\n');
      
      // Verify created jobs
      const jobsCheck = await client.query(`
        SELECT j.title, j.experience_level, j.employment_type, 
               j.salary_min, j.salary_max, j.status, c.company_name
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        JOIN users u ON j.recruiter_id = u.user_id
        WHERE u.email = 'hr@topcv.com'
        ORDER BY j.created_at DESC
      `);
      
      console.log('🎯 Created jobs summary:');
      console.log('========================');
      
      if (jobsCheck.rows.length === 0) {
        console.log('❌ No jobs found for HR@TopCV.com');
      } else {
        jobsCheck.rows.forEach((job, index) => {
          const salaryRange = `${(job.salary_min / 1000000).toFixed(0)}-${(job.salary_max / 1000000).toFixed(0)}M VND`;
          console.log(`${index + 1}. ${job.title}`);
          console.log(`   Company: ${job.company_name}`);
          console.log(`   Level: ${job.experience_level} | Type: ${job.employment_type}`);
          console.log(`   Salary: ${salaryRange} | Status: ${job.status}`);
          console.log('');
        });
        
        console.log(`✅ Total jobs created: ${jobsCheck.rows.length}\n`);
      }

      // Check skills assignment
      const skillsCheck = await client.query(`
        SELECT COUNT(*) as total_skills
        FROM job_skills js
        JOIN jobs j ON js.job_id = j.job_id
        JOIN users u ON j.recruiter_id = u.user_id
        WHERE u.email = 'hr@topcv.com'
      `);
      
      console.log(`🔧 Skills assigned: ${skillsCheck.rows[0].total_skills} job-skill relationships\n`);
      
      console.log('🎉 HR@TopCV.com jobs seeding completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Login to HR dashboard with hr@topcv.com / hr123!@#');
      console.log('2. Navigate to Test Management');
      console.log('3. Try creating AI-powered tests for these jobs');
      console.log('4. Test the AI question generation feature');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error running seed:', error.message);
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n👋 Gracefully shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the seed
runSeed().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
