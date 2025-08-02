const Application = require('../models/Application');
const winston = require('winston');
const Joi = require('joi');
const { authenticateToken, requireRole } = require('../modules/auth');
const { BaseModel } = require('../models/Database');
const Job = require('../models/Job');
const User = require('../models/User');
const emailService = require('../services/EmailService');

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
    new winston.transports.File({ filename: 'logs/application-controller.log' })
  ]
});

// Validation schemas
const createApplicationSchema = Joi.object({
  job_id: Joi.string().uuid().required(),
  cv_id: Joi.string().uuid().optional(),
  cover_letter: Joi.string().max(5000).optional(),
  source: Joi.string().valid('DIRECT', 'SOCIAL_MEDIA', 'REFERRAL', 'HEADHUNTER', 'CAREER_FAIR').default('DIRECT')
});

const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWING', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED').required(),
  reason: Joi.string().max(1000).optional(),
  scheduled_date: Joi.date().optional()
});

const bulkUpdateSchema = Joi.object({
  application_ids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  status: Joi.string().valid('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWING', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED').required(),
  reason: Joi.string().max(1000).optional()
});

const searchApplicationsSchema = Joi.object({
  job_id: Joi.string().uuid().optional(),
  status: Joi.alternatives().try(
    Joi.string().valid('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWING', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED'),
    Joi.array().items(Joi.string().valid('PENDING', 'REVIEWING', 'SHORTLISTED', 'INTERVIEWING', 'TESTING', 'OFFERED', 'HIRED', 'REJECTED'))
  ).optional(),
  search: Joi.string().optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  orderBy: Joi.string().valid('created_at', 'updated_at', 'match_score').default('created_at'),
  direction: Joi.string().valid('ASC', 'DESC').default('DESC')
});

class ApplicationController {
  constructor() {
    this.applicationModel = new Application();
  }

  /**
   * @swagger
   * /api/v1/applications:
   *   post:
   *     summary: Create new job application
   *     description: Submit a new job application as a candidate
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - job_id
   *             properties:
   *               job_id:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the job to apply for
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               cv_id:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the CV to use for this application
   *                 example: "123e4567-e89b-12d3-a456-426614174001"
   *               cover_letter:
   *                 type: string
   *                 maxLength: 5000
   *                 description: Cover letter for the application
   *                 example: "Dear Hiring Manager, I am very interested in this position..."
   *               source:
   *                 type: string
   *                 enum: [DIRECT, SOCIAL_MEDIA, REFERRAL, HEADHUNTER, CAREER_FAIR]
   *                 default: DIRECT
   *                 description: Source of the application
   *     responses:
   *       201:
   *         description: Application submitted successfully
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
   *                   example: "Application submitted successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Application'
   *       400:
   *         description: Validation failed or application already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   */
  async createApplication(req, res) {
    try {
      const { error, value } = createApplicationSchema.validate(req.body);
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

      const { job_id, cv_id, cover_letter } = value;
      const candidate_id = req.user.user_id;

      // Check if already applied
      const existingApplication = await this.applicationModel.findOne({
        job_id,
        candidate_id
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this job'
        });
      }

      // Create application
      const applicationData = {
        job_id,
        candidate_id,
        cv_id,
        cover_letter,
        status: 'PENDING',
        applied_at: new Date()
      };

      const application = await this.applicationModel.create(applicationData);

      // Get job and candidate info for email
      try {
        const jobModel = new Job();
        const userModel = new User();
        
        const job = await jobModel.findById(job_id);
        const candidate = await userModel.findById(candidate_id);
        
        if (job && candidate && job.recruiter_id) {
          const recruiter = await userModel.findById(job.recruiter_id);
          if (recruiter) {
            // Send notification email to recruiter
            await emailService.sendJobApplicationEmail(
              recruiter.email,
              {
                title: job.title,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                address: job.address
              },
              {
                full_name: candidate.full_name,
                email: candidate.email
              }
            );
            
            logger.info('Job application email sent to recruiter', {
              application_id: application.application_id,
              recruiter_email: recruiter.email,
              job_title: job.title
            });
          }
        }
      } catch (emailError) {
        logger.error('Failed to send job application email:', emailError);
        // Don't fail application creation if email fails
      }

      logger.info('Application created successfully', {
        application_id: application.application_id,
        candidate_id,
        job_id
      });

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully',
        data: application
      });

    } catch (error) {
      logger.error('Failed to create application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create application',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications:
   *   get:
   *     summary: Get applications with filtering
   *     description: Get list of applications with filtering and pagination (HR/Admin only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: job_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: status
   *         schema:
   *           oneOf:
   *             - type: string
   *               enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *             - type: array
   *               items:
   *                 type: string
   *                 enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *         description: Filter by application status
   *         example: "PENDING"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by candidate name or email
   *         example: "john doe"
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter applications from this date
   *         example: "2023-01-01"
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter applications until this date
   *         example: "2023-12-31"
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
   *         description: Number of applications per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, match_score]
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Applications retrieved successfully
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
   *                   example: "Applications retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Application'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - HR/Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getApplications(req, res) {
    try {
      const { error, value } = searchApplicationsSchema.validate(req.query);
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

      const options = { ...value };

      // HR/RECRUITER can only see applications for their company
      if (req.user.role === 'HR' || req.user.role === 'RECRUITER') {
        options.company_id = req.user.company_id;
      }

      const result = await this.applicationModel.getApplications(options);

      res.json({
        success: true,
        message: 'Applications retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get applications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}:
   *   get:
   *     summary: Get application by ID
   *     description: Get detailed application information by ID
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: include_details
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include detailed candidate and job information
   *         example: true
   *     responses:
   *       200:
   *         description: Application retrieved successfully
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
   *                   example: "Application retrieved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/ApplicationDetail'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const includeDetails = req.query.include_details === 'true';

      const application = await this.applicationModel.getApplicationById(id, includeDetails);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check permission
      const hasPermission = await this.checkApplicationPermission(req.user, application);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        message: 'Application retrieved successfully',
        data: application
      });
    } catch (error) {
      logger.error('Failed to get application by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get application',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}/status:
   *   put:
   *     summary: Update application status
   *     description: Update the status of a job application (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
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
   *                 enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *                 example: "REVIEWING"
   *                 description: "New status for the application"
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Candidate meets initial requirements"
   *                 description: "Reason for status change (optional)"
   *               scheduled_date:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-02-15T14:30:00Z"
   *                 description: "Scheduled date for interview (required for INTERVIEWING status)"
   *     responses:
   *       200:
   *         description: Application status updated successfully
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
   *                   example: "Application status updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Application'
   *       400:
   *         description: Validation failed or invalid status transition
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
   *         description: Access denied - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateApplicationStatusSchema.validate(req.body);
      
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

      // Check if application exists and user has permission
      const application = await this.applicationModel.getApplicationById(id, false);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const hasPermission = await this.checkApplicationPermission(req.user, application, 'update');
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedApplication = await this.applicationModel.updateApplicationStatus(
        id,
        value.status,
        req.user.user_id,
        value.reason,
        value.scheduled_date
      );

      logger.info('Application status updated successfully', {
        application_id: id,
        new_status: value.status,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Application status updated successfully',
        data: updatedApplication
      });
    } catch (error) {
      logger.error('Failed to update application status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update application status',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/my-applications:
   *   get:
   *     summary: Get my applications
   *     description: Get current candidate's job applications
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *         description: Filter by application status
   *         example: "PENDING"
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
   *         description: Number of applications per page
   *       - in: query
   *         name: orderBy
   *         schema:
   *           type: string
   *           enum: [created_at, updated_at, match_score]
   *           default: created_at
   *         description: Sort field
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: DESC
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: My applications retrieved successfully
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
   *                   example: "My applications retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Application'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized - candidate role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getMyApplications(req, res) {
    try {
      const { error, value } = searchApplicationsSchema.validate(req.query);
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

      // Use user_id instead of candidate_profile_id
      const candidateId = req.user.user_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'User ID not found'
        });
      }

      const result = await this.applicationModel.getCandidateApplications(candidateId, value);

      res.json({
        success: true,
        message: 'My applications retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get my applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my applications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/job/{jobId}:
   *   get:
   *     summary: Get applications for specific job
   *     description: Get all applications for a specific job (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: jobId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *         description: Filter by application status
   *         example: "PENDING"
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
   *         description: Number of applications per page
   *     responses:
   *       200:
   *         description: Job applications retrieved successfully
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
   *                   example: "Job applications retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Application'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - HR/Recruiter role required
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
  async getJobApplications(req, res) {
    try {
      const { jobId } = req.params;
      const { error, value } = searchApplicationsSchema.validate(req.query);
      
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

      const result = await this.applicationModel.getJobApplications(jobId, value);

      res.json({
        success: true,
        message: 'Job applications retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get job applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job applications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/bulk-update:
   *   post:
   *     summary: Bulk update application status
   *     description: Update the status of multiple applications at once (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - application_ids
   *               - status
   *             properties:
   *               application_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: uuid
   *                 minItems: 1
   *                 maxItems: 100
   *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
   *                 description: "Array of application IDs to update"
   *               status:
   *                 type: string
   *                 enum: [PENDING, REVIEWING, SHORTLISTED, INTERVIEWING, TESTING, OFFERED, HIRED, REJECTED]
   *                 example: "REJECTED"
   *                 description: "New status for all applications"
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Batch processing - position filled"
   *                 description: "Reason for status change (optional)"
   *     responses:
   *       200:
   *         description: Applications updated successfully
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
   *                   example: "Applications updated successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     updated_count:
   *                       type: number
   *                       example: 15
   *                       description: "Number of applications successfully updated"
   *                     failed_count:
   *                       type: number
   *                       example: 2
   *                       description: "Number of applications that failed to update"
   *                     failed_applications:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           application_id:
   *                             type: string
   *                             format: uuid
   *                           error:
   *                             type: string
   *       400:
   *         description: Validation failed or invalid application IDs
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
   *         description: Access denied - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async bulkUpdateApplications(req, res) {
    try {
      const { error, value } = bulkUpdateSchema.validate(req.body);
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

      const results = await this.applicationModel.bulkUpdateApplications(
        value.application_ids,
        value.status,
        req.user.user_id,
        value.reason
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Bulk application update completed', {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        new_status: value.status,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
        data: results
      });
    } catch (error) {
      logger.error('Failed to bulk update applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update applications',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}/withdraw:
   *   put:
   *     summary: Withdraw application
   *     description: Withdraw a job application (candidate only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 description: Reason for withdrawal (optional)
   *                 example: "Found another opportunity"
   *     responses:
   *       200:
   *         description: Application withdrawn successfully
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
   *                   example: "Application withdrawn successfully"
   *       401:
   *         description: Unauthorized - candidate role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Cannot withdraw this application
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async withdrawApplication(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get candidate profile ID from user_id
      const userId = req.user.user_id;
      if (!userId) {
        return res.status(403).json({
          success: false,
          message: 'User ID not found'
        });
      }

      // Get candidate profile_id from user_id
      const profileQuery = `
        SELECT profile_id FROM candidate_profiles WHERE user_id = $1
      `;
      const profileResult = await this.applicationModel.db.query(profileQuery, [userId], 'get_candidate_profile');
      
      if (!profileResult.rows[0]) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }
      
      const candidateId = profileResult.rows[0].profile_id;

      const application = await this.applicationModel.withdrawApplication(id, candidateId, reason);

      logger.info('Application withdrawn successfully', {
        application_id: id,
        candidate_id: candidateId,
        reason
      });

      res.json({
        success: true,
        message: 'Application withdrawn successfully',
        data: application
      });
    } catch (error) {
      logger.error('Failed to withdraw application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw application',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/statistics:
   *   get:
   *     summary: Get application statistics
   *     description: Get comprehensive application statistics (HR/Admin only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: job_id
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter statistics by job ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: date_from
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter from this date
   *         example: "2023-01-01"
   *       - in: query
   *         name: date_to
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter until this date
   *         example: "2023-12-31"
   *     responses:
   *       200:
   *         description: Application statistics retrieved successfully
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
   *                   example: "Application statistics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     total_applications:
   *                       type: number
   *                       example: 150
   *                     applications_by_status:
   *                       type: object
   *                       properties:
   *                         PENDING:
   *                           type: number
   *                           example: 45
   *                         REVIEWING:
   *                           type: number
   *                           example: 30
   *                         SHORTLISTED:
   *                           type: number
   *                           example: 25
   *                         HIRED:
   *                           type: number
   *                           example: 15
   *                         REJECTED:
   *                           type: number
   *                           example: 35
   *                     conversion_rates:
   *                       type: object
   *                       properties:
   *                         application_to_interview:
   *                           type: number
   *                           example: 0.3
   *                         interview_to_hire:
   *                           type: number
   *                           example: 0.6
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - HR/Admin role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getApplicationStats(req, res) {
    try {
      const { job_id, date_from, date_to } = req.query;
      const filters = {};

      if (job_id) filters.job_id = job_id;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      // HR/RECRUITER can only see stats for their company
      if (req.user.role === 'HR' || req.user.role === 'RECRUITER') {
        filters.company_id = req.user.company_id;
      }

      const stats = await this.applicationModel.getApplicationStats(filters);

      res.json({
        success: true,
        message: 'Application statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get application stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get application stats',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}/shortlist:
   *   post:
   *     summary: Shortlist candidate
   *     description: Move application to shortlisted status (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
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
   *                 example: "Candidate meets all requirements and has excellent skills"
   *                 description: "Reason for shortlisting (optional)"
   *     responses:
   *       200:
   *         description: Candidate shortlisted successfully
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
   *                   example: "Candidate shortlisted successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Application'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * POST /api/v1/applications/:id/shortlist - Shortlist candidate
   * Requires: HR/RECRUITER role (job ownership) or ADMIN role
   */
  async shortlistCandidate(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const application = await this.applicationModel.updateApplicationStatus(
        id,
        'SHORTLISTED',
        req.user.user_id,
        reason || 'Candidate shortlisted for further review'
      );

      logger.info('Candidate shortlisted successfully', {
        application_id: id,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Candidate shortlisted successfully',
        data: application
      });
    } catch (error) {
      logger.error('Failed to shortlist candidate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to shortlist candidate',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}/reject:
   *   post:
   *     summary: Reject candidate
   *     description: Reject a candidate's application with reason (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
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
   *                 example: "Skills do not match job requirements"
   *                 description: "Reason for rejection (required)"
   *     responses:
   *       200:
   *         description: Candidate rejected successfully
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
   *                   example: "Candidate rejected successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Application'
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
   *         description: Access denied - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * POST /api/v1/applications/:id/reject - Reject candidate
   * Requires: HR/RECRUITER role (job ownership) or ADMIN role
   */
  async rejectCandidate(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reason is required for rejection'
        });
      }

      const application = await this.applicationModel.updateApplicationStatus(
        id,
        'REJECTED',
        req.user.user_id,
        reason
      );

      logger.info('Candidate rejected successfully', {
        application_id: id,
        updated_by: req.user.user_id,
        reason
      });

      res.json({
        success: true,
        message: 'Candidate rejected successfully',
        data: application
      });
    } catch (error) {
      logger.error('Failed to reject candidate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject candidate',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/{id}/schedule-interview:
   *   post:
   *     summary: Schedule interview
   *     description: Schedule an interview for a candidate and update application status to INTERVIEWING (HR/Recruiter only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Application ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - scheduled_date
   *             properties:
   *               scheduled_date:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-02-15T14:30:00Z"
   *                 description: "Date and time for the interview (required)"
   *               reason:
   *                 type: string
   *                 maxLength: 1000
   *                 example: "Initial technical interview scheduled"
   *                 description: "Additional notes about the interview (optional)"
   *     responses:
   *       200:
   *         description: Interview scheduled successfully
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
   *                   example: "Interview scheduled successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Application'
   *       400:
   *         description: Validation failed - scheduled date is required
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
   *         description: Access denied - HR/Recruiter role required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * POST /api/v1/applications/:id/schedule-interview - Schedule interview
   * Requires: HR/RECRUITER role (job ownership) or ADMIN role
   */
  async scheduleInterview(req, res) {
    try {
      const { id } = req.params;
      const { scheduled_date, reason } = req.body;

      if (!scheduled_date) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date is required'
        });
      }

      const application = await this.applicationModel.updateApplicationStatus(
        id,
        'INTERVIEWING',
        req.user.user_id,
        reason || 'Interview scheduled',
        scheduled_date
      );

      logger.info('Interview scheduled successfully', {
        application_id: id,
        scheduled_date,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Interview scheduled successfully',
        data: application
      });
    } catch (error) {
      logger.error('Failed to schedule interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/applications/match-score/{jobId}:
   *   get:
   *     summary: Calculate match score
   *     description: Calculate match score between current candidate and a specific job (Candidate only)
   *     tags: [Applications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: jobId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Job ID to calculate match score for
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Match score calculated successfully
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
   *                   example: "Match score calculated successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     job_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                       description: "Job ID"
   *                     candidate_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174002"
   *                       description: "Candidate ID"
   *                     match_score:
   *                       type: number
   *                       minimum: 0
   *                       maximum: 100
   *                       example: 85.5
   *                       description: "Match score percentage (0-100)"
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
   *       404:
   *         description: Job not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * GET /api/v1/applications/match-score/:jobId - Calculate match score for current candidate
   * Requires: CANDIDATE role
   */
  async getMatchScore(req, res) {
    try {
      const { jobId } = req.params;

      const candidateId = req.user.candidate_profile_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      const matchScore = await this.applicationModel.calculateMatchScore(candidateId, jobId);

      res.json({
        success: true,
        message: 'Match score calculated successfully',
        data: {
          job_id: jobId,
          candidate_id: candidateId,
          match_score: matchScore
        }
      });
    } catch (error) {
      logger.error('Failed to calculate match score:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate match score',
        error: error.message
      });
    }
  }

  /**
   * Helper method to check application permissions
   */
  async checkApplicationPermission(user, application, action = 'view') {
    try {
      // Admin can do everything
      if (user.role === 'ADMIN') {
        return true;
      }

      // Candidate can view/withdraw their own applications
      if (user.role === 'CANDIDATE' && user.candidate_profile_id === application.candidate_id) {
        return true;
      }

      // HR/Recruiter can manage applications for their company jobs
      if ((user.role === 'HR' || user.role === 'RECRUITER') && 
          user.company_id === application.company_id) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check application permission:', error);
      return false;
    }
  }
}

// Create Express router
const express = require('express');
const router = express.Router();
const applicationController = new ApplicationController();

// Routes with authentication - specific routes first, generic /:id routes last
router.get('/', authenticateToken, applicationController.getApplications.bind(applicationController));

// Specific routes (must come before /:id)
router.get('/my-applications', authenticateToken, requireRole(['CANDIDATE']), applicationController.getMyApplications.bind(applicationController));
router.get('/stats', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.getApplicationStats.bind(applicationController));
router.get('/match-score/:jobId', authenticateToken, requireRole(['CANDIDATE']), applicationController.getMatchScore.bind(applicationController));
router.get('/job/:jobId', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.getJobApplications.bind(applicationController));

// Bulk operations
router.post('/bulk-update', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.bulkUpdateApplications.bind(applicationController));

// Generic routes with ID parameter (must come after specific routes)
router.get('/:id', authenticateToken, applicationController.getApplicationById.bind(applicationController));
router.post('/', authenticateToken, requireRole(['CANDIDATE']), applicationController.createApplication.bind(applicationController));
router.put('/:id/status', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.updateApplicationStatus.bind(applicationController));
router.post('/:id/withdraw', authenticateToken, requireRole(['CANDIDATE']), applicationController.withdrawApplication.bind(applicationController));
router.post('/:id/shortlist', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.shortlistCandidate.bind(applicationController));
router.post('/:id/reject', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.rejectCandidate.bind(applicationController));
router.post('/:id/schedule-interview', authenticateToken, requireRole(['HR', 'RECRUITER', 'ADMIN']), applicationController.scheduleInterview.bind(applicationController));

module.exports = router; 