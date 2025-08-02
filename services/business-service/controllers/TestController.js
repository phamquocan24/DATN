const Test = require('../models/Test');
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
    new winston.transports.File({ filename: 'logs/test-controller.log' })
  ]
});

// Validation schemas
const createTestSchema = Joi.object({
  job_id: Joi.string().uuid().required(),
  test_name: Joi.string().required().min(3).max(200),
  test_description: Joi.string().optional(),
  test_type: Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'CODING', 'MIXED').default('MULTIPLE_CHOICE'),
  time_limit: Joi.number().min(1).max(480).default(60), // 1 minute to 8 hours
  passing_score: Joi.number().min(0).max(100).default(70),
  is_active: Joi.boolean().default(true),
  questions: Joi.array().items(Joi.object({
    question_text: Joi.string().required(),
    question_type: Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'ESSAY', 'CODING').default('MULTIPLE_CHOICE'),
    options: Joi.array().items(Joi.string()).optional(),
    correct_answer: Joi.string().required(),
    points: Joi.number().min(1).max(100).default(1)
  })).min(1).required()
});

const updateTestSchema = Joi.object({
  test_name: Joi.string().min(3).max(200).optional(),
  test_description: Joi.string().optional(),
  time_limit: Joi.number().min(1).max(480).optional(),
  passing_score: Joi.number().min(0).max(100).optional(),
  is_active: Joi.boolean().optional()
});

const assignTestSchema = Joi.object({
  candidate_id: Joi.string().uuid().required(),
  application_id: Joi.string().uuid().required()
});

const submitTestSchema = Joi.object({
  answers: Joi.object().pattern(
    Joi.string().uuid(),
    Joi.string().required()
  ).required()
});

class TestController {
  constructor() {
    this.testModel = new Test();
  }

