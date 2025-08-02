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
    new winston.transports.File({ filename: 'logs/application.log' })
  ]
});

/**
 * Application Model
 * Handles job applications, status tracking, and workflow management
 */
class Application extends BaseModel {
  constructor() {
    super('applications', 'application_id');
  }

  /**
   * Create a new job application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>}
   */
  async createApplication(applicationData) {
    try {
      const {
        job_id,
        candidate_id,
        cv_id,
        cover_letter,
        match_score,
        source
      } = applicationData;

      // Validate required fields
      if (!job_id || !candidate_id) {
        throw new Error('Job ID and candidate ID are required');
      }

      // Check if candidate has already applied for this job
      const existingQuery = `
        SELECT application_id 
        FROM applications 
        WHERE job_id = $1 AND candidate_id = $2
      `;
      const existingResult = await this.db.query(existingQuery, [job_id, candidate_id], 'check_existing_application');
      
      if (existingResult.rows.length > 0) {
        throw new Error('You have already applied for this job');
      }

      // Create application
      const query = `
        INSERT INTO applications (
          job_id, candidate_id, cv_id, cover_letter, match_score, source, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        job_id, 
        candidate_id, 
        cv_id, 
        cover_letter, 
        match_score || 0, 
        source || 'DIRECT',
        'PENDING'
      ];

      const result = await this.db.query(query, values, 'create_application');
      const application = result.rows[0];

      // Create initial status history
      await this.createStatusHistory(application.application_id, null, 'PENDING', candidate_id, 'Application submitted');

      logger.info('Application created successfully', {
        application_id: application.application_id,
        job_id,
        candidate_id
      });

      return application;
    } catch (error) {
      logger.error('Failed to create application:', error);
      throw error;
    }
  }

  /**
   * Get application details with related information
   * @param {string} applicationId - Application ID
   * @param {string} userId - Current user ID for access control
   * @returns {Promise<Object>}
   */
  async getApplicationDetails(applicationId, userId) {
    try {
      const query = `
        SELECT 
          a.*,
          j.title as job_title,
          j.experience_level,
          j.employment_type,
          j.salary_min,
          j.salary_max,
          j.currency,
          j.work_arrangement,
          j.recruiter_id,
          c.company_name,
          c.logo_url,
          c.industry,
          candidate.full_name as candidate_name,
          candidate.email as candidate_email,
          candidate.phone as candidate_phone,
          cv.cv_name,
          cv.file_name,
          cv.file_path,
          city.city_name,
          dist.district_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        JOIN users candidate ON a.candidate_id = candidate.user_id
        LEFT JOIN candidate_cvs cv ON a.cv_id = cv.cv_id
        LEFT JOIN cities city ON j.city_id = city.city_id
        LEFT JOIN districts dist ON j.district_id = dist.district_id
        WHERE a.application_id = $1
      `;

      const result = await this.db.query(query, [applicationId], 'get_application_details');
      
      if (!result.rows[0]) {
        throw new Error('Application not found');
      }

      const application = result.rows[0];

      // Check access permissions
      const hasAccess = application.candidate_id === userId || application.recruiter_id === userId;
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get status history
      const historyQuery = `
        SELECT 
          ash.*,
          u.full_name as changed_by_name
        FROM application_status_history ash
        LEFT JOIN users u ON ash.changed_by = u.user_id
        WHERE ash.application_id = $1
        ORDER BY ash.created_at ASC
      `;

      const historyResult = await this.db.query(historyQuery, [applicationId], 'get_application_history');
      application.status_history = historyResult.rows;

      // Get test results if any
      const testsQuery = `
        SELECT 
          tr.*,
          jt.test_name,
          jt.test_type,
          jt.passing_score
        FROM test_results tr
        JOIN job_tests jt ON tr.test_id = jt.test_id
        WHERE tr.application_id = $1
        ORDER BY tr.created_at DESC
      `;

      const testsResult = await this.db.query(testsQuery, [applicationId], 'get_application_tests');
      application.test_results = testsResult.rows;

      return application;
    } catch (error) {
      throw new Error(`Failed to get application details: ${error.message}`);
    }
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} newStatus - New status
   * @param {string} changedBy - User ID who made the change
   * @param {string} changeReason - Reason for status change
   * @param {Object} additionalData - Additional data like rejection_reason, notes
   * @returns {Promise<Object>}
   */
  async updateStatus(applicationId, newStatus, changedBy, changeReason, additionalData = {}) {
    try {
      const validStatuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];
      
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      // Get current application
      const currentApp = await this.findById(applicationId);
      if (!currentApp) {
        throw new Error('Application not found');
      }

      return await this.db.transaction(async (client) => {
        // Update application
        const updateData = {
          current_status: newStatus,
          ...additionalData
        };

        if (newStatus === 'REJECTED') {
          updateData.rejection_reason = additionalData.rejection_reason || 'No reason provided';
        }

        const updateQuery = `
          UPDATE applications 
          SET ${Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = NOW()
          WHERE application_id = $1
          RETURNING *
        `;

        const result = await client.query(updateQuery, [applicationId, ...Object.values(updateData)]);
        const updatedApplication = result.rows[0];

        // Create status history entry
        await client.query(
          `INSERT INTO application_status_history (
            application_id, from_status, to_status, changed_by, change_reason, automated
          ) VALUES ($1, $2, $3, $4, $5, false)`,
          [applicationId, currentApp.current_status, newStatus, changedBy, changeReason]
        );

        // Send notification to candidate
        const notificationTitle = this.getStatusNotificationTitle(newStatus);
        const notificationMessage = this.getStatusNotificationMessage(newStatus, changeReason);

        await client.query(
          `INSERT INTO notifications (
            user_id, title, message, type, data
          ) VALUES ($1, $2, $3, 'APPLICATION_UPDATE', $4)`,
          [
            currentApp.candidate_id,
            notificationTitle,
            notificationMessage,
            JSON.stringify({
              application_id: applicationId,
              job_id: currentApp.job_id,
              new_status: newStatus
            })
          ]
        );

        return updatedApplication;
      });
    } catch (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }
  }

  /**
   * Get applications for a candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getCandidateApplications(candidateId, options = {}) {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        orderBy = 'submitted_at',
        direction = 'DESC'
      } = options;

      // Build the base query - candidateId is actually the user_id, need to get profile_id
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      // Get candidate profile_id from user_id
      const profileQuery = `
        SELECT profile_id FROM candidate_profiles WHERE user_id = $1
      `;
      const profileResult = await this.db.query(profileQuery, [candidateId], 'get_candidate_profile');
      
      if (!profileResult.rows[0]) {
        throw new Error('Candidate profile not found');
      }
      
      const profileId = profileResult.rows[0].profile_id;
      
      whereConditions.push(`a.candidate_id = $${paramIndex}`);
      params.push(profileId);
      paramIndex++;

      if (status) {
        whereConditions.push(`a.current_status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const query = `
        SELECT 
          a.application_id,
          a.submitted_at,
          a.current_status,
          a.match_score,
          a.cover_letter,
          j.title as job_title,
          j.experience_level,
          j.employment_type,
          j.salary_min,
          j.salary_max,
          j.currency,
          j.remote_work_option,
          j.application_deadline,
          c.company_name,
          c.logo_url,
          c.industry,
          city.city_name,
          CASE 
            WHEN j.application_deadline IS NOT NULL 
            THEN EXTRACT(days FROM j.application_deadline - CURRENT_DATE)
            ELSE NULL
          END as days_until_deadline
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities city ON j.city_id = city.city_id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY a.${orderBy} ${direction}
        ${limitClause}
      `;

      const result = await this.db.query(query, params, 'get_candidate_applications');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM applications a 
        WHERE ${whereConditions.slice(0, -2).join(' AND ')}
      `;
      const countParams = params.slice(0, -2);
      const countResult = await this.db.query(countQuery, countParams, 'count_candidate_applications');
      const total = parseInt(countResult.rows[0].total);

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
      throw new Error(`Failed to get candidate applications: ${error.message}`);
    }
  }

  /**
   * Get applications for a job (recruiter view)
   * @param {string} jobId - Job ID
   * @param {string} recruiterId - Recruiter ID for access control
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getJobApplications(jobId, recruiterId, options = {}) {
    try {
      // Verify recruiter owns this job
      const jobCheck = await this.db.query(
        `SELECT job_id FROM jobs WHERE job_id = $1 AND recruiter_id = $2`,
        [jobId, recruiterId],
        'verify_job_ownership'
      );

      if (!jobCheck.rows[0]) {
        throw new Error('Job not found or access denied');
      }

      const {
        status,
        search,
        page = 1,
        limit = 20,
        orderBy = 'submitted_at',
        direction = 'DESC'
      } = options;

      let whereConditions = ['a.job_id = $1'];
      let params = [jobId];
      let paramIndex = 2;

      if (status) {
        whereConditions.push(`a.current_status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(
          candidate.full_name ILIKE $${paramIndex} OR
          candidate.email ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const query = `
        SELECT 
          a.application_id,
          a.submitted_at,
          a.current_status,
          a.ai_match_score,
          a.cover_letter,
          a.source,
          candidate.user_id as candidate_id,
          candidate.full_name as candidate_name,
          candidate.email as candidate_email,
          candidate.phone as candidate_phone,
          cv.cv_name,
          cv.file_name,
          cp.years_experience,
          cp.current_job_title,
          cp.expected_salary,
          COUNT(tr.result_id) as test_count,
          AVG(tr.percentage) as avg_test_score
        FROM applications a
        JOIN users candidate ON a.candidate_id = candidate.user_id
        LEFT JOIN candidate_cvs cv ON a.cv_id = cv.cv_id
        LEFT JOIN candidate_profiles cp ON candidate.user_id = cp.user_id
        LEFT JOIN test_results tr ON a.application_id = tr.application_id
        WHERE ${whereConditions.join(' AND ')}
        GROUP BY a.application_id, candidate.user_id, cv.cv_id, cp.profile_id
        ORDER BY a.${orderBy} ${direction}
        ${limitClause}
      `;

      const result = await this.db.query(query, params, 'get_job_applications');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM applications a
        JOIN users candidate ON a.candidate_id = candidate.user_id
        WHERE ${whereConditions.slice(0, -2).join(' AND ')}
      `;
      const countParams = params.slice(0, -2);
      const countResult = await this.db.query(countQuery, countParams, 'count_job_applications');
      const total = parseInt(countResult.rows[0].total);

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
      throw new Error(`Failed to get job applications: ${error.message}`);
    }
  }

  /**
   * Withdraw application by candidate
   * @param {string} applicationId - Application ID
   * @param {string} candidateId - Candidate ID
   * @param {string} reason - Withdrawal reason
   * @returns {Promise<Object>}
   */
  async withdrawApplication(applicationId, candidateId, reason) {
    try {
      // Verify candidate owns this application
      const application = await this.findOne({
        application_id: applicationId,
        candidate_id: candidateId
      });

      if (!application) {
        throw new Error('Application not found or access denied');
      }

      if (application.current_status === 'WITHDRAWN') {
        throw new Error('Application already withdrawn');
      }

      if (['HIRED', 'REJECTED'].includes(application.current_status)) {
        throw new Error('Cannot withdraw application in current status');
      }

      return await this.updateStatus(
        applicationId,
        'WITHDRAWN',
        candidateId,
        reason || 'Withdrawn by candidate'
      );
    } catch (error) {
      throw new Error(`Failed to withdraw application: ${error.message}`);
    }
  }

  /**
   * Get application statistics for recruiter dashboard
   * @param {string} recruiterId - Recruiter ID
   * @returns {Promise<Object>}
   */
  async getApplicationStatistics(recruiterId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN a.current_status = 'APPLIED' THEN 1 END) as new_applications,
          COUNT(CASE WHEN a.current_status = 'SCREENING' THEN 1 END) as screening_applications,
          COUNT(CASE WHEN a.current_status = 'INTERVIEW' THEN 1 END) as interview_applications,
          COUNT(CASE WHEN a.current_status = 'OFFER' THEN 1 END) as offer_applications,
          COUNT(CASE WHEN a.current_status = 'HIRED' THEN 1 END) as hired_applications,
          COUNT(CASE WHEN a.current_status = 'REJECTED' THEN 1 END) as rejected_applications,
          AVG(a.ai_match_score) as avg_match_score,
          COUNT(CASE WHEN a.submitted_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as applications_this_week
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        WHERE j.recruiter_id = $1
      `;

      const result = await this.db.query(query, [recruiterId], 'get_application_statistics');
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get application statistics: ${error.message}`);
    }
  }

  /**
   * Get status notification title
   * @param {string} status - Application status
   * @returns {string}
   */
  getStatusNotificationTitle(status) {
    const titles = {
      'APPLIED': 'Application Submitted',
      'SCREENING': 'Application Under Review',
      'INTERVIEW': 'Interview Scheduled',
      'ASSESSMENT': 'Assessment Required',
      'OFFER': 'Job Offer Extended',
      'HIRED': 'Congratulations! You\'re Hired',
      'REJECTED': 'Application Update',
      'WITHDRAWN': 'Application Withdrawn'
    };
    return titles[status] || 'Application Update';
  }

  /**
   * Get status notification message
   * @param {string} status - Application status
   * @param {string} reason - Reason for change
   * @returns {string}
   */
  getStatusNotificationMessage(status, reason) {
    const messages = {
      'APPLIED': 'Your application has been successfully submitted.',
      'SCREENING': 'Your application is being reviewed by the hiring team.',
      'INTERVIEW': 'Congratulations! You have been selected for an interview.',
      'ASSESSMENT': 'Please complete the required assessment for this position.',
      'OFFER': 'Great news! You have received a job offer.',
      'HIRED': 'Welcome to the team! Your application process is complete.',
      'REJECTED': 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
      'WITHDRAWN': 'Your application has been withdrawn.'
    };
    
    let message = messages[status] || 'Your application status has been updated.';
    if (reason && reason !== 'No reason provided') {
      message += ` Reason: ${reason}`;
    }
    
    return message;
  }

  /**
   * Bulk update application statuses
   * @param {Array} applicationIds - Array of application IDs
   * @param {string} newStatus - New status
   * @param {string} changedBy - User ID who made the change
   * @param {string} changeReason - Reason for status change
   * @returns {Promise<Array>}
   */
  async bulkUpdateStatus(applicationIds, newStatus, changedBy, changeReason) {
    try {
      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        throw new Error('Application IDs array is required');
      }

      return await this.db.transaction(async (client) => {
        const results = [];
        
        for (const applicationId of applicationIds) {
          try {
            const result = await this.updateStatus(applicationId, newStatus, changedBy, changeReason);
            results.push({ application_id: applicationId, success: true, data: result });
          } catch (error) {
            results.push({ application_id: applicationId, success: false, error: error.message });
          }
        }
        
        return results;
      });
    } catch (error) {
      throw new Error(`Failed to bulk update application statuses: ${error.message}`);
    }
  }

  /**
   * Create status history entry
   */
  async createStatusHistory(applicationId, oldStatus, newStatus, changedBy, reason = '', scheduledDate = null) {
    try {
      const query = `
        INSERT INTO application_status_history (
          application_id, old_status, new_status, changed_by, reason, scheduled_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [applicationId, oldStatus, newStatus, changedBy, reason, scheduledDate];
      const result = await this.db.query(query, values, 'create_status_history');
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create status history:', error);
      throw error;
    }
  }

  /**
   * Get application by ID (wrapper for getApplicationDetails)
   * @param {string} applicationId - Application ID
   * @param {boolean} includeDetails - Whether to include detailed information
   * @returns {Promise<Object>}
   */
  async getApplicationById(applicationId, includeDetails = false) {
    try {
      const query = `
        SELECT 
          a.*,
          j.title as job_title,
          j.experience_level,
          j.employment_type,
          j.salary_min,
          j.salary_max,
          j.currency,
          j.remote_work_option,
          c.company_name,
          c.logo_url,
          c.industry,
          city.city_name,
          d.district_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities city ON j.city_id = city.city_id
        LEFT JOIN districts d ON j.district_id = d.district_id
        WHERE a.application_id = $1
      `;

      const result = await this.db.query(query, [applicationId], 'get_application_by_id');
      
      if (!result.rows[0]) {
        return null;
      }

      const application = result.rows[0];

      if (includeDetails) {
        // Get status history
        const historyQuery = `
          SELECT 
            ash.*,
            u.full_name as changed_by_name
          FROM application_status_history ash
          LEFT JOIN users u ON ash.changed_by = u.user_id
          WHERE ash.application_id = $1
          ORDER BY ash.created_at ASC
        `;

        const historyResult = await this.db.query(historyQuery, [applicationId], 'get_application_history');
        application.status_history = historyResult.rows;

        // Get test results if any
        const testsQuery = `
          SELECT 
            tr.*,
            jt.test_name,
            jt.test_type,
            jt.passing_score
          FROM test_results tr
          JOIN job_tests jt ON tr.test_id = jt.test_id
          WHERE tr.application_id = $1
          ORDER BY tr.created_at DESC
        `;

        const testsResult = await this.db.query(testsQuery, [applicationId], 'get_application_tests');
        application.test_results = testsResult.rows;
      }

      return application;
    } catch (error) {
      throw new Error(`Failed to get application by ID: ${error.message}`);
    }
  }
}

module.exports = Application; 