const Database = require('../models/Database');
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
    new winston.transports.File({ filename: 'logs/matching-service.log' })
  ]
});

class MatchingService extends Database {
  constructor() {
    super();
  }

  /**
   * Calculate detailed match score between candidate and job
   */
  async calculateDetailedMatchScore(candidateId, jobId) {
    try {
      const query = `
        WITH candidate_info AS (
          SELECT 
            cp.*,
            u.user_id,
            COALESCE(cs.skills, '[]'::json) as candidate_skills,
            COALESCE(cs.skill_ids, ARRAY[]::uuid[]) as candidate_skill_ids
          FROM candidate_profiles cp
          JOIN users u ON cp.user_id = u.user_id
          LEFT JOIN (
            SELECT 
              cs.profile_id,
              json_agg(
                json_build_object(
                  'skill_id', s.skill_id,
                  'skill_name', s.skill_name,
                  'proficiency_level', cs.proficiency_level,
                  'years_experience', cs.years_experience,
                  'level_score', 
                    CASE 
                      WHEN cs.proficiency_level = 'BEGINNER' THEN 1
                      WHEN cs.proficiency_level = 'INTERMEDIATE' THEN 2
                      WHEN cs.proficiency_level = 'ADVANCED' THEN 3
                      WHEN cs.proficiency_level = 'EXPERT' THEN 4
                      ELSE 0
                    END
                )
              ) as skills,
              array_agg(cs.skill_id) as skill_ids
            FROM candidate_skills cs
            JOIN skills s ON cs.skill_id = s.skill_id
            GROUP BY cs.profile_id
          ) cs ON cp.profile_id = cs.profile_id
          WHERE cp.profile_id = $1
        ),
        job_info AS (
          SELECT 
            j.*,
            c.company_name,
            c.company_logo_url,
            ci.city_name,
            ci.country_name,
            COALESCE(js.skills, '[]'::json) as job_skills,
            COALESCE(js.skill_ids, ARRAY[]::uuid[]) as job_skill_ids
          FROM jobs j
          JOIN companies c ON j.company_id = c.company_id
          LEFT JOIN cities ci ON j.city_id = ci.city_id
          LEFT JOIN (
            SELECT 
              js.job_id,
              json_agg(
                json_build_object(
                  'skill_id', s.skill_id,
                  'skill_name', s.skill_name,
                  'required_level', js.required_level,
                  'level_score',
                    CASE 
                      WHEN js.required_level = 'BEGINNER' THEN 1
                      WHEN js.required_level = 'INTERMEDIATE' THEN 2
                      WHEN js.required_level = 'ADVANCED' THEN 3
                      WHEN js.required_level = 'EXPERT' THEN 4
                      ELSE 0
                    END
                )
              ) as skills,
              array_agg(js.skill_id) as skill_ids
            FROM job_skills js
            JOIN skills s ON js.skill_id = s.skill_id
            GROUP BY js.job_id
          ) js ON j.job_id = js.job_id
          WHERE j.job_id = $2
        ),
        skill_analysis AS (
          SELECT 
            ci.candidate_skill_ids,
            ji.job_skill_ids,
            ci.candidate_skills,
            ji.job_skills,
            -- Calculate skill overlap
            cardinality(ci.candidate_skill_ids & ji.job_skill_ids) as matched_skills,
            cardinality(ji.job_skill_ids) as total_required_skills,
            cardinality(ci.candidate_skill_ids) as total_candidate_skills
          FROM candidate_info ci
          CROSS JOIN job_info ji
        ),
        match_calculation AS (
          SELECT 
            ci.*,
            ji.*,
            sa.*,
            -- Skill match score (40%)
            CASE 
              WHEN sa.total_required_skills > 0 
              THEN (sa.matched_skills::float / sa.total_required_skills) * 40
              ELSE 0 
            END as skill_match_score,
            
            -- Experience match score (25%)
            CASE 
              WHEN ji.experience_required IS NULL OR ji.experience_required = 0 THEN 25
              WHEN ci.years_experience >= ji.experience_required THEN 25
              WHEN ci.years_experience >= (ji.experience_required * 0.8) THEN 20
              WHEN ci.years_experience >= (ji.experience_required * 0.6) THEN 15
              WHEN ci.years_experience >= (ji.experience_required * 0.4) THEN 10
              ELSE 5
            END as experience_match_score,
            
            -- Education match score (15%)
            CASE 
              WHEN ji.education_required IS NULL THEN 15
              WHEN ci.education_level = ji.education_required THEN 15
              WHEN (ci.education_level = 'MASTER' AND ji.education_required = 'BACHELOR') OR
                   (ci.education_level = 'PHD' AND ji.education_required IN ('BACHELOR', 'MASTER')) OR
                   (ci.education_level = 'BACHELOR' AND ji.education_required = 'COLLEGE') OR
                   (ci.education_level = 'COLLEGE' AND ji.education_required = 'HIGH_SCHOOL') THEN 15
              WHEN (ci.education_level = 'BACHELOR' AND ji.education_required = 'MASTER') OR
                   (ci.education_level = 'MASTER' AND ji.education_required = 'PHD') THEN 10
              ELSE 5
            END as education_match_score,
            
            -- Location match score (10%)
            CASE 
              WHEN ji.work_type = 'REMOTE' THEN 10
              WHEN ci.city_id = ji.city_id THEN 10
              WHEN ji.work_type = 'HYBRID' THEN 7
              ELSE 3
            END as location_match_score,
            
            -- Salary match score (10%)
            CASE 
              WHEN ji.salary_min IS NULL OR ji.salary_max IS NULL THEN 10
              WHEN ci.expected_salary IS NULL THEN 10
              WHEN ci.expected_salary BETWEEN ji.salary_min AND ji.salary_max THEN 10
              WHEN ci.expected_salary < ji.salary_min THEN 
                CASE 
                  WHEN (ji.salary_min - ci.expected_salary) / ji.salary_min < 0.2 THEN 8
                  WHEN (ji.salary_min - ci.expected_salary) / ji.salary_min < 0.4 THEN 6
                  ELSE 3
                END
              WHEN ci.expected_salary > ji.salary_max THEN 
                CASE 
                  WHEN (ci.expected_salary - ji.salary_max) / ji.salary_max < 0.2 THEN 8
                  WHEN (ci.expected_salary - ji.salary_max) / ji.salary_max < 0.4 THEN 6
                  ELSE 3
                END
              ELSE 5
            END as salary_match_score
          FROM candidate_info ci
          CROSS JOIN job_info ji
          CROSS JOIN skill_analysis sa
        )
        SELECT 
          *,
          (skill_match_score + experience_match_score + education_match_score + location_match_score + salary_match_score) as total_match_score,
          CASE 
            WHEN (skill_match_score + experience_match_score + education_match_score + location_match_score + salary_match_score) >= 90 THEN 'EXCELLENT'
            WHEN (skill_match_score + experience_match_score + education_match_score + location_match_score + salary_match_score) >= 80 THEN 'VERY_GOOD'
            WHEN (skill_match_score + experience_match_score + education_match_score + location_match_score + salary_match_score) >= 70 THEN 'GOOD'
            WHEN (skill_match_score + experience_match_score + education_match_score + location_match_score + salary_match_score) >= 60 THEN 'FAIR'
            ELSE 'POOR'
          END as match_grade
        FROM match_calculation
      `;

      const result = await this.query(query, [candidateId, jobId], 'calculate_detailed_match_score');
      
      if (result.rows.length === 0) {
        throw new Error('Candidate or job not found');
      }

      const matchData = result.rows[0];

      logger.info('Detailed match score calculated', {
        candidate_id: candidateId,
        job_id: jobId,
        total_match_score: matchData.total_match_score,
        match_grade: matchData.match_grade
      });

      return {
        candidate_id: candidateId,
        job_id: jobId,
        total_match_score: Math.round(matchData.total_match_score),
        match_grade: matchData.match_grade,
        detailed_scores: {
          skill_match: Math.round(matchData.skill_match_score),
          experience_match: Math.round(matchData.experience_match_score),
          education_match: Math.round(matchData.education_match_score),
          location_match: Math.round(matchData.location_match_score),
          salary_match: Math.round(matchData.salary_match_score)
        },
        skill_analysis: {
          matched_skills: matchData.matched_skills,
          total_required_skills: matchData.total_required_skills,
          total_candidate_skills: matchData.total_candidate_skills,
          candidate_skills: matchData.candidate_skills,
          job_skills: matchData.job_skills
        },
        job_info: {
          job_title: matchData.job_title,
          company_name: matchData.company_name,
          company_logo_url: matchData.company_logo_url,
          employment_type: matchData.employment_type,
          work_type: matchData.work_type,
          city_name: matchData.city_name,
          salary_min: matchData.salary_min,
          salary_max: matchData.salary_max
        }
      };
    } catch (error) {
      logger.error('Failed to calculate detailed match score:', error);
      throw error;
    }
  }

