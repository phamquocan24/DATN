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
  job_benefits: Joi.string().optional(),
  employment_type: Joi.string().valid('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE').required(),
  work_location: Joi.string().optional(),
  salary_min: Joi.number().min(0).optional(),
  salary_max: Joi.number().min(0).optional(),
  currency: Joi.string().valid('VND', 'USD', 'EUR').default('VND'),
  experience_required: Joi.number().min(0).max(50).optional(),
  education_required: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').optional(),
  deadline: Joi.date().greater('now').optional(),
  number_of_positions: Joi.number().min(1).max(1000).default(1),
  job_level: Joi.string().valid('ENTRY', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR').optional(),
  work_type: Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID').optional(),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional(),
  skills: Joi.array().items(Joi.object({
    skill_id: Joi.string().uuid().required(),
    is_required: Joi.boolean().default(false)
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
      if (!companyId) {
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

      // Only show active jobs for public access
      const options = {
        ...value,
        status: 'ACTIVE'
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
        company_id: companyId,
        status: 'ACTIVE'
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
   * GET /api/v1/jobs/recommendations - Get job recommendations for current candidate
   * Requires: CANDIDATE role
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
   * GET /api/v1/jobs/latest - Get latest jobs
   * Public endpoint
   */
  async getLatestJobs(req, res) {
    try {
      const { limit = 10 } = req.query;

      const options = {
        status: 'ACTIVE',
        page: 1,
        limit: parseInt(limit),
        orderBy: 'created_at',
        direction: 'DESC'
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Latest jobs retrieved successfully',
        data: result.data
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
        status: 'ACTIVE'
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

      // HR/RECRUITER can only see their own stats
      if (req.user.role === 'HR' || req.user.role === 'RECRUITER') {
        filters.created_by = req.user.user_id;
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
   *     description: Get jobs that are pending approval (Admin only)
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
   * GET /api/v1/jobs/pending - Get jobs pending approval
   * Requires: ADMIN role
   */
  async getPendingJobs(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const options = {
        status: 'PENDING',
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
        company_id: companyId,
        status: 'ACTIVE'
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
      const { limit = 10 } = req.query;

      const options = {
        status: 'ACTIVE',
        page: 1,
        limit: parseInt(limit),
        orderBy: 'created_at',
        direction: 'DESC'
      };

      const result = await this.jobModel.getJobs(options);

      res.json({
        success: true,
        message: 'Latest jobs retrieved successfully',
        data: result.data
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
router.get('/latest', jobController.getLatestJobs.bind(jobController));

// Authenticated specific routes (before :id route to avoid conflicts)
router.get('/stats', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.getJobStats.bind(jobController));
router.get('/my-jobs', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.getMyJobs.bind(jobController));
router.get('/pending', authenticateToken, requireRole(['ADMIN']), jobController.getPendingJobs.bind(jobController));
router.get('/recommendations', authenticateToken, requireRole(['CANDIDATE']), jobController.getRecommendedJobs.bind(jobController));
router.get('/bookmarked', authenticateToken, requireRole(['CANDIDATE']), jobController.getBookmarkedJobs.bind(jobController));

// Generic :id route (must come after all specific routes)
router.get('/:id', jobController.getJobById.bind(jobController));

// Other authenticated routes
router.post('/', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.createJob.bind(jobController));
router.put('/:id', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.updateJob.bind(jobController));
router.patch('/:id/status', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.updateJobStatus.bind(jobController));
router.delete('/:id', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), jobController.deleteJob.bind(jobController));
router.get('/company/:companyId', jobController.getJobsByCompany.bind(jobController));
router.post('/:id/bookmark', authenticateToken, requireRole(['CANDIDATE']), jobController.addJobBookmark.bind(jobController));
router.delete('/:id/bookmark', authenticateToken, requireRole(['CANDIDATE']), jobController.removeJobBookmark.bind(jobController));

// Admin routes
router.post('/:id/approve', authenticateToken, requireRole(['ADMIN']), jobController.approveJob.bind(jobController));
router.post('/:id/reject', authenticateToken, requireRole(['ADMIN']), jobController.rejectJob.bind(jobController));

module.exports = router; 