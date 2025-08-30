#!/usr/bin/env node

/**
 * Dedicated seeder for Real World Jobs (003_real_world_jobs.sql)
 * Usage: node seed-jobs.js [options]
 * Options:
 *   --dry-run    Preview SQL without executing
 *   --force      Force execution even if jobs already exist
 *   --clean      Clean existing jobs from companies before seeding
 *   --stats      Show statistics after seeding
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../database.env') });

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'seed-jobs.log'),
      level: 'debug'
    })
  ]
});

class JobSeeder {
  constructor() {
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'userdb',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
    
    this.client = null;
    this.options = this.parseArgs();
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      dryRun: args.includes('--dry-run'),
      force: args.includes('--force'),
      clean: args.includes('--clean'),
      stats: args.includes('--stats'),
      help: args.includes('--help') || args.includes('-h')
    };
    
    return options;
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🏢 Real World Jobs Seeder
========================

Usage: node seed-jobs.js [options]

Options:
  --dry-run    Preview the SQL that would be executed without running it
  --force      Force execution even if jobs from these companies already exist
  --clean      Remove existing jobs from seed companies before adding new ones
  --stats      Show detailed statistics after seeding completion
  --help, -h   Show this help message

Examples:
  node seed-jobs.js                    # Normal seeding
  node seed-jobs.js --dry-run          # Preview what would be executed
  node seed-jobs.js --clean --stats    # Clean old data and show stats
  node seed-jobs.js --force            # Force overwrite existing data

Companies included:
  • VNG Corporation (Zalo, ZaloPay)
  • FPT Corporation (IT Services)
  • Vingroup (Conglomerate)
  • Sacombank (Banking)
  • Sendo (E-commerce)
  • Tiki (E-commerce)
  • Techcombank (Digital Banking)
  • Samsung Vietnam (Electronics)
  • MoMo (Fintech)
  • Shopee Vietnam (E-commerce)

Total jobs: 25+ realistic positions across all experience levels
    `);
  }

  /**
   * Connect to database
   */
  async connect() {
    this.client = new Client(this.dbConfig);
    
    try {
      await this.client.connect();
      logger.info('✅ Database connection established');
      
      // Test connection
      const result = await this.client.query('SELECT NOW() as current_time, version()');
      logger.info(`📅 Server time: ${result.rows[0].current_time}`);
      logger.debug(`🐘 PostgreSQL version: ${result.rows[0].version}`);
      
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    if (this.client) {
      await this.client.end();
      logger.info('🔌 Database connection closed');
    }
  }

  /**
   * Read SQL file content
   */
  readSQLFile() {
    const sqlFilePath = path.join(__dirname, 'seeds', '003_real_world_jobs.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`❌ SQL file not found: ${sqlFilePath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    logger.info(`📄 Loaded SQL file: ${sqlFilePath}`);
    logger.debug(`📏 SQL file size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
    
    return sqlContent;
  }

  /**
   * Check if companies from the seed already exist
   */
  async checkExistingData() {
    const checkQuery = `
      SELECT 
        company_name,
        tax_code,
        (SELECT COUNT(*) FROM jobs WHERE company_id = companies.company_id) as job_count
      FROM companies 
      WHERE tax_code IN (
        '0311457315', -- VNG
        '0100109106', -- FPT
        '0104958657', -- Vingroup
        '0300456116', -- Sacombank
        '0315133068', -- Sendo
        '0313428474', -- Tiki
        '0100101413', -- Techcombank
        '0309674842', -- Samsung
        '0313728397', -- MoMo
        '0315415459'  -- Shopee
      )
      ORDER BY company_name;
    `;

    try {
      const result = await this.client.query(checkQuery);
      
      if (result.rows.length > 0) {
        logger.warn('⚠️  Found existing companies from seed data:');
        result.rows.forEach(row => {
          logger.warn(`   📊 ${row.company_name} (${row.tax_code}): ${row.job_count} jobs`);
        });
        
        const totalJobs = result.rows.reduce((sum, row) => sum + parseInt(row.job_count), 0);
        logger.warn(`   📈 Total existing jobs: ${totalJobs}`);
        
        return { companies: result.rows, totalJobs };
      } else {
        logger.info('✅ No existing seed data found - safe to proceed');
        return { companies: [], totalJobs: 0 };
      }
    } catch (error) {
      logger.error('❌ Error checking existing data:', error.message);
      throw error;
    }
  }

  /**
   * Clean existing seed data
   */
  async cleanExistingData() {
    logger.info('🧹 Cleaning existing seed data...');
    
    const cleanQueries = [
      // Remove job skills first (foreign key constraints)
      `DELETE FROM job_skills 
       WHERE job_id IN (
         SELECT j.job_id FROM jobs j 
         JOIN companies c ON j.company_id = c.company_id 
         WHERE c.tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')
       )`,
      
      // Remove jobs
      `DELETE FROM jobs 
       WHERE company_id IN (
         SELECT company_id FROM companies 
         WHERE tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')
       )`,
      
      // Remove recruiter profiles
      `DELETE FROM recruiter_profiles 
       WHERE company_id IN (
         SELECT company_id FROM companies 
         WHERE tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')
       )`,
      
      // Remove user profiles for seed recruiters
      `DELETE FROM user_profile 
       WHERE user_id IN (
         SELECT user_id FROM users 
         WHERE email IN ('talent@vng.com.vn', 'hr@fpt.com.vn', 'careers@vingroup.net', 'recruitment@sacombank.com', 'jobs@sendo.vn', 'talent@tiki.vn', 'hr@techcombank.com', 'careers@samsung.com', 'talent@momo.vn', 'jobs@shopee.com')
       )`,
      
      // Remove users (recruiters)
      `DELETE FROM users 
       WHERE email IN ('talent@vng.com.vn', 'hr@fpt.com.vn', 'careers@vingroup.net', 'recruitment@sacombank.com', 'jobs@sendo.vn', 'talent@tiki.vn', 'hr@techcombank.com', 'careers@samsung.com', 'talent@momo.vn', 'jobs@shopee.com')`,
      
      // Remove companies
      `DELETE FROM companies 
       WHERE tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')`
    ];

    try {
      let totalDeleted = 0;
      
      for (const query of cleanQueries) {
        const result = await this.client.query(query);
        totalDeleted += result.rowCount || 0;
      }
      
      logger.info(`🗑️  Cleaned ${totalDeleted} records`);
      return totalDeleted;
    } catch (error) {
      logger.error('❌ Error cleaning existing data:', error.message);
      throw error;
    }
  }

  /**
   * Execute SQL content
   */
  async executeSeed(sqlContent) {
    if (this.options.dryRun) {
      logger.info('🔍 DRY RUN MODE - SQL Preview:');
      console.log('\n' + '='.repeat(80));
      console.log(sqlContent.substring(0, 1000) + (sqlContent.length > 1000 ? '\n... (truncated)' : ''));
      console.log('='.repeat(80) + '\n');
      logger.info(`📏 Total SQL length: ${sqlContent.length} characters`);
      return { success: true, dryRun: true };
    }

    try {
      logger.info('🚀 Executing seed SQL...');
      const startTime = Date.now();
      
      await this.client.query(sqlContent);
      
      const executionTime = Date.now() - startTime;
      logger.info(`✅ Seed execution completed in ${executionTime}ms`);
      
      return { success: true, executionTime };
    } catch (error) {
      logger.error('❌ SQL execution failed:', error.message);
      logger.error('🔍 SQL error details:', JSON.stringify(error, null, 2));
      if (error.position) {
        logger.error(`🎯 Error position in SQL: ${error.position}`);
      }
      throw error;
    }
  }

  /**
   * Show seeding statistics
   */
  async showStatistics() {
    const statsQueries = {
      companies: `SELECT COUNT(*) as count FROM companies WHERE tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')`,
      jobs: `SELECT COUNT(*) as count FROM jobs j JOIN companies c ON j.company_id = c.company_id WHERE c.tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')`,
      recruiters: `SELECT COUNT(*) as count FROM users WHERE email IN ('talent@vng.com.vn', 'hr@fpt.com.vn', 'careers@vingroup.net', 'recruitment@sacombank.com', 'jobs@sendo.vn', 'talent@tiki.vn', 'hr@techcombank.com', 'careers@samsung.com', 'talent@momo.vn', 'jobs@shopee.com')`,
      skills: `SELECT COUNT(*) as count FROM skills WHERE skill_name IN ('Java', 'Spring Framework', 'Microservices', 'Redis', 'Kafka', 'TensorFlow', 'Swift', 'Cybersecurity')`
    };

    const jobsByCompany = `
      SELECT 
        c.company_name,
        c.industry,
        COUNT(j.job_id) as job_count,
        AVG(j.salary_min) as avg_salary_min,
        AVG(j.salary_max) as avg_salary_max
      FROM companies c
      LEFT JOIN jobs j ON c.company_id = j.company_id
      WHERE c.tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')
      GROUP BY c.company_id, c.company_name, c.industry
      ORDER BY job_count DESC;
    `;

    const jobsByLevel = `
      SELECT 
        j.experience_level,
        COUNT(*) as count,
        AVG(j.salary_min) as avg_min_salary,
        AVG(j.salary_max) as avg_max_salary
      FROM jobs j 
      JOIN companies c ON j.company_id = c.company_id 
      WHERE c.tax_code IN ('0311457315', '0100109106', '0104958657', '0300456116', '0315133068', '0313428474', '0100101413', '0309674842', '0313728397', '0315415459')
      GROUP BY j.experience_level
      ORDER BY 
        CASE j.experience_level 
          WHEN 'JUNIOR' THEN 1
          WHEN 'MIDDLE' THEN 2
          WHEN 'SENIOR' THEN 3
          WHEN 'LEAD' THEN 4
          WHEN 'MANAGER' THEN 5
          ELSE 6
        END;
    `;

    try {
      logger.info('📊 Generating seeding statistics...');
      
      // Basic counts
      const counts = {};
      for (const [key, query] of Object.entries(statsQueries)) {
        const result = await this.client.query(query);
        counts[key] = parseInt(result.rows[0].count);
      }

      // Detailed statistics
      const companyStats = await this.client.query(jobsByCompany);
      const levelStats = await this.client.query(jobsByLevel);

      // Display results
      console.log('\n' + '='.repeat(60));
      console.log('📈 REAL WORLD JOBS SEEDING STATISTICS');
      console.log('='.repeat(60));
      
      console.log('\n📊 Summary:');
      console.log(`   🏢 Companies seeded: ${counts.companies}`);
      console.log(`   💼 Jobs created: ${counts.jobs}`);
      console.log(`   👥 Recruiters added: ${counts.recruiters}`);
      console.log(`   🔧 Skills added: ${counts.skills}`);

      console.log('\n🏢 Jobs by Company:');
      companyStats.rows.forEach(row => {
        const avgSalary = row.avg_salary_min && row.avg_salary_max 
          ? `${(row.avg_salary_min/1000000).toFixed(1)}-${(row.avg_salary_max/1000000).toFixed(1)}M VND`
          : 'N/A';
        console.log(`   📊 ${row.company_name}: ${row.job_count} jobs (${row.industry}) - Avg: ${avgSalary}`);
      });

      console.log('\n📈 Jobs by Experience Level:');
      levelStats.rows.forEach(row => {
        const avgSalary = row.avg_min_salary && row.avg_max_salary 
          ? `${(row.avg_min_salary/1000000).toFixed(1)}-${(row.avg_max_salary/1000000).toFixed(1)}M VND`
          : 'N/A';
        console.log(`   🎯 ${row.experience_level}: ${row.count} jobs - Avg: ${avgSalary}`);
      });

      console.log('\n' + '='.repeat(60) + '\n');

    } catch (error) {
      logger.error('❌ Error generating statistics:', error.message);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    if (this.options.help) {
      this.showHelp();
      return;
    }

    try {
      logger.info('🏢 Starting Real World Jobs Seeding...');
      
      // Connect to database
      await this.connect();
      
      // Check existing data
      const existing = await this.checkExistingData();
      
      // Handle existing data
      if (existing.totalJobs > 0 && !this.options.force && !this.options.clean) {
        logger.warn('⚠️  Existing seed data detected.');
        logger.warn('   Use --force to overwrite or --clean to remove first');
        logger.warn('   Use --dry-run to preview the SQL without executing');
        await this.disconnect();
        return;
      }
      
      // Clean existing data if requested
      if (this.options.clean && existing.totalJobs > 0) {
        await this.cleanExistingData();
      }
      
      // Read and execute SQL
      const sqlContent = this.readSQLFile();
      const result = await this.executeSeed(sqlContent);
      
      if (result.dryRun) {
        logger.info('🔍 Dry run completed - no changes made to database');
      } else {
        logger.info('✅ Real world jobs seeded successfully!');
        
        // Show statistics if requested
        if (this.options.stats) {
          await this.showStatistics();
        }
      }
      
    } catch (error) {
      logger.error('❌ Seeding failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Execute if called directly
if (require.main === module) {
  const seeder = new JobSeeder();
  seeder.run().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = JobSeeder;