  /**
   * Find similar candidates for a job
   */
  async findSimilarCandidates(jobId, options = {}) {
    try {
      const { limit = 50, min_score = 60 } = options;

      const query = `
        WITH job_skills AS (
          SELECT 
            js.job_id,
            array_agg(js.skill_id) as required_skill_ids,
            j.experience_required,
            j.education_required,
            j.city_id,
            j.work_type,
            j.salary_min,
            j.salary_max
          FROM job_skills js
          JOIN jobs j ON js.job_id = j.job_id
          WHERE js.job_id = $1
          GROUP BY js.job_id, j.experience_required, j.education_required, j.city_id, j.work_type, j.salary_min, j.salary_max
        ),
        candidate_matches AS (
          SELECT 
            cp.profile_id,
            cp.full_name,
            cp.email,
            cp.phone,
            cp.years_experience,
            cp.education_level,
            cp.expected_salary,
            cp.city_id,
            cp.current_position,
            cp.profile_picture_url,
            u.user_id,
            COALESCE(cs.candidate_skill_ids, ARRAY[]::uuid[]) as candidate_skill_ids,
            -- Calculate match score
            CASE 
              WHEN js.required_skill_ids IS NOT NULL AND cardinality(js.required_skill_ids) > 0
              THEN (cardinality(COALESCE(cs.candidate_skill_ids, ARRAY[]::uuid[]) & js.required_skill_ids)::float / cardinality(js.required_skill_ids)) * 40
              ELSE 0 
            END +
            CASE 
              WHEN js.experience_required IS NULL OR js.experience_required = 0 THEN 25
              WHEN cp.years_experience >= js.experience_required THEN 25
              WHEN cp.years_experience >= (js.experience_required * 0.8) THEN 20
              ELSE GREATEST(0, 25 - (js.experience_required - cp.years_experience) * 2)
            END +
            CASE 
              WHEN js.education_required IS NULL THEN 15
              WHEN cp.education_level = js.education_required THEN 15
              ELSE GREATEST(0, 15 - 3)
            END +
            CASE 
              WHEN js.work_type = 'REMOTE' THEN 10
              WHEN cp.city_id = js.city_id THEN 10
              WHEN js.work_type = 'HYBRID' THEN 7
              ELSE 3
            END +
            CASE 
              WHEN js.salary_min IS NULL OR js.salary_max IS NULL THEN 10
              WHEN cp.expected_salary IS NULL THEN 10
              WHEN cp.expected_salary BETWEEN js.salary_min AND js.salary_max THEN 10
              ELSE 5
            END as match_score
          FROM candidate_profiles cp
          JOIN users u ON cp.user_id = u.user_id
          LEFT JOIN (
            SELECT 
              cs.profile_id,
              array_agg(cs.skill_id) as candidate_skill_ids
            FROM candidate_skills cs
            GROUP BY cs.profile_id
          ) cs ON cp.profile_id = cs.profile_id
          CROSS JOIN job_skills js
          WHERE u.status = 'ACTIVE' 
            AND u.role = 'CANDIDATE'
            AND NOT EXISTS (
              SELECT 1 FROM applications a 
              WHERE a.job_id = $1 AND a.candidate_id = cp.profile_id
            )
        )
        SELECT *
        FROM candidate_matches
        WHERE match_score >= $2
        ORDER BY match_score DESC
        LIMIT $3
      `;

      const result = await this.query(query, [jobId, min_score, limit], 'find_similar_candidates');

      return result.rows.map(row => ({
        ...row,
        match_score: Math.round(row.match_score)
      }));
    } catch (error) {
      logger.error('Failed to find similar candidates:', error);
      throw error;
    }
  }

