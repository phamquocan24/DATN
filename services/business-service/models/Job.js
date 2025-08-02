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
    new winston.transports.File({ filename: 'logs/job.log' })
  ]
});

class Job extends BaseModel {
  constructor() {
    super('jobs', 'job_id');
  }

  /**
   * Create a new job posting - supports both old and new parameter formats
   */
  async createJob(jobData) {
    try {
      // Map both old format (from controller) and new format (direct) to database columns
      const mappedData = {
        company_id: jobData.company_id,
        title: jobData.title || jobData.job_title,
        description: jobData.description || jobData.job_description,
        requirements: jobData.requirements || jobData.job_requirements,
        benefits: jobData.benefits || jobData.job_benefits,
        employment_type: jobData.employment_type,
        address: jobData.address || jobData.work_location,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        currency: jobData.currency,
        experience_level: jobData.experience_level || jobData.experience_required,
        application_deadline: jobData.application_deadline || jobData.deadline,
        max_applications: jobData.max_applications || jobData.number_of_positions,
        remote_work_option: jobData.remote_work_option || jobData.work_type,
        city_id: jobData.city_id,
        district_id: jobData.district_id,
        recruiter_id: jobData.recruiter_id || jobData.created_by,
        skills: jobData.skills || []
      };

      // Validate required fields
      if (!mappedData.company_id || !mappedData.title || !mappedData.description || !mappedData.recruiter_id) {
        throw new Error('Company ID, title, description, and recruiter ID are required');
      }

      // Create job with correct column names
      const query = `
        INSERT INTO jobs (
          company_id, title, description, requirements, benefits,
          employment_type, address, salary_min, salary_max, currency,
          experience_level, application_deadline, max_applications,
          remote_work_option, city_id, district_id, recruiter_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const values = [
        mappedData.company_id, 
        mappedData.title,
        mappedData.description,
        mappedData.requirements,
        mappedData.benefits,
        mappedData.employment_type,
        mappedData.address,
        mappedData.salary_min,
        mappedData.salary_max,
        mappedData.currency || 'VND',
        mappedData.experience_level,
        mappedData.application_deadline,
        mappedData.max_applications || 1,
        mappedData.remote_work_option,
        mappedData.city_id,
        mappedData.district_id,
        mappedData.recruiter_id,
        'PENDING'
      ];

      const result = await this.db.query(query, values, 'create_job');
      const job = result.rows[0];

      // Add job skills
      if (mappedData.skills.length > 0) {
        await this.addJobSkills(job.job_id, mappedData.skills);
      }

      logger.info('Job created successfully', {
        job_id: job.job_id,
        title: job.title,
        company_id: mappedData.company_id,
        recruiter_id: mappedData.recruiter_id
      });

      return job;
    } catch (error) {
      logger.error('Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Get job by ID with full details
   */
  async getJobById(jobId, includeStats = false) {
    try {
      const query = `
        SELECT 
          j.*,
          c.company_name,
          c.logo_url,
          c.website,
          ci.city_name,
          ci.country_code,
          d.district_name,
          u.full_name as recruiter_name,
          u.email as recruiter_email,
          COALESCE(js.skills, '[]'::json) as required_skills
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities ci ON j.city_id = ci.city_id
        LEFT JOIN districts d ON j.district_id = d.district_id
        LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.profile_id
        LEFT JOIN users u ON rp.user_id = u.user_id
        LEFT JOIN (
          SELECT 
            js.job_id,
            json_agg(
              json_build_object(
                'skill_id', s.skill_id,
                'skill_name', s.skill_name,
                'category', s.category,
                'is_required', js.is_required
              )
            ) as skills
          FROM job_skills js
          JOIN skills s ON js.skill_id = s.skill_id
          GROUP BY js.job_id
        ) js ON j.job_id = js.job_id
        WHERE j.job_id = $1
      `;

      const result = await this.db.query(query, [jobId], 'get_job_by_id');
      
      if (result.rows.length === 0) {
        return null;
      }

      const job = result.rows[0];

      // Get job statistics if requested
      if (includeStats) {
        const statsQuery = `
          SELECT 
            COUNT(DISTINCT a.application_id) as total_applications,
            COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'PENDING') as pending_applications,
            COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'REVIEWING') as reviewing_applications,
            COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'INTERVIEWING') as interviewing_applications,
            COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'HIRED') as hired_applications,
            COUNT(DISTINCT a.application_id) FILTER (WHERE a.status = 'REJECTED') as rejected_applications,
            AVG(a.match_score) as avg_match_score
          FROM applications a
          WHERE a.job_id = $1
        `;

        const statsResult = await this.db.query(statsQuery, [jobId], 'get_job_stats');
        job.statistics = statsResult.rows[0];
      }

      return job;
    } catch (error) {
      logger.error('Failed to get job by ID:', error);
      throw error;
    }
  }

  /**
   * Get jobs with filters and pagination
   */
  async getJobs(options = {}) {
    try {
      const {
        search,
        company_id,
        employment_type,
        work_type,
        city_id,
        experience_required,
        salary_min,
        salary_max,
        skills,
        status = 'ACTIVE',
        created_by,
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
        conditions.push(`(j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (company_id) {
        conditions.push(`j.company_id = $${paramIndex}`);
        values.push(company_id);
        paramIndex++;
      }

      if (employment_type) {
        conditions.push(`j.employment_type = $${paramIndex}`);
        values.push(employment_type);
        paramIndex++;
      }

      if (work_type) {
        conditions.push(`j.remote_work_option = $${paramIndex}`);
        values.push(work_type);
        paramIndex++;
      }

      if (city_id) {
        conditions.push(`j.city_id = $${paramIndex}`);
        values.push(city_id);
        paramIndex++;
      }

      if (experience_required !== undefined) {
        conditions.push(`j.experience_level = $${paramIndex}`);
        values.push(experience_required);
        paramIndex++;
      }

      if (salary_min !== undefined) {
        conditions.push(`j.salary_max >= $${paramIndex}`);
        values.push(salary_min);
        paramIndex++;
      }

      if (salary_max !== undefined) {
        conditions.push(`j.salary_min <= $${paramIndex}`);
        values.push(salary_max);
        paramIndex++;
      }

      if (status) {
        if (Array.isArray(status)) {
          conditions.push(`j.status = ANY($${paramIndex})`);
          values.push(status);
        } else {
          conditions.push(`j.status = $${paramIndex}`);
          values.push(status);
        }
        paramIndex++;
      }

      if (created_by) {
        conditions.push(`j.recruiter_id = $${paramIndex}`);
        values.push(created_by);
        paramIndex++;
      }

      // Skills filter
      let skillsJoin = '';
      if (skills && skills.length > 0) {
        skillsJoin = `JOIN job_skills js ON j.job_id = js.job_id`;
        conditions.push(`js.skill_id = ANY($${paramIndex})`);
        values.push(skills);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT j.job_id) as total
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        ${skillsJoin}
        ${whereClause}
      `;

      const countResult = await this.db.query(countQuery, values, 'count_jobs');
      const total = parseInt(countResult.rows[0].total);

      // Get jobs (simplified version without JSON aggregation)
      const query = `
        SELECT DISTINCT
          j.*,
          c.company_name,
          c.logo_url,
          ci.city_name,
          ci.country_code,
          d.district_name,
          COUNT(DISTINCT a.application_id) as application_count
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities ci ON j.city_id = ci.city_id
        LEFT JOIN districts d ON j.district_id = d.district_id
        LEFT JOIN applications a ON j.job_id = a.job_id
        ${whereClause}
        GROUP BY j.job_id, c.company_name, c.logo_url, ci.city_name, ci.country_code, d.district_name
        ORDER BY j.${orderBy} ${direction}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.query(query, values, 'get_jobs');

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
      logger.error('Failed to get jobs:', error);
      throw error;
    }
  }

  /**
   * Update job
   */
  async updateJob(jobId, updateData, userId) {
    try {
      // Check if user has permission to update this job
      const permission = await this.checkJobPermission(jobId, userId);
      if (!permission) {
        throw new Error('You do not have permission to update this job');
      }

      // Map parameter names to database column names
      const fieldMapping = {
        'job_title': 'title',
        'title': 'title',
        'job_description': 'description',
        'description': 'description',
        'job_requirements': 'requirements',
        'requirements': 'requirements',
        'job_benefits': 'benefits',
        'benefits': 'benefits',
        'employment_type': 'employment_type',
        'work_location': 'address',
        'address': 'address',
        'salary_min': 'salary_min',
        'salary_max': 'salary_max',
        'experience_required': 'experience_level',
        'experience_level': 'experience_level',
        'education_required': 'education_required',
        'deadline': 'application_deadline',
        'application_deadline': 'application_deadline',
        'number_of_positions': 'max_applications',
        'max_applications': 'max_applications',
        'job_level': 'job_level',
        'work_type': 'remote_work_option',
        'remote_work_option': 'remote_work_option',
        'city_id': 'city_id',
        'district_id': 'district_id',
        'category': 'category'
      };

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (fieldMapping[key] && updateData[key] !== undefined) {
          const dbColumn = fieldMapping[key];
          updateFields.push(`${dbColumn} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(jobId);

      const query = `
        UPDATE jobs 
        SET ${updateFields.join(', ')}
        WHERE job_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'update_job');

      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }

      logger.info('Job updated successfully', {
        job_id: jobId,
        updated_by: userId,
        updated_fields: Object.keys(updateData)
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update job:', error);
      throw error;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId, status, userId, reason = '') {
    try {
      const validStatuses = ['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid job status');
      }

      // Check permission
      const permission = await this.checkJobPermission(jobId, userId, true); // true for admin override
      if (!permission) {
        throw new Error('You do not have permission to update this job status');
      }

      const query = `
        UPDATE jobs 
        SET status = $1, updated_at = NOW()
        WHERE job_id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [status, jobId], 'update_job_status');

      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }

      // Log status change
      await this.db.query(
        `INSERT INTO job_status_history (job_id, old_status, new_status, changed_by, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [jobId, result.rows[0].status, status, userId, reason],
        'log_job_status_change'
      );

      logger.info('Job status updated', {
        job_id: jobId,
        old_status: result.rows[0].status,
        new_status: status,
        updated_by: userId,
        reason
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update job status:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission to manage job
   */
  async checkJobPermission(jobId, userId, adminOverride = false) {
    try {
      let query;
      if (adminOverride) {
        query = `
          SELECT EXISTS(
            SELECT 1 FROM jobs j
            LEFT JOIN recruiter_profiles rp ON j.company_id = rp.company_id
            LEFT JOIN users u ON j.created_by = u.user_id OR rp.user_id = u.user_id
            WHERE j.job_id = $1 
            AND (j.created_by = $2 OR rp.user_id = $2 OR u.role = 'ADMIN')
          ) as has_permission
        `;
      } else {
        query = `
          SELECT EXISTS(
            SELECT 1 FROM jobs j
            LEFT JOIN recruiter_profiles rp ON j.company_id = rp.company_id
            WHERE j.job_id = $1 
            AND (j.created_by = $2 OR rp.user_id = $2)
          ) as has_permission
        `;
      }

      const result = await this.db.query(query, [jobId, userId], 'check_job_permission');
      return result.rows[0].has_permission;
    } catch (error) {
      logger.error('Failed to check job permission:', error);
      throw error;
    }
  }

  /**
   * Add skills to job
   */
  async addJobSkills(jobId, skills) {
    try {
      const values = [];
      const valueStrings = [];
      
      skills.forEach((skill, index) => {
        const offset = index * 3;
        valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
        values.push(jobId, skill.skill_id, skill.is_required || false);
      });

      const query = `
        INSERT INTO job_skills (job_id, skill_id, is_required)
        VALUES ${valueStrings.join(', ')}
        ON CONFLICT (job_id, skill_id) DO UPDATE SET is_required = EXCLUDED.is_required
      `;

      await this.db.query(query, values, 'add_job_skills');

      logger.info('Job skills added successfully', {
        job_id: jobId,
        skills_count: skills.length
      });
    } catch (error) {
      logger.error('Failed to add job skills:', error);
      throw error;
    }
  }

  /**
   * Get recommended jobs for candidate
   */
  async getRecommendedJobs(candidateId, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      const offset = (page - 1) * limit;

      // Get candidate profile and skills
      const candidateQuery = `
        SELECT 
          cp.*,
          u.user_id,
          COALESCE(cs.skills, '[]'::json) as candidate_skills
        FROM candidate_profiles cp
        JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN (
          SELECT 
            cs.profile_id,
            json_agg(
              json_build_object(
                'skill_id', s.skill_id,
                'skill_name', s.skill_name,
                'proficiency_level', cs.proficiency_level,
                'years_experience', cs.years_experience
              )
            ) as skills
          FROM candidate_skills cs
          JOIN skills s ON cs.skill_id = s.skill_id
          GROUP BY cs.profile_id
        ) cs ON cp.profile_id = cs.profile_id
        WHERE cp.profile_id = $1
      `;

      const candidateResult = await this.db.query(candidateQuery, [candidateId], 'get_candidate_for_recommendations');
      
      if (candidateResult.rows.length === 0) {
        throw new Error('Candidate not found');
      }

      const candidate = candidateResult.rows[0];

      // Build recommendation query based on candidate profile
      const query = `
        SELECT DISTINCT
          j.*,
          c.company_name,
          c.logo_url,
          ci.city_name,
          (
            -- Skill match score (40%)
            CASE 
              WHEN skill_matches.total_skills > 0 
              THEN (skill_matches.matched_skills::float / skill_matches.total_skills) * 40
              ELSE 0 
            END +
            -- Experience match score (30%)
            CASE 
              WHEN j.experience_required <= $2 
              THEN 30 
              ELSE GREATEST(0, 30 - (j.experience_required - $2) * 5)
            END +
            -- Location match score (20%)
            CASE 
              WHEN j.city_id = $3 THEN 20
              WHEN j.work_type IN ('REMOTE', 'HYBRID') THEN 15
              ELSE 0
            END +
            -- Education match score (10%)
            CASE 
              WHEN j.education_required <= $4 THEN 10
              ELSE GREATEST(0, 10 - 2)
            END
          ) as match_score
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities ci ON j.city_id = ci.city_id
        LEFT JOIN (
          SELECT 
            js.job_id,
            COUNT(js.skill_id) as total_skills,
            COUNT(cs.skill_id) as matched_skills
          FROM job_skills js
          LEFT JOIN candidate_skills cs ON js.skill_id = cs.skill_id AND cs.profile_id = $1
          GROUP BY js.job_id
        ) skill_matches ON j.job_id = skill_matches.job_id
        WHERE j.status = 'ACTIVE'
          AND j.deadline > NOW()
          AND NOT EXISTS (
            SELECT 1 FROM applications a 
            WHERE a.job_id = j.job_id AND a.candidate_id = $1
          )
        ORDER BY match_score DESC, j.created_at DESC
        LIMIT $5 OFFSET $6
      `;

      const values = [
        candidateId,
        candidate.years_experience || 0,
        candidate.city_id,
        this.getEducationLevel(candidate.education_level),
        limit,
        offset
      ];

      const result = await this.db.query(query, values, 'get_recommended_jobs');

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total: result.rows.length,
          totalPages: Math.ceil(result.rows.length / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get recommended jobs:', error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(filters = {}) {
    try {
      const { company_id, created_by } = filters;
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (company_id) {
        conditions.push(`company_id = $${paramIndex}`);
        values.push(company_id);
        paramIndex++;
      }

      if (created_by) {
        conditions.push(`created_by = $${paramIndex}`);
        values.push(created_by);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_jobs,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_jobs,
          COUNT(*) FILTER (WHERE status = 'PAUSED') as paused_jobs,
          COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_jobs,
          COUNT(*) FILTER (WHERE deadline < NOW()) as expired_jobs,
          AVG(salary_max) as avg_salary_max,
          AVG(salary_min) as avg_salary_min,
          COUNT(DISTINCT company_id) as unique_companies
        FROM jobs
        ${whereClause}
      `;

      const result = await this.db.query(query, values, 'get_job_stats');
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Failed to get job stats:', error);
      throw error;
    }
  }

  /**
   * Helper function to convert education level to numeric value
   */
  getEducationLevel(level) {
    const levels = {
      'HIGH_SCHOOL': 1,
      'COLLEGE': 2,
      'BACHELOR': 3,
      'MASTER': 4,
      'PHD': 5
    };
    return levels[level] || 1;
  }

  /**
   * Delete job (soft delete)
   */
  async deleteJob(jobId, userId) {
    try {
      // Check permission
      const permission = await this.checkJobPermission(jobId, userId);
      if (!permission) {
        throw new Error('You do not have permission to delete this job');
      }

      // Check if job has applications
      const applicationsQuery = `
        SELECT COUNT(*) as application_count
        FROM applications
        WHERE job_id = $1
      `;

      const applicationsResult = await this.db.query(applicationsQuery, [jobId], 'check_job_applications');
      if (parseInt(applicationsResult.rows[0].application_count) > 0) {
        // Don't allow hard delete if there are applications, just close it
        return await this.updateJobStatus(jobId, 'CLOSED', userId, 'Job deleted by user');
      }

      const query = `
        UPDATE jobs 
        SET status = 'CLOSED', updated_at = NOW()
        WHERE job_id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [jobId], 'delete_job');

      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }

      logger.info('Job deleted successfully', {
        job_id: jobId,
        deleted_by: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to delete job:', error);
      throw error;
    }
  }
}

module.exports = Job; 