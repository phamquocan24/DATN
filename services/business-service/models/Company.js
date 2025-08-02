const { BaseModel } = require('./Database');
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
    new winston.transports.File({ filename: 'logs/company.log' })
  ]
});

class Company extends BaseModel {
  constructor() {
    super('companies', 'company_id');
  }

  /**
   * Validate UUID format
   * @param {string} uuid 
   * @returns {boolean}
   */
  isValidUUID(uuid) {
    return this.db.isValidUUID(uuid);
  }

  /**
   * Create a new company
   */
  async createCompany(companyData) {
    try {
      const {
        company_name,
        company_description,
        company_website,
        company_email,
        company_phone,
        company_address,
        city_id,
        district_id,
        industry,
        company_size,
        company_logo_url,
        tax_code,
        founded_year,
        created_by
      } = companyData;

      // Validate required fields
      if (!company_name || !created_by) {
        throw new Error('Company name and creator are required');
      }

      // Check if company name already exists
      const existingCompany = await this.findOne({ company_name });
      if (existingCompany) {
        throw new Error('Company name already exists');
      }

      const query = `
        INSERT INTO companies (
          company_name, description, website, 
          company_phone, address, city_id, district_id, industry,
          company_size, logo_url, tax_code, founded_year
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        company_name,
        company_description,
        company_website,
        company_phone,
        company_address,
        city_id,
        district_id,
        industry,
        company_size,
        company_logo_url,
        tax_code,
        founded_year
      ];

      const result = await this.db.query(query, values, 'create_company');
      const company = result.rows[0];

      // Create recruiter profile for the creator
      await this.db.query(
        `INSERT INTO recruiter_profiles (user_id, company_id, position)
         VALUES ($1, $2, 'Company Administrator')
         ON CONFLICT (user_id) DO UPDATE SET company_id = $2`,
        [created_by, company.company_id],
        'create_recruiter_profile'
      );

      logger.info('Company created successfully', {
        company_id: company.company_id,
        company_name: company.company_name,
        created_by
      });

      return company;
    } catch (error) {
      logger.error('Failed to create company:', error);
      throw error;
    }
  }

  /**
   * Get company by ID with related data
   */
  async getCompanyById(companyId) {
    try {
      const query = `
        SELECT 
          c.*,
          ci.city_name,
          d.district_name,
          COUNT(DISTINCT rp.user_id) as total_recruiters,
          COUNT(DISTINCT j.job_id) as total_jobs,
          COUNT(DISTINCT j.job_id) FILTER (WHERE j.status = 'ACTIVE') as active_jobs
        FROM companies c
        LEFT JOIN cities ci ON c.city_id = ci.city_id
        LEFT JOIN districts d ON c.district_id = d.district_id
        LEFT JOIN recruiter_profiles rp ON c.company_id = rp.company_id
        LEFT JOIN jobs j ON c.company_id = j.company_id
        WHERE c.company_id = $1
        GROUP BY c.company_id, ci.city_name, d.district_name
      `;

      const result = await this.db.query(query, [companyId], 'get_company_by_id');
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get company by ID:', error);
      throw error;
    }
  }

  /**
   * Get companies list with filters and pagination
   */
  async getCompanies(options = {}) {
    try {
      const {
        search,
        industry,
        city_id,
        company_size,
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        direction = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (search) {
        conditions.push(`(c.company_name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (industry) {
        conditions.push(`c.industry = $${paramIndex}`);
        values.push(industry);
        paramIndex++;
      }

      if (city_id) {
        conditions.push(`c.city_id = $${paramIndex}`);
        values.push(city_id);
        paramIndex++;
      }

      if (company_size) {
        conditions.push(`c.company_size = $${paramIndex}`);
        values.push(company_size);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM companies c
        ${whereClause}
      `;

      const countResult = await this.db.query(countQuery, values, 'count_companies');
      const total = parseInt(countResult.rows[0].total);

      // Get companies
      const query = `
        SELECT 
          c.*,
          ci.city_name,
          d.district_name,
          COUNT(DISTINCT rp.user_id) as total_recruiters,
          COUNT(DISTINCT j.job_id) as total_jobs
        FROM companies c
        LEFT JOIN cities ci ON c.city_id = ci.city_id
        LEFT JOIN districts d ON c.district_id = d.district_id
        LEFT JOIN recruiter_profiles rp ON c.company_id = rp.company_id
        LEFT JOIN jobs j ON c.company_id = j.company_id
        ${whereClause}
        GROUP BY c.company_id, ci.city_name, d.district_name
        ORDER BY c.${orderBy} ${direction}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.query(query, values, 'get_companies');

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get companies:', error);
      throw error;
    }
  }

  /**
   * Update company information
   */
  async updateCompany(companyId, updateData, userId) {
    try {
      // Check if user has permission to update this company
      const permission = await this.checkCompanyPermission(companyId, userId);
      if (!permission) {
        throw new Error('You do not have permission to update this company');
      }

      const allowedFields = [
        'company_name', 'company_description', 'company_website', 'company_email',
        'company_phone', 'company_address', 'city_id', 'district_id', 'industry',
        'company_size', 'company_logo_url', 'tax_code', 'founded_year'
      ];

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(companyId);

      const query = `
        UPDATE companies 
        SET ${updateFields.join(', ')}
        WHERE company_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'update_company');

      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }

      logger.info('Company updated successfully', {
        company_id: companyId,
        updated_by: userId,
        updated_fields: Object.keys(updateData)
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update company:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission to manage company
   */
  async checkCompanyPermission(companyId, userId) {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM recruiter_profiles rp
          JOIN users u ON rp.user_id = u.user_id
          WHERE rp.company_id = $1 AND rp.user_id = $2
          AND (rp.is_company_admin = true OR u.role = 'ADMIN')
        ) as has_permission
      `;

      const result = await this.db.query(query, [companyId, userId], 'check_company_permission');
      return result.rows[0].has_permission;
    } catch (error) {
      logger.error('Failed to check company permission:', error);
      throw error;
    }
  }

  /**
   * Get company recruiters
   */
  async getCompanyRecruiters(companyId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.full_name,
          u.phone,
          u.profile_image_url,
          u.is_active,
          rp.position,
          rp.department,
          rp.hire_authority_level,
          rp.is_company_admin,
          rp.created_at as joined_at
        FROM recruiter_profiles rp
        JOIN users u ON rp.user_id = u.user_id
        WHERE rp.company_id = $1
        ORDER BY rp.is_company_admin DESC, rp.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [companyId, limit, offset], 'get_company_recruiters');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM recruiter_profiles rp
        WHERE rp.company_id = $1
      `;

      const countResult = await this.db.query(countQuery, [companyId], 'count_company_recruiters');
      const total = parseInt(countResult.rows[0].total);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get company recruiters:', error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT rp.user_id) as total_recruiters,
          COUNT(DISTINCT j.job_id) as total_jobs,
          COUNT(DISTINCT j.job_id) FILTER (WHERE j.status = 'ACTIVE') as active_jobs,
          COUNT(DISTINCT j.job_id) FILTER (WHERE j.status = 'CLOSED') as closed_jobs,
          COUNT(DISTINCT a.application_id) as total_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'PENDING') as pending_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'INTERVIEWING') as interviewing_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'HIRED') as hired_applications,
          AVG(j.salary_max) as avg_salary_max,
          AVG(j.salary_min) as avg_salary_min
        FROM companies c
        LEFT JOIN recruiter_profiles rp ON c.company_id = rp.company_id
        LEFT JOIN jobs j ON c.company_id = j.company_id
        LEFT JOIN applications a ON j.job_id = a.job_id
        WHERE c.company_id = $1
        GROUP BY c.company_id
      `;

      const result = await this.db.query(query, [companyId], 'get_company_stats');
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Failed to get company stats:', error);
      throw error;
    }
  }

  /**
   * Delete company (soft delete)
   */
  async deleteCompany(companyId, userId) {
    try {
      // Check if user has permission
      const permission = await this.checkCompanyPermission(companyId, userId);
      if (!permission) {
        throw new Error('You do not have permission to delete this company');
      }

      // Check if company has active jobs
      const activeJobsQuery = `
        SELECT COUNT(*) as active_jobs
        FROM jobs
        WHERE company_id = $1 AND status = 'ACTIVE'
      `;

      const activeJobsResult = await this.db.query(activeJobsQuery, [companyId], 'check_active_jobs');
      if (parseInt(activeJobsResult.rows[0].active_jobs) > 0) {
        throw new Error('Cannot delete company with active job postings');
      }

      const query = `
        UPDATE companies 
        SET is_active = false, updated_at = NOW()
        WHERE company_id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [companyId], 'delete_company');

      if (result.rows.length === 0) {
        throw new Error('Company not found');
      }

      logger.info('Company deleted successfully', {
        company_id: companyId,
        deleted_by: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to delete company:', error);
      throw error;
    }
  }
}

module.exports = Company; 