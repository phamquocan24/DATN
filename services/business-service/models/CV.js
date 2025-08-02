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
    new winston.transports.File({ filename: 'logs/cv.log' })
  ]
});

class CV extends BaseModel {
  constructor() {
    super('cvs', 'cv_id');
  }

  /**
   * Create a new CV
   */
  async createCV(cvData) {
    try {
      const {
        candidate_id,
        cv_title,
        cv_file_url,
        cv_file_name,
        cv_file_size,
        cv_file_type,
        is_primary = false
      } = cvData;

      // Validate required fields
      if (!candidate_id || !cv_title || !cv_file_url) {
        throw new Error('Candidate ID, CV title, and CV file URL are required');
      }

      // If this is set as primary, unset other primary CVs
      if (is_primary) {
        await this.db.query(
          `UPDATE cvs SET is_primary = false WHERE candidate_id = $1`,
          [candidate_id],
          'unset_primary_cvs'
        );
      }

      const query = `
        INSERT INTO cvs (
          candidate_id, cv_title, cv_file_url, cv_file_name, 
          cv_file_size, cv_file_type, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        candidate_id,
        cv_title,
        cv_file_url,
        cv_file_name,
        cv_file_size,
        cv_file_type,
        is_primary
      ];

      const result = await this.db.query(query, values, 'create_cv');
      const cv = result.rows[0];

      logger.info('CV created successfully', {
        cv_id: cv.cv_id,
        candidate_id,
        cv_title
      });

      return cv;
    } catch (error) {
      logger.error('Failed to create CV:', error);
      throw error;
    }
  }

  /**
   * Get candidate CVs
   */
  async getCandidateCVs(candidateId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          cv.*,
          cc.parsed_text,
          cc.parsed_data,
          cc.skills_extracted,
          cc.experience_years,
          cc.education_level,
          cc.job_titles,
          cc.companies,
          cc.last_parsed_at
        FROM cvs cv
        LEFT JOIN cv_content cc ON cv.cv_id = cc.cv_id
        WHERE cv.candidate_id = $1
        ORDER BY cv.is_primary DESC, cv.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [candidateId, limit, offset], 'get_candidate_cvs');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM cvs
        WHERE candidate_id = $1
      `;

      const countResult = await this.db.query(countQuery, [candidateId], 'count_candidate_cvs');
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
      logger.error('Failed to get candidate CVs:', error);
      throw error;
    }
  }

  /**
   * Get CV by ID
   */
  async getCVById(cvId) {
    try {
      const query = `
        SELECT 
          cv.*,
          cp.user_id,
          u.full_name,
          u.email,
          cc.parsed_text,
          cc.parsed_data,
          cc.skills_extracted,
          cc.experience_years,
          cc.education_level,
          cc.job_titles,
          cc.companies,
          cc.last_parsed_at
        FROM cvs cv
        JOIN candidate_profiles cp ON cv.candidate_id = cp.profile_id
        JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN cv_content cc ON cv.cv_id = cc.cv_id
        WHERE cv.cv_id = $1
      `;

      const result = await this.db.query(query, [cvId], 'get_cv_by_id');
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get CV by ID:', error);
      throw error;
    }
  }

