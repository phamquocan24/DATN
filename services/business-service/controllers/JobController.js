const Job = require('../models/Job');
const Bookmark = require('../models/Bookmark');
const winston = require('winston');
const Joi = require('joi');

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
    new winston.transports.File({ filename: 'logs/job-controller.log' })
  ]
});

// Validation schemas
const createJobSchema = Joi.object({
  job_title: Joi.string().required().min(3).max(200),
  job_description: Joi.string().required().min(10),
  job_requirements: Joi.string().optional(),
  job_responsibilities: Joi.string().optional(),
  job_benefits: Joi.string().optional(),
  employment_type: Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').required(),
  work_location: Joi.string().optional(),
  salary_min: Joi.number().min(0).optional(),
  salary_max: Joi.number().min(0).optional(),
  currency: Joi.string().valid('VND', 'USD', 'EUR').default('VND'),
  experience_level: Joi.string().valid('ENTRY', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER').optional(),
  min_experience_years: Joi.number().min(0).max(50).optional(),
  max_experience_years: Joi.number().min(0).max(50).optional(),
  education_requirements: Joi.string().optional(),
  language_requirements: Joi.array().items(Joi.string()).optional(),
  deadline: Joi.date().greater('now').optional(),
  number_of_positions: Joi.number().min(1).max(1000).default(1),
  work_type: Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID').optional(),
  auto_review_threshold: Joi.number().min(0).max(1).default(0.70).optional(),
  priority_level: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').default('NORMAL').optional(),
  featured: Joi.boolean().default(false).optional(),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional(),
  skills: Joi.array().items(Joi.object({
    skill_id: Joi.string().uuid().required(),
    is_required: Joi.boolean().default(false),
    importance_level: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM').optional(),
    min_years_experience: Joi.number().min(0).default(0).optional()
  })).optional()
});

const updateJobSchema = Joi.object({
  job_title: Joi.string().min(3).max(200).optional(),
  job_description: Joi.string().min(10).optional(),
  job_requirements: Joi.string().optional(),
  job_benefits: Joi.string().optional(),
  employment_type: Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').optional(),
  work_location: Joi.string().optional(),
  salary_min: Joi.number().min(0).optional(),
  salary_max: Joi.number().min(0).optional(),
  experience_required: Joi.number().min(0).max(50).optional(),
  education_required: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').optional(),
  deadline: Joi.date().greater('now').optional(),
  number_of_positions: Joi.number().min(1).max(1000).optional(),
  job_level: Joi.string().valid('ENTRY', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR').optional(),
  work_type: Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID').optional(),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional()
});

// Updated search schema to handle frontend parameters - allow unknown for flexibility
const searchJobsSchema = Joi.object({
  // Accept both 'search' and 'query' parameters
  search: Joi.string().optional(),
  query: Joi.string().optional(),
  
  // Location parameters - accept both formats
  location: Joi.string().optional(),
  city_id: Joi.string().uuid().optional(),
  
  // Employment and work type filters
  employment_type: Joi.alternatives().try(
    Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'),
    Joi.array().items(Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'))
  ).optional(),
  employmentType: Joi.alternatives().try(
    Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'),
    Joi.array().items(Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'))
  ).optional(),
  
  work_type: Joi.alternatives().try(
    Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID'),
    Joi.array().items(Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID'))
  ).optional(),
  workType: Joi.alternatives().try(
    Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID'),
    Joi.array().items(Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID'))
  ).optional(),
  
  // Salary and experience filters
  salary_min: Joi.number().min(0).optional(),
  salary_max: Joi.number().min(0).optional(),
  experience_required: Joi.number().min(0).max(50).optional(),
  
  // Category and skill filters
  categories: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  skills: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string().uuid())
  ).optional(),
  
  // Company filter
  company_id: Joi.string().uuid().optional(),
  
  // Additional filters from frontend
  type: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // Sorting
  orderBy: Joi.string().valid('created_at', 'updated_at', 'salary_max', 'application_deadline', 'relevance').default('created_at'),
  direction: Joi.string().valid('ASC', 'DESC').default('DESC')
}).options({ allowUnknown: true });

class JobController {
  constructor() {
    this.jobModel = new Job();
    this.bookmarkModel = new Bookmark();
  }

  /**
   * POST /api/v1/jobs - Create new job posting
   * Requires: HR/RECRUITER role
   */
  async createJob(req, res) {
    try {
      console.log('=== DEBUG: CreateJob Request ===');
      console.log('User ID:', req.user?.user_id);
      console.log('User Role:', req.user?.role);
      console.log('User company_id:', req.user?.company_id);
      console.log('User recruiter_profile:', req.user?.recruiter_profile);
      
      const { error, value } = createJobSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      // Check if user has company profile
      const companyId = req.user.company_id || (req.user.recruiter_profile && req.user.recruiter_profile.company_id);
      console.log('Resolved company_id:', companyId);
      
      if (!companyId) {
        console.log('ERROR: No company ID found for user');
        return res.status(403).json({
          success: false,
          message: 'You must be associated with a company to create job postings'
        });
      }

      const jobData = {
        ...value,
        company_id: companyId,
        created_by: req.user.recruiter_profile.profile_id
      };

      const job = await this.jobModel.createJob(jobData);

      logger.info('Job created successfully', {
        job_id: job.job_id,
        created_by: req.user.recruiter_profile.profile_id,
        company_id: companyId
      });

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to create job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create job',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs - Get all jobs with filtering and pagination
   */
  async getJobs(req, res) {
    try {
      // Normalize parameters before validation
      const normalizedParams = this.normalizeSearchParams(req.query);
      
      // Validate normalized parameters with allowUnknown for flexibility
      const { error, value } = searchJobsSchema.validate(normalizedParams, { allowUnknown: true });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      // Only show active and published jobs for public access
      const options = {
        ...value,
        status: ['ACTIVE', 'PUBLISHED']
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get jobs',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/admin - Get all jobs for admin with all statuses
   */
  async getJobsAdmin(req, res) {
    try {
      // Normalize parameters before validation
      const normalizedParams = this.normalizeSearchParams(req.query);
      
      // Validate normalized parameters with allowUnknown for flexibility
      const { error, value } = searchJobsSchema.validate(normalizedParams, { allowUnknown: true });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      // Admin can see all jobs regardless of status
      const options = {
        ...value,
        status: null  // Explicitly set to null to avoid default 'ACTIVE' filter
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get admin jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin jobs',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}:
   *   get:
   *     summary: Get job by ID
   *     description: Retrieve detailed information about a specific job
   *     tags: [Jobs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: include_stats
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include application statistics
   *         example: true
   *     responses:
   *       200:
   *         description: Job retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Job retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      const includeStats = req.query.include_stats === 'true';

      const job = await this.jobModel.getJobById(id, includeStats);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        message: 'Job retrieved successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to get job by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}/view:
   *   post:
   *     summary: Increment job view count
   *     description: Increment the view count for a specific job
   *     tags: [Jobs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: View count incremented successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: View count incremented successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     view_count:
   *                       type: number
   *                       example: 42
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async incrementViewCount(req, res) {
    try {
      const { id } = req.params;

      // Increment view count in database
      const result = await this.jobModel.incrementViewCount(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        message: 'View count incremented successfully',
        data: {
          view_count: result.view_count
        }
      });
    } catch (error) {
      logger.error('Failed to increment view count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to increment view count',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}:
   *   put:
   *     summary: Update job posting
   *     description: Update an existing job posting (HR/Recruiter only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 200
   *                 example: "Senior Software Engineer"
   *               description:
   *                 type: string
   *                 minLength: 10
   *                 example: "We are looking for an experienced software engineer to join our team..."
   *               requirements:
   *                 type: string
   *                 example: "5+ years of experience in software development, knowledge of React and Node.js"
   *               employment_type:
   *                 type: string
   *                 enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
   *                 example: "FULL_TIME"
   *               work_type:
   *                 type: string
   *                 enum: [ONSITE, REMOTE, HYBRID]
   *                 example: "HYBRID"
   *               salary_min:
   *                 type: number
   *                 minimum: 0
   *                 example: 80000
   *               salary_max:
   *                 type: number
   *                 minimum: 0
   *                 example: 120000
   *               currency:
   *                 type: string
   *                 default: "USD"
   *                 example: "USD"
   *               experience_required:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 50
   *                 example: 5
   *               application_deadline:
   *                 type: string
   *                 format: date
   *                 example: "2024-03-15"
   *               benefits:
   *                 type: string
   *                 example: "Health insurance, 401k, flexible working hours"
   *               location:
   *                 type: string
   *                 example: "San Francisco, CA"
   *     responses:
   *       200:
   *         description: Job updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       400:
   *         description: Validation failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - job owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateJobSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const job = await this.jobModel.updateJob(id, value, req.user.user_id);

      logger.info('Job updated successfully', {
        job_id: id,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job updated successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to update job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}/status:
   *   patch:
   *     summary: Update job status
   *     description: Update the status of a job posting (HR/Recruiter only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [DRAFT, PENDING, ACTIVE, PAUSED, CLOSED, CANCELLED, REJECTED]
   *                 example: "ACTIVE"
   *                 description: "New status for the job"
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Job posting approved and activated"
   *                 description: "Reason for status change (optional)"
   *     responses:
   *       200:
   *         description: Job status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job status updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       400:
   *         description: Validation failed or invalid status transition
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - job owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const job = await this.jobModel.updateJobStatus(id, status, req.user.user_id, reason);

      logger.info('Job status updated successfully', {
        job_id: id,
        new_status: status,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job status updated successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to update job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job status',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}:
   *   delete:
   *     summary: Delete job posting
   *     description: Delete a job posting (HR/Recruiter only, job owner or admin)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Job deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job deleted successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - job owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * DELETE /api/v1/jobs/:id - Delete job
   * Requires: HR/RECRUITER role, job ownership
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await this.jobModel.deleteJob(id, req.user.user_id);

      logger.info('Job deleted successfully', {
        job_id: id,
        deleted_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job deleted successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to delete job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete job',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/my-jobs:
   *   get:
   *     summary: Get my jobs
   *     description: Get jobs created by current user (HR/Recruiter only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by job title, description, or company name
   *         example: "software engineer"
   *       - in: query
   *         name: employment_type
   *         schema:
   *           type: string
   *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
   *         description: Filter by employment type
   *         example: "FULL_TIME"
   *       - in: query
   *         name: work_type
   *         schema:
   *           type: string
   *           enum: [ONSITE, REMOTE, HYBRID]
   *         description: Filter by work arrangement
   *         example: "HYBRID"
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, ACTIVE, PAUSED, CLOSED]
   *         description: Filter by job status
   *         example: "ACTIVE"
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, salary_max, application_deadline]
   *           default: "created_at"
   *         description: Field to sort by
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: "DESC"
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: My jobs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "My jobs retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Job'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/my-jobs - Get jobs created by current user
   * Requires: HR/RECRUITER role
   */
  async getMyJobs(req, res) {
    try {
      const { error, value } = searchJobsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const options = {
        ...value,
        created_by: req.user.user_id,
        status: ['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED'] // Show all statuses for own jobs
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'My jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get my jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my jobs',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/company/{companyId}:
   *   get:
   *     summary: Get jobs by company
   *     description: Get all active jobs posted by a specific company (Public endpoint)
   *     tags: [Jobs]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Company ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by job title or description
   *         example: "software engineer"
   *       - in: query
   *         name: employment_type
   *         schema:
   *           type: string
   *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
   *         description: Filter by employment type
   *         example: "FULL_TIME"
   *       - in: query
   *         name: work_type
   *         schema:
   *           type: string
   *           enum: [ONSITE, REMOTE, HYBRID]
   *         description: Filter by work arrangement
   *         example: "HYBRID"
   *       - in: query
   *         name: salary_min
   *         schema:
   *           type: number
   *           minimum: 0
   *         description: Minimum salary filter
   *         example: 50000
   *       - in: query
   *         name: salary_max
   *         schema:
   *           type: number
   *           minimum: 0
   *         description: Maximum salary filter
   *         example: 100000
   *       - in: query
   *         name: experience_required
   *         schema:
   *           type: number
   *           minimum: 0
   *           maximum: 50
   *         description: Required years of experience
   *         example: 3
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, salary_max, application_deadline]
   *           default: "created_at"
   *         description: Field to sort by
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: "DESC"
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Company jobs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Company jobs retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Job'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Company not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/company/:companyId - Get jobs by company
   * Public endpoint
   */
  async getJobsByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const { error, value } = searchJobsSchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const options = {
        ...value,
        company_id: companyId
        // Remove status filter - allow all statuses for company jobs
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Company jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get jobs by company:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get jobs by company',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/recommendations:
   *   get:
   *     summary: Get job recommendations
   *     description: Get personalized job recommendations for current candidate (Candidate only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of recommended jobs per page
   *     responses:
   *       200:
   *         description: Job recommendations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job recommendations retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     allOf:
   *                       - $ref: '#/components/schemas/Job'
   *                       - type: object
   *                         properties:
   *                           match_score:
   *                             type: number
   *                             minimum: 0
   *                             maximum: 100
   *                             example: 85.5
   *                             description: "Match score percentage based on candidate profile"
   *                           match_reasons:
   *                             type: array
   *                             items:
   *                               type: string
   *                             example: ["Skills match", "Experience level", "Location preference"]
   *                             description: "Reasons why this job is recommended"
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized - candidate role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Candidate profile not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/recommendations - Get AI-powered job recommendations for current candidate
   * Requires: CANDIDATE role
   * Calls AI service directly with candidate_uuid and returns formatted results
   */
  async getRecommendedJobs(req, res) {
    try {
      const { top_k = 10 } = req.query;
      const candidate_uuid = req.user.candidate_profile_id;

      if (!candidate_uuid) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      logger.info('🎯 Job Recommendations Request:', {
        candidate_uuid,
        top_k: parseInt(top_k)
      });

      // Call AI service directly
      const axios = require('axios');
      const AI_SERVICE_URL = process.env.AI_MATCHING_SERVICE_URL || 'http://localhost:8001';
      
      try {
        const response = await axios.get(`${AI_SERVICE_URL}/api/v1/ai/job-recommendations/${candidate_uuid}`, {
          params: {
            top_k: parseInt(top_k),
            include_reasoning: true
          },
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.success) {
          logger.info('✅ AI Recommendations received:', {
            candidate_uuid,
            total_jobs: response.data.total_jobs,
            recommendations_count: response.data.recommendations_count
          });

          // Transform AI response to frontend format
          const transformedRecommendations = response.data.recommendations.map((job, index) => ({
            job_id: job.job_id,
            title: job.job_title || job.title,
            company: job.company_name || job.group,
            location: job.location || 'Remote',
            type: job.employment_type || 'Full-time',
            match: Math.round(job.match_score || job.overall_similarity * 100),
            applied: job.application_count || 0,
            capacity: job.max_applications || 100,
            tags: job.skills || ['Technology'],
            logoColor: 'bg-blue-100 text-blue-600',
            logo: job.company_name ? job.company_name.charAt(0).toUpperCase() : 'J',
            // Add AI-specific fields
            match_reasoning: job.reasoning,
            match_strengths: job.strengths || [],
            recommendation_rank: index + 1,
            recommendation_reason: job.reasoning ? job.reasoning.slice(0, 100) + '...' : 'AI-powered match',
            fit_level: job.match_score >= 90 ? 'excellent' : 
                      job.match_score >= 80 ? 'great' :
                      job.match_score >= 70 ? 'good' : 'fair'
          }));

      res.json({
        success: true,
            data: transformedRecommendations,
            message: `Found ${transformedRecommendations.length} AI-powered job recommendations`,
            metadata: {
              candidate_uuid,
              total_jobs_analyzed: response.data.total_jobs,
              recommendations_count: response.data.recommendations_count,
              average_match_score: response.data.average_match_score,
              top_k: parseInt(top_k),
              source: 'ai_service',
              api_version: 'simplified_v1'
            }
          });

        } else {
          throw new Error(response.data?.message || 'AI service failed');
        }

      } catch (aiError) {
        logger.warn('AI service unavailable, falling back to basic recommendations:', aiError.message);
        
        // Fallback to basic job list
        const fallbackResult = await this.jobModel.getLatestJobs({ limit: parseInt(top_k) });
        
        const basicRecommendations = (fallbackResult.jobs || []).map((job, index) => ({
          job_id: job.job_id,
          title: job.title,
          company: job.company_name,
          location: job.city_name || 'Remote',
          type: job.employment_type || 'Full-time', 
          match: 75, // Default match score
          applied: job.application_count || 0,
          capacity: job.max_applications || 100,
          tags: ['Popular'],
          logoColor: 'bg-gray-100 text-gray-600',
          logo: job.company_name ? job.company_name.charAt(0).toUpperCase() : 'J',
          recommendation_rank: index + 1,
          recommendation_reason: 'Popular job opportunity',
          fit_level: 'good'
        }));

        res.json({
          success: true,
          data: basicRecommendations,
          message: `Found ${basicRecommendations.length} basic job recommendations`,
          metadata: {
            candidate_uuid,
            total_jobs_analyzed: basicRecommendations.length,
            recommendations_count: basicRecommendations.length,
            average_match_score: 75,
            top_k: parseInt(top_k),
            source: 'fallback_basic',
            api_version: 'simplified_v1'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error getting job recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job recommendations',
        message: error.message
      });
    }
  }

  // Removed unified system - Use simplified getRecommendedJobs instead

  // Legacy helper methods (kept for compatibility)
  async getUserProfile(user_id) {
    try {
      const query = `
        SELECT cp.*, u.email, u.full_name 
        FROM candidate_profiles cp
        JOIN users u ON u.user_id = cp.user_id
        WHERE cp.user_id = $1
      `;
      const result = await this.database.query(query, [user_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  async getPrimaryCV(user_id) {
    try {
      const query = `
        SELECT cv_id, file_path, file_name, is_primary, created_at
        FROM candidate_cvs 
        WHERE user_id = $1 AND is_primary = true
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await this.database.query(query, [user_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting primary CV:', error);
      return null;
    }
  }

  async getAvailableJobsForRecommendation(options = {}) {
    try {
      const { candidateId, employment_type, exclude_applied = true } = options;
      
      let query = `
        SELECT DISTINCT j.*, 
               c.company_name, c.logo_url,
               ci.city_name, d.district_name,
               COUNT(a.application_id) as application_count
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities ci ON j.city_id = ci.city_id  
        LEFT JOIN districts d ON j.district_id = d.district_id
        LEFT JOIN applications a ON j.job_id = a.job_id
      `;
      
      const conditions = [`j.status = 'PUBLISHED'`];
      const params = [];
      let paramIndex = 1;

      // Exclude jobs user already applied to
      if (exclude_applied && candidateId) {
        query += ` LEFT JOIN applications user_apps ON j.job_id = user_apps.job_id AND user_apps.candidate_id = $${paramIndex}`;
        conditions.push(`user_apps.application_id IS NULL`);
        params.push(candidateId);
        paramIndex++;
      }

      // Filter by employment type if specified
      if (employment_type) {
        conditions.push(`j.employment_type = $${paramIndex}`);
        params.push(employment_type);
        paramIndex++;
      }

      // Add deadline filter
      conditions.push(`(j.application_deadline IS NULL OR j.application_deadline > CURRENT_DATE)`);

      query += ` WHERE ${conditions.join(' AND ')}`;
      query += ` GROUP BY j.job_id, c.company_id, ci.city_id, d.district_id`;
      query += ` ORDER BY j.created_at DESC, j.featured DESC`;
      query += ` LIMIT 50`; // Reasonable limit for analysis

      const result = await this.database.query(query, params);
      return result.rows || [];
    } catch (error) {
      logger.error('Error getting available jobs for recommendation:', error);
      return [];
    }
  }

  async calculateBatchMatches(options = {}) {
    try {
      const { cv_id, job_ids, include_reasoning = true } = options;
      const axios = require('axios');
      
      const AI_MATCHING_SERVICE_URL = process.env.AI_MATCHING_SERVICE_URL || 'http://localhost:8001';
      
      logger.info('🤖 Calling AI batch matching service:', {
        cv_id,
        job_count: job_ids.length,
        service_url: AI_MATCHING_SERVICE_URL
      });

      const response = await axios.post(`${AI_MATCHING_SERVICE_URL}/api/v1/ai/batch-calculate-matches`, {
        cv_id: cv_id,
        job_ids: job_ids,
        include_reasoning
      }, {
        timeout: 60000, // 60 second timeout for batch processing
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        logger.info('✅ AI batch matching completed:', {
          cv_id,
          total_jobs: response.data.total_jobs,
          successful_matches: response.data.matches_calculated
        });
        return response.data;
      } else {
        throw new Error(response.data?.error || 'Batch matching failed');
      }
    } catch (error) {
      logger.error('❌ Error in calculateBatchMatches:', error);
      // Return empty results instead of throwing to allow graceful fallback
      return {
        success: false,
        results: [],
        total_jobs: 0,
        matches_calculated: 0,
        error: error.message
      };
    }
  }

  getFitLevel(matchScore) {
    if (matchScore >= 90) return 'excellent';
    if (matchScore >= 80) return 'great';
    if (matchScore >= 70) return 'good';
    if (matchScore >= 60) return 'fair';
    return 'poor';
  }

  generateRecommendationReason(matchScore, strengths = []) {
    const topStrengths = strengths.slice(0, 2);
    
    if (matchScore >= 90) {
      return `Perfect match! You excel in ${topStrengths.join(' and ')}.`;
    } else if (matchScore >= 80) {
      return `Great fit with strong ${topStrengths[0] || 'relevant'} skills.`;
    } else if (matchScore >= 70) {
      return `Good match for your ${topStrengths[0] || 'professional'} background.`;
    } else if (matchScore >= 60) {
      return `Potential opportunity to grow in ${topStrengths[0] || 'new areas'}.`;
    }
    return `Entry-level opportunity to develop ${topStrengths[0] || 'core'} skills.`;
  }

  // ===============================
  // UNIFIED RECOMMENDATION HELPERS
  // ===============================

  async getCandidateProfile(candidate_uuid) {
    try {
      const query = `
        SELECT cp.*, u.email, u.full_name, u.user_id
        FROM candidate_profiles cp
        JOIN users u ON u.user_id = cp.user_id
        WHERE cp.candidate_profile_id = $1
      `;
      const result = await this.database.query(query, [candidate_uuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting candidate profile:', error);
      return null;
    }
  }

  async getPrimaryCVByCandidate(candidate_uuid) {
    try {
      const query = `
        SELECT cv.*, cc.parsed_content
        FROM candidate_cvs cv
        LEFT JOIN cv_content cc ON cv.cv_id = cc.cv_id
        WHERE cv.candidate_id = $1 AND cv.is_primary = true
        ORDER BY cv.created_at DESC
        LIMIT 1
      `;
      const result = await this.database.query(query, [candidate_uuid]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting primary CV by candidate:', error);
      return null;
    }
  }

  async determineRecommendationStrategy(options) {
    const { mode, candidateProfile, primaryCV, refresh_cache } = options;

    // Force refresh mode
    if (refresh_cache) {
      if (primaryCV) {
        return {
          type: 'ai_smart',
          reason: 'Force refresh with AI analysis requested',
          cache_used: false
        };
      } else {
        return {
          type: 'profile_based', 
          reason: 'Force refresh but no CV available, using profile',
          cache_used: false
        };
      }
    }

    // Mode-based strategy
    switch (mode) {
      case 'smart':
        if (primaryCV && primaryCV.parsed_content) {
          return {
            type: 'ai_smart',
            reason: 'Primary CV available with parsed content for AI matching',
            cache_used: true
          };
        } else if (candidateProfile) {
          return {
            type: 'profile_based',
            reason: 'No CV but profile available for matching',
            cache_used: true
          };
        } else {
          return {
            type: 'basic',
            reason: 'Limited profile data, using basic recommendations',
            cache_used: true
          };
        }

      case 'basic':
        return {
          type: 'basic',
          reason: 'Basic mode explicitly requested',
          cache_used: true
        };

      case 'auto':
      default:
        // Auto-determine best strategy
        if (primaryCV && primaryCV.parsed_content) {
          return {
            type: 'ai_smart',
            reason: 'Primary CV available, using AI analysis',
            cache_used: true
          };
        } else if (candidateProfile) {
          return {
            type: 'profile_based',
            reason: 'Profile-based matching with available data',
            cache_used: true
          };
        } else {
          return {
            type: 'basic',
            reason: 'Limited data available, fallback to basic',
            cache_used: true
          };
        }
    }
  }

  async executeSmartRecommendations(options) {
    const { candidate_uuid, primaryCV, top_k, min_match_score } = options;

    try {
      // Call unified AI service directly
      const aiResults = await this.callUnifiedAIRecommendations({
        candidate_uuid,
        cv_id: primaryCV.cv_id,
        top_k,
        include_reasoning: true
      });

      if (!aiResults.success) {
        throw new Error(aiResults.message || 'AI service failed');
      }

      // Transform AI results to match our format
      const recommendations = aiResults.recommendations
        .filter(job => job.match_score >= min_match_score)
        .map((job, index) => ({
          ...job,
          recommendation_rank: index + 1,
          recommendation_reason: this.generateRecommendationReason(job.match_score, job.strengths),
          fit_level: this.getFitLevel(job.match_score)
        }));

      return {
        recommendations,
        metadata: {
          total_jobs_analyzed: aiResults.total_jobs,
          recommendations_count: recommendations.length,
          average_match_score: aiResults.average_match_score,
          strategy: 'ai_smart',
          cv_id: primaryCV.cv_id,
          ai_processing_time: aiResults.processing_time
        }
      };

    } catch (error) {
      logger.error('Error in executeSmartRecommendations:', error);
      throw error;
    }
  }

  async executeProfileBasedRecommendations(options) {
    const { candidate_uuid, candidateProfile, top_k, min_match_score } = options;

    try {
      // Get basic job recommendations
      const basicJobs = await this.getBasicJobRecommendations(top_k * 2); // Get more for filtering

      // Score based on profile preferences
      const scoredJobs = basicJobs.map(job => {
        let score = 50; // Base score

        if (candidateProfile?.preferred_employment_type === job.employment_type) score += 20;
        if (candidateProfile?.preferred_location === job.city_name) score += 15;
        if (candidateProfile?.experience_level === job.experience_level) score += 15;

        return {
          ...job,
          match_score: Math.min(score, 100),
          match_reasoning: `Profile-based match: ${score}%`,
          match_strengths: ['Profile preferences'],
          match_weaknesses: ['Detailed analysis not available'],
          calculated_at: new Date().toISOString()
        };
      });

      const recommendations = scoredJobs
        .filter(job => job.match_score >= min_match_score)
        .slice(0, top_k)
        .map((job, index) => ({
          ...job,
          recommendation_rank: index + 1,
          recommendation_reason: this.generateRecommendationReason(job.match_score, job.match_strengths),
          fit_level: this.getFitLevel(job.match_score)
        }));

      const avgScore = recommendations.length > 0 
        ? recommendations.reduce((sum, job) => sum + job.match_score, 0) / recommendations.length 
        : 0;

      return {
        recommendations,
        metadata: {
          total_jobs_analyzed: basicJobs.length,
          recommendations_count: recommendations.length,
          average_match_score: Math.round(avgScore * 100) / 100,
          strategy: 'profile_based'
        }
      };

    } catch (error) {
      logger.error('Error in executeProfileBasedRecommendations:', error);
      throw error;
    }
  }

  async executeBasicRecommendations(options) {
    const { candidate_uuid, top_k } = options;

    try {
      const basicJobs = await this.getBasicJobRecommendations(top_k);

      const recommendations = basicJobs.map((job, index) => ({
        ...job,
        match_score: 75,
        match_reasoning: 'Basic recommendation based on job popularity',
        match_strengths: ['Recent posting', 'Popular job'],
        match_weaknesses: ['No personalization'],
        recommendation_rank: index + 1,
        recommendation_reason: 'Popular job opportunity',
        fit_level: 'good',
        calculated_at: new Date().toISOString()
      }));

      return {
        recommendations,
        metadata: {
          total_jobs_analyzed: basicJobs.length,
          recommendations_count: recommendations.length,
          average_match_score: 75,
          strategy: 'basic'
        }
      };

    } catch (error) {
      logger.error('Error in executeBasicRecommendations:', error);
      return {
        recommendations: [],
        metadata: {
          total_jobs_analyzed: 0,
          recommendations_count: 0,
          average_match_score: 0,
          strategy: 'basic',
          error: error.message
        }
      };
    }
  }

  async getBasicJobRecommendations(limit = 10) {
    try {
      const query = `
        SELECT j.*, c.company_name, c.logo_url,
               ci.city_name, d.district_name,
               COUNT(a.application_id) as application_count
        FROM jobs j
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN cities ci ON j.city_id = ci.city_id  
        LEFT JOIN districts d ON j.district_id = d.district_id
        LEFT JOIN applications a ON j.job_id = a.job_id
        WHERE j.status = 'PUBLISHED'
        AND (j.application_deadline IS NULL OR j.application_deadline > CURRENT_DATE)
        GROUP BY j.job_id, c.company_id, ci.city_id, d.district_id
        ORDER BY j.featured DESC, j.created_at DESC
        LIMIT $1
      `;
      
      const result = await this.database.query(query, [limit]);
      return result.rows || [];
    } catch (error) {
      logger.error('Error getting basic job recommendations:', error);
      return [];
    }
  }

  async callUnifiedAIRecommendations(options) {
    try {
      const { candidate_uuid, cv_id, top_k, include_reasoning } = options;
      const axios = require('axios');
      
      const AI_SERVICE_URL = process.env.AI_MATCHING_SERVICE_URL || 'http://localhost:8001';
      
      logger.info('🤖 Calling UNIFIED AI Service:', {
        candidate_uuid,
        cv_id,
        top_k,
        service_url: `${AI_SERVICE_URL}/api/v1/ai/job-recommendations/${candidate_uuid}`
      });

      const response = await axios.get(`${AI_SERVICE_URL}/api/v1/ai/job-recommendations/${candidate_uuid}`, {
        params: {
          top_k,
          cv_id,
          include_reasoning
        },
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        logger.info('✅ UNIFIED AI Service completed:', {
          candidate_uuid,
          total_jobs: response.data.total_jobs,
          recommendations: response.data.recommendations_count
        });
        return response.data;
      } else {
        throw new Error(response.data?.message || 'AI recommendation service failed');
      }
    } catch (error) {
      logger.error('❌ Error calling unified AI service:', error);
      throw error;
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/latest:
   *   get:
   *     summary: Get latest jobs
   *     description: Get the most recently posted active jobs (Public endpoint)
   *     tags: [Jobs]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of latest jobs to retrieve
   *         example: 15
   *     responses:
   *       200:
   *         description: Latest jobs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Latest jobs retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Job'
   *       400:
   *         description: Invalid limit parameter
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/search/suggestions - Simple search suggestions
   */
  async getSearchSuggestions(req, res) {
    try {
      const { q: query, limit = 5 } = req.query;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      const suggestions = await this.jobModel.getSearchSuggestions(query, parseInt(limit));

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      logger.error('Failed to get search suggestions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/latest - Get latest jobs
   * Public endpoint
   */
  async getLatestJobs(req, res) {
    try {
      const { limit = 10, page = 1 } = req.query;

      const options = {
        status: ['ACTIVE', 'PUBLISHED'],
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: 'created_at',
        direction: 'DESC'
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Latest jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get latest jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get latest jobs',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/search:
   *   get:
   *     summary: Advanced job search
   *     description: Search jobs with advanced filtering options (Public endpoint)
   *     tags: [Jobs]
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by job title, description, or company name
   *         example: "software engineer"
   *       - in: query
   *         name: employment_type
   *         schema:
   *           type: string
   *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE]
   *         description: Filter by employment type
   *         example: "FULL_TIME"
   *       - in: query
   *         name: work_type
   *         schema:
   *           type: string
   *           enum: [ONSITE, REMOTE, HYBRID]
   *         description: Filter by work arrangement
   *         example: "HYBRID"
   *       - in: query
   *         name: salary_min
   *         schema:
   *           type: number
   *           minimum: 0
   *         description: Minimum salary filter
   *         example: 50000
   *       - in: query
   *         name: salary_max
   *         schema:
   *           type: number
   *           minimum: 0
   *         description: Maximum salary filter
   *         example: 100000
   *       - in: query
   *         name: experience_required
   *         schema:
   *           type: number
   *           minimum: 0
   *           maximum: 50
   *         description: Required years of experience
   *         example: 3
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *         description: Job location
   *         example: "San Francisco, CA"
   *       - in: query
   *         name: skills
   *         schema:
   *           type: string
   *         description: Comma-separated list of required skills
   *         example: "JavaScript,React,Node.js"
   *       - in: query
   *         name: company_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by specific company
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, salary_max, application_deadline, relevance]
   *           default: "relevance"
   *         description: Field to sort by
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: "DESC"
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Jobs search completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Jobs search completed successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Job'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/search - Advanced job search
   * Public endpoint
   */
  async searchJobs(req, res) {
    try {
      // Normalize parameters before validation
      const normalizedParams = this.normalizeSearchParams(req.query);
      
      // Validate normalized parameters with allowUnknown for flexibility
      const { error, value } = searchJobsSchema.validate(normalizedParams, { allowUnknown: true });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const options = {
        ...value,
        status: ['ACTIVE', 'PUBLISHED']
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Jobs search completed successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to search jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search jobs',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/stats:
   *   get:
   *     summary: Get job statistics
   *     description: Get comprehensive job statistics (HR/Recruiter see own stats, Admin sees global stats)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Job statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job statistics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     total_jobs:
   *                       type: number
   *                       example: 245
   *                       description: "Total number of jobs"
   *                     jobs_by_status:
   *                       type: object
   *                       properties:
   *                         ACTIVE:
   *                           type: number
   *                           example: 120
   *                         PENDING:
   *                           type: number
   *                           example: 15
   *                         PAUSED:
   *                           type: number
   *                           example: 30
   *                         CLOSED:
   *                           type: number
   *                           example: 60
   *                         CANCELLED:
   *                           type: number
   *                           example: 20
   *                     jobs_by_employment_type:
   *                       type: object
   *                       properties:
   *                         FULL_TIME:
   *                           type: number
   *                           example: 180
   *                         PART_TIME:
   *                           type: number
   *                           example: 25
   *                         CONTRACT:
   *                           type: number
   *                           example: 30
   *                         INTERNSHIP:
   *                           type: number
   *                           example: 10
   *                     jobs_by_work_type:
   *                       type: object
   *                       properties:
   *                         ONSITE:
   *                           type: number
   *                           example: 100
   *                         REMOTE:
   *                           type: number
   *                           example: 80
   *                         HYBRID:
   *                           type: number
   *                           example: 65
   *                     average_salary:
   *                       type: object
   *                       properties:
   *                         min:
   *                           type: number
   *                           example: 75000
   *                         max:
   *                           type: number
   *                           example: 95000
   *                     total_applications:
   *                       type: number
   *                       example: 1250
   *                       description: "Total applications received"
   *                     applications_per_job:
   *                       type: number
   *                       example: 5.1
   *                       description: "Average applications per job"
   *                     most_popular_skills:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           skill:
   *                             type: string
   *                           count:
   *                             type: number
   *                       example:
   *                         - skill: "JavaScript"
   *                           count: 45
   *                         - skill: "React"
   *                           count: 38
   *       401:
   *         description: Unauthorized - HR/Recruiter/Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/stats - Get job statistics
   * Requires: HR/RECRUITER role for own stats, ADMIN for global stats
   */
  async getJobStats(req, res) {
    try {
      const filters = {};

      // HR/RECRUITER can only see their company's stats
      if (req.user.role === 'RECRUITER' || req.user.role === 'RECRUITER') {
        if (req.user.company_id) {
          filters.company_id = req.user.company_id;
        } else {
          filters.created_by = req.user.user_id; // Fallback to user's jobs if no company_id
        }
      }

      const stats = await this.jobModel.getJobStats(filters);

      res.json({
        success: true,
        message: 'Job statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get job stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job stats',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/pending:
   *   get:
   *     summary: Get pending jobs
   *     description: Get jobs that are pending approval (DRAFT and PENDING status) (Admin only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Pending jobs retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Pending jobs retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     allOf:
   *                       - $ref: '#/components/schemas/Job'
   *                       - type: object
   *                         properties:
   *                           created_by_name:
   *                             type: string
   *                             example: "John Doe"
   *                             description: "Name of the user who created this job"
   *                           company_name:
   *                             type: string
   *                             example: "Tech Corp Inc."
   *                             description: "Company name"
   *                           days_pending:
   *                             type: number
   *                             example: 3
   *                             description: "Number of days this job has been pending"
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/jobs/pending - Get jobs pending approval (DRAFT and PENDING status)
   * Requires: ADMIN role
   */
  async getPendingJobs(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const options = {
        status: ['DRAFT', 'PENDING'],
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: 'created_at',
        direction: 'ASC'
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Pending jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get pending jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending jobs',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}/approve:
   *   post:
   *     summary: Approve job posting
   *     description: Approve a pending job posting and make it active (Admin only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Job posting meets all requirements and standards"
   *                 description: "Reason for approval (optional)"
   *     responses:
   *       200:
   *         description: Job approved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job approved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Job not found or not in pending status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * POST /api/v1/jobs/:id/approve - Approve job posting
   * Requires: ADMIN role
   */
  async approveJob(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const job = await this.jobModel.updateJobStatus(id, 'ACTIVE', req.user.user_id, reason || 'Approved by admin');

      logger.info('Job approved successfully', {
        job_id: id,
        approved_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job approved successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to approve job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve job',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/jobs/{id}/reject:
   *   post:
   *     summary: Reject job posting
   *     description: Reject a pending job posting with reason (Admin only)
   *     tags: [Jobs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Job description does not meet company standards"
   *                 description: "Reason for rejection (required)"
   *     responses:
   *       200:
   *         description: Job rejected successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Job rejected successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Job'
   *       400:
   *         description: Validation failed - reason is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Job not found or not in pending status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * POST /api/v1/jobs/:id/reject - Reject job posting
   * Requires: ADMIN role
   */
  async rejectJob(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reason is required for job rejection'
        });
      }

      const job = await this.jobModel.updateJobStatus(id, 'REJECTED', req.user.user_id, reason);

      logger.info('Job rejected successfully', {
        job_id: id,
        rejected_by: req.user.user_id,
        reason
      });

      res.json({
        success: true,
        message: 'Job rejected successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to reject job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject job',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/bookmarked - Get user's bookmarked jobs
   * Requires: CANDIDATE role
   */
  async getBookmarkedJobs(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { page = 1, limit = 20 } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await this.bookmarkModel.getUserBookmarkedJobs(req.user.user_id, options);

      res.json({
        success: true,
        message: 'Bookmarked jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get bookmarked jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bookmarked jobs',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/jobs/:id/bookmark - Add job to bookmarks
   * Requires: CANDIDATE role
   */
  async addJobBookmark(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id: jobId } = req.params;
      
      // Check if job exists
      const job = await this.jobModel.getJobById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const bookmark = await this.bookmarkModel.addBookmark(req.user.user_id, jobId);

      res.status(201).json({
        success: true,
        message: 'Job added to bookmarks successfully',
        data: bookmark
      });
    } catch (error) {
      logger.error('Failed to add job bookmark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add job bookmark',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/:id - Get job by ID
   */
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      const includeStats = req.query.include_stats === 'true';

      const job = await this.jobModel.getJobById(id, includeStats);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        message: 'Job retrieved successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to get job by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/v1/jobs/:id - Update job
   */
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateJobSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const job = await this.jobModel.updateJob(id, value, req.user.user_id);

      logger.info('Job updated successfully', {
        job_id: id,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job updated successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to update job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job',
        error: error.message
      });
    }
  }

  /**
   * PATCH /api/v1/jobs/:id/status - Update job status
   */
  async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const job = await this.jobModel.updateJobStatus(id, status, req.user.user_id, reason);

      logger.info('Job status updated successfully', {
        job_id: id,
        new_status: status,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job status updated successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to update job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job status',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/jobs/:id - Delete job
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await this.jobModel.deleteJob(id, req.user.user_id);

      logger.info('Job deleted successfully', {
        job_id: id,
        deleted_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Job deleted successfully',
        data: job
      });
    } catch (error) {
      logger.error('Failed to delete job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete job',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/my-jobs - Get jobs created by current user
   */
  async getMyJobs(req, res) {
    try {
      const { error, value } = searchJobsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const options = {
        ...value,
        created_by: req.user.user_id,
        status: ['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED'] // Show all statuses for own jobs
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'My jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get my jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my jobs',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/company/:companyId - Get jobs by company
   */
  async getJobsByCompany(req, res) {
    try {
      const { companyId } = req.params;
      const { error, value } = searchJobsSchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        });
      }

      const options = {
        ...value,
        company_id: companyId
        // Removed status filter to show all company jobs
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Company jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get jobs by company:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get jobs by company',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/recommendations - Get job recommendations for current candidate
   */
  async getRecommendedJobs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      // Get candidate profile ID
      const candidateId = req.user.candidate_profile_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await this.jobModel.getRecommendedJobs(candidateId, options);

      res.json({
        success: true,
        message: 'Job recommendations retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get job recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job recommendations',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/latest - Get latest jobs
   */
  async getLatestJobs(req, res) {
    try {
      const { limit = 10, page = 1 } = req.query;

      const options = {
        status: ['ACTIVE', 'PUBLISHED'],
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy: 'created_at',
        direction: 'DESC'
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Latest jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get latest jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get latest jobs',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/jobs/:id/bookmark - Remove job from bookmarks  
   * Requires: CANDIDATE role
   */
  async removeJobBookmark(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id: jobId } = req.params;
      
      const bookmark = await this.bookmarkModel.removeBookmark(req.user.user_id, jobId);
      
      if (!bookmark) {
        return res.status(404).json({
          success: false,
          message: 'Bookmark not found'
        });
      }

      res.json({
        success: true,
        message: 'Job removed from bookmarks successfully',
        data: bookmark
      });
    } catch (error) {
      logger.error('Failed to remove job bookmark:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove job bookmark',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/jobs/:id/bookmark-status - Check if job is bookmarked
   * Requires: CANDIDATE role
   */
  async checkJobBookmarkStatus(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { id: jobId } = req.params;
      
      const isBookmarked = await this.bookmarkModel.isJobBookmarked(req.user.user_id, jobId);

      res.json({
        success: true,
        data: {
          job_id: jobId,
          is_bookmarked: isBookmarked
        }
      });
    } catch (error) {
      logger.error('Failed to check bookmark status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check bookmark status',
        error: error.message
      });
    }
  }

  // Normalize search parameters to handle both frontend formats
  normalizeSearchParams(params) {
    const normalized = { ...params };
    
    // Remove empty string parameters to avoid validation errors
    Object.keys(normalized).forEach(key => {
      if (normalized[key] === '' || normalized[key] === null || normalized[key] === undefined) {
        delete normalized[key];
      }
    });
    
    // Handle search/query parameter
    if (params.query && !params.search) {
      normalized.search = params.query;
      delete normalized.query;
    }
    
    // Handle employment type variations
    if (params.employmentType && !params.employment_type) {
      normalized.employment_type = params.employmentType;
      delete normalized.employmentType;
    }
    
    // Handle work type variations
    if (params.workType && !params.work_type) {
      normalized.work_type = params.workType;
      delete normalized.workType;
    }
    
    // Convert arrays to comma-separated strings if needed
    if (Array.isArray(normalized.employment_type)) {
      normalized.employment_type = normalized.employment_type[0]; // Take first for now
    }
    if (Array.isArray(normalized.work_type)) {
      normalized.work_type = normalized.work_type[0]; // Take first for now
    }
    if (Array.isArray(normalized.categories)) {
      normalized.categories = normalized.categories.join(',');
    }
    
    return normalized;
  }
}

// Create Express router
const express = require('express');
const { authenticateToken, requireRole } = require('../modules/auth');
const router = express.Router();
const jobController = new JobController();

// Public routes (specific routes must come before generic :id route)
router.get('/', jobController.getJobs.bind(jobController));
router.get('/search', jobController.searchJobs.bind(jobController));
router.get('/search/suggestions', jobController.getSearchSuggestions.bind(jobController));
router.get('/latest', jobController.getLatestJobs.bind(jobController));

// Authenticated specific routes (before :id route to avoid conflicts)
router.get('/stats', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.getJobStats.bind(jobController));
router.get('/my-jobs', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.getMyJobs.bind(jobController));
router.get('/pending', authenticateToken, requireRole(['ADMIN']), jobController.getPendingJobs.bind(jobController));
router.get('/admin', authenticateToken, requireRole(['ADMIN']), jobController.getJobsAdmin.bind(jobController));
// Job recommendations endpoint (calls AI service directly)
router.get('/recommendations', authenticateToken, requireRole(['CANDIDATE']), jobController.getRecommendedJobs.bind(jobController));
router.get('/bookmarked', authenticateToken, requireRole(['CANDIDATE']), jobController.getBookmarkedJobs.bind(jobController));

// Generic :id route (must come after all specific routes)
router.get('/:id', jobController.getJobById.bind(jobController));

// View count route (must come before other :id routes)
router.post('/:id/view', jobController.incrementViewCount.bind(jobController));

// Other authenticated routes
router.post('/', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.createJob.bind(jobController));
router.put('/:id', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.updateJob.bind(jobController));
router.patch('/:id/status', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.updateJobStatus.bind(jobController));
router.delete('/:id', authenticateToken, requireRole(['RECRUITER', 'RECRUITER', 'ADMIN']), jobController.deleteJob.bind(jobController));
router.get('/company/:companyId', jobController.getJobsByCompany.bind(jobController));
router.get('/:id/bookmark-status', authenticateToken, requireRole(['CANDIDATE']), jobController.checkJobBookmarkStatus.bind(jobController));
router.post('/:id/bookmark', authenticateToken, requireRole(['CANDIDATE']), jobController.addJobBookmark.bind(jobController));
router.delete('/:id/bookmark', authenticateToken, requireRole(['CANDIDATE']), jobController.removeJobBookmark.bind(jobController));

// Admin routes
router.post('/:id/approve', authenticateToken, requireRole(['ADMIN']), jobController.approveJob.bind(jobController));
router.post('/:id/reject', authenticateToken, requireRole(['ADMIN']), jobController.rejectJob.bind(jobController));

module.exports = router; 