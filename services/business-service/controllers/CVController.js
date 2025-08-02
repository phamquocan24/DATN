const express = require('express');
const Joi = require('joi');
const CV = require('../models/CV');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../modules/auth');
const winston = require('winston');

const router = express.Router();

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
    new winston.transports.File({ filename: 'logs/cv-controller.log' })
  ]
});

// Initialize CV model
const cvModel = new CV();

// Validation schemas
const createCVSchema = Joi.object({
  cv_title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'CV title must be at least 2 characters',
    'string.max': 'CV title must not exceed 200 characters',
    'any.required': 'CV title is required'
  }),
  cv_file_url: Joi.string().uri().required().messages({
    'string.uri': 'CV file URL must be a valid URL',
    'any.required': 'CV file URL is required'
  }),
  cv_file_name: Joi.string().max(255).required().messages({
    'string.max': 'CV file name must not exceed 255 characters',
    'any.required': 'CV file name is required'
  }),
  cv_file_size: Joi.number().integer().positive().optional(),
  cv_file_type: Joi.string().valid('pdf', 'doc', 'docx').optional(),
  is_primary: Joi.boolean().default(false)
});

const updateCVSchema = Joi.object({
  cv_title: Joi.string().min(2).max(200).optional(),
  cv_file_url: Joi.string().uri().optional(),
  cv_file_name: Joi.string().max(255).optional(),
  cv_file_size: Joi.number().integer().positive().optional(),
  cv_file_type: Joi.string().valid('pdf', 'doc', 'docx').optional()
});

const searchCVSchema = Joi.object({
  skills: Joi.array().items(Joi.string().uuid()).optional(),
  experience_years_min: Joi.number().integer().min(0).optional(),
  experience_years_max: Joi.number().integer().min(0).optional(),
  education_level: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').optional(),
  job_titles: Joi.array().items(Joi.string()).optional(),
  location: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const parseCVSchema = Joi.object({
  parsed_text: Joi.string().required(),
  parsed_data: Joi.object().required(),
  skills_extracted: Joi.array().items(Joi.string()).optional(),
  experience_years: Joi.number().integer().min(0).optional(),
  education_level: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').optional(),
  job_titles: Joi.array().items(Joi.string()).optional(),
  companies: Joi.array().items(Joi.string()).optional()
});

// Helper function to get candidate profile ID
async function getCandidateProfileId(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'CANDIDATE') {
      throw new Error('User is not a candidate');
    }

    const profile = await User.getUserProfile(userId);
    if (!profile.candidate_profile) {
      throw new Error('Candidate profile not found');
    }

    return profile.candidate_profile.profile_id;
  } catch (error) {
    logger.error('Failed to get candidate profile ID:', error);
    throw error;
  }
}

// Routes

