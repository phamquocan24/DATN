const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('./auth');
const winston = require('winston');
const userModel = new User();

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
    new winston.transports.File({ filename: 'logs/user.log' })
  ]
});

// Validation schemas
const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
  profile_image_url: Joi.string().uri().optional().allow(''),
  bio: Joi.string().max(1000).optional().allow(''),
  website_url: Joi.string().uri().optional().allow(''),
  languages: Joi.array().items(Joi.string()).optional(),
  
  // Candidate specific fields
  date_of_birth: Joi.date().optional(),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').optional(),
  address: Joi.string().max(500).optional().allow(''),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional(),
  education_level: Joi.string().valid('HIGH_SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD').optional(),
  years_experience: Joi.number().integer().min(0).max(50).optional(),
  current_job_title: Joi.string().max(200).optional().allow(''),
  current_company: Joi.string().max(200).optional().allow(''),
  current_salary: Joi.number().positive().optional(),
  expected_salary: Joi.number().positive().optional(),
  currency: Joi.string().length(3).default('VND').optional(),
  notice_period_days: Joi.number().integer().min(0).max(365).optional(),
  willing_to_relocate: Joi.boolean().optional(),
  remote_work_preference: Joi.string().valid('ONSITE', 'REMOTE', 'HYBRID', 'FLEXIBLE').optional(),
  
  // Recruiter specific fields
  position: Joi.string().max(100).optional().allow(''),
  department: Joi.string().max(100).optional().allow(''),
  hire_authority_level: Joi.string().valid('JUNIOR', 'SENIOR', 'MANAGER', 'DIRECTOR').optional()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    'any.required': 'New password is required'
  }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

const addSkillSchema = Joi.object({
  skill_id: Joi.string().uuid().required(),
  proficiency_level: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').required(),
  years_experience: Joi.number().integer().min(0).max(50).default(0),
  is_primary: Joi.boolean().default(false)
});

const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required()
});

