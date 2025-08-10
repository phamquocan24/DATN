#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../database.env') });

const { Pool } = require('pg');
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
    new winston.transports.Console()
  ]
});

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  const dbName = process.env.POSTGRES_DB || 'userdb';
  const dbUser = process.env.POSTGRES_USER || 'cv_user';
  const dbPassword = process.env.POSTGRES_PASSWORD || 'cv_password';
  const dbHost = process.env.POSTGRES_HOST || 'localhost';
  const dbPort = process.env.POSTGRES_PORT || 5432;

  // Connect to postgres database to create our target database
  const adminDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;
  
  const adminPool = new Pool({
    connectionString: adminDbUrl,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    logger.info(`🔧 Checking if database "${dbName}" exists...`);
    
    // Check if database exists
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const checkResult = await adminPool.query(checkQuery, [dbName]);
    
    if (checkResult.rows.length > 0) {
      logger.info(`✅ Database "${dbName}" already exists`);
      return;
    }

    // Create database
    logger.info(`🚀 Creating database "${dbName}"...`);
    await adminPool.query(`CREATE DATABASE "${dbName}" WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8'`);
    
    logger.info(`✅ Database "${dbName}" created successfully`);

    // Test connection to the new database
    const testDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    const testPool = new Pool({
      connectionString: testDbUrl,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const testClient = await testPool.connect();
    await testClient.query('SELECT NOW()');
    testClient.release();
    await testPool.end();
    
    logger.info(`✅ Connection test to "${dbName}" successful`);

  } catch (error) {
    logger.error('❌ Database creation failed:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      logger.error('💡 PostgreSQL server is not running or not accessible');
      logger.error('💡 Please check:');
      logger.error('   - PostgreSQL service is running');
      logger.error('   - Connection parameters in database.env file');
      logger.error('   - Firewall settings');
    } else if (error.code === '28P01') {
      logger.error('💡 Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      logger.error('💡 Target database does not exist (this is expected for creation)');
    }
    
    throw error;
  } finally {
    await adminPool.end();
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await createDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createDatabase }; 