/**
 * @swagger
 * /api/v1/cvs:
 *   get:
 *     summary: Get CVs
 *     description: Get list of CVs (own CVs for candidates, searchable CVs for HR/Recruiters)
 *     tags: [CVs]
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
 *           default: 10
 *         description: Number of CVs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by CV title or content (HR/Recruiter only)
 *         example: "software engineer"
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated skill IDs to filter by (HR/Recruiter only)
 *         example: "skill1,skill2,skill3"
 *       - in: query
 *         name: experience_min
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum years of experience (HR/Recruiter only)
 *         example: 3
 *       - in: query
 *         name: education_level
 *         schema:
 *           type: string
 *           enum: [HIGH_SCHOOL, COLLEGE, BACHELOR, MASTER, PHD]
 *         description: Filter by education level (HR/Recruiter only)
 *         example: "BACHELOR"
 *     responses:
 *       200:
 *         description: CVs retrieved successfully
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
 *                   example: "CVs retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CV'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get CVs (List all for HR/Recruiters, own CVs for Candidates)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, skills, experience_min, education_level } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      skills: skills ? skills.split(',') : undefined,
      experience_years_min: experience_min ? parseInt(experience_min) : undefined,
      education_level
    };

    let result;

    if (req.user.role === 'CANDIDATE') {
      // Candidates get their own CVs only
      const candidateId = await getCandidateProfileId(req.user.user_id);
      result = await cvModel.getCandidateCVs(candidateId, options);
    } else if (['RECRUITER', 'HR', 'ADMIN'].includes(req.user.role)) {
      // HR/Recruiters can search all CVs
      const searchCriteria = {
        skills: options.skills,
        experience_years_min: options.experience_years_min,
        education_level: options.education_level,
        search: options.search
      };
      
      result = await cvModel.searchCVs(searchCriteria, { page: options.page, limit: options.limit });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'CVs retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get CVs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CVS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs:
 *   post:
 *     summary: Create a new CV
 *     description: Create a new CV (candidates only)
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cv_title
 *               - cv_file_url
 *               - cv_file_name
 *             properties:
 *               cv_title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Software Engineer CV"
 *               cv_file_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://storage.example.com/cvs/john_doe_cv.pdf"
 *               cv_file_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: "john_doe_cv.pdf"
 *               cv_file_size:
 *                 type: number
 *                 minimum: 1
 *                 example: 2048576
 *                 description: File size in bytes
 *               cv_file_type:
 *                 type: string
 *                 enum: [pdf, doc, docx]
 *                 example: "pdf"
 *               is_primary:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *                 description: Whether this is the primary CV
 *     responses:
 *       201:
 *         description: CV created successfully
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
 *                   example: "CV created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       $ref: '#/components/schemas/CV'
 *       400:
 *         description: Validation failed
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
 *         description: Access denied - candidate role required
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
// Create CV (Candidates only)
router.post('/', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { error, value } = createCVSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const candidateId = await getCandidateProfileId(req.user.user_id);

    const cvData = {
      ...value,
      candidate_id: candidateId
    };

    const cv = await cvModel.createCV(cvData);

    logger.info('CV created successfully', {
      cv_id: cv.cv_id,
      user_id: req.user.user_id,
      cv_title: cv.cv_title
    });

    res.status(201).json({
      success: true,
      message: 'CV created successfully',
      data: {
        cv
      }
    });

  } catch (error) {
    logger.error('Failed to create CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_CREATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/my-cvs:
 *   get:
 *     summary: Get my CVs
 *     description: Get current candidate's CVs
 *     tags: [CVs]
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
 *           default: 10
 *         description: Number of CVs per page
 *     responses:
 *       200:
 *         description: My CVs retrieved successfully
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
 *                   example: "My CVs retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CV'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - candidate role required
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
// Get user's CVs (Candidates only)
router.get('/my-cvs', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const candidateId = await getCandidateProfileId(req.user.user_id);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await cvModel.getCandidateCVs(candidateId, options);

    res.json({
      success: true,
      message: 'CVs retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get user CVs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CVS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/{cv_id}:
 *   get:
 *     summary: Get CV by ID
 *     description: Get detailed CV information by ID (candidates can only view their own CVs, HR/Recruiters can view all)
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cv_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CV ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: CV retrieved successfully
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
 *                   example: "CV retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       $ref: '#/components/schemas/CV'
 *       400:
 *         description: Invalid CV ID format
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
 *         description: Access denied - cannot view this CV
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: CV not found
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
// Get CV by ID
router.get('/:cv_id', authenticateToken, async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    const cv = await cvModel.getCVById(cv_id);

    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found',
        code: 'CV_NOT_FOUND'
      });
    }

    // Check permission (candidates can only view their own CVs, recruiters can view all)
    if (req.user.role === 'CANDIDATE' && cv.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'CV retrieved successfully',
      data: {
        cv
      }
    });

  } catch (error) {
    logger.error('Failed to get CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/{cv_id}:
 *   put:
 *     summary: Update CV
 *     description: Update an existing CV (candidates can only update their own CVs)
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cv_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CV ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cv_title:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Senior Software Engineer CV - Updated"
 *               cv_file_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://storage.example.com/cvs/john_doe_cv_v2.pdf"
 *               cv_file_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: "john_doe_cv_v2.pdf"
 *               cv_file_size:
 *                 type: number
 *                 minimum: 1
 *                 example: 2500000
 *                 description: File size in bytes
 *               cv_file_type:
 *                 type: string
 *                 enum: [pdf, doc, docx]
 *                 example: "pdf"
 *               is_primary:
 *                 type: boolean
 *                 example: true
 *                 description: Whether this is the primary CV
 *     responses:
 *       200:
 *         description: CV updated successfully
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
 *                   example: "CV updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       $ref: '#/components/schemas/CV'
 *       400:
 *         description: Validation failed or invalid CV ID format
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
 *         description: Access denied - cannot update this CV
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: CV not found
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
// Update CV
router.put('/:cv_id', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    const { error, value } = updateCVSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const cv = await cvModel.updateCV(cv_id, value, req.user.user_id);

    logger.info('CV updated successfully', {
      cv_id,
      updated_by: req.user.user_id,
      updated_fields: Object.keys(value)
    });

    res.json({
      success: true,
      message: 'CV updated successfully',
      data: {
        cv
      }
    });

  } catch (error) {
    logger.error('Failed to update CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_UPDATE_ERROR'
    });
  }
});

// Set primary CV
router.post('/:cv_id/set-primary', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    const cv = await cvModel.setPrimaryCV(cv_id, req.user.user_id);

    logger.info('Primary CV set successfully', {
      cv_id,
      user_id: req.user.user_id
    });

    res.json({
      success: true,
      message: 'Primary CV set successfully',
      data: {
        cv
      }
    });

  } catch (error) {
    logger.error('Failed to set primary CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SET_PRIMARY_CV_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/{cv_id}:
 *   delete:
 *     summary: Delete CV
 *     description: Delete an existing CV (candidates can only delete their own CVs)
 *     tags: [CVs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cv_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CV ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: CV deleted successfully
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
 *                   example: "CV deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv:
 *                       $ref: '#/components/schemas/CV'
 *       400:
 *         description: Invalid CV ID format
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
 *         description: Access denied - cannot delete this CV
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: CV not found
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
// Delete CV
router.delete('/:cv_id', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    const cv = await cvModel.deleteCV(cv_id, req.user.user_id);

    logger.info('CV deleted successfully', {
      cv_id,
      deleted_by: req.user.user_id
    });

    res.json({
      success: true,
      message: 'CV deleted successfully',
      data: {
        cv
      }
    });

  } catch (error) {
    logger.error('Failed to delete CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_DELETE_ERROR'
    });
  }
});

// Parse CV content (AI service integration)
router.post('/:cv_id/parse', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    const { error, value } = parseCVSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const parsedCV = await cvModel.parseCVContent(cv_id, value);

    logger.info('CV parsed successfully', {
      cv_id,
      parsed_by: req.user.user_id,
      skills_count: value.skills_extracted?.length || 0
    });

    res.json({
      success: true,
      message: 'CV parsed successfully',
      data: {
        parsed_cv: parsedCV
      }
    });

  } catch (error) {
    logger.error('Failed to parse CV:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_PARSE_ERROR'
    });
  }
});

// Search CVs (HR/Recruiters only)
router.post('/search', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), async (req, res) => {
  try {
    const { error, value } = searchCVSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { page, limit, ...searchCriteria } = value;

    const options = { page, limit };
    const result = await cvModel.searchCVs(searchCriteria, options);

    logger.info('CV search performed', {
      searched_by: req.user.user_id,
      criteria: searchCriteria,
      results_count: result.data.length
    });

    res.json({
      success: true,
      message: 'CVs search completed',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to search CVs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_SEARCH_ERROR'
    });
  }
});

// Get CV statistics (Candidates only)
router.get('/my-cvs/stats', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const candidateId = await getCandidateProfileId(req.user.user_id);
    const stats = await cvModel.getCVStats(candidateId);

    res.json({
      success: true,
      message: 'CV statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get CV stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_STATS_ERROR'
    });
  }
});

module.exports = router; 