// Routes

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: "Profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized access
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
// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await userModel.getUserProfile(req.user.user_id);

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: profile
      }
    });

  } catch (error) {
    logger.error('Failed to get profile:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'PROFILE_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *                 description: "User's full name"
 *               phone:
 *                 type: string
 *                 pattern: "^[+]?[0-9]{10,15}$"
 *                 example: "+84901234567"
 *                 description: "Phone number"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *                 description: "Date of birth"
 *               bio:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Experienced software developer with 5+ years..."
 *                 description: "User biography"
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Ho Chi Minh City, Vietnam"
 *                 description: "Current location"
 *               # Candidate specific fields
 *               experience_level:
 *                 type: string
 *                 enum: [FRESHER, JUNIOR, SENIOR, LEAD, EXPERT]
 *                 example: "SENIOR"
 *                 description: "Experience level (Candidate only)"
 *               expected_salary_min:
 *                 type: number
 *                 minimum: 0
 *                 example: 1000
 *                 description: "Minimum expected salary USD (Candidate only)"
 *               expected_salary_max:
 *                 type: number
 *                 minimum: 0
 *                 example: 2000
 *                 description: "Maximum expected salary USD (Candidate only)"
 *               current_job_title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Senior Software Engineer"
 *                 description: "Current job title (Candidate only)"
 *               years_of_experience:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 50
 *                 example: 5
 *                 description: "Years of experience (Candidate only)"
 *               job_seeking_status:
 *                 type: string
 *                 enum: [ACTIVELY_SEEKING, OPEN_TO_OPPORTUNITIES, NOT_SEEKING]
 *                 example: "OPEN_TO_OPPORTUNITIES"
 *                 description: "Job seeking status (Candidate only)"
 *               preferred_job_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP]
 *                 example: ["FULL_TIME", "CONTRACT"]
 *                 description: "Preferred job types (Candidate only)"
 *               remote_work_preference:
 *                 type: string
 *                 enum: [ONSITE, REMOTE, HYBRID, FLEXIBLE]
 *                 example: "HYBRID"
 *                 description: "Remote work preference (Candidate only)"
 *               # Recruiter specific fields
 *               position:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Senior Recruiter"
 *                 description: "Position in company (Recruiter only)"
 *               department:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Human Resources"
 *                 description: "Department (Recruiter only)"
 *               hire_authority_level:
 *                 type: string
 *                 enum: [JUNIOR, SENIOR, MANAGER, DIRECTOR]
 *                 example: "SENIOR"
 *                 description: "Hiring authority level (Recruiter only)"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const updatedProfile = await userModel.updateProfile(req.user.user_id, value);

    logger.info('Profile updated successfully', {
      user_id: req.user.user_id,
      updated_fields: Object.keys(value)
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedProfile
      }
    });

  } catch (error) {
    logger.error('Failed to update profile:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the authenticated user's password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: "CurrentPassword123!"
 *                 description: "User's current password"
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])"
 *                 example: "NewPassword123!"
 *                 description: "New password (min 8 chars, must contain uppercase, lowercase, number, special char)"
 *               confirm_password:
 *                 type: string
 *                 example: "NewPassword123!"
 *                 description: "Confirm new password (must match new_password)"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password changed successfully"
 *       400:
 *         description: Validation error or incorrect current password
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { current_password, new_password } = value;

    await userModel.changePassword(req.user.user_id, current_password, new_password);

    logger.info('Password changed successfully', {
      user_id: req.user.user_id
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Failed to change password:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Get profile completion suggestions
router.get('/profile/suggestions', authenticateToken, async (req, res) => {
  try {
    const profile = await userModel.getUserProfile(req.user.user_id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    const suggestions = [];

    // Basic profile suggestions
    if (!profile.profile_image_url) {
      suggestions.push({
        category: 'basic',
        field: 'profile_image_url',
        title: 'Add Profile Picture',
        description: 'Upload a professional photo to make your profile more engaging',
        priority: 'high'
      });
    }

    if (!profile.bio) {
      suggestions.push({
        category: 'basic',
        field: 'bio',
        title: 'Write Bio',
        description: 'Tell employers about yourself and your career goals',
        priority: 'high'
      });
    }

    if (!profile.phone) {
      suggestions.push({
        category: 'contact',
        field: 'phone',
        title: 'Add Phone Number',
        description: 'Help recruiters contact you easily',
        priority: 'medium'
      });
    }

    // Role-specific suggestions
    if (profile.role === 'CANDIDATE') {
      if (!profile.candidate_profile?.years_experience) {
        suggestions.push({
          category: 'experience',
          field: 'years_experience',
          title: 'Add Experience Level',
          description: 'Specify your years of experience to match with relevant jobs',
          priority: 'high'
        });
      }

      if (!profile.candidate_profile?.skills || profile.candidate_profile.skills.length === 0) {
        suggestions.push({
          category: 'skills',
          field: 'skills',
          title: 'Add Skills',
          description: 'List your technical and professional skills',
          priority: 'high'
        });
      }

      if (!profile.candidate_profile?.expected_salary) {
        suggestions.push({
          category: 'salary',
          field: 'expected_salary',
          title: 'Set Salary Expectation',
          description: 'Help recruiters understand your salary requirements',
          priority: 'medium'
        });
      }
    }

    // Calculate completion percentage
    const completionPercentage = calculateCompletionPercentage(profile);

    res.json({
      success: true,
      message: 'Profile suggestions retrieved successfully',
      data: {
        suggestions,
        completion_percentage: completionPercentage,
        total_suggestions: suggestions.length
      }
    });

  } catch (error) {
    logger.error('Failed to get profile suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SUGGESTIONS_ERROR'
    });
  }
});

// Add skill to candidate profile
router.post('/skills', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { error, value } = addSkillSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { skill_id, proficiency_level, years_experience, is_primary } = value;

    // Get candidate profile
    const profile = await userModel.getUserProfile(req.user.user_id);
    if (!profile.candidate_profile) {
      return res.status(400).json({
        success: false,
        error: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Add skill
    await userModel.db.query(
      `INSERT INTO candidate_skills (profile_id, skill_id, proficiency_level, years_experience, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (profile_id, skill_id) 
       DO UPDATE SET 
         proficiency_level = $3,
         years_experience = $4,
         is_primary = $5`,
      [profile.candidate_profile.profile_id, skill_id, proficiency_level, years_experience, is_primary],
      'add_candidate_skill'
    );

    logger.info('Skill added to candidate profile', {
      user_id: req.user.user_id,
      skill_id,
      proficiency_level
    });

    res.json({
      success: true,
      message: 'Skill added successfully'
    });

  } catch (error) {
    logger.error('Failed to add skill:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ADD_SKILL_ERROR'
    });
  }
});

// Remove skill from candidate profile
router.delete('/skills/:skill_id', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { skill_id } = req.params;

    if (!userModel.db.isValidUUID(skill_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid skill ID format',
        code: 'INVALID_UUID'
      });
    }

    // Get candidate profile
    const profile = await userModel.getUserProfile(req.user.user_id);
    if (!profile.candidate_profile) {
      return res.status(400).json({
        success: false,
        error: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Remove skill
    const result = await userModel.db.query(
      `DELETE FROM candidate_skills 
       WHERE profile_id = $1 AND skill_id = $2`,
      [profile.candidate_profile.profile_id, skill_id],
      'remove_candidate_skill'
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found in profile',
        code: 'SKILL_NOT_FOUND'
      });
    }

    logger.info('Skill removed from candidate profile', {
      user_id: req.user.user_id,
      skill_id
    });

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });

  } catch (error) {
    logger.error('Failed to remove skill:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'REMOVE_SKILL_ERROR'
    });
  }
});

// Deactivate account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await userModel.deactivateAccount(req.user.user_id);

    logger.info('Account deactivated', {
      user_id: req.user.user_id,
      email: req.user.email
    });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    logger.error('Failed to deactivate account:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'DEACTIVATION_ERROR'
    });
  }
});

// Admin routes

/**
 * @swagger
 * /api/v1/users/{user_id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     description: Retrieve a specific user's profile information by ID
 *     tags: [User Management (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: "UUID of the user to retrieve"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: "User retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid user ID format
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
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
// Get user by ID (Admin only)
router.get('/:user_id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!userModel.db.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }

    const user = await userModel.getUserProfile(user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user
      }
    });

  } catch (error) {
    logger.error('Failed to get user by ID:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USER_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get users list (Admin only)
 *     description: Retrieve a paginated list of users with filtering options
 *     tags: [User Management (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CANDIDATE, RECRUITER, HR, ADMIN]
 *           example: "CANDIDATE"
 *         description: "Filter by user role"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *           example: true
 *         description: "Filter by active status"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
 *         description: "Search by name or email"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         description: "Page number"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           example: 20
 *         description: "Number of items per page"
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, full_name, email, last_login]
 *           default: "created_at"
 *           example: "created_at"
 *         description: "Field to order by"
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: "DESC"
 *           example: "DESC"
 *         description: "Order direction"
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin role required
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
// Get users list (Admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const {
      role,
      is_active,
      search,
      page = 1,
      limit = 20,
      order_by = 'created_at',
      direction = 'DESC'
    } = req.query;

    const options = {
      role,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy: order_by,
      direction: direction.toUpperCase()
    };

    const result = await userModel.getUsers(options);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get users list:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'USERS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/users/{user_id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     description: Activate or deactivate a user account
 *     tags: [User Management (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         description: "UUID of the user to update"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: true
 *                 description: "Set user active status (true = active, false = inactive)"
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: "User status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid user ID format or validation error
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
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
// Update user status (Admin only)
router.put('/:user_id/status', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!userModel.db.isValidUUID(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }

    const { error, value } = updateUserStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { is_active } = value;

    const updatedUser = await userModel.update(user_id, { is_active });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info('User status updated', {
      user_id,
      is_active,
      admin_id: req.user.user_id
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user_id: updatedUser.user_id,
        is_active: updatedUser.is_active,
        updated_at: updatedUser.updated_at
      }
    });

  } catch (error) {
    logger.error('Failed to update user status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATUS_UPDATE_ERROR'
    });
  }
});

// Get user statistics (Admin only)
router.get('/admin/statistics', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const totalUsers = await userModel.count();
    const activeUsers = await userModel.count({ is_active: true });
    const candidateCount = await userModel.count({ role: 'CANDIDATE' });
    const recruiterCount = await userModel.count({ role: 'RECRUITER' });
    const adminCount = await userModel.count({ role: 'ADMIN' });

    // Get registration stats for the last 30 days
    const registrationStatsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const registrationStats = await userModel.db.query(registrationStatsQuery, [], 'get_registration_stats');

    const statistics = {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: totalUsers - activeUsers,
      candidates: candidateCount,
      recruiters: recruiterCount,
      admins: adminCount,
      registration_trend: registrationStats.rows
    };

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    logger.error('Failed to get user statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATISTICS_ERROR'
    });
  }
});

// Helper function to calculate profile completion percentage
function calculateCompletionPercentage(profile) {
  const requiredFields = [
    'full_name', 'email', 'phone', 'profile_image_url', 'bio'
  ];

  const roleSpecificFields = {
    'CANDIDATE': ['years_experience', 'current_job_title', 'expected_salary'],
    'RECRUITER': ['position', 'company_name']
  };

  const allFields = [
    ...requiredFields,
    ...(roleSpecificFields[profile.role] || [])
  ];

  const completedFields = allFields.filter(field => {
    if (field === 'company_name' && profile.recruiter_profile) {
      return !!profile.recruiter_profile.company_name;
    }
    if (field === 'position' && profile.recruiter_profile) {
      return !!profile.recruiter_profile.position;
    }
    if (profile.candidate_profile && ['years_experience', 'current_job_title', 'expected_salary'].includes(field)) {
      return !!profile.candidate_profile[field];
    }
    return !!profile[field];
  });

  return Math.round((completedFields.length / allFields.length) * 100);
}

module.exports = router;