  /**
   * Update CV information
   */
  async updateCV(cvId, updateData, userId) {
    try {
      // Check if user owns this CV
      const cv = await this.getCVById(cvId);
      if (!cv || cv.user_id !== userId) {
        throw new Error('CV not found or access denied');
      }

      const allowedFields = ['cv_title', 'cv_file_url', 'cv_file_name', 'cv_file_size', 'cv_file_type'];
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
      values.push(cvId);

      const query = `
        UPDATE cvs 
        SET ${updateFields.join(', ')}
        WHERE cv_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'update_cv');

      if (result.rows.length === 0) {
        throw new Error('CV not found');
      }

      logger.info('CV updated successfully', {
        cv_id: cvId,
        updated_by: userId,
        updated_fields: Object.keys(updateData)
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update CV:', error);
      throw error;
    }
  }

  /**
   * Set primary CV
   */
  async setPrimaryCV(cvId, userId) {
    try {
      // Check if user owns this CV
      const cv = await this.getCVById(cvId);
      if (!cv || cv.user_id !== userId) {
        throw new Error('CV not found or access denied');
      }

      // Unset other primary CVs for this candidate
      await this.db.query(
        `UPDATE cvs SET is_primary = false WHERE candidate_id = $1`,
        [cv.candidate_id],
        'unset_primary_cvs'
      );

      // Set this CV as primary
      const query = `
        UPDATE cvs 
        SET is_primary = true, updated_at = NOW()
        WHERE cv_id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [cvId], 'set_primary_cv');

      logger.info('Primary CV set successfully', {
        cv_id: cvId,
        user_id: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to set primary CV:', error);
      throw error;
    }
  }

  /**
   * Delete CV
   */
  async deleteCV(cvId, userId) {
    try {
      // Check if user owns this CV
      const cv = await this.getCVById(cvId);
      if (!cv || cv.user_id !== userId) {
        throw new Error('CV not found or access denied');
      }

      // Check if this CV has applications
      const applicationsQuery = `
        SELECT COUNT(*) as application_count
        FROM applications
        WHERE cv_id = $1
      `;

      const applicationsResult = await this.db.query(applicationsQuery, [cvId], 'check_cv_applications');
      if (parseInt(applicationsResult.rows[0].application_count) > 0) {
        throw new Error('Cannot delete CV that has been used in job applications');
      }

      const query = `
        DELETE FROM cvs 
        WHERE cv_id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [cvId], 'delete_cv');

      if (result.rows.length === 0) {
        throw new Error('CV not found');
      }

      logger.info('CV deleted successfully', {
        cv_id: cvId,
        deleted_by: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to delete CV:', error);
      throw error;
    }
  }

  /**
   * Parse CV content (for AI processing)
   */
  async parseCVContent(cvId, parsedData) {
    try {
      const {
        parsed_text,
        parsed_data,
        skills_extracted,
        experience_years,
        education_level,
        job_titles,
        companies
      } = parsedData;

      const query = `
        INSERT INTO cv_content (
          cv_id, parsed_text, parsed_data, skills_extracted,
          experience_years, education_level, job_titles, companies
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (cv_id) DO UPDATE SET
          parsed_text = $2,
          parsed_data = $3,
          skills_extracted = $4,
          experience_years = $5,
          education_level = $6,
          job_titles = $7,
          companies = $8,
          last_parsed_at = NOW()
        RETURNING *
      `;

      const values = [
        cvId,
        parsed_text,
        JSON.stringify(parsed_data),
        JSON.stringify(skills_extracted),
        experience_years,
        education_level,
        JSON.stringify(job_titles),
        JSON.stringify(companies)
      ];

      const result = await this.db.query(query, values, 'parse_cv_content');

      logger.info('CV content parsed successfully', {
        cv_id: cvId,
        skills_count: skills_extracted?.length || 0,
        experience_years
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to parse CV content:', error);
      throw error;
    }
  }

  /**
   * Search CVs by skills and criteria
   */
  async searchCVs(searchCriteria, options = {}) {
    try {
      const {
        skills,
        experience_years_min,
        experience_years_max,
        education_level,
        job_titles,
        location,
        page = 1,
        limit = 20
      } = searchCriteria;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      // Base query
      let query = `
        SELECT DISTINCT
          cv.*,
          cp.user_id,
          u.full_name,
          u.email,
          u.phone,
          u.profile_image_url,
          cp.years_experience,
          cp.education_level,
          cp.current_job_title,
          cp.current_company,
          cp.expected_salary,
          cp.currency,
          cp.willing_to_relocate,
          cp.remote_work_preference,
          cc.skills_extracted,
          cc.job_titles,
          cc.companies,
          cc.last_parsed_at
        FROM cvs cv
        JOIN candidate_profiles cp ON cv.candidate_id = cp.profile_id
        JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN cv_content cc ON cv.cv_id = cc.cv_id
      `;

      // Add skills search
      if (skills && skills.length > 0) {
        query += ` JOIN candidate_skills cs ON cp.profile_id = cs.profile_id`;
        conditions.push(`cs.skill_id = ANY($${paramIndex})`);
        values.push(skills);
        paramIndex++;
      }

      // Add experience filter
      if (experience_years_min !== undefined) {
        conditions.push(`COALESCE(cc.experience_years, cp.years_experience) >= $${paramIndex}`);
        values.push(experience_years_min);
        paramIndex++;
      }

      if (experience_years_max !== undefined) {
        conditions.push(`COALESCE(cc.experience_years, cp.years_experience) <= $${paramIndex}`);
        values.push(experience_years_max);
        paramIndex++;
      }

      // Add education filter
      if (education_level) {
        conditions.push(`COALESCE(cc.education_level, cp.education_level) = $${paramIndex}`);
        values.push(education_level);
        paramIndex++;
      }

      // Add job titles filter
      if (job_titles && job_titles.length > 0) {
        conditions.push(`(cc.job_titles ?| $${paramIndex} OR cp.current_job_title ILIKE ANY($${paramIndex + 1}))`);
        values.push(job_titles);
        values.push(job_titles.map(title => `%${title}%`));
        paramIndex += 2;
      }

      // Add user active filter
      conditions.push(`u.is_active = true`);

      // Build WHERE clause
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Add ordering and pagination
      query += ` ORDER BY cv.updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await this.db.query(query, values, 'search_cvs');

      // Get total count
      const countQuery = query.replace(
        /SELECT DISTINCT[\s\S]*?FROM/,
        'SELECT COUNT(DISTINCT cv.cv_id) as total FROM'
      ).replace(/ORDER BY[\s\S]*$/, '');

      const countResult = await this.db.query(countQuery, values.slice(0, -2), 'count_search_cvs');
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
      logger.error('Failed to search CVs:', error);
      throw error;
    }
  }

  /**
   * Get CV statistics
   */
  async getCVStats(candidateId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_cvs,
          COUNT(*) FILTER (WHERE is_primary = true) as primary_cvs,
          COUNT(DISTINCT a.application_id) as total_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'PENDING') as pending_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'INTERVIEWING') as interviewing_applications,
          COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'HIRED') as hired_applications,
          MAX(cv.created_at) as last_cv_upload,
          MAX(a.created_at) as last_application
        FROM cvs cv
        LEFT JOIN applications a ON cv.cv_id = a.cv_id
        WHERE cv.candidate_id = $1
        GROUP BY cv.candidate_id
      `;

      const result = await this.db.query(query, [candidateId], 'get_cv_stats');
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Failed to get CV stats:', error);
      throw error;
    }
  }
}

module.exports = CV; 