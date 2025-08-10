#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../database.env') });

const { dbConfig } = require('./config');
const { createDatabase } = require('./create-database');
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
    new winston.transports.Console()
  ]
});

/**
 * Database Setup Script
 */
class DatabaseSetup {
  constructor() {
    this.commands = {
      'create-db': this.createDatabaseOnly.bind(this),
      init: this.initialize.bind(this),
      migrate: this.migrate.bind(this),
      seed: this.seed.bind(this),
      reset: this.reset.bind(this),
      stats: this.showStats.bind(this),
      test: this.testConnection.bind(this),
      help: this.showHelp.bind(this)
    };
  }

  /**
   * Parse command line arguments
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const options = {};

    // Parse options
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value || true;
      }
    }

    return { command, options };
  }

  /**
   * Create database only (without migrations/seeds)
   */
  async createDatabaseOnly() {
    try {
      logger.info('🚀 Creating database...');
      await createDatabase();
      logger.info('✅ Database creation completed successfully');
    } catch (error) {
      logger.error('❌ Database creation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize database (migrations + seeds)
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing database...');
      
      // First, ensure database exists
      await createDatabase();
      
      // Then run migrations and seeds
      await dbConfig.initialize();
      logger.info('✅ Database initialization completed successfully');
    } catch (error) {
      logger.error('❌ Database initialization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run migrations only
   */
  async migrate() {
    try {
      logger.info('🔄 Running database migrations...');
      await dbConfig.runMigrations();
      logger.info('✅ Migrations completed successfully');
    } catch (error) {
      logger.error('❌ Migrations failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run seeds only
   */
  async seed() {
    try {
      logger.info('🌱 Running database seeds...');
      await dbConfig.runSeeds();
      logger.info('✅ Seeds completed successfully');
    } catch (error) {
      logger.error('❌ Seeds failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Reset database (drop all tables and recreate)
   */
  async reset() {
    try {
      logger.info('🔥 Resetting database...');
      
      // Confirm reset in production
      if (process.env.NODE_ENV === 'production') {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise((resolve) => {
          rl.question('⚠️  Are you sure you want to reset the PRODUCTION database? (yes/no): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() !== 'yes') {
          logger.info('❌ Database reset cancelled');
          return;
        }
      }

      await dbConfig.reset();
      logger.info('✅ Database reset completed successfully');
    } catch (error) {
      logger.error('❌ Database reset failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Show database statistics
   */
  async showStats() {
    try {
      logger.info('📊 Gathering database statistics...');
      const stats = await dbConfig.getStatistics();
      
      console.log('\n📈 Database Statistics:');
      console.log('─'.repeat(50));
      console.log(`Database Size: ${stats.database_size}`);
      console.log('\n📋 Table Counts:');
      
      const tables = [
        'users', 'jobs', 'applications', 'companies', 
        'candidate_cvs', 'skills', 'cities'
      ];
      
      tables.forEach(table => {
        if (stats[table] !== undefined) {
          console.log(`  ${table.padEnd(20)}: ${stats[table].toLocaleString()}`);
        }
      });
      
      console.log('\n💾 Largest Tables:');
      stats.table_sizes.forEach(table => {
        console.log(`  ${table.tablename.padEnd(20)}: ${table.size}`);
      });
      
    } catch (error) {
      logger.error('❌ Failed to get database statistics:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      logger.info('🔍 Testing database connection...');
      await dbConfig.testConnection();
      logger.info('✅ Database connection successful');
    } catch (error) {
      logger.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🗃️  CV Recruitment Database Setup Tool

Usage: node setup.js [command] [options]

Commands:
  create-db Create database only (first-time setup)
  init      Initialize database (run migrations and seeds)
  migrate   Run database migrations only
  seed      Run database seeds only
  reset     Reset database (⚠️  DESTRUCTIVE - drops all tables)
  stats     Show database statistics
  test      Test database connection
  help      Show this help message

Options:
  --force   Force operation without confirmation (use with caution)

Examples:
  node setup.js create-db          # Create database (first-time)
  node setup.js init               # Initialize database
  node setup.js migrate            # Run migrations only
  node setup.js seed               # Run seeds only
  node setup.js reset              # Reset database
  node setup.js stats              # Show statistics
  node setup.js test               # Test connection

Environment Variables:
  DATABASE_URL                     # PostgreSQL connection string
  NODE_ENV                        # Environment (development/production)
  LOG_LEVEL                       # Logging level (debug/info/error)

Schema Information:
  - Uses UUID for all primary keys
  - Supports vector embeddings for AI matching
  - Includes comprehensive audit trails
  - Optimized for recruitment workflow

For more information, see: database/README.md
`);
  }

  /**
   * Run the setup script
   */
  async run() {
    const { command, options } = this.parseArgs();
    
    logger.info(`🔧 Running database setup command: ${command}`);
    
    if (!this.commands[command]) {
      logger.error(`❌ Unknown command: ${command}`);
      this.showHelp();
      process.exit(1);
    }

    try {
      await this.commands[command](options);
      await dbConfig.close();
      logger.info('👋 Database setup completed');
    } catch (error) {
      logger.error('💥 Setup failed:', error.message);
      await dbConfig.close();
      process.exit(1);
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseSetup; 