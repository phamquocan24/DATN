const express = require('express');
const Joi = require('joi');
const CV = require('../models/CV');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../modules/auth');
const winston = require('winston');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create cvModel instance
const cvModel = new CV();

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

// AI Extraction Service Configuration
const AI_EXTRACTION_SERVICE_URL = process.env.AI_EXTRACTION_SERVICE_URL || 'http://localhost:8003';

// File upload configuration
const uploadPath = path.join(__dirname, '../uploads/cvs');

// Ensure upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExtension);
    cb(null, `${uniqueSuffix}-${baseName}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  }
});

// Helper function to auto-extract CV content
async function extractCVContentAsync(cvId, cvFileUrl) {
  try {
    // Download CV file
    const fileResponse = await axios.get(cvFileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileResponse.data);
    
    // Create form data for AI extraction service
    const formData = new FormData();
    formData.append('cv', fileBuffer, {
      filename: 'cv.pdf',
      contentType: 'application/pdf'
    });
    
    // Call AI extraction service
    const extractResponse = await axios.post(`${AI_EXTRACTION_SERVICE_URL}/extract-cv`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (extractResponse.data) {
      const parsedContent = typeof extractResponse.data === 'string' 
        ? JSON.parse(extractResponse.data) 
        : extractResponse.data;
      
      // Save extracted content to cv_content table
      const contentData = {
        parsed_content: parsedContent,
        ai_analysis: { status: 'extracted', timestamp: new Date() },
        extracted_skills: parsedContent.ky_nang || [],
        extracted_experience: {
          positions: parsedContent.kinh_nghiem_lam_viec?.map(exp => exp.vi_tri) || [],
          companies: parsedContent.kinh_nghiem_lam_viec?.map(exp => exp.cong_ty) || [],
          years: parsedContent.kinh_nghiem_lam_viec?.length || 0
        },
        extracted_education: {
          level: parsedContent.hoc_van?.[0]?.cap_do || null,
          degrees: parsedContent.hoc_van || []
        },
        extracted_contact: {
          email: parsedContent.email || '',
          phone: parsedContent.so_dien_thoai || '',
          address: parsedContent.dia_chi || '',
          full_name: parsedContent.full_name || ''
        }
      };
      
      await cvModel.parseCVContent(cvId, contentData);
      logger.info('CV content extracted successfully', { cv_id: cvId });
    }
  } catch (error) {
    logger.error('Failed to extract CV content:', {
      cv_id: cvId,
      error: error.message,
      stack: error.stack
    });
  }
}

// Validation schemas
const createCVSchema = Joi.object({
  cv_title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'CV title must be at least 2 characters',
    'string.max': 'CV title must not exceed 200 characters',
    'any.required': 'CV title is required'
  }),
  cv_file_url: Joi.string().min(1).required().messages({
    'string.min': 'CV file URL cannot be empty',
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
  cv_file_url: Joi.string().min(1).optional(),
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
  parsed_content: Joi.object().required(),  // JSONB field for complete parsed data
  ai_analysis: Joi.object().required(),  // JSONB field for complete analysis
  extracted_skills: Joi.array().items(Joi.string()).optional(),  // text[] array
  extracted_experience: Joi.object({
    positions: Joi.array().items(Joi.string()).optional(),
    companies: Joi.array().items(Joi.string()).optional(),
    years: Joi.number().integer().min(0).optional()
  }).optional(),
  extracted_education: Joi.object({
    level: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').allow(null).optional(),
    degrees: Joi.array().items(Joi.object()).optional()
  }).optional(),
  extracted_contact: Joi.object({
    email: Joi.string().email().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    full_name: Joi.string().allow('').optional()
  }).optional()
});

// Helper function to get candidate profile ID
async function getCandidateProfileId(userId) {
  try {
    const userModel = new User();
    const user = await userModel.findById(userId);
    if (!user || user.role !== 'CANDIDATE') {
      throw new Error('User is not a candidate');
    }

    const profile = await userModel.getUserProfile(userId);
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
      const candidateId = req.user.user_id;
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
/**
 * @swagger
 * /api/v1/cvs/upload:
 *   post:
 *     tags: [CVs]
 *     summary: Upload CV file
 *     description: Upload a CV file and get the file path for creating a CV record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - cv_file
 *             properties:
 *               cv_file:
 *                 type: string
 *                 format: binary
 *                 description: CV file (PDF, DOC, or DOCX, max 5MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     file_path:
 *                       type: string
 *                       example: "/uploads/cvs/1703123456789-123456789-john_doe_cv.pdf"
 *                     file_name:
 *                       type: string
 *                       example: "john_doe_cv.pdf"
 *                     file_size:
 *                       type: number
 *                       example: 2048576
 *                     file_type:
 *                       type: string
 *                       example: "pdf"
 *       400:
 *         description: Bad request (invalid file, too large, etc.)
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
 *         description: Forbidden - candidates only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Upload CV file (Candidates only)
router.post('/upload', authenticateToken, requireRole(['CANDIDATE']), upload.single('cv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const file = req.file;
    
    // Get file extension and type
    const fileExtension = path.extname(file.originalname).toLowerCase();
    let fileType = '';
    
    switch (fileExtension) {
      case '.pdf':
        fileType = 'pdf';
        break;
      case '.doc':
        fileType = 'doc';
        break;
      case '.docx':
        fileType = 'docx';
        break;
      default:
        fileType = 'pdf'; // Default fallback
    }

    // Return relative path for database storage
    const relativePath = `/uploads/cvs/${file.filename}`;

    logger.info('CV file uploaded successfully', {
      user_id: req.user.user_id,
      file_name: file.originalname,
      file_size: file.size,
      file_path: relativePath
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file_path: relativePath,
        file_name: file.originalname,
        file_size: file.size,
        file_type: fileType
      }
    });

  } catch (error) {
    logger.error('Failed to upload CV file:', {
      user_id: req.user?.user_id,
      error: error.message,
      stack: error.stack
    });

    // Clean up uploaded file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to clean up uploaded file:', unlinkError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Create CV (Candidates only)
router.post('/', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    // Debug: Log the incoming request body
    console.log('📝 CV Creation Request:', {
      body: req.body,
      hasFileUrl: !!req.body.cv_file_url,
      fileUrl: req.body.cv_file_url
    });

    const { error, value } = createCVSchema.validate(req.body);
    if (error) {
      console.error('❌ CV Creation Validation Error:', error.details[0]);
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const candidateId = req.user.user_id;

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

    // Auto-extract CV content using AI service (async, don't block response)
    extractCVContentAsync(cv.cv_id, cv.cv_file_url).catch(error => {
      logger.error('Failed to auto-extract CV content:', {
        cv_id: cv.cv_id,
        error: error.message
      });
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

    // Use user_id directly as candidate_id (based on actual database schema)
    const candidateId = req.user.user_id;

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
    const candidateId = req.user.user_id;
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

/**
 * @swagger
 * /api/v1/cvs/{cv_id}/match-scores:
 *   get:
 *     summary: Get CV match scores
 *     description: Get match scores for a specific CV with all jobs
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of match scores to return
 *     responses:
 *       200:
 *         description: Match scores retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: CV not found
 *       500:
 *         description: Internal server error
 */
// Get CV match scores
router.get('/:cv_id/match-scores', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;
    const { limit = 20 } = req.query;
    const user_id = req.user.user_id;

    // Get candidate profile ID from user ID 
    const candidateProfileQuery = `
      SELECT profile_id 
      FROM candidate_profiles 
      WHERE user_id = $1
    `;
    const candidateResult = await cvModel.db.query(candidateProfileQuery, [user_id], 'get_candidate_profile');
    
    if (candidateResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    const candidate_id = candidateResult.rows[0].profile_id;

    // Verify CV ownership (candidate_cvs.candidate_id is user_id, not profile_id)
    const cvQuery = `
      SELECT cv.cv_id 
      FROM candidate_cvs cv
      INNER JOIN candidate_profiles cp ON cv.candidate_id = cp.user_id
      WHERE cv.cv_id = $1 AND cp.profile_id = $2
    `;
    const cvResult = await cvModel.db.query(cvQuery, [cv_id, candidate_id], 'validate_cv_ownership');
    
    if (cvResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'CV not found or access denied'
      });
    }

    // For now, return empty match scores (can be enhanced with actual match scores later)
    res.json({
      success: true,
      message: 'Match scores retrieved successfully',
      data: {
        cv_id,
        best_match_score: null,
        best_match_job: null,
        has_job_matches: false,
        job_match_scores: []
      }
    });

  } catch (error) {
    logger.error('Failed to get match scores:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_MATCH_SCORES_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/{cv_id}/match-scores:
 *   post:
 *     summary: Save CV match scores
 *     description: Save match scores for a specific CV
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               best_match_score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               best_match_job:
 *                 type: string
 *               has_job_matches:
 *                 type: boolean
 *               job_match_scores:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Match scores saved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: CV not found
 *       500:
 *         description: Internal server error
 */
// Save CV match scores
router.post('/:cv_id/match-scores', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;
    const matchScoresData = req.body;
    const user_id = req.user.user_id;

    // Get candidate profile ID from user ID 
    const candidateProfileQuery = `
      SELECT profile_id 
      FROM candidate_profiles 
      WHERE user_id = $1
    `;
    const candidateResult = await cvModel.db.query(candidateProfileQuery, [user_id], 'get_candidate_profile');
    
    if (candidateResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    const candidate_id = candidateResult.rows[0].profile_id;

    // Verify CV ownership (candidate_cvs.candidate_id is user_id, not profile_id)
    const cvQuery = `
      SELECT cv.cv_id 
      FROM candidate_cvs cv
      INNER JOIN candidate_profiles cp ON cv.candidate_id = cp.user_id
      WHERE cv.cv_id = $1 AND cp.profile_id = $2
    `;
    const cvResult = await cvModel.db.query(cvQuery, [cv_id, candidate_id], 'validate_cv_ownership');
    
    if (cvResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'CV not found or access denied'
      });
    }

    // For now, just return success (can be enhanced to actually save match scores later)
    logger.info('Match scores saved for CV:', {
      cv_id,
      candidate_id,
      match_scores: matchScoresData
    });

    res.json({
      success: true,
      message: 'Match scores saved successfully',
      data: {
        cv_id,
        saved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to save match scores:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SAVE_MATCH_SCORES_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cvs/{cv_id}/download:
 *   get:
 *     summary: Download CV file
 *     description: Download CV file for enhancement (candidates only)
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
 *     responses:
 *       200:
 *         description: CV file returned
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/msword:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied
 *       404:
 *         description: CV or file not found
 *       500:
 *         description: Internal server error
 */
// Download CV file (Candidates only)
router.get('/:cv_id/download', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;
    const user_id = req.user.user_id;

    if (!cvModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    // Get CV information and verify ownership
    const cv = await cvModel.getCVById(cv_id);
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        error: 'CV not found',
        code: 'CV_NOT_FOUND'
      });
    }

    // Check ownership (candidates can only download their own CVs)
    if (cv.candidate_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Log CV data for debugging
    logger.info('CV data for download:', {
      cv_id,
      file_path: cv.file_path,
      filename: cv.filename,
      original_filename: cv.original_filename,
      file_type: cv.file_type,
      cv_file_url: cv.cv_file_url,
      cv_file_name: cv.cv_file_name,
      cv_file_type: cv.cv_file_type
    });

    // Use the correct field name from database schema
    const filePath = cv.file_path || cv.cv_file_url;
    const fileName = cv.original_filename || cv.filename || cv.cv_file_name || 'cv.pdf';
    const fileType = cv.file_type || cv.cv_file_type || 'pdf';
    
    if (!filePath) {
      logger.error('CV file path is undefined:', {
        cv_id,
        cv: cv
      });
      
      return res.status(404).json({
        success: false,
        error: 'CV file path not found in database',
        code: 'FILE_PATH_MISSING'
      });
    }

    // Build full file path
    const fullFilePath = path.join(__dirname, '..', filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullFilePath)) {
      logger.error('CV file not found on disk:', {
        cv_id,
        file_path: fullFilePath,
        original_file_path: filePath
      });
      
      return res.status(404).json({
        success: false,
        error: 'CV file not found on server',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set appropriate headers
    const fileTypeNormalized = fileType.toLowerCase().replace('.', '');
    const mimeType = fileTypeNormalized === 'pdf' ? 'application/pdf' :
                    fileTypeNormalized === 'doc' ? 'application/msword' :
                    fileTypeNormalized === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                    'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // Stream the file
    const fileStream = fs.createReadStream(fullFilePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      logger.error('Error streaming CV file:', {
        cv_id,
        error: error.message,
        file_path: fullFilePath
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to read CV file',
          code: 'FILE_READ_ERROR'
        });
      }
    });

    logger.info('CV file downloaded successfully', {
      cv_id,
      user_id,
      file_name: fileName
    });

  } catch (error) {
    logger.error('Failed to download CV file:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CV_DOWNLOAD_ERROR'
    });
  }
});

module.exports = router; 