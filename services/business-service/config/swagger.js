const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CV Recruitment System - Business Service API',
      version: '2.0.0',
      description: 'Complete API documentation for the CV Recruitment System Business Service',
      contact: {
        name: 'CV Recruitment System',
        email: 'support@cvrecruitment.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server'
      },
      {
        url: 'https://api.cvrecruitment.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            full_name: {
              type: 'string',
              description: 'User full name'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            role: {
              type: 'string',
              enum: ['CANDIDATE', 'RECRUITER', 'HR', 'ADMIN'],
              description: 'User role in the system'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              description: 'User account status'
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            job_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique job identifier'
            },
            title: {
              type: 'string',
              description: 'Job title'
            },
            description: {
              type: 'string',
              description: 'Job description'
            },
            requirements: {
              type: 'string',
              description: 'Job requirements'
            },
            benefits: {
              type: 'string',
              description: 'Job benefits'
            },
            employment_type: {
              type: 'string',
              enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'],
              description: 'Type of employment'
            },
            remote_work_option: {
              type: 'string',
              enum: ['ONSITE', 'REMOTE', 'HYBRID'],
              description: 'Work arrangement'
            },
            salary_min: {
              type: 'number',
              description: 'Minimum salary'
            },
            salary_max: {
              type: 'number',
              description: 'Maximum salary'
            },
            currency: {
              type: 'string',
              default: 'VND',
              description: 'Salary currency'
            },
            experience_level: {
              type: 'string',
              enum: ['ENTRY', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'],
              description: 'Required experience level'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED'],
              description: 'Job status'
            }
          }
        },
        Application: {
          type: 'object',
          properties: {
            application_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique application identifier'
            },
            job_id: {
              type: 'string',
              format: 'uuid',
              description: 'Related job ID'
            },
            candidate_id: {
              type: 'string',
              format: 'uuid',
              description: 'Candidate profile ID'
            },
            cv_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated CV ID'
            },
            cover_letter: {
              type: 'string',
              description: 'Cover letter content'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'REVIEWING', 'INTERVIEWING', 'HIRED', 'REJECTED'],
              description: 'Application status'
            },
            match_score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'AI-calculated match score'
            }
          }
        },
        Company: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique company identifier'
            },
            company_name: {
              type: 'string',
              description: 'Company name'
            },
            description: {
              type: 'string',
              description: 'Company description'
            },
            industry: {
              type: 'string',
              description: 'Company industry'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Company website URL'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'Company logo URL'
            },
            employee_count: {
              type: 'string',
              enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
              description: 'Number of employees'
            }
          }
        },
        CV: {
          type: 'object',
          properties: {
            cv_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique CV identifier'
            },
            cv_title: {
              type: 'string',
              description: 'CV title'
            },
            cv_file_url: {
              type: 'string',
              format: 'uri',
              description: 'CV file URL'
            },
            cv_file_name: {
              type: 'string',
              description: 'CV file name'
            },
            cv_file_type: {
              type: 'string',
              enum: ['pdf', 'doc', 'docx'],
              description: 'CV file type'
            },
            is_primary: {
              type: 'boolean',
              description: 'Whether this is the primary CV'
            }
          }
        },
        Test: {
          type: 'object',
          properties: {
            test_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique test identifier'
            },
            test_name: {
              type: 'string',
              description: 'Test name'
            },
            test_description: {
              type: 'string',
              description: 'Test description'
            },
            test_type: {
              type: 'string',
              enum: ['MULTIPLE_CHOICE', 'CODING', 'ESSAY', 'PRACTICAL'],
              description: 'Type of test'
            },
            time_limit: {
              type: 'number',
              description: 'Time limit in minutes'
            },
            passing_score: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Minimum score to pass'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the test is active'
            }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            notification_id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique notification identifier'
            },
            title: {
              type: 'string',
              description: 'Notification title'
            },
            message: {
              type: 'string',
              description: 'Notification message'
            },
            type: {
              type: 'string',
              enum: ['APPLICATION_UPDATE', 'INTERVIEW_SCHEDULED', 'TEST_ASSIGNED', 'JOB_MATCH', 'NEW_APPLICATION', 'SYSTEM_UPDATE', 'GENERAL'],
              description: 'Notification type'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH'],
              description: 'Notification priority'
            },
            is_read: {
              type: 'boolean',
              description: 'Whether the notification is read'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string'
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'number',
                  description: 'Current page number'
                },
                limit: {
                  type: 'number',
                  description: 'Items per page'
                },
                total: {
                  type: 'number',
                  description: 'Total number of items'
                },
                totalPages: {
                  type: 'number',
                  description: 'Total number of pages'
                },
                hasNext: {
                  type: 'boolean',
                  description: 'Whether there is a next page'
                },
                hasPrev: {
                  type: 'boolean',
                  description: 'Whether there is a previous page'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './server.js',
    './controllers/*.js',
    './modules/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 