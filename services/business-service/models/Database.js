const { Pool } = require('pg');
const winston = require('winston');

// Load environment variables from database.env
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../database.env') });

/**
 * Database connection pool and base model functionality
 */
class Database {
  constructor() {
    // Build connection string from individual environment variables
    const dbUrl = `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'userdb'}`;
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || dbUrl,
      max: parseInt(process.env.DATABASE_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) || 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

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

    this.initializeEventListeners();
  }

  /**
   * Initialize database event listeners
   */
  initializeEventListeners() {
    this.pool.on('connect', (client) => {
      this.logger.info('Connected to PostgreSQL database', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      });
    });

    this.pool.on('error', (err, client) => {
      this.logger.error('Database connection error:', err);
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
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as server_time, version() as version');
      client.release();
      
      this.logger.info('Database connection test successful', {
        serverTime: result.rows[0].server_time,
        version: result.rows[0].version.split(' ')[0]
      });
      
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a query with connection pooling
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @param {string} queryName - Optional query name for logging
   * @returns {Promise<Object>}
   */
  async query(text, params = [], queryName = 'unnamed') {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      this.logger.debug('Query executed successfully', {
        queryName,
        duration: `${duration}ms`,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      this.logger.error('Query execution failed', {
        queryName,
        duration: `${duration}ms`,
        error: error.message,
        query: text.substring(0, 100) + '...',
        params: params.length > 0 ? '[REDACTED]' : '[]'
      });
      
      throw error;
    }
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Transaction callback function
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      this.logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Build WHERE clause with dynamic conditions
   * @param {Object} conditions - Key-value pairs for WHERE conditions
   * @param {number} startIndex - Starting parameter index
   * @returns {Object} { whereClause, params, nextIndex }
   */
  buildWhereClause(conditions = {}, startIndex = 1) {
    const whereParts = [];
    const params = [];
    let paramIndex = startIndex;

    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle IN operator
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          whereParts.push(`${key} IN (${placeholders})`);
          params.push(...value);
        } else if (typeof value === 'object' && value.operator) {
          // Handle custom operators
          whereParts.push(`${key} ${value.operator} $${paramIndex++}`);
          params.push(value.value);
        } else {
          // Handle equality
          whereParts.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }
    });

    return {
      whereClause: whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '',
      params,
      nextIndex: paramIndex
    };
  }

  /**
   * Build ORDER BY clause
   * @param {string|Array} orderBy - Order by field(s)
   * @param {string} direction - ASC or DESC
   * @returns {string}
   */
  buildOrderClause(orderBy = 'created_at', direction = 'DESC') {
    if (Array.isArray(orderBy)) {
      return `ORDER BY ${orderBy.join(', ')} ${direction}`;
    }
    return `ORDER BY ${orderBy} ${direction}`;
  }

  /**
   * Build pagination clause
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @param {number} paramIndex - Current parameter index
   * @returns {Object} { limitClause, params, nextIndex }
   */
  buildPaginationClause(page = 1, limit = 10, paramIndex = 1) {
    const offset = (page - 1) * limit;
    return {
      limitClause: `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params: [limit, offset],
      nextIndex: paramIndex + 2
    };
  }

  /**
   * Get database connection statistics
   * @returns {Object}
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.pool.options.max
    };
  }

  /**
   * Generate UUID using database function
   * @returns {Promise<string>}
   */
  async generateUUID() {
    const result = await this.query('SELECT gen_random_uuid() as uuid');
    return result.rows[0].uuid;
  }

  /**
   * Validate UUID format
   * @param {string} uuid 
   * @returns {boolean}
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Close all database connections
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.pool.end();
      this.logger.info('Database connections closed successfully');
    } catch (error) {
      this.logger.error('Error closing database connections:', error);
      throw error;
    }
  }
}

/**
 * Base Model class for all database models
 */
class BaseModel {
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.db = new Database();
  }

  /**
   * Find all records with optional conditions and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async findAll(options = {}) {
    const {
      conditions = {},
      select = '*',
      orderBy = 'created_at',
      direction = 'DESC',
      page = 1,
      limit = 10,
      includeCount = true
    } = options;

    try {
      // Build WHERE clause
      const { whereClause, params, nextIndex } = this.db.buildWhereClause(conditions);
      
      // Build ORDER BY clause
      const orderClause = this.db.buildOrderClause(orderBy, direction);
      
      // Build pagination clause
      const { limitClause, params: paginationParams } = this.db.buildPaginationClause(page, limit, nextIndex);
      
      // Main query
      const query = `
        SELECT ${select}
        FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;
      
      const allParams = [...params, ...paginationParams];
      const result = await this.db.query(query, allParams, `${this.tableName}_findAll`);
      
      // Get total count if requested
      let total = 0;
      if (includeCount) {
        const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
        const countResult = await this.db.query(countQuery, params, `${this.tableName}_count`);
        total = parseInt(countResult.rows[0].total);
      }
      
      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find a single record by ID
   * @param {string} id - Record ID
   * @param {string} select - Fields to select
   * @returns {Promise<Object|null>}
   */
  async findById(id, select = '*') {
    try {
      if (!this.db.isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const query = `SELECT ${select} FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
      const result = await this.db.query(query, [id], `${this.tableName}_findById`);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find ${this.tableName} by ID: ${error.message}`);
    }
  }

  /**
   * Find a single record by conditions
   * @param {Object} conditions - Search conditions
   * @param {string} select - Fields to select
   * @returns {Promise<Object|null>}
   */
  async findOne(conditions, select = '*') {
    try {
      const { whereClause, params } = this.db.buildWhereClause(conditions);
      
      const query = `SELECT ${select} FROM ${this.tableName} ${whereClause} LIMIT 1`;
      const result = await this.db.query(query, params, `${this.tableName}_findOne`);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      
      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      const result = await this.db.query(query, values, `${this.tableName}_create`);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    try {
      if (!this.db.isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const fields = Object.keys(data);
      const values = Object.values(data);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = NOW()
        WHERE ${this.primaryKey} = $1
        RETURNING *
      `;
      
      const result = await this.db.query(query, [id, ...values], `${this.tableName}_update`);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    try {
      if (!this.db.isValidUUID(id)) {
        throw new Error('Invalid UUID format');
      }

      const query = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = $1 RETURNING *`;
      const result = await this.db.query(query, [id], `${this.tableName}_delete`);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Count records with optional conditions
   * @param {Object} conditions - Count conditions
   * @returns {Promise<number>}
   */
  async count(conditions = {}) {
    try {
      const { whereClause, params } = this.db.buildWhereClause(conditions);
      
      const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`;
      const result = await this.db.query(query, params, `${this.tableName}_count`);
      
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Check if record exists
   * @param {Object} conditions - Check conditions
   * @returns {Promise<boolean>}
   */
  async exists(conditions) {
    try {
      const count = await this.count(conditions);
      return count > 0;
    } catch (error) {
      throw new Error(`Failed to check if ${this.tableName} exists: ${error.message}`);
    }
  }
}

// Export singleton database instance and BaseModel class
const database = new Database();

module.exports = {
  Database,
  BaseModel,
  database
}; 