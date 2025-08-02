const { BaseModel } = require('./Database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * User Model
 * Handles user authentication, profiles, and related operations
 */
class User extends BaseModel {
  constructor() {
    super('users', 'user_id');
  }

  /**
   * Create a new user with encrypted password
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    try {
      const { email, password, phone, full_name, role = 'CANDIDATE', auth_provider = 'LOCAL' } = userData;

      // Check if email already exists
      const existingUser = await this.findOne({ email });
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Hash password if provided
      let password_hash = null;
      if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        password_hash = await bcrypt.hash(password, saltRounds);
      }

      // Create user
      const userResult = await this.create({
        email,
        password_hash,
        phone,
        full_name,
        role,
        auth_provider
      });

      // Create user profile
      await this.db.query(
        `INSERT INTO user_profile (user_id) VALUES ($1)`,
        [userResult.user_id],
        'create_user_profile'
      );

      // Remove password hash from response
      const { password_hash: _, ...userWithoutPassword } = userResult;
      
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>}
   */
  async authenticate(email, password) {
    try {
      // Find user by email
      const user = await this.findOne(
        { email, is_active: true },
        'user_id, email, password_hash, full_name, role, auth_provider'
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user uses local authentication
      if (user.auth_provider !== 'LOCAL' || !user.password_hash) {
        throw new Error('Please use social login or reset your password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.db.query(
        `UPDATE user_profile SET last_login_at = NOW() WHERE user_id = $1`,
        [user.user_id],
        'update_last_login'
      );

      // Generate JWT tokens
      const tokens = this.generateTokens(user);

      // Remove password hash from response
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        ...tokens
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Generate JWT access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object}
   */
  generateTokens(user) {
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN || '1h'
    };
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>}
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Find user to ensure they still exist and are active
      const user = await this.findById(decoded.user_id, 'user_id, email, full_name, role, is_active');
      
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      return {
        user,
        ...tokens
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get user profile with related data
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getUserProfile(userId) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.phone,
          u.full_name,
          u.role,
          u.auth_provider,
          u.is_active,
          u.created_at,
          up.profile_image_url,
          up.bio,
          up.website_url,
          up.languages,
          up.profile_completed,
          up.account_status,
          up.last_login_at,
          CASE 
            WHEN u.role = 'CANDIDATE' THEN cp.profile_id
            WHEN u.role = 'RECRUITER' THEN rp.profile_id
            ELSE NULL
          END as role_profile_id
        FROM users u
        LEFT JOIN user_profile up ON u.user_id = up.user_id
        LEFT JOIN candidate_profiles cp ON u.user_id = cp.user_id
        LEFT JOIN recruiter_profiles rp ON u.user_id = rp.user_id
        WHERE u.user_id = $1 AND u.is_active = true
      `;

      const result = await this.db.query(query, [userId], 'get_user_profile');
      
      if (!result.rows[0]) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // Get additional profile data based on role
      if (user.role === 'CANDIDATE' && user.role_profile_id) {
        const candidateProfile = await this.getCandidateProfile(userId);
        user.candidate_profile = candidateProfile;
      } else if (user.role === 'RECRUITER' && user.role_profile_id) {
        const recruiterProfile = await this.getRecruiterProfile(userId);
        user.recruiter_profile = recruiterProfile;
      }

      return user;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Get candidate profile details
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getCandidateProfile(userId) {
    try {
      const query = `
        SELECT 
          cp.*,
          c.city_name,
          d.district_name,
          COUNT(cs.skill_id) as skill_count,
          COUNT(cv.cv_id) as cv_count
        FROM candidate_profiles cp
        LEFT JOIN cities c ON cp.city_id = c.city_id
        LEFT JOIN districts d ON cp.district_id = d.district_id
        LEFT JOIN candidate_skills cs ON cp.profile_id = cs.profile_id
        LEFT JOIN candidate_cvs cv ON cp.user_id = cv.candidate_id
        WHERE cp.user_id = $1
        GROUP BY cp.profile_id, c.city_name, d.district_name
      `;

      const result = await this.db.query(query, [userId], 'get_candidate_profile');
      
      if (result.rows[0]) {
        const profile = result.rows[0];
        
        // Get candidate skills
        const skillsQuery = `
          SELECT s.skill_name, s.category, cs.proficiency_level, cs.years_experience, cs.is_primary
          FROM candidate_skills cs
          JOIN skills s ON cs.skill_id = s.skill_id
          WHERE cs.profile_id = $1
          ORDER BY cs.is_primary DESC, cs.proficiency_level DESC
        `;
        
        const skillsResult = await this.db.query(skillsQuery, [profile.profile_id], 'get_candidate_skills');
        profile.skills = skillsResult.rows;

        return profile;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get candidate profile: ${error.message}`);
    }
  }

  /**
   * Get recruiter profile details
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getRecruiterProfile(userId) {
    try {
      const query = `
        SELECT 
          rp.*,
          c.company_name,
          c.industry,
          c.company_size,
          c.website,
          c.logo_url,
          c.is_verified as company_verified
        FROM recruiter_profiles rp
        LEFT JOIN companies c ON rp.company_id = c.company_id
        WHERE rp.user_id = $1
      `;

      const result = await this.db.query(query, [userId], 'get_recruiter_profile');
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to get recruiter profile: ${error.message}`);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, profileData) {
    try {
      const { 
        phone, full_name, profile_image_url, bio, website_url, languages,
        // Candidate specific fields
        date_of_birth, gender, address, city_id, district_id, education_level,
        years_experience, current_job_title, current_company, current_salary,
        expected_salary, notice_period_days, willing_to_relocate, remote_work_preference,
        // Recruiter specific fields
        position, department, hire_authority_level
      } = profileData;

      // Update user table
      const userFields = { phone, full_name };
      const userUpdateData = Object.fromEntries(
        Object.entries(userFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(userUpdateData).length > 0) {
        await this.update(userId, userUpdateData);
      }

      // Update user_profile table
      const profileFields = { profile_image_url, bio, website_url, languages };
      const profileUpdateData = Object.fromEntries(
        Object.entries(profileFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(profileUpdateData).length > 0) {
        const profileQuery = `
          UPDATE user_profile 
          SET ${Object.keys(profileUpdateData).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = NOW()
          WHERE user_id = $1
          RETURNING *
        `;
        
        await this.db.query(
          profileQuery, 
          [userId, ...Object.values(profileUpdateData)], 
          'update_user_profile'
        );
      }

      // Get user role and update role-specific profile
      const user = await this.findById(userId, 'role');
      
      if (user.role === 'CANDIDATE') {
        await this.updateCandidateProfile(userId, {
          date_of_birth, gender, address, city_id, district_id, education_level,
          years_experience, current_job_title, current_company, current_salary,
          expected_salary, notice_period_days, willing_to_relocate, remote_work_preference
        });
      } else if (user.role === 'RECRUITER') {
        await this.updateRecruiterProfile(userId, {
          position, department, hire_authority_level
        });
      }

      // Return updated profile
      return await this.getUserProfile(userId);
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  /**
   * Update candidate-specific profile
   * @param {string} userId - User ID
   * @param {Object} candidateData - Candidate profile data
   * @returns {Promise<void>}
   */
  async updateCandidateProfile(userId, candidateData) {
    const updateData = Object.fromEntries(
      Object.entries(candidateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length > 0) {
      const query = `
        UPDATE candidate_profiles 
        SET ${Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = NOW()
        WHERE user_id = $1
      `;
      
      await this.db.query(
        query, 
        [userId, ...Object.values(updateData)], 
        'update_candidate_profile'
      );
    }
  }

  /**
   * Update recruiter-specific profile
   * @param {string} userId - User ID
   * @param {Object} recruiterData - Recruiter profile data
   * @returns {Promise<void>}
   */
  async updateRecruiterProfile(userId, recruiterData) {
    const updateData = Object.fromEntries(
      Object.entries(recruiterData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length > 0) {
      const query = `
        UPDATE recruiter_profiles 
        SET ${Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = NOW()
        WHERE user_id = $1
      `;
      
      await this.db.query(
        query, 
        [userId, ...Object.values(updateData)], 
        'update_recruiter_profile'
      );
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current user with password
      const user = await this.findById(userId, 'password_hash, auth_provider');
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.auth_provider !== 'LOCAL') {
        throw new Error('Cannot change password for social login accounts');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.update(userId, { password_hash: newPasswordHash });

      // Log security event
      await this.db.query(
        `INSERT INTO security_events (user_id, event_type, description) 
         VALUES ($1, 'PASSWORD_CHANGE', 'User changed password')`,
        [userId],
        'log_password_change'
      );

    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deactivateAccount(userId) {
    try {
      await this.update(userId, { is_active: false });
      
      // Log security event
      await this.db.query(
        `INSERT INTO security_events (user_id, event_type, description) 
         VALUES ($1, 'ACCOUNT_DEACTIVATED', 'User deactivated account')`,
        [userId],
        'log_account_deactivation'
      );
    } catch (error) {
      throw new Error(`Failed to deactivate account: ${error.message}`);
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>}
   */
  async register(userData) {
    try {
      // Use the existing createUser method
      const user = await this.createUser(userData);
      
      // Generate tokens for the new user
      const accessToken = jwt.sign(
        { 
          user_id: user.user_id, 
          email: user.email, 
          role: user.role,
          type: 'access'
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { 
          user_id: user.user_id, 
          email: user.email, 
          type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
        { expiresIn: '7d' }
      );

      return {
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 3600
        }
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Get users with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getUsers(options = {}) {
    try {
      const {
        role,
        is_active = true,
        search,
        page = 1,
        limit = 10,
        orderBy = 'created_at',
        direction = 'DESC'
      } = options;

      let conditions = { is_active };
      
      if (role) {
        conditions.role = role;
      }

      // Handle search across multiple fields
      let searchQuery = '';
      let searchParams = [];
      if (search) {
        searchQuery = `
          AND (
            u.full_name ILIKE $${Object.keys(conditions).length + 1} OR
            u.email ILIKE $${Object.keys(conditions).length + 1}
          )
        `;
        searchParams = [`%${search}%`];
      }

      const { whereClause, params } = this.db.buildWhereClause(conditions);
      const { limitClause, params: paginationParams, nextIndex } = this.db.buildPaginationClause(page, limit, params.length + searchParams.length + 1);

      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.full_name,
          u.role,
          u.is_active,
          u.created_at,
          up.profile_completed,
          up.account_status,
          up.last_login_at
        FROM users u
        LEFT JOIN user_profile up ON u.user_id = up.user_id
        ${whereClause.replace('WHERE', 'WHERE')} ${searchQuery}
        ORDER BY u.${orderBy} ${direction}
        ${limitClause}
      `;

      const allParams = [...params, ...searchParams, ...paginationParams];
      const result = await this.db.query(query, allParams, 'get_users_list');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users u 
        ${whereClause} ${searchQuery}
      `;
      const countResult = await this.db.query(countQuery, [...params, ...searchParams], 'count_users');
      const total = parseInt(countResult.rows[0].total);

      return {
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }
}

module.exports = User; 