  /**
   * Find similar jobs for a candidate
   */
  async findSimilarJobs(candidateId, options = {}) {
    try {
      const { limit = 50, min_score = 60, exclude_applied = true } = options;

      const excludeAppliedClause = exclude_applied ? `
        AND NOT EXISTS (
          SELECT 1 FROM applications a 
          WHERE a.job_id = j.job_id AND a.candidate_id = $1
        )
      ` : '';

      const query = `
        WITH candidate_info AS (
          SELECT 
            cp.*,
            COALESCE(cs.candidate_skill_ids, ARRAY[]::uuid[]) as candidate_skill_ids
          FROM candidate_profiles cp
          LEFT JOIN (
            SELECT 
              cs.profile_id,
              array_agg(cs.skill_id) as candidate_skill_ids
            FROM candidate_skills cs
            GROUP BY cs.profile_id
          ) cs ON cp.profile_id = cs.profile_id
          WHERE cp.profile_id = $1
        ),
        job_matches AS (
          SELECT 
            j.job_id,
            j.title as job_title,
            j.description as job_description,
            j.employment_type,
            j.remote_work_option as work_type,
            j.location as work_location,
            j.salary_min,
            j.salary_max,
            j.experience_level as experience_required,
            j.education_level as education_required,
            j.application_deadline as deadline,
            j.created_at,
            c.company_name,
            c.logo_url as company_logo_url,
            ci.city_name,
            COALESCE(js.job_skill_ids, ARRAY[]::uuid[]) as job_skill_ids,
            -- Calculate match score
            CASE 
              WHEN js.job_skill_ids IS NOT NULL AND cardinality(js.job_skill_ids) > 0
              THEN (cardinality(cand.candidate_skill_ids & js.job_skill_ids)::float / cardinality(js.job_skill_ids)) * 40
              ELSE 0 
            END +
            CASE 
              WHEN j.experience_required IS NULL OR j.experience_required = 0 THEN 25
              WHEN cand.years_experience >= j.experience_required THEN 25
              WHEN cand.years_experience >= (j.experience_required * 0.8) THEN 20
              ELSE GREATEST(0, 25 - (j.experience_required - cand.years_experience) * 2)
            END +
            CASE 
              WHEN j.education_required IS NULL THEN 15
              WHEN cand.education_level = j.education_required THEN 15
              ELSE GREATEST(0, 15 - 3)
            END +
            CASE 
              WHEN j.work_type = 'REMOTE' THEN 10
              WHEN cand.city_id = j.city_id THEN 10
              WHEN j.work_type = 'HYBRID' THEN 7
              ELSE 3
            END +
            CASE 
              WHEN j.salary_min IS NULL OR j.salary_max IS NULL THEN 10
              WHEN cand.expected_salary IS NULL THEN 10
              WHEN cand.expected_salary BETWEEN j.salary_min AND j.salary_max THEN 10
              ELSE 5
            END as match_score
          FROM jobs j
          JOIN companies c ON j.company_id = c.company_id
          LEFT JOIN cities ci ON j.city_id = ci.city_id
          LEFT JOIN (
            SELECT 
              js.job_id,
              array_agg(js.skill_id) as job_skill_ids
            FROM job_skills js
            GROUP BY js.job_id
          ) js ON j.job_id = js.job_id
          CROSS JOIN candidate_info cand
          WHERE j.status = 'ACTIVE'
            AND j.deadline > NOW()
            ${excludeAppliedClause}
        )
        SELECT *
        FROM job_matches
        WHERE match_score >= $${exclude_applied ? 3 : 2}
        ORDER BY match_score DESC, created_at DESC
        LIMIT $${exclude_applied ? 4 : 3}
      `;

      const values = [candidateId, min_score, limit];
      if (!exclude_applied) {
        values.splice(1, 0, min_score); // Insert min_score at index 1
      }

      const result = await this.query(query, values, 'find_similar_jobs');

      return result.rows.map(row => ({
        ...row,
        match_score: Math.round(row.match_score)
      }));
    } catch (error) {
      logger.error('Failed to find similar jobs:', error);
      throw error;
    }
  }

