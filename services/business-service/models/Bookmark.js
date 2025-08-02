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
    new winston.transports.File({ filename: 'logs/bookmark.log' })
  ]
});

class Bookmark extends BaseModel {
  constructor() {
    super('saved_jobs', 'saved_job_id');
  }

  /**
   * Add a job to user's saved jobs (bookmarks)
   */
  async addBookmark(userId, jobId) {
    try {
      // First get the candidate profile ID from user ID
      const candidateId = await this.getCandidateIdFromUserId(userId);
      if (!candidateId) {
        throw new Error('Candidate profile not found for this user');
      }

      // Check if already saved
      const existingBookmark = await this.findBookmark(candidateId, jobId);
      if (existingBookmark) {
        return existingBookmark;
      }

      const query = `
        INSERT INTO saved_jobs (candidate_id, job_id, created_at) 
        VALUES ($1, $2, NOW()) 
        RETURNING *
      `;
      const result = await this.db.query(query, [candidateId, jobId], 'add_saved_job');
      
      logger.info('Job saved successfully', {
        user_id: userId,
        candidate_id: candidateId,
        job_id: jobId,
        saved_job_id: result.rows[0].saved_job_id
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to save job:', error);
      throw error;
    }
  }

  /**
   * Remove a job from user's saved jobs
   */
  async removeBookmark(userId, jobId) {
    try {
      // First get the candidate profile ID from user ID
      const candidateId = await this.getCandidateIdFromUserId(userId);
      if (!candidateId) {
        throw new Error('Candidate profile not found for this user');
      }

      const query = `
        DELETE FROM saved_jobs 
        WHERE candidate_id = $1 AND job_id = $2 
        RETURNING *
      `;
      const result = await this.db.query(query, [candidateId, jobId], 'remove_saved_job');
      
      if (result.rows.length > 0) {
        logger.info('Job bookmark removed successfully', {
          user_id: userId,
          candidate_id: candidateId,
          job_id: jobId
        });
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to remove saved job:', error);
      throw error;
    }
  }

  /**
   * Find a specific saved job
   */
  async findBookmark(candidateId, jobId) {
    try {
      const query = `
        SELECT * FROM saved_jobs 
        WHERE candidate_id = $1 AND job_id = $2
      `;
      const result = await this.db.query(query, [candidateId, jobId], 'find_saved_job');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to find saved job:', error);
      throw error;
    }
  }

  /**
   * Get candidate profile ID from user ID
   */
  async getCandidateIdFromUserId(userId) {
    try {
      const query = `
        SELECT profile_id FROM candidate_profiles 
        WHERE user_id = $1
      `;
      const result = await this.db.query(query, [userId], 'get_candidate_id');
      return result.rows[0]?.profile_id;
    } catch (error) {
      logger.error('Failed to get candidate ID:', error);
      throw error;
    }
  }

  /**
   * Get all saved jobs for a user with job details
   */
  async getUserBookmarkedJobs(userId, options = {}) {
    try {
      // First get the candidate profile ID from user ID
      const candidateId = await this.getCandidateIdFromUserId(userId);
      if (!candidateId) {
        throw new Error('Candidate profile not found for this user');
      }

      const { page = 1, limit = 20, orderBy = 'created_at', direction = 'DESC' } = options;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          sj.saved_job_id as bookmark_id,
          sj.created_at as bookmarked_at,
          j.job_id,
          j.title,
          j.description,
          j.employment_type,
          j.address,
          j.salary_min,
          j.salary_max,
          j.currency,
          j.experience_level,
          j.application_deadline,
          j.remote_work_option,
          j.status,
          j.created_at,
          c.company_id,
          c.company_name as company_name,
          c.logo_url as company_logo,
          c.description as company_description
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        WHERE sj.candidate_id = $1 AND j.status = 'ACTIVE'
        ORDER BY sj.${orderBy} ${direction}
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.job_id
        WHERE sj.candidate_id = $1 AND j.status = 'ACTIVE'
      `;

      const [jobsResult, countResult] = await Promise.all([
        this.db.query(query, [candidateId, limit, offset], 'get_saved_jobs'),
        this.db.query(countQuery, [candidateId], 'count_saved_jobs')
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        data: jobsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get saved jobs:', error);
      throw error;
    }
  }

  /**
   * Check if a job is saved by user
   */
  async isJobBookmarked(userId, jobId) {
    try {
      const candidateId = await this.getCandidateIdFromUserId(userId);
      if (!candidateId) {
        return false;
      }
      
      const bookmark = await this.findBookmark(candidateId, jobId);
      return !!bookmark;
    } catch (error) {
      logger.error('Failed to check saved job status:', error);
      throw error;
    }
  }

  /**
   * Get saved job statistics for a user
   */
  async getUserBookmarkStats(userId) {
    try {
      const candidateId = await this.getCandidateIdFromUserId(userId);
      if (!candidateId) {
        throw new Error('Candidate profile not found for this user');
      }

      const query = `
        SELECT 
          COUNT(*) as total_bookmarks,
          COUNT(CASE WHEN j.status = 'ACTIVE' THEN 1 END) as active_bookmarks,
          COUNT(CASE WHEN j.application_deadline < NOW() THEN 1 END) as expired_bookmarks
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.job_id
        WHERE sj.candidate_id = $1
      `;

      const result = await this.db.query(query, [candidateId], 'get_saved_job_stats');
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get saved job stats:', error);
      throw error;
    }
  }
}

module.exports = Bookmark; 