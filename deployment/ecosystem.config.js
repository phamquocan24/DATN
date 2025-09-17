module.exports = {
  apps: [
    // API Gateway
    {
      name: 'api-gateway',
      script: './api-gateway/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        BUSINESS_SERVICE_URL: 'http://localhost:5001'
      },
      error_file: '/var/log/datn/api-gateway-error.log',
      out_file: '/var/log/datn/api-gateway-out.log',
      log_file: '/var/log/datn/api-gateway.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // Business Service (Main API)
    {
      name: 'business-service', 
      script: './services/business-service/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: '/var/log/datn/business-service-error.log',
      out_file: '/var/log/datn/business-service-out.log', 
      log_file: '/var/log/datn/business-service.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s'
    },

    // Frontend Service (Serve built files)
    {
      name: 'frontend-service',
      script: './deployment/serve-frontend.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      error_file: '/var/log/datn/frontend-error.log',
      out_file: '/var/log/datn/frontend-out.log',
      log_file: '/var/log/datn/frontend.log',
      time: true,
      max_memory_restart: '200M',
      restart_delay: 3000
    },

    // AI Service - CV Processing
    {
      name: 'ai-cv-service',
      script: './services/ai-service/extract_and_improve_cv/venv/bin/python',
      args: 'main.py',
      cwd: './services/ai-service/extract_and_improve_cv',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        SERVICE_PORT: 8003,
        SERVICE_HOST: '0.0.0.0'
      },
      error_file: '/var/log/datn/ai-cv-error.log',
      out_file: '/var/log/datn/ai-cv-out.log',
      log_file: '/var/log/datn/ai-cv.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    },

    // AI Service - JD-CV Matching  
    {
      name: 'ai-matching-service',
      script: './services/ai-service/jd-cv-matching/venv/bin/python',
      args: 'app/main.py',
      cwd: './services/ai-service/jd-cv-matching',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        SERVICE_PORT: 8001,
        SERVICE_HOST: '0.0.0.0'
      },
      error_file: '/var/log/datn/ai-matching-error.log',
      out_file: '/var/log/datn/ai-matching-out.log',
      log_file: '/var/log/datn/ai-matching.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    },

    // AI Service - Question Generation
    {
      name: 'ai-question-service',
      script: './services/ai-service/generating-and-evaluating-questions-for-test/venv/bin/python',
      args: 'app/main.py', 
      cwd: './services/ai-service/generating-and-evaluating-questions-for-test',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        SERVICE_PORT: 8002,
        SERVICE_HOST: '0.0.0.0'
      },
      error_file: '/var/log/datn/ai-question-error.log',
      out_file: '/var/log/datn/ai-question-out.log',
      log_file: '/var/log/datn/ai-question.log', 
      time: true,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};