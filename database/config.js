const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

/**
 * Database Configuration and Migration Runner
 */
class DatabaseConfig {
  constructor() {
    const dbUrl = `postgresql://${process.env.POSTGRES_USER || 'cv_user'}:${process.env.POSTGRES_PASSWORD || 'cv_password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'cv_recruitment'}`;

    this.config = {
      connectionString: process.env.DATABASE_URL || dbUrl,
      max: parseInt(process.env.DATABASE_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) || 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

    this.pool = new Pool(this.config);

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/database.log' })
      ]
    });

    this.setupEventListeners();
  }

  /**
   * Setup pool event listeners
   */
  setupEventListeners() {
    this.pool.on('connect', (client) => {
      this.logger.info('Connected to PostgreSQL database');
    });

    this.pool.on('error', (err, client) => {
      this.logger.error('Database pool error:', err);
    });

    this.pool.on('acquire', (client) => {
      this.logger.debug('Client acquired from pool');
    });

    this.pool.on('remove', (client) => {
      this.logger.debug('Client removed from pool');
    });
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as server_time, version() as version');
      client.release();
      
      this.logger.info('Database connection successful', {
        serverTime: result.rows[0].server_time,
        version: result.rows[0].version.split(' ')[0]
      });
      
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Create migration tracking table
   */
  async createMigrationTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `;

    try {
      await this.pool.query(query);
      this.logger.info('Migration table created successfully');
    } catch (error) {
      this.logger.error('Failed to create migration table:', error);
      throw error;
    }
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await this.pool.query('SELECT migration_name FROM schema_migrations ORDER BY executed_at');
      return result.rows.map(row => row.migration_name);
    } catch (error) {
      this.logger.error('Failed to get executed migrations:', error);
      throw error;
    }
  }

  /**
   * Mark migration as executed
   */
  async markMigrationAsExecuted(migrationName) {
    try {
      await this.pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
        [migrationName]
      );
      this.logger.info(`Migration ${migrationName} marked as executed`);
    } catch (error) {
      this.logger.error(`Failed to mark migration ${migrationName} as executed:`, error);
      throw error;
    }
  }

  /**
   * Run migrations
   */
  async runMigrations() {
    try {
      this.logger.info('Starting database migrations...');
      
      // Create migration table if it doesn't exist
      await this.createMigrationTable();
      
      // Get list of migration files
      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        this.logger.info('No migration files found');
        return;
      }

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();

      // Run pending migrations
      for (const migrationFile of migrationFiles) {
        const migrationName = path.basename(migrationFile, '.sql');
        
        if (executedMigrations.includes(migrationName)) {
          this.logger.info(`Skipping migration ${migrationName} (already executed)`);
          continue;
        }

        this.logger.info(`Running migration ${migrationName}...`);
        
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration in transaction
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(migrationSQL);
          await client.query('COMMIT');
          
          // Mark as executed
          await this.markMigrationAsExecuted(migrationName);
          
          this.logger.info(`Migration ${migrationName} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error(`Migration ${migrationName} failed:`, error);
          throw error;
        } finally {
          client.release();
        }
      }

      this.logger.info('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Run seeds
   */
  async runSeeds() {
    try {
      this.logger.info('Starting database seeding...');
      
      const seedsDir = path.join(__dirname, 'seeds');
      
      if (!fs.existsSync(seedsDir)) {
        this.logger.info('No seeds directory found');
        return;
      }

      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (seedFiles.length === 0) {
        this.logger.info('No seed files found');
        return;
      }

      for (const seedFile of seedFiles) {
        this.logger.info(`Running seed ${seedFile}...`);
        
        const seedPath = path.join(seedsDir, seedFile);
        const seedSQL = fs.readFileSync(seedPath, 'utf8');
        
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(seedSQL);
          await client.query('COMMIT');
          
          this.logger.info(`Seed ${seedFile} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error(`Seed ${seedFile} failed:`, error);
          throw error;
        } finally {
          client.release();
        }
      }

      this.logger.info('All seeds completed successfully');
    } catch (error) {
      this.logger.error('Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database (run migrations and seeds)
   */
  async initialize() {
    try {
      await this.testConnection();
      await this.runMigrations();
      await this.runSeeds();
      
      this.logger.info('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (drop all tables and re-run migrations)
   */
  async reset() {
    try {
      this.logger.info('Resetting database...');
      
      // Read and execute the main schema file
      const schemaPath = path.join(__dirname, 'schema-uuid.sql');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error('Schema file not found');
      }

      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(schemaSQL);
        await client.query('COMMIT');
        
        this.logger.info('Database schema created successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Run seeds
      await this.runSeeds();
      
      this.logger.info('Database reset completed successfully');
    } catch (error) {
      this.logger.error('Database reset failed:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics() {
    try {
      const queries = [
        {
          name: 'users',
          query: 'SELECT COUNT(*) as count FROM users'
        },
        {
          name: 'jobs',
          query: 'SELECT COUNT(*) as count FROM jobs'
        },
        {
          name: 'applications',
          query: 'SELECT COUNT(*) as count FROM applications'
        },
        {
          name: 'companies',
          query: 'SELECT COUNT(*) as count FROM companies'
        },
        {
          name: 'candidate_cvs',
          query: 'SELECT COUNT(*) as count FROM candidate_cvs'
        },
        {
          name: 'skills',
          query: 'SELECT COUNT(*) as count FROM skills'
        },
        {
          name: 'cities',
          query: 'SELECT COUNT(*) as count FROM cities'
        }
      ];

      const statistics = {};
      
      for (const { name, query } of queries) {
        const result = await this.pool.query(query);
        statistics[name] = parseInt(result.rows[0].count);
      }

      // Get database size
      const sizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `;
      const sizeResult = await this.pool.query(sizeQuery);
      statistics.database_size = sizeResult.rows[0].database_size;

      // Get table sizes
      const tableSizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;
      const tableSizeResult = await this.pool.query(tableSizeQuery);
      statistics.table_sizes = tableSizeResult.rows;

      return statistics;
    } catch (error) {
      this.logger.error('Failed to get database statistics:', error);
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async close() {
    try {
      await this.pool.end();
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dbConfig = new DatabaseConfig();

module.exports = {
  DatabaseConfig,
  dbConfig,
  pool: dbConfig.pool
}; 