  /**
   * Get trending skills in the market
   */
  async getTrendingSkills(options = {}) {
    try {
      const { limit = 20, days = 30 } = options;

      const query = `
        SELECT 
          s.skill_id,
          s.skill_name,
          s.category,
          COUNT(DISTINCT j.job_id) as job_demand,
          COUNT(DISTINCT cs.profile_id) as candidate_supply,
          ROUND(
            COUNT(DISTINCT j.job_id)::float / NULLIF(COUNT(DISTINCT cs.profile_id), 0),
            2
          ) as demand_supply_ratio,
          COUNT(DISTINCT j.job_id) FILTER (WHERE j.created_at >= NOW() - INTERVAL '${days} days') as recent_job_demand,
          AVG(j.salary_max) as avg_salary_max
        FROM skills s
        LEFT JOIN job_skills js ON s.skill_id = js.skill_id
        LEFT JOIN jobs j ON js.job_id = j.job_id AND j.status = 'ACTIVE'
        LEFT JOIN candidate_skills cs ON s.skill_id = cs.skill_id
        GROUP BY s.skill_id, s.skill_name, s.category
        HAVING COUNT(DISTINCT j.job_id) > 0
        ORDER BY recent_job_demand DESC, demand_supply_ratio DESC
        LIMIT $1
      `;

      const result = await this.query(query, [limit], 'get_trending_skills');

      return result.rows.map(row => ({
        ...row,
        job_demand: parseInt(row.job_demand),
        candidate_supply: parseInt(row.candidate_supply),
        recent_job_demand: parseInt(row.recent_job_demand),
        avg_salary_max: row.avg_salary_max ? Math.round(row.avg_salary_max) : null
      }));
    } catch (error) {
      logger.error('Failed to get trending skills:', error);
      throw error;
    }
  }