  /**
   * @swagger
   * /api/v1/tests:
   *   post:
   *     summary: Create new test
   *     description: Create a new test for a job (HR/Recruiter only)
   *     tags: [Tests]
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
   *               - test_name
   *               - questions
   *             properties:
   *               job_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               test_name:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 200
   *                 example: "JavaScript Developer Assessment"
   *               test_description:
   *                 type: string
   *                 example: "Technical assessment for JavaScript developers"
   *               test_type:
   *                 type: string
   *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, CODING, MIXED]
   *                 default: MULTIPLE_CHOICE
   *                 example: "MULTIPLE_CHOICE"
   *               time_limit:
   *                 type: number
   *                 minimum: 1
   *                 maximum: 480
   *                 default: 60
   *                 example: 90
   *                 description: Time limit in minutes
   *               passing_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *                 default: 70
   *                 example: 75
   *               is_active:
   *                 type: boolean
   *                 default: true
   *                 example: true
   *               questions:
   *                 type: array
   *                 minItems: 1
   *                 items:
   *                   type: object
   *                   required:
   *                     - question_text
   *                     - correct_answer
   *                   properties:
   *                     question_text:
   *                       type: string
   *                       example: "What is the correct way to declare a variable in JavaScript?"
   *                     question_type:
   *                       type: string
   *                       enum: [MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, CODING]
   *                       default: MULTIPLE_CHOICE
   *                       example: "MULTIPLE_CHOICE"
   *                     options:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["var x = 1;", "let x = 1;", "const x = 1;", "All of the above"]
   *                     correct_answer:
   *                       type: string
   *                       example: "All of the above"
   *                     points:
   *                       type: number
   *                       minimum: 1
   *                       maximum: 100
   *                       default: 1
   *                       example: 5
   *     responses:
   *       201:
   *         description: Test created successfully
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
   *                   example: "Test created successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Test'
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
  async createTest(req, res) {
    try {
      const { error, value } = createTestSchema.validate(req.body);
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

      const testData = {
        ...value,
        created_by: req.user.user_id
      };

      const test = await this.testModel.createTest(testData);

      logger.info('Test created successfully', {
        test_id: test.test_id,
        test_name: test.test_name,
        job_id: value.job_id,
        created_by: req.user.user_id
      });

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: test
      });
    } catch (error) {
      logger.error('Failed to create test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}:
   *   get:
   *     summary: Get test by ID
   *     description: Get test information by ID (HR/Recruiter for all details, candidates for assigned tests only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *       - in: query
   *         name: include_answers
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include correct answers (HR/Recruiter only)
   *         example: true
   *     responses:
   *       200:
   *         description: Test retrieved successfully
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
   *                   example: "Test retrieved successfully"
   *                 data:
   *                   $ref: '#/components/schemas/TestDetail'
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
   *         description: Test not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getTestById(req, res) {
    try {
      const { id } = req.params;
      const includeAnswers = req.query.include_answers === 'true';

      const test = await this.testModel.getTestById(id, true);

      if (!test) {
        return res.status(404).json({
          success: false,
          message: 'Test not found'
        });
      }

      // Check permission
      const hasPermission = await this.checkTestPermission(req.user, test);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Remove correct answers for candidates unless they've completed the test
      if (req.user.role === 'CANDIDATE' && !includeAnswers) {
        test.questions = test.questions.map(q => ({
          ...q,
          correct_answer: undefined
        }));
      }

      res.json({
        success: true,
        message: 'Test retrieved successfully',
        data: test
      });
    } catch (error) {
      logger.error('Failed to get test by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/tests/job/:jobId - Get tests for a job
   * Requires: HR/RECRUITER role (job ownership) or ADMIN role
   */
  async getTestsByJob(req, res) {
    try {
      const { jobId } = req.params;

      const tests = await this.testModel.getTestsByJob(jobId);

      res.json({
        success: true,
        message: 'Job tests retrieved successfully',
        data: tests
      });
    } catch (error) {
      logger.error('Failed to get tests by job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job tests',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}:
   *   put:
   *     summary: Update test
   *     description: Update an existing test (HR/Recruiter who created the test or Admin only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               test_name:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 200
   *                 example: "Advanced JavaScript Developer Assessment"
   *               test_description:
   *                 type: string
   *                 example: "Comprehensive technical assessment for senior JavaScript developers"
   *               test_type:
   *                 type: string
   *                 enum: [MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, CODING, MIXED]
   *                 example: "MIXED"
   *               time_limit:
   *                 type: number
   *                 minimum: 1
   *                 maximum: 480
   *                 example: 120
   *                 description: Time limit in minutes
   *               passing_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *                 example: 80
   *               is_active:
   *                 type: boolean
   *                 example: true
   *               questions:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     question_text:
   *                       type: string
   *                       example: "Explain the concept of closures in JavaScript"
   *                     question_type:
   *                       type: string
   *                       enum: [MULTIPLE_CHOICE, TRUE_FALSE, ESSAY, CODING]
   *                       example: "ESSAY"
   *                     options:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["Option A", "Option B", "Option C", "Option D"]
   *                     correct_answer:
   *                       type: string
   *                       example: "Closures allow functions to access variables from their outer scope..."
   *                     points:
   *                       type: number
   *                       minimum: 1
   *                       maximum: 100
   *                       example: 10
   *     responses:
   *       200:
   *         description: Test updated successfully
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
   *                   example: "Test updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Test'
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
   *         description: Access denied - test owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Test not found
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
   * PUT /api/v1/tests/:id - Update test
   * Requires: HR/RECRUITER role (test ownership) or ADMIN role
   */
  async updateTest(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateTestSchema.validate(req.body);
      
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

      const test = await this.testModel.updateTest(id, value, req.user.user_id);

      logger.info('Test updated successfully', {
        test_id: id,
        updated_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Test updated successfully',
        data: test
      });
    } catch (error) {
      logger.error('Failed to update test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update test',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}:
   *   delete:
   *     summary: Delete test
   *     description: Delete an existing test (HR/Recruiter who created the test or Admin only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     responses:
   *       200:
   *         description: Test deleted successfully
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
   *                   example: "Test deleted successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Test'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - test owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Test not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Cannot delete test with existing assignments
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
   * DELETE /api/v1/tests/:id - Delete test
   * Requires: HR/RECRUITER role (test ownership) or ADMIN role
   */
  async deleteTest(req, res) {
    try {
      const { id } = req.params;

      const test = await this.testModel.deleteTest(id, req.user.user_id);

      logger.info('Test deleted successfully', {
        test_id: id,
        deleted_by: req.user.user_id
      });

      res.json({
        success: true,
        message: 'Test deleted successfully',
        data: test
      });
    } catch (error) {
      logger.error('Failed to delete test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete test',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}/assign:
   *   post:
   *     summary: Assign test to candidate
   *     description: Assign a test to a candidate for a specific application (HR/Recruiter only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - candidate_id
   *               - application_id
   *             properties:
   *               candidate_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174001"
   *               application_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174002"
   *     responses:
   *       200:
   *         description: Test assigned successfully
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
   *                   example: "Test assigned successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     assignment_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174003"
   *       400:
   *         description: Validation failed or test already assigned
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
   *         description: Test, candidate, or application not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async assignTest(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = assignTestSchema.validate(req.body);
      
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

      const testResult = await this.testModel.assignTestToCandidate(
        id,
        value.candidate_id,
        value.application_id,
        req.user.user_id
      );

      logger.info('Test assigned successfully', {
        test_id: id,
        candidate_id: value.candidate_id,
        application_id: value.application_id,
        assigned_by: req.user.user_id
      });

      res.status(201).json({
        success: true,
        message: 'Test assigned successfully',
        data: testResult
      });
    } catch (error) {
      logger.error('Failed to assign test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign test',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/tests/:id/start - Start test attempt
   * Requires: CANDIDATE role (assigned test)
   */
  async startTest(req, res) {
    try {
      const { id } = req.params;
      const { application_id } = req.body;

      if (!application_id) {
        return res.status(400).json({
          success: false,
          message: 'Application ID is required'
        });
      }

      const candidateId = req.user.candidate_profile_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      const testResult = await this.testModel.startTestAttempt(id, candidateId, application_id);

      logger.info('Test started successfully', {
        test_id: id,
        candidate_id: candidateId,
        application_id,
        result_id: testResult.result_id
      });

      res.json({
        success: true,
        message: 'Test started successfully',
        data: testResult
      });
    } catch (error) {
      logger.error('Failed to start test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start test',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}/submit:
   *   post:
   *     summary: Submit test answers
   *     description: Submit answers for an assigned test (candidates only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
   *         example: "123e4567-e89b-12d3-a456-426614174000"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - answers
   *             properties:
   *               answers:
   *                 type: object
   *                 description: Map of question IDs to answers
   *                 example:
   *                   "123e4567-e89b-12d3-a456-426614174004": "All of the above"
   *                   "123e4567-e89b-12d3-a456-426614174005": "True"
   *                   "123e4567-e89b-12d3-a456-426614174006": "JavaScript is a programming language..."
   *     responses:
   *       200:
   *         description: Test submitted successfully
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
   *                   example: "Test submitted successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     test_result_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174007"
   *                     score:
   *                       type: number
   *                       example: 85
   *                     passed:
   *                       type: boolean
   *                       example: true
   *                     total_questions:
   *                       type: number
   *                       example: 10
   *                     correct_answers:
   *                       type: number
   *                       example: 8
   *       400:
   *         description: Validation failed or test already submitted
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
   *         description: Test not assigned or access denied
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Test not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async submitTest(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = submitTestSchema.validate(req.body);
      
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

      const { application_id } = req.query;
      if (!application_id) {
        return res.status(400).json({
          success: false,
          message: 'Application ID is required'
        });
      }

      const candidateId = req.user.candidate_profile_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      const testResult = await this.testModel.submitTestAnswers(
        id,
        candidateId,
        application_id,
        value.answers
      );

      logger.info('Test submitted successfully', {
        test_id: id,
        candidate_id: candidateId,
        application_id,
        score: testResult.percentage_score,
        passed: testResult.passed
      });

      res.json({
        success: true,
        message: 'Test submitted successfully',
        data: testResult
      });
    } catch (error) {
      logger.error('Failed to submit test:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit test',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/tests/:id/result - Get test result
   * Requires: CANDIDATE role (own result) or HR/RECRUITER role (company results)
   */
  async getTestResult(req, res) {
    try {
      const { id } = req.params;
      const { application_id } = req.query;

      if (!application_id) {
        return res.status(400).json({
          success: false,
          message: 'Application ID is required'
        });
      }

      let candidateId;
      if (req.user.role === 'CANDIDATE') {
        candidateId = req.user.candidate_profile_id;
        if (!candidateId) {
          return res.status(403).json({
            success: false,
            message: 'Candidate profile not found'
          });
        }
      } else {
        // HR/RECRUITER can view any result for their company
        candidateId = req.query.candidate_id;
        if (!candidateId) {
          return res.status(400).json({
            success: false,
            message: 'Candidate ID is required'
          });
        }
      }

      const testResult = await this.testModel.getTestResult(id, candidateId, application_id);

      if (!testResult) {
        return res.status(404).json({
          success: false,
          message: 'Test result not found'
        });
      }

      res.json({
        success: true,
        message: 'Test result retrieved successfully',
        data: testResult
      });
    } catch (error) {
      logger.error('Failed to get test result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test result',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/my-tests:
   *   get:
   *     summary: Get my assigned tests
   *     description: Get tests assigned to the current candidate
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, EXPIRED]
   *         description: Filter by test status
   *         example: "ASSIGNED"
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
   *         description: Number of tests per page
   *     responses:
   *       200:
   *         description: My tests retrieved successfully
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
   *                   example: "My tests retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TestAssignment'
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized - candidate role required
   */
  async getMyTests(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const candidateId = req.user.candidate_profile_id;
      if (!candidateId) {
        return res.status(403).json({
          success: false,
          message: 'Candidate profile not found'
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      };

      const result = await this.testModel.getCandidateTestResults(candidateId, options);

      res.json({
        success: true,
        message: 'My tests retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to get my tests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my tests',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/tests/:id/stats - Get test statistics
   * Requires: HR/RECRUITER role (test ownership) or ADMIN role
   */
  async getTestStats(req, res) {
    try {
      const { id } = req.params;

      const stats = await this.testModel.getTestStats(id);

      res.json({
        success: true,
        message: 'Test statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get test stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test stats',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/tests/{id}/results:
   *   get:
   *     summary: Get test results
   *     description: Get all results for a specific test (HR/Recruiter who created the test or Admin only)
   *     tags: [Tests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Test ID
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
   *         description: Number of results per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ASSIGNED, IN_PROGRESS, COMPLETED, EXPIRED]
   *         description: Filter by test status
   *         example: "COMPLETED"
   *     responses:
   *       200:
   *         description: Test results retrieved successfully
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
   *                   example: "Test results retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       test_result_id:
   *                         type: string
   *                         format: uuid
   *                         example: "123e4567-e89b-12d3-a456-426614174003"
   *                       candidate_name:
   *                         type: string
   *                         example: "John Doe"
   *                       candidate_email:
   *                         type: string
   *                         format: email
   *                         example: "john.doe@example.com"
   *                       score:
   *                         type: number
   *                         minimum: 0
   *                         maximum: 100
   *                         example: 85
   *                       passed:
   *                         type: boolean
   *                         example: true
   *                       completed_at:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-15T14:30:00Z"
   *                       time_taken:
   *                         type: number
   *                         example: 3600
   *                         description: "Time taken in seconds"
   *                       application_status:
   *                         type: string
   *                         example: "INTERVIEWING"
   *                 pagination:
   *                   $ref: '#/components/schemas/Pagination'
   *       401:
   *         description: Unauthorized access
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - test owner or admin required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Test not found
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
   * GET /api/v1/tests/:id/results - Get all results for a test
   * Requires: HR/RECRUITER role (test ownership) or ADMIN role
   */
  async getTestResults(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const query = `
        SELECT 
          tr.*,
          cp.full_name as candidate_name,
          cp.email as candidate_email,
          cp.phone as candidate_phone,
          a.status as application_status
        FROM test_results tr
        JOIN candidate_profiles cp ON tr.candidate_id = cp.profile_id
        LEFT JOIN applications a ON tr.application_id = a.application_id
        WHERE tr.test_id = $1
        ${status ? 'AND tr.status = $2' : ''}
        ORDER BY tr.assigned_at DESC
        LIMIT $${status ? 3 : 2} OFFSET $${status ? 4 : 3}
      `;

      const offset = (page - 1) * limit;
      const values = [id];
      
      if (status) {
        values.push(status);
      }
      
      values.push(limit, offset);

      const result = await this.testModel.query(query, values, 'get_test_results');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM test_results tr
        WHERE tr.test_id = $1
        ${status ? 'AND tr.status = $2' : ''}
      `;

      const countValues = [id];
      if (status) {
        countValues.push(status);
      }

      const countResult = await this.testModel.query(countQuery, countValues, 'count_test_results');
      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        message: 'Test results retrieved successfully',
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Failed to get test results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get test results',
        error: error.message
      });
    }
  }

  /**
   * Helper method to check test permissions
   */
  async checkTestPermission(user, test) {
    try {
      // Admin can do everything
      if (user.role === 'ADMIN') {
        return true;
      }

      // HR/Recruiter can manage tests for their company
      if ((user.role === 'HR' || user.role === 'RECRUITER') && 
          user.company_id === test.company_id) {
        return true;
      }

      // Candidate can view assigned tests
      if (user.role === 'CANDIDATE' && user.candidate_profile_id) {
        // Check if test is assigned to this candidate
        const assignedQuery = `
          SELECT COUNT(*) as count
          FROM test_results
          WHERE test_id = $1 AND candidate_id = $2
        `;
        
        const result = await this.testModel.query(assignedQuery, [test.test_id, user.candidate_profile_id], 'check_test_assignment');
        return parseInt(result.rows[0].count) > 0;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check test permission:', error);
      return false;
    }
  }
}

// Create Express router
const express = require('express');
const router = express.Router();
const testController = new TestController();

// Routes
router.get('/:id', testController.getTestById.bind(testController));
router.post('/', testController.createTest.bind(testController));
router.put('/:id', testController.updateTest.bind(testController));
router.delete('/:id', testController.deleteTest.bind(testController));
router.get('/job/:jobId', testController.getTestsByJob.bind(testController));
router.post('/:id/assign', testController.assignTest.bind(testController));
router.post('/:id/start', testController.startTest.bind(testController));
router.post('/:id/submit', testController.submitTest.bind(testController));
router.get('/:id/result', testController.getTestResult.bind(testController));
router.get('/my-tests', testController.getMyTests.bind(testController));
router.get('/:id/stats', testController.getTestStats.bind(testController));
router.get('/:id/results', testController.getTestResults.bind(testController));

module.exports = router; 