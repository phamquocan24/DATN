const { Database } = require('../models/Database');
const winston = require('winston');

// Setup logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

class AuditLogger {
  constructor() {
    this.database = new Database();
  }

  /**
   * Log an audit event to the database
   * @param {Object} auditData - Audit data
   * @param {string} auditData.user_id - ID of the user performing the action
   * @param {string} auditData.action - Action performed (login, create, update, delete, etc.)
   * @param {string} auditData.entity_type - Type of entity affected (user, job, company, etc.)
   * @param {string} auditData.entity_id - ID of the entity affected
   * @param {Object} auditData.old_values - Previous values (for updates)
   * @param {Object} auditData.new_values - New values (for creates/updates)
   * @param {string} auditData.ip_address - Client IP address
   * @param {string} auditData.user_agent - Client user agent
   * @param {string} auditData.session_id - Session ID
   * @param {boolean} auditData.success - Whether the action was successful
   * @param {string} auditData.error_message - Error message if failed
   * @param {number} auditData.duration_ms - Duration in milliseconds
   */
  async logAudit(auditData) {
    try {
      const {
        user_id = null,
        action,
        entity_type,
        entity_id = null,
        old_values = null,
        new_values = null,
        ip_address = null,
        user_agent = null,
        session_id = null,
        request_id = null,
        success = true,
        error_message = null,
        duration_ms = null
      } = auditData;

      const query = `
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, old_values, new_values,
          ip_address, user_agent, session_id, request_id, success, 
          error_message, duration_ms, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
        ) RETURNING log_id
      `;

      const values = [
        user_id,
        action,
        entity_type,
        entity_id,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent,
        session_id,
        request_id,
        success,
        error_message,
        duration_ms
      ];

      const result = await this.database.query(query, values, 'insert_audit_log');
      
      logger.info('Audit log created', {
        log_id: result.rows[0].log_id,
        action,
        entity_type,
        user_id,
        success
      });

      return result.rows[0].log_id;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  /**
   * Helper method to log user authentication events
   */
  async logAuth(user_id, action, success, req, additional_data = {}) {
    return this.logAudit({
      user_id,
      action, // 'login', 'logout', 'register'
      entity_type: 'user',
      entity_id: user_id,
      new_values: {
        timestamp: new Date().toISOString(),
        ...additional_data
      },
      ip_address: this.getClientIP(req),
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID || req.headers['x-session-id'],
      success
    });
  }

  /**
   * Helper method to log CRUD operations
   */
  async logCRUD(user_id, action, entity_type, entity_id, old_values, new_values, req, success = true) {
    return this.logAudit({
      user_id,
      action, // 'create', 'update', 'delete'
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address: this.getClientIP(req),
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID || req.headers['x-session-id'],
      success
    });
  }

  /**
   * Helper method to log admin actions
   */
  async logAdminAction(admin_user_id, action, target_entity_type, target_entity_id, reason, req, success = true) {
    return this.logAudit({
      user_id: admin_user_id,
      action, // 'activate', 'deactivate', 'approve', 'reject', etc.
      entity_type: target_entity_type,
      entity_id: target_entity_id,
      new_values: {
        reason,
        admin_action: true,
        timestamp: new Date().toISOString()
      },
      ip_address: this.getClientIP(req),
      user_agent: req.get('User-Agent'),
      session_id: req.sessionID || req.headers['x-session-id'],
      success
    });
  }

  /**
   * Extract client IP address from request
   */
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           '127.0.0.1';
  }

  /**
   * Middleware to automatically log API requests
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Store original res.json to intercept responses
      const originalJson = res.json;
      
      res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Determine if this is an audit-worthy action
        const method = req.method;
        const path = req.path;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
        
        // Log significant actions (not just GET requests)
        if (method !== 'GET' && req.user) {
          const action = method.toLowerCase();
          let entity_type = 'unknown';
          
          // Extract entity type from path
          if (path.includes('/users')) entity_type = 'user';
          else if (path.includes('/jobs')) entity_type = 'job';
          else if (path.includes('/companies')) entity_type = 'company';
          else if (path.includes('/applications')) entity_type = 'application';
          else if (path.includes('/auth/login')) entity_type = 'auth';
          else if (path.includes('/auth/logout')) entity_type = 'auth';
          
          // Auto-log API actions
          if (entity_type !== 'unknown') {
            auditLogger.logAudit({
              user_id: req.user.user_id,
              action: method === 'POST' ? 'create' : 
                     method === 'PUT' || method === 'PATCH' ? 'update' : 
                     method === 'DELETE' ? 'delete' : action,
              entity_type,
              entity_id: req.params.id || null,
              new_values: method !== 'DELETE' ? req.body : null,
              ip_address: auditLogger.getClientIP(req),
              user_agent: req.get('User-Agent'),
              session_id: req.sessionID || req.headers['x-session-id'],
              success: isSuccess,
              duration_ms: duration,
              error_message: !isSuccess ? data.error : null
            }).catch(err => {
              logger.error('Auto-audit failed:', err);
            });
          }
        }
        
        // Call original res.json
        return originalJson.call(this, data);
      };
      
      next();
    };
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

module.exports = {
  AuditLogger,
  auditLogger
};
