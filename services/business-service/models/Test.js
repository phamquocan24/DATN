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
    new winston.transports.File({ filename: 'logs/test.log' })
  ]
});

class Test extends BaseModel {
  constructor() {
    super('tests', 'test_id');
  }

  /**
   * Create a new test
   */
  async createTest(testData) {
    try {
      const {
        job_id,
        test_name,
        test_description,
        test_type,
        time_limit,
        passing_score,
        is_active,
        created_by,
        questions
      } = testData;

      // Validate required fields
      if (!job_id || !test_name || !created_by) {
        throw new Error('Job ID, test name, and creator are required');
      }

      // Create test
      const query = `
        INSERT INTO job_tests (
          job_id, test_name, test_description, test_type, time_limit, passing_score, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        job_id,
        test_name,
        test_description,
        test_type || 'MULTIPLE_CHOICE',
        time_limit || 60,
        passing_score || 70,
        is_active !== undefined ? is_active : true,
        created_by
      ];

      const result = await this.db.query(query, values, 'create_test');
      const test = result.rows[0];

      // Add questions if provided
      if (questions && questions.length > 0) {
        await this.addTestQuestions(test.test_id, questions);
      }

      logger.info('Test created successfully', {
        test_id: test.test_id,
        test_name: test.test_name,
        job_id,
        created_by
      });

      return test;
    } catch (error) {
      logger.error('Failed to create test:', error);
      throw error;
    }
  }

  /**
   * Get test by ID with questions
   */
  async getTestById(testId, includeQuestions = true) {
    try {
      const query = `
        SELECT 
          t.*,
          j.title as job_title,
          j.company_id,
          c.company_name,
          u.full_name as created_by_name
        FROM job_tests t
        JOIN jobs j ON t.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        LEFT JOIN users u ON t.created_by = u.user_id
        WHERE t.test_id = $1
      `;

      const result = await this.db.query(query, [testId], 'get_test_by_id');
      
      if (result.rows.length === 0) {
        return null;
      }

      const test = result.rows[0];

      if (includeQuestions) {
        const questionsQuery = `
          SELECT 
            question_id,
            question_text,
            question_type,
            options,
            correct_answer,
            points,
            order_index
          FROM test_questions
          WHERE test_id = $1
          ORDER BY order_index ASC
        `;

        const questionsResult = await this.db.query(questionsQuery, [testId], 'get_test_questions');
        test.questions = questionsResult.rows;
      }

      return test;
    } catch (error) {
      logger.error('Failed to get test by ID:', error);
      throw error;
    }
  }

  /**
   * Get tests for a job
   */
  async getTestsByJob(jobId) {
    try {
      const query = `
        SELECT 
          t.*,
          u.full_name as created_by_name,
          COUNT(tr.result_id) as total_attempts,
          AVG(tr.score) as avg_score
        FROM job_tests t
        LEFT JOIN users u ON t.created_by = u.user_id
        LEFT JOIN test_results tr ON t.test_id = tr.test_id
        WHERE t.job_id = $1
        GROUP BY t.test_id, u.full_name
        ORDER BY t.created_at DESC
      `;

      const result = await this.db.query(query, [jobId], 'get_tests_by_job');
      return result.rows;
    } catch (error) {
      logger.error('Failed to get tests by job:', error);
      throw error;
    }
  }

  /**
   * Add questions to test
   */
  async addTestQuestions(testId, questions) {
    try {
      const values = [];
      const valueStrings = [];
      
      questions.forEach((question, index) => {
        const offset = index * 6;
        valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
        values.push(
          testId,
          question.question_text,
          question.question_type || 'MULTIPLE_CHOICE',
          JSON.stringify(question.options || []),
          question.correct_answer,
          question.points || 1
        );
      });

      const query = `
        INSERT INTO test_questions (test_id, question_text, question_type, options, correct_answer, points)
        VALUES ${valueStrings.join(', ')}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'add_test_questions');

      logger.info('Test questions added successfully', {
        test_id: testId,
        questions_count: questions.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Failed to add test questions:', error);
      throw error;
    }
  }

  /**
   * Assign test to candidate
   */
  async assignTestToCandidate(testId, candidateId, applicationId, assignedBy) {
    try {
      // Check if test is already assigned
      const existingQuery = `
        SELECT result_id 
        FROM test_results 
        WHERE test_id = $1 AND candidate_id = $2 AND application_id = $3
      `;
      
      const existingResult = await this.db.query(existingQuery, [testId, candidateId, applicationId], 'check_existing_test_assignment');
      
      if (existingResult.rows.length > 0) {
        throw new Error('Test is already assigned to this candidate');
      }

      // Create test result entry
      const query = `
        INSERT INTO test_results (
          test_id, candidate_id, application_id, assigned_by, status, assigned_at
        ) VALUES ($1, $2, $3, $4, 'ASSIGNED', NOW())
        RETURNING *
      `;

      const result = await this.db.query(query, [testId, candidateId, applicationId, assignedBy], 'assign_test');
      
      logger.info('Test assigned successfully', {
        test_id: testId,
        candidate_id: candidateId,
        application_id: applicationId,
        assigned_by: assignedBy
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to assign test:', error);
      throw error;
    }
  }

  /**
   * Start test attempt
   */
  async startTestAttempt(testId, candidateId, applicationId) {
    try {
      // Check if test is assigned and not completed
      const checkQuery = `
        SELECT tr.*, t.time_limit
        FROM test_results tr
        JOIN job_tests t ON tr.test_id = t.test_id
        WHERE tr.test_id = $1 AND tr.candidate_id = $2 AND tr.application_id = $3
        AND tr.status IN ('ASSIGNED', 'IN_PROGRESS')
      `;

      const checkResult = await this.db.query(checkQuery, [testId, candidateId, applicationId], 'check_test_assignment');
      
      if (checkResult.rows.length === 0) {
        throw new Error('Test is not assigned or already completed');
      }

      const testResult = checkResult.rows[0];

      // If already in progress, return the existing attempt
      if (testResult.status === 'IN_PROGRESS') {
        return testResult;
      }

      // Update status to IN_PROGRESS
      const updateQuery = `
        UPDATE test_results 
        SET status = 'IN_PROGRESS', started_at = NOW(), 
            expires_at = NOW() + INTERVAL '${testResult.time_limit} minutes'
        WHERE result_id = $1
        RETURNING *
      `;

      const result = await this.db.query(updateQuery, [testResult.result_id], 'start_test_attempt');
      
      logger.info('Test attempt started', {
        test_id: testId,
        candidate_id: candidateId,
        application_id: applicationId,
        result_id: testResult.result_id
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to start test attempt:', error);
      throw error;
    }
  }

  /**
   * Submit test answers
   */
  async submitTestAnswers(testId, candidateId, applicationId, answers) {
    try {
      // Get test result
      const resultQuery = `
        SELECT tr.*, t.passing_score
        FROM test_results tr
        JOIN job_tests t ON tr.test_id = t.test_id
        WHERE tr.test_id = $1 AND tr.candidate_id = $2 AND tr.application_id = $3
        AND tr.status = 'IN_PROGRESS'
      `;

      const resultResult = await this.db.query(resultQuery, [testId, candidateId, applicationId], 'get_test_result');
      
      if (resultResult.rows.length === 0) {
        throw new Error('Test not found or not in progress');
      }

      const testResult = resultResult.rows[0];

      // Get questions and calculate score
      const questionsQuery = `
        SELECT question_id, correct_answer, points
        FROM test_questions
        WHERE test_id = $1
      `;

      const questionsResult = await this.db.query(questionsQuery, [testId], 'get_questions_for_scoring');
      const questions = questionsResult.rows;

      let totalScore = 0;
      let maxScore = 0;
      const detailedAnswers = [];

      questions.forEach(question => {
        maxScore += question.points;
        const userAnswer = answers[question.question_id];
        const isCorrect = userAnswer === question.correct_answer;
        
        if (isCorrect) {
          totalScore += question.points;
        }

        detailedAnswers.push({
          question_id: question.question_id,
          user_answer: userAnswer,
          correct_answer: question.correct_answer,
          is_correct: isCorrect,
          points_earned: isCorrect ? question.points : 0
        });
      });

      const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      const passed = percentageScore >= testResult.passing_score;

      // Update test result
      const updateQuery = `
        UPDATE test_results 
        SET 
          status = 'COMPLETED',
          completed_at = NOW(),
          score = $1,
          max_score = $2,
          percentage_score = $3,
          passed = $4,
          answers = $5,
          detailed_results = $6
        WHERE result_id = $7
        RETURNING *
      `;

      const updateValues = [
        totalScore,
        maxScore,
        percentageScore,
        passed,
        JSON.stringify(answers),
        JSON.stringify(detailedAnswers),
        testResult.result_id
      ];

      const result = await this.db.query(updateQuery, updateValues, 'submit_test_answers');
      
      logger.info('Test submitted successfully', {
        test_id: testId,
        candidate_id: candidateId,
        application_id: applicationId,
        score: percentageScore,
        passed
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to submit test answers:', error);
      throw error;
    }
  }

  /**
   * Get test result
   */
  async getTestResult(testId, candidateId, applicationId) {
    try {
      const query = `
        SELECT 
          tr.*,
          t.test_name,
          t.test_description,
          t.time_limit,
          t.passing_score,
          j.title as job_title,
          c.company_name,
          cp.full_name as candidate_name
        FROM test_results tr
        JOIN job_tests t ON tr.test_id = t.test_id
        JOIN jobs j ON t.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        JOIN candidate_profiles cp ON tr.candidate_id = cp.profile_id
        WHERE tr.test_id = $1 AND tr.candidate_id = $2 AND tr.application_id = $3
      `;

      const result = await this.db.query(query, [testId, candidateId, applicationId], 'get_test_result');
      
      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get test result:', error);
      throw error;
    }
  }

  /**
   * Get candidate's test results
   */
  async getCandidateTestResults(candidateId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE tr.candidate_id = $1';
      const values = [candidateId];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND tr.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      const query = `
        SELECT 
          tr.*,
          t.test_name,
          t.test_description,
          t.time_limit,
          t.passing_score,
          j.title as job_title,
          c.company_name
        FROM test_results tr
        JOIN job_tests t ON tr.test_id = t.test_id
        JOIN jobs j ON t.job_id = j.job_id
        JOIN companies c ON j.company_id = c.company_id
        ${whereClause}
        ORDER BY tr.assigned_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.query(query, values, 'get_candidate_test_results');
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM test_results tr
        ${whereClause}
      `;

      const countResult = await this.db.query(countQuery, values.slice(0, -2), 'count_candidate_test_results');
      const total = parseInt(countResult.rows[0].total);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get candidate test results:', error);
      throw error;
    }
  }

  /**
   * Get test statistics
   */
  async getTestStats(testId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_attempts,
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_attempts,
          COUNT(*) FILTER (WHERE passed = true) as passed_attempts,
          AVG(percentage_score) FILTER (WHERE status = 'COMPLETED') as avg_score,
          MAX(percentage_score) as max_score,
          MIN(percentage_score) FILTER (WHERE status = 'COMPLETED') as min_score
        FROM test_results
        WHERE test_id = $1
      `;

      const result = await this.db.query(query, [testId], 'get_test_stats');
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Failed to get test stats:', error);
      throw error;
    }
  }

  /**
   * Update test
   */
  async updateTest(testId, updateData, userId) {
    try {
      const allowedFields = [
        'test_name', 'test_description', 'time_limit', 'passing_score', 'is_active'
      ];

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(testId);

      const query = `
        UPDATE job_tests 
        SET ${updateFields.join(', ')}
        WHERE test_id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, values, 'update_test');

      if (result.rows.length === 0) {
        throw new Error('Test not found');
      }

      logger.info('Test updated successfully', {
        test_id: testId,
        updated_by: userId,
        updated_fields: Object.keys(updateData)
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update test:', error);
      throw error;
    }
  }

  /**
   * Delete test
   */
  async deleteTest(testId, userId) {
    try {
      // Check if test has any results
      const resultsQuery = `
        SELECT COUNT(*) as result_count
        FROM test_results
        WHERE test_id = $1
      `;

      const resultsResult = await this.db.query(resultsQuery, [testId], 'check_test_results');
      if (parseInt(resultsResult.rows[0].result_count) > 0) {
        // Don't allow deletion if there are results, just deactivate
        return await this.updateTest(testId, { is_active: false }, userId);
      }

      // Delete test and its questions
      const deleteQuestionsQuery = `DELETE FROM test_questions WHERE test_id = $1`;
      await this.db.query(deleteQuestionsQuery, [testId], 'delete_test_questions');

      const deleteTestQuery = `DELETE FROM job_tests WHERE test_id = $1 RETURNING *`;
      const result = await this.db.query(deleteTestQuery, [testId], 'delete_test');

      if (result.rows.length === 0) {
        throw new Error('Test not found');
      }

      logger.info('Test deleted successfully', {
        test_id: testId,
        deleted_by: userId
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to delete test:', error);
      throw error;
    }
  }
}

module.exports = Test; 