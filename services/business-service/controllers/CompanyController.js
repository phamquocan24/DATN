const express = require('express');
const Joi = require('joi');
const Company = require('../models/Company');
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
    new winston.transports.File({ filename: 'logs/company-controller.log' })
  ]
});

// Initialize Company model
const companyModel = new Company();

// Validation schemas
const createCompanySchema = Joi.object({
  company_name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Company name must be at least 2 characters',
    'string.max': 'Company name must not exceed 200 characters',
    'any.required': 'Company name is required'
  }),
  company_description: Joi.string().max(2000).optional().allow(''),
  company_website: Joi.string().uri().optional().allow(''),
  company_email: Joi.string().email().optional().allow(''),
  company_phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
  company_address: Joi.string().max(500).optional().allow(''),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional(),
  industry: Joi.string().max(100).optional(),
  company_size: Joi.string().valid('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE').optional(),
  company_logo_url: Joi.string().uri().optional().allow(''),
  tax_code: Joi.string().max(50).optional().allow(''),
  founded_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional()
});

const updateCompanySchema = Joi.object({
  company_name: Joi.string().min(2).max(200).optional(),
  company_description: Joi.string().max(2000).optional().allow(''),
  company_website: Joi.string().uri().optional().allow(''),
  company_email: Joi.string().email().optional().allow(''),
  company_phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow(''),
  company_address: Joi.string().max(500).optional().allow(''),
  city_id: Joi.string().uuid().optional(),
  district_id: Joi.string().uuid().optional(),
  industry: Joi.string().max(100).optional(),
  company_size: Joi.string().valid('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE').optional(),
  company_logo_url: Joi.string().uri().optional().allow(''),
  tax_code: Joi.string().max(50).optional().allow(''),
  founded_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional()
});

// Routes

