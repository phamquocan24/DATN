// PM2 Ecosystem Configuration for DATN Project
module.exports = {
  apps: [
    // API Gateway
    {
      name: 'api-gateway',
      script: '../api-gateway/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/datn/api-gateway-error.log',
      out_file: '/var/log/datn/api-gateway-out.log',
      log_file: '/var/log/datn/api-gateway.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10
    },

    // Business Service
    {
      name: 'business-service',
      script: '../services/business-service/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/datn/business-service-error.log',
      out_file: '/var/log/datn/business-service-out.log',
      log_file: '/var/log/datn/business-service.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    },

    // AI Service - CV Processing
    {
      name: 'ai-cv-service',
      script: 'extract_and_improve_cv/venv/bin/python',
      args: 'extract_and_improve_cv/main.py',
      interpreter: 'none',
      instances: 1,
      env: {
        FLASK_ENV: 'production',
        PORT: 8003,
        PYTHONPATH: '/opt/datn-recruitment/services/ai-service/extract_and_improve_cv'
      },
      error_file: '/var/log/datn/ai-cv-error.log',
      out_file: '/var/log/datn/ai-cv-out.log',
      log_file: '/var/log/datn/ai-cv.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      min_uptime: '30s',
      max_restarts: 5
    },

    // AI Service - Job Matching
    {
      name: 'ai-matching-service',
      script: 'jd-cv-matching/venv/bin/python',
      args: 'jd-cv-matching/app/main.py',
      interpreter: 'none',
      instances: 1,
      env: {
        FLASK_ENV: 'production',
        PORT: 8001,
        PYTHONPATH: '/opt/datn-recruitment/services/ai-service/jd-cv-matching'
      },
      error_file: '/var/log/datn/ai-matching-error.log',
      out_file: '/var/log/datn/ai-matching-out.log',
      log_file: '/var/log/datn/ai-matching.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      min_uptime: '30s',
      max_restarts: 5
    },

    // AI Service - Question Generation
    {
      name: 'ai-question-service',
      script: 'generating-and-evaluating-questions-for-test/venv/bin/python',
      args: 'generating-and-evaluating-questions-for-test/app/main.py',
      interpreter: 'none',
      instances: 1,
      env: {
        FLASK_ENV: 'production',
        PORT: 8002,
        PYTHONPATH: '/opt/datn-recruitment/services/ai-service/generating-and-evaluating-questions-for-test'
      },
      error_file: '/var/log/datn/ai-question-error.log',
      out_file: '/var/log/datn/ai-question-out.log',
      log_file: '/var/log/datn/ai-question.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      min_uptime: '30s',
      max_restarts: 5
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/opt/datn-recruitment',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y git nodejs npm python3 python3-pip postgresql'
    }
  }
};