  /**
   * Get market insights for a specific skill
   */
  async getSkillMarketInsights(skillId) {
    try {
      const query = `
        WITH skill_stats AS (
          SELECT 
            s.skill_id,
            s.skill_name,
            s.category,
            COUNT(DISTINCT j.job_id) as total_jobs,
            COUNT(DISTINCT cs.profile_id) as total_candidates,
            COUNT(DISTINCT j.job_id) FILTER (WHERE j.created_at >= NOW() - INTERVAL '30 days') as recent_jobs,
            COUNT(DISTINCT j.job_id) FILTER (WHERE j.created_at >= NOW() - INTERVAL '7 days') as weekly_jobs,
            AVG(j.salary_min) as avg_salary_min,
            AVG(j.salary_max) as avg_salary_max,
            MIN(j.salary_min) as min_salary,
            MAX(j.salary_max) as max_salary
          FROM skills s
          LEFT JOIN job_skills js ON s.skill_id = js.skill_id
          LEFT JOIN jobs j ON js.job_id = j.job_id AND j.status = 'ACTIVE'
          LEFT JOIN candidate_skills cs ON s.skill_id = cs.skill_id
          WHERE s.skill_id = $1
          GROUP BY s.skill_id, s.skill_name, s.category
        ),
        level_distribution AS (
          SELECT 
            js.required_level,
            COUNT(*) as job_count
          FROM job_skills js
          JOIN jobs j ON js.job_id = j.job_id
          WHERE js.skill_id = $1 AND j.status = 'ACTIVE'
          GROUP BY js.required_level
        ),
        industry_distribution AS (
          SELECT 
            c.industry,
            COUNT(DISTINCT j.job_id) as job_count
          FROM job_skills js
          JOIN jobs j ON js.job_id = j.job_id
          JOIN companies c ON j.company_id = c.company_id
          WHERE js.skill_id = $1 AND j.status = 'ACTIVE'
          GROUP BY c.industry
          ORDER BY job_count DESC
          LIMIT 5
        ),
        location_distribution AS (
          SELECT 
            ci.city_name,
            ci.country_name,
            COUNT(DISTINCT j.job_id) as job_count
          FROM job_skills js
          JOIN jobs j ON js.job_id = j.job_id
          JOIN cities ci ON j.city_id = ci.city_id
          WHERE js.skill_id = $1 AND j.status = 'ACTIVE'
          GROUP BY ci.city_name, ci.country_name
          ORDER BY job_count DESC
          LIMIT 5
        )
        SELECT 
          ss.*,
          json_agg(DISTINCT jsonb_build_object('level', ld.required_level, 'count', ld.job_count)) 
            FILTER (WHERE ld.required_level IS NOT NULL) as level_distribution,
          json_agg(DISTINCT jsonb_build_object('industry', ind.industry, 'count', ind.job_count)) 
            FILTER (WHERE ind.industry IS NOT NULL) as industry_distribution,
          json_agg(DISTINCT jsonb_build_object('city', loc.city_name, 'country', loc.country_name, 'count', loc.job_count)) 
            FILTER (WHERE loc.city_name IS NOT NULL) as location_distribution
        FROM skill_stats ss
        LEFT JOIN level_distribution ld ON true
        LEFT JOIN industry_distribution ind ON true
        LEFT JOIN location_distribution loc ON true
        GROUP BY ss.skill_id, ss.skill_name, ss.category, ss.total_jobs, ss.total_candidates, 
                 ss.recent_jobs, ss.weekly_jobs, ss.avg_salary_min, ss.avg_salary_max, ss.min_salary, ss.max_salary
      `;

      const result = await this.query(query, [skillId], 'get_skill_market_insights');

      if (result.rows.length === 0) {
        throw new Error('Skill not found');
      }

      const insights = result.rows[0];

      return {
        skill_id: insights.skill_id,
        skill_name: insights.skill_name,
        category: insights.category,
        market_stats: {
          total_jobs: parseInt(insights.total_jobs),
          total_candidates: parseInt(insights.total_candidates),
          recent_jobs: parseInt(insights.recent_jobs),
          weekly_jobs: parseInt(insights.weekly_jobs),
          demand_supply_ratio: insights.total_candidates > 0 ? 
            Math.round((insights.total_jobs / insights.total_candidates) * 100) / 100 : null
        },
        salary_insights: {
          avg_salary_min: insights.avg_salary_min ? Math.round(insights.avg_salary_min) : null,
          avg_salary_max: insights.avg_salary_max ? Math.round(insights.avg_salary_max) : null,
          min_salary: insights.min_salary ? Math.round(insights.min_salary) : null,
          max_salary: insights.max_salary ? Math.round(insights.max_salary) : null
        },
        distributions: {
          level_distribution: insights.level_distribution || [],
          industry_distribution: insights.industry_distribution || [],
          location_distribution: insights.location_distribution || []
        }
      };
    } catch (error) {
      logger.error('Failed to get skill market insights:', error);
      throw error;
    }
  }

  /**
   * Get personalized job recommendations for candidate
   */
  async getPersonalizedRecommendations(candidateId, options = {}) {
    try {
      const { limit = 20, algorithm = 'hybrid' } = options;

      let recommendations = [];

      switch (algorithm) {
        case 'skills_based':
          recommendations = await this.getSkillBasedRecommendations(candidateId, limit);
          break;
        case 'behavior_based':
          recommendations = await this.getBehaviorBasedRecommendations(candidateId, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.getHybridRecommendations(candidateId, limit);
          break;
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to get personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Get skill-based recommendations
   */
  async getSkillBasedRecommendations(candidateId, limit) {
    try {
      const jobs = await this.findSimilarJobs(candidateId, { limit, min_score: 50 });
      return jobs.map(job => ({
        ...job,
        recommendation_type: 'skills_based',
        recommendation_reason: 'Based on your skills and experience'
      }));
    } catch (error) {
      logger.error('Failed to get skill-based recommendations:', error);
      throw error;
    }
  }

  /**
   * Get behavior-based recommendations
   */
  async getBehaviorBasedRecommendations(candidateId, limit) {
    try {
      // Get jobs similar to what candidate has applied to
      const query = `
        WITH candidate_applications AS (
          SELECT DISTINCT j.job_id, j.title, j.company_id, j.employment_type, j.work_type
          FROM applications a
          JOIN jobs j ON a.job_id = j.job_id
          WHERE a.candidate_id = $1
        ),
        similar_jobs AS (
          SELECT DISTINCT
            j.job_id,
            j.title,
            j.description,
            j.employment_type,
            j.work_type,
            j.location,
            j.salary_min,
            j.salary_max,
            j.created_at,
            c.company_name,
            c.logo_url,
            ci.city_name,
            COUNT(*) as similarity_score
          FROM jobs j
          JOIN companies c ON j.company_id = c.company_id
          LEFT JOIN cities ci ON j.city_id = ci.city_id
          JOIN candidate_applications ca ON (
            j.employment_type = ca.employment_type OR
            j.work_type = ca.work_type OR
            j.company_id = ca.company_id
          )
          WHERE j.status = 'ACTIVE'
            AND j.deadline > NOW()
            AND NOT EXISTS (
              SELECT 1 FROM applications a2 
              WHERE a2.job_id = j.job_id AND a2.candidate_id = $1
            )
          GROUP BY j.job_id, j.title, j.description, j.employment_type, j.work_type, 
                   j.location, j.salary_min, j.salary_max, j.created_at, c.company_name, 
                   c.logo_url, ci.city_name
          ORDER BY similarity_score DESC, j.created_at DESC
          LIMIT $2
        )
        SELECT *, 70 as match_score
        FROM similar_jobs
      `;

      const result = await this.query(query, [candidateId, limit], 'get_behavior_based_recommendations');

      return result.rows.map(job => ({
        ...job,
        recommendation_type: 'behavior_based',
        recommendation_reason: 'Based on your application history'
      }));
    } catch (error) {
      logger.error('Failed to get behavior-based recommendations:', error);
      throw error;
    }
  }

  /**
   * Get hybrid recommendations
   */
  async getHybridRecommendations(candidateId, limit) {
    try {
      const skillsBasedLimit = Math.ceil(limit * 0.6);
      const behaviorBasedLimit = Math.floor(limit * 0.4);

      const [skillsBased, behaviorBased] = await Promise.all([
        this.getSkillBasedRecommendations(candidateId, skillsBasedLimit),
        this.getBehaviorBasedRecommendations(candidateId, behaviorBasedLimit)
      ]);

      // Combine and deduplicate
      const combined = [...skillsBased, ...behaviorBased];
      const unique = combined.filter((job, index, self) => 
        index === self.findIndex(j => j.job_id === job.job_id)
      );

      // Sort by match score
      unique.sort((a, b) => b.match_score - a.match_score);

      return unique.slice(0, limit).map(job => ({
        ...job,
        recommendation_type: 'hybrid',
        recommendation_reason: 'Based on skills, experience, and behavior'
      }));
    } catch (error) {
      logger.error('Failed to get hybrid recommendations:', error);
      throw error;
    }
  }
}

module.exports = MatchingService; 