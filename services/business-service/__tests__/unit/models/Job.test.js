const Job = require('../../../models/Job');
const winston = require('winston');

// Mock winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

describe('Job Model', () => {
  let jobModel;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      query: jest.fn()
    };
    
    jobModel = new Job();
    jobModel.db = mockDb;
  });

  describe('createJob', () => {
    it('should create a new job successfully', async () => {
      const jobData = {
        company_id: '123e4567-e89b-12d3-a456-426614174100',
        job_title: 'Software Engineer',
        job_description: 'We are looking for a software engineer...',
        job_requirements: 'Bachelor degree in Computer Science',
        job_benefits: 'Health insurance, flexible working hours',
        employment_type: 'FULL_TIME',
        work_location: 'Ho Chi Minh City',
        salary_min: 15000000,
        salary_max: 25000000,
        currency: 'VND',
        experience_required: 'JUNIOR',
        deadline: '2024-12-31',
        number_of_positions: 2,
        work_type: 'REMOTE',
        city_id: 1,
        district_id: 1,
        created_by: '123e4567-e89b-12d3-a456-426614174002',
        skills: ['javascript', 'react', 'nodejs']
      };

      const mockJobId = '123e4567-e89b-12d3-a456-426614174300';
      const mockCreatedJob = {
        job_id: mockJobId,
        company_id: jobData.company_id,
        title: jobData.job_title,
        description: jobData.job_description,
        requirements: jobData.job_requirements,
        benefits: jobData.job_benefits,
        employment_type: jobData.employment_type,
        address: jobData.work_location,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        currency: jobData.currency,
        experience_level: jobData.experience_required,
        application_deadline: jobData.deadline,
        max_applications: jobData.number_of_positions,
        remote_work_option: jobData.work_type,
        city_id: jobData.city_id,
        district_id: jobData.district_id,
        recruiter_id: jobData.created_by,
        status: 'PENDING',
        created_at: new Date()
      };

      // Mock successful job creation
      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedJob] });
      
      // Mock addJobSkills method
      jobModel.addJobSkills = jest.fn().mockResolvedValue();

      const result = await jobModel.createJob(jobData);

      // Verify database query
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO jobs'),
        expect.arrayContaining([
          jobData.company_id,
          jobData.job_title,
          jobData.job_description,
          jobData.job_requirements,
          jobData.job_benefits,
          jobData.employment_type,
          jobData.work_location,
          jobData.salary_min,
          jobData.salary_max,
          'VND',
          jobData.experience_required,
          jobData.deadline,
          2,
          jobData.work_type,
          jobData.city_id,
          jobData.district_id,
          jobData.created_by,
          'PENDING'
        ]),
        'create_job'
      );

      // Verify skills were added
      expect(jobModel.addJobSkills).toHaveBeenCalledWith(mockJobId, jobData.skills);

      expect(result).toEqual(mockCreatedJob);
    });

    it('should throw error for missing required fields', async () => {
      const incompleteJobData = {
        job_title: 'Software Engineer'
        // Missing company_id, job_description, created_by
      };

      await expect(jobModel.createJob(incompleteJobData)).rejects.toThrow('Company ID, job title, job description, and creator are required');
    });

    it('should create job without skills', async () => {
      const jobData = {
        company_id: '123e4567-e89b-12d3-a456-426614174100',
        job_title: 'Software Engineer',
        job_description: 'Job description',
        created_by: '123e4567-e89b-12d3-a456-426614174002'
      };

      const mockJobId = '123e4567-e89b-12d3-a456-426614174300';
      const mockCreatedJob = {
        job_id: mockJobId,
        title: jobData.job_title,
        status: 'PENDING'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockCreatedJob] });
      jobModel.addJobSkills = jest.fn();

      const result = await jobModel.createJob(jobData);

      expect(jobModel.addJobSkills).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedJob);
    });

    it('should handle database errors', async () => {
      const jobData = {
        company_id: '123e4567-e89b-12d3-a456-426614174100',
        job_title: 'Software Engineer',
        job_description: 'Job description',
        created_by: '123e4567-e89b-12d3-a456-426614174002'
      };

      const dbError = new Error('Database connection failed');
      mockDb.query.mockRejectedValue(dbError);

      await expect(jobModel.createJob(jobData)).rejects.toThrow(dbError);
    });
  });

  describe('getJobById', () => {
    it('should get job by ID with basic information', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const mockJob = {
        job_id: jobId,
        title: 'Software Engineer',
        description: 'Job description',
        company_name: 'Tech Company',
        logo_url: 'https://example.com/logo.png',
        city_name: 'Ho Chi Minh City',
        district_name: 'District 1',
        recruiter_name: 'John Recruiter',
        recruiter_email: 'recruiter@company.com',
        required_skills: [
          { skill_id: 1, skill_name: 'JavaScript', category: 'Programming', is_required: true },
          { skill_id: 2, skill_name: 'React', category: 'Framework', is_required: false }
        ]
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockJob] });

      const result = await jobModel.getJobById(jobId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [jobId],
        'get_job_by_id'
      );
      expect(result).toEqual(mockJob);
    });

    it('should get job by ID with statistics', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const mockJob = {
        job_id: jobId,
        title: 'Software Engineer',
        description: 'Job description'
      };
      const mockStats = {
        total_applications: '15',
        pending_applications: '5',
        reviewing_applications: '3',
        interviewing_applications: '2',
        hired_applications: '1',
        rejected_applications: '4',
        avg_match_score: '0.75'
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockJob] }) // getJobById query
        .mockResolvedValueOnce({ rows: [mockStats] }); // statistics query

      const result = await jobModel.getJobById(jobId, true);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('SELECT'),
        [jobId],
        'get_job_stats'
      );
      expect(result).toEqual({
        ...mockJob,
        statistics: mockStats
      });
    });

    it('should return null for non-existent job', async () => {
      const jobId = 'non-existent-job-id';

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await jobModel.getJobById(jobId);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const dbError = new Error('Database query failed');

      mockDb.query.mockRejectedValue(dbError);

      await expect(jobModel.getJobById(jobId)).rejects.toThrow(dbError);
    });
  });

  describe('getJobs', () => {
    it('should get jobs with default options', async () => {
      const mockJobs = [
        {
          job_id: '123e4567-e89b-12d3-a456-426614174301',
          title: 'Software Engineer',
          company_name: 'Tech Company',
          status: 'ACTIVE'
        },
        {
          job_id: '123e4567-e89b-12d3-a456-426614174302',
          title: 'DevOps Engineer',
          company_name: 'Cloud Company',
          status: 'ACTIVE'
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockJobs });

      const result = await jobModel.getJobs();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM jobs j'),
        expect.any(Array),
        'get_jobs'
      );
      expect(result).toEqual(mockJobs);
    });

    it('should get jobs with search filter', async () => {
      const options = {
        search: 'software engineer',
        page: 1,
        limit: 10
      };

      const mockJobs = [
        {
          job_id: '123e4567-e89b-12d3-a456-426614174301',
          title: 'Software Engineer',
          company_name: 'Tech Company'
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockJobs });

      const result = await jobModel.getJobs(options);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%software engineer%']),
        'get_jobs'
      );
      expect(result).toEqual(mockJobs);
    });

    it('should get jobs with company filter', async () => {
      const options = {
        company_id: '123e4567-e89b-12d3-a456-426614174100'
      };

      const mockJobs = [
        {
          job_id: '123e4567-e89b-12d3-a456-426614174301',
          title: 'Software Engineer',
          company_id: options.company_id
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockJobs });

      const result = await jobModel.getJobs(options);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('j.company_id = $'),
        expect.arrayContaining([options.company_id]),
        'get_jobs'
      );
      expect(result).toEqual(mockJobs);
    });

    it('should get jobs with salary range filter', async () => {
      const options = {
        salary_min: 10000000,
        salary_max: 30000000
      };

      const mockJobs = [
        {
          job_id: '123e4567-e89b-12d3-a456-426614174301',
          title: 'Software Engineer',
          salary_min: 15000000,
          salary_max: 25000000
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockJobs });

      const result = await jobModel.getJobs(options);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('j.salary_max >= $'),
        expect.arrayContaining([options.salary_min, options.salary_max]),
        'get_jobs'
      );
      expect(result).toEqual(mockJobs);
    });
  });

  describe('updateJob', () => {
    beforeEach(() => {
      jobModel.checkJobPermission = jest.fn();
      jobModel.findById = jest.fn();
    });

    it('should update job successfully', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = {
        title: 'Senior Software Engineer',
        description: 'Updated job description',
        salary_min: 20000000,
        salary_max: 30000000
      };

      const mockCurrentJob = {
        job_id: jobId,
        title: 'Software Engineer',
        status: 'ACTIVE'
      };

      const mockUpdatedJob = {
        ...mockCurrentJob,
        ...updateData
      };

      jobModel.checkJobPermission.mockResolvedValue(true);
      jobModel.findById.mockResolvedValue(mockCurrentJob);
      mockDb.query.mockResolvedValueOnce({ rows: [mockUpdatedJob] });

      const result = await jobModel.updateJob(jobId, updateData, userId);

      expect(jobModel.checkJobPermission).toHaveBeenCalledWith(jobId, userId);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jobs SET'),
        expect.any(Array),
        'update_job'
      );
      expect(result).toEqual(mockUpdatedJob);
    });

    it('should throw error for unauthorized update', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174999';
      const updateData = { title: 'Updated Title' };

      jobModel.checkJobPermission.mockRejectedValue(new Error('Access denied'));

      await expect(jobModel.updateJob(jobId, updateData, userId)).rejects.toThrow('Access denied');
    });

    it('should throw error for non-existent job', async () => {
      const jobId = 'non-existent-job-id';
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const updateData = { title: 'Updated Title' };

      jobModel.checkJobPermission.mockResolvedValue(true);
      jobModel.findById.mockResolvedValue(null);

      await expect(jobModel.updateJob(jobId, updateData, userId)).rejects.toThrow('Job not found');
    });
  });

  describe('updateJobStatus', () => {
    beforeEach(() => {
      jobModel.checkJobPermission = jest.fn();
    });

    it('should update job status successfully', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174002';
      const status = 'CLOSED';
      const reason = 'Position filled';

      const mockUpdatedJob = {
        job_id: jobId,
        status: status,
        updated_at: new Date()
      };

      jobModel.checkJobPermission.mockResolvedValue(true);
      mockDb.query.mockResolvedValueOnce({ rows: [mockUpdatedJob] });

      const result = await jobModel.updateJobStatus(jobId, status, userId, reason);

      expect(jobModel.checkJobPermission).toHaveBeenCalledWith(jobId, userId);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE jobs SET'),
        expect.arrayContaining([status, jobId]),
        'update_job_status'
      );
      expect(result).toEqual(mockUpdatedJob);
    });

    it('should throw error for unauthorized status update', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174999';
      const status = 'CLOSED';

      jobModel.checkJobPermission.mockRejectedValue(new Error('Access denied'));

      await expect(jobModel.updateJobStatus(jobId, status, userId)).rejects.toThrow('Access denied');
    });
  });

  describe('checkJobPermission', () => {
    it('should allow job owner to access', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      const mockJob = {
        job_id: jobId,
        recruiter_id: userId
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockJob] });

      const result = await jobModel.checkJobPermission(jobId, userId);

      expect(result).toBe(true);
    });

    it('should throw error for unauthorized access', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174999';

      const mockJob = {
        job_id: jobId,
        recruiter_id: '123e4567-e89b-12d3-a456-426614174002'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockJob] });

      await expect(jobModel.checkJobPermission(jobId, userId)).rejects.toThrow('Access denied');
    });

    it('should allow admin access with override', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174999';

      const mockJob = {
        job_id: jobId,
        recruiter_id: '123e4567-e89b-12d3-a456-426614174002'
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockJob] });

      const result = await jobModel.checkJobPermission(jobId, userId, true);

      expect(result).toBe(true);
    });

    it('should throw error for non-existent job', async () => {
      const jobId = 'non-existent-job-id';
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await expect(jobModel.checkJobPermission(jobId, userId)).rejects.toThrow('Job not found');
    });
  });

  describe('deleteJob', () => {
    beforeEach(() => {
      jobModel.checkJobPermission = jest.fn();
    });

    it('should delete job successfully', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174002';

      jobModel.checkJobPermission.mockResolvedValue(true);
      mockDb.query.mockResolvedValueOnce({ rows: [{ job_id: jobId }] });

      const result = await jobModel.deleteJob(jobId, userId);

      expect(jobModel.checkJobPermission).toHaveBeenCalledWith(jobId, userId);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM jobs'),
        [jobId],
        'delete_job'
      );
      expect(result).toEqual({ message: 'Job deleted successfully' });
    });

    it('should throw error for unauthorized deletion', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174300';
      const userId = '123e4567-e89b-12d3-a456-426614174999';

      jobModel.checkJobPermission.mockRejectedValue(new Error('Access denied'));

      await expect(jobModel.deleteJob(jobId, userId)).rejects.toThrow('Access denied');
    });
  });
}); 