/**
 * @swagger
 * /api/v1/companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company profile (HR/Recruiter only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *             properties:
 *               company_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Tech Solutions Inc."
 *               company_description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "A leading technology solutions provider"
 *               company_website:
 *                 type: string
 *                 format: uri
 *                 example: "https://techsolutions.com"
 *               company_email:
 *                 type: string
 *                 format: email
 *                 example: "contact@techsolutions.com"
 *               company_phone:
 *                 type: string
 *                 pattern: "^[0-9+\\-\\s()]+$"
 *                 example: "+84 123 456 789"
 *               company_address:
 *                 type: string
 *                 maxLength: 500
 *                 example: "123 Tech Street, Ho Chi Minh City"
 *               city_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               district_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               industry:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Information Technology"
 *               company_size:
 *                 type: string
 *                 enum: [STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE]
 *                 example: "MEDIUM"
 *               company_logo_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://techsolutions.com/logo.png"
 *               tax_code:
 *                 type: string
 *                 maxLength: 50
 *                 example: "0123456789"
 *               founded_year:
 *                 type: number
 *                 minimum: 1800
 *                 maximum: 2023
 *                 example: 2010
 *     responses:
 *       201:
 *         description: Company created successfully
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
 *                   example: "Company created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       $ref: '#/components/schemas/Company'
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
 *         description: Access denied - HR/Recruiter role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Create company (HR/Recruiter only)
router.post('/', authenticateToken, requireRole(['RECRUITER', 'HR']), async (req, res) => {
  try {
    const { error, value } = createCompanySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const companyData = {
      ...value,
      created_by: req.user.user_id
    };

    const company = await companyModel.createCompany(companyData);

    logger.info('Company created successfully', {
      company_id: company.company_id,
      company_name: company.company_name,
      created_by: req.user.user_id
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company
      }
    });

  } catch (error) {
    logger.error('Failed to create company:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COMPANY_CREATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/companies:
 *   get:
 *     summary: Get companies list
 *     description: Get list of companies with filtering and pagination
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or description
 *         example: "tech"
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry
 *         example: "Information Technology"
 *       - in: query
 *         name: city_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by city
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: company_size
 *         schema:
 *           type: string
 *           enum: [STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE]
 *         description: Filter by company size
 *         example: "MEDIUM"
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
 *         description: Number of companies per page
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, company_name, founded_year]
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
 *         description: Companies retrieved successfully
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
 *                   example: "Companies retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get companies list
router.get('/', async (req, res) => {
  try {
    const {
      search,
      industry,
      city_id,
      company_size,
      page = 1,
      limit = 20,
      order_by = 'created_at',
      direction = 'DESC'
    } = req.query;

    const options = {
      search,
      industry,
      city_id,
      company_size,
      page: parseInt(page),
      limit: parseInt(limit),
      orderBy: order_by,
      direction: direction.toUpperCase()
    };

    const result = await companyModel.getCompanies(options);

    res.json({
      success: true,
      message: 'Companies retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get companies:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COMPANIES_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/companies/{company_id}:
 *   get:
 *     summary: Get company by ID
 *     description: Get detailed company information by ID
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Company retrieved successfully
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
 *                   example: "Company retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       $ref: '#/components/schemas/CompanyDetail'
 *       400:
 *         description: Invalid company ID format
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
// Get company by ID
router.get('/:company_id', async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!companyModel.isValidUUID(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        code: 'INVALID_UUID'
      });
    }

    const company = await companyModel.getCompanyById(company_id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Company retrieved successfully',
      data: {
        company
      }
    });

  } catch (error) {
    logger.error('Failed to get company:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COMPANY_RETRIEVAL_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/companies/{company_id}:
 *   put:
 *     summary: Update company
 *     description: Update company information (HR/Recruiter only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 200
 *                 example: "Updated Tech Solutions Inc."
 *               company_description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "An updated technology solutions provider"
 *               company_website:
 *                 type: string
 *                 format: uri
 *                 example: "https://newtechsolutions.com"
 *               company_email:
 *                 type: string
 *                 format: email
 *                 example: "info@newtechsolutions.com"
 *               company_phone:
 *                 type: string
 *                 pattern: "^[0-9+\\-\\s()]+$"
 *                 example: "+84 987 654 321"
 *               company_address:
 *                 type: string
 *                 maxLength: 500
 *                 example: "456 Innovation Blvd, Ho Chi Minh City"
 *               city_id:
 *                 type: string
 *                 format: uuid
 *               district_id:
 *                 type: string
 *                 format: uuid
 *               industry:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Information Technology"
 *               company_size:
 *                 type: string
 *                 enum: [STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE]
 *                 example: "LARGE"
 *               company_logo_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://newtechsolutions.com/logo.png"
 *               tax_code:
 *                 type: string
 *                 maxLength: 50
 *                 example: "0987654321"
 *               founded_year:
 *                 type: number
 *                 minimum: 1800
 *                 maximum: 2023
 *                 example: 2008
 *     responses:
 *       200:
 *         description: Company updated successfully
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
 *                   example: "Company updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       $ref: '#/components/schemas/Company'
 *       400:
 *         description: Validation failed or invalid company ID
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
// Update company
router.put('/:company_id', authenticateToken, requireRole(['RECRUITER', 'HR']), async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!companyModel.isValidUUID(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        code: 'INVALID_UUID'
      });
    }

    const { error, value } = updateCompanySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const company = await companyModel.updateCompany(company_id, value, req.user.user_id);

    logger.info('Company updated successfully', {
      company_id,
      updated_by: req.user.user_id,
      updated_fields: Object.keys(value)
    });

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: {
        company
      }
    });

  } catch (error) {
    logger.error('Failed to update company:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COMPANY_UPDATE_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/companies/{company_id}:
 *   delete:
 *     summary: Delete company
 *     description: Delete a company (HR/Recruiter only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: company_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Company deleted successfully
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
 *                   example: "Company deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     company:
 *                       $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid company ID format
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
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cannot delete company with active jobs or applications
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
// Delete company
router.delete('/:company_id', authenticateToken, requireRole(['RECRUITER', 'HR']), async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!companyModel.isValidUUID(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        code: 'INVALID_UUID'
      });
    }

    const company = await companyModel.deleteCompany(company_id, req.user.user_id);

    logger.info('Company deleted successfully', {
      company_id,
      deleted_by: req.user.user_id
    });

    res.json({
      success: true,
      message: 'Company deleted successfully',
      data: {
        company
      }
    });

  } catch (error) {
    logger.error('Failed to delete company:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COMPANY_DELETE_ERROR'
    });
  }
});

// Get company recruiters
router.get('/:company_id/recruiters', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), async (req, res) => {
  try {
    const { company_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!companyModel.isValidUUID(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        code: 'INVALID_UUID'
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await companyModel.getCompanyRecruiters(company_id, options);

    res.json({
      success: true,
      message: 'Company recruiters retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to get company recruiters:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'RECRUITERS_RETRIEVAL_ERROR'
    });
  }
});

// Get company statistics
router.get('/:company_id/stats', authenticateToken, requireRole(['RECRUITER', 'HR', 'ADMIN']), async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!companyModel.isValidUUID(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        code: 'INVALID_UUID'
      });
    }

    const stats = await companyModel.getCompanyStats(company_id);

    res.json({
      success: true,
      message: 'Company statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get company stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATS_RETRIEVAL_ERROR'
    });
  }
});

module.exports = router; 