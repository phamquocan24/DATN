const express = require('express');
const router = express.Router();
const winston = require('winston');
const { authenticateToken, requireRole } = require('../modules/auth');
const CVProcessing = require('../models/CVProcessing');
const MatchingService = require('../services/MatchingService');

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
    new winston.transports.File({ filename: 'logs/cv-processing.log' })
  ]
});

const cvProcessingModel = new CVProcessing();
const matchingService = new MatchingService();

/**
 * @swagger
 * /api/v1/cv-processing/save-data:
 *   post:
 *     summary: Save CV processing data
 *     description: Save CV processing data including match scores, extracted data, and analysis results
 *     tags: [CV Processing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cv_id
 *               - data
 *             properties:
 *               cv_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               data:
 *                 type: object
 *                 properties:
 *                   match_scores:
 *                     type: object
 *                     description: Match scores with jobs
 *                   extracted_data:
 *                     type: object
 *                     description: Extracted CV content
 *                   preview_data:
 *                     type: object
 *                     description: Preview rendering data
 *                   ai_analysis:
 *                     type: object
 *                     description: AI analysis results
 *     responses:
 *       200:
 *         description: CV processing data saved successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/save-data', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id, data } = req.body;

    if (!cv_id || !data) {
      return res.status(400).json({
        success: false,
        error: 'CV ID and data are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify CV ownership
    const cv = await cvProcessingModel.getCVById(cv_id);
    if (!cv || cv.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Update cv_content with processing data
    const updateData = {
      ai_analysis: {
        ...data.ai_analysis,
        match_scores: data.match_scores,
        extracted_data: data.extracted_data,
        preview_data: data.preview_data,
        last_updated: new Date(),
        status: 'processed'
      }
    };

    await cvProcessingModel.updateCVContent(cv_id, updateData);

    logger.info('CV processing data saved successfully', {
      cv_id,
      user_id: req.user.user_id,
      data_types: Object.keys(data)
    });

    res.json({
      success: true,
      message: 'CV processing data saved successfully'
    });

  } catch (error) {
    logger.error('Failed to save CV processing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SAVE_DATA_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cv-processing/get-data/{cv_id}:
 *   get:
 *     summary: Get CV processing data
 *     description: Retrieve CV processing data including match scores, extracted data, and analysis results
 *     tags: [CV Processing]
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
 *         description: CV processing data retrieved successfully
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
 *                   example: "CV processing data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cv_info:
 *                       type: object
 *                       description: Basic CV information
 *                     match_scores:
 *                       type: object
 *                       description: Match scores with jobs
 *                     extracted_data:
 *                       type: object
 *                       description: Extracted CV content
 *                     preview_data:
 *                       type: object
 *                       description: Preview rendering data
 *                     ai_analysis:
 *                       type: object
 *                       description: AI analysis results
 *       400:
 *         description: Invalid CV ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: CV not found
 *       500:
 *         description: Internal server error
 */
router.get('/get-data/:cv_id', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;

    if (!cvProcessingModel.isValidUUID(cv_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid CV ID format',
        code: 'INVALID_UUID'
      });
    }

    // Verify CV ownership
    const cv = await cvProcessingModel.getCVById(cv_id);
    if (!cv || cv.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get CV content with processing data
    const cvContent = await cvProcessingModel.getCVContent(cv_id);
    
    // Get CV embeddings if available
    const embeddings = await cvProcessingModel.getCVEmbeddings(cv_id);
    
    // Get match scores from vector_matches table
    const matchScores = await cvProcessingModel.getCVMatchScores(cv_id);

    const responseData = {
      cv_info: {
        cv_id: cv.cv_id,
        cv_title: cv.cv_title,
        cv_file_url: cv.cv_file_url,
        created_at: cv.created_at,
        updated_at: cv.updated_at
      },
      match_scores: matchScores || {},
      extracted_data: cvContent?.parsed_content || cvContent?.structured_data || {},
      preview_data: cvContent?.ai_analysis?.preview_data || {},
      ai_analysis: cvContent?.ai_analysis || {},
      embeddings: embeddings ? {
        has_embeddings: true,
        confidence_score: embeddings.confidence_score,
        model_version: embeddings.model_version,
        created_at: embeddings.created_at
      } : { has_embeddings: false }
    };

    logger.info('CV processing data retrieved successfully', {
      cv_id,
      user_id: req.user.user_id,
      has_content: !!cvContent,
      has_embeddings: !!embeddings
    });

    res.json({
      success: true,
      message: 'CV processing data retrieved successfully',
      data: responseData
    });

  } catch (error) {
    logger.error('Failed to get CV processing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_DATA_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/v1/cv-processing/get-match-scores/{cv_id}:
 *   get:
 *     summary: Get CV match scores
 *     description: Retrieve match scores for a specific CV with all jobs
 *     tags: [CV Processing]
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
router.get('/get-match-scores/:cv_id', authenticateToken, requireRole(['CANDIDATE']), async (req, res) => {
  try {
    const { cv_id } = req.params;
    const { limit = 20 } = req.query;

    // Verify CV ownership
    const cv = await cvProcessingModel.getCVById(cv_id);
    if (!cv || cv.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get detailed match scores
    const matchScores = await cvProcessingModel.getCVJobMatches(cv_id, { limit: parseInt(limit) });

    res.json({
      success: true,
      message: 'Match scores retrieved successfully',
      data: {
        cv_id,
        match_scores: matchScores,
        total_matches: matchScores.length
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

module.exports = router;
