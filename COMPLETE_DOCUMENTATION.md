# 📘 CV Recruitment Platform - Complete Documentation

> **Generated**: $(date)
> **Project**: CV Recruitment Platform - DATN
> **Description**: Complete consolidated documentation from all markdown files

This document contains all documentation from the CV Recruitment platform project, merged into a single comprehensive guide.

## 📋 Table of Contents

1. [Project Overview & Demo Guide](#project-overview--demo-guide)
2. [Database Documentation](#database-documentation)
3. [Database Sample Data Guide](#database-sample-data-guide)
4. [AI Services Overview](#ai-services-overview)
5. [AI Services Setup Guide](#ai-services-setup-guide)
6. [JD-CV Matching Service](#jd-cv-matching-service)
7. [Question Generation Service](#question-generation-service)
8. [Frontend API Integration Guide](#frontend-api-integration-guide)
9. [Job API Guide](#job-api-guide)
10. [Test API Integration Guide](#test-api-integration-guide)
11. [Nginx SSL Setup](#nginx-ssl-setup)
12. [Project Cleanup Summary](#project-cleanup-summary)


---

# Project Overview & Demo Guide

> **Source**: `./DEMO_GUIDE.md`

# 🎯 CV RECRUITMENT SYSTEM - DEMO GUIDE

## 🚀 Quick Start
```bash
# Open these URLs in your browser:
Frontend App:    http://localhost:5173
API Documentation: http://localhost:5001/api-docs  
System Health:   http://localhost:4000/health
```

## 📋 Pre-Created Test Data
- **Test Account**: `testdemo@example.com` / `TestDemo123!`
- **9 Companies**: Shopee, Grab, Tiki, VNG, FPT Software, etc.
- **9 Job Positions**: Software Architect, Frontend Developer, DevOps, etc.

---

## 🎪 DEMO SCENARIOS

### 1. 🏠 **Landing Page Tour**
**URL**: `http://localhost:5173`

**What to Test:**
- ✅ **Company Logos**: Featured companies display (Shopee, Grab, Tiki)
- ✅ **Job Categories**: Technology, Business, Design categories
- ✅ **Latest Jobs**: Job listings with salary ranges (23M - 52M VND)
- ✅ **Search Functionality**: Search bar and filters
- ✅ **Navigation**: Header menu and call-to-action buttons

**Expected Results:**
- 🎨 Modern, responsive UI with TailwindCSS
- 📱 Mobile-friendly design
- ⚡ Fast loading with Vite dev server

---

### 2. 🔐 **Authentication Flow**

#### **A. User Registration**
1. Click **"Sign In"** button → **"Sign Up"** tab
2. Fill form:
   - **Name**: `Demo User Test`
   - **Email**: `newuser@demo.com`
   - **Password**: `NewUser123!`
3. Click **"Create Account"**

**Expected**: Success message + auto login

#### **B. User Login**  
1. Use existing account: `testdemo@example.com` / `TestDemo123!`
2. Click **"Sign In"**

**Expected**: Dashboard redirect + user profile in header

#### **C. Password Reset**
1. Click **"Forgot Password?"**
2. Enter email: `testdemo@example.com`
3. Check reset flow

**Expected**: Success message (email sent)

---

### 3. 💼 **Job Management Features**

#### **A. Browse Jobs**
**URL**: Navigate to **"Find Jobs"**

**What to Test:**
- ✅ **Job List**: 9 positions available
- ✅ **Filters**: By experience (Junior/Mid/Senior), salary range
- ✅ **Job Details**: Click job → view full description
- ✅ **Company Info**: Company name, industry, size
- ✅ **Salary Display**: 16M - 52M VND range

**Sample Jobs:**
```
🏢 Shopee Vietnam - Software Architect (30M-49M VND)
🏢 Grab Vietnam - DevOps Engineer (29M-40M VND) 
🏢 Tiki Corporation - Data Scientist (24M-44M VND)
```

#### **B. Job Application** (Requires Login)
1. Login first
2. Click **"Apply Now"** on any job
3. Fill application form
4. Upload CV/Resume

**Expected**: Application submitted + tracking number

---

### 4. 🏢 **Company Features**

#### **A. Company Profiles**
**URL**: Navigate to **"Companies"**

**What to Test:**
- ✅ **Company List**: 7 featured companies
- ✅ **Company Details**: Click company → view profile
- ✅ **Job Listings**: Jobs by company
- ✅ **Company Info**: Industry, size, description

**Sample Companies:**
```
🚀 Shopee Vietnam - E-commerce (1000+ employees)
🚗 Grab Vietnam - Transportation (1000+ employees)
🛒 Tiki Corporation - E-commerce (1000+ employees)
```

---

### 5. 👤 **User Dashboard** (After Login)

#### **A. Profile Management**
1. Login → Click profile icon
2. Navigate to **"My Profile"**
3. Update personal information
4. Add skills and experience

**Expected**: Profile saved + success notification

#### **B. CV Management**
1. Go to **"Resume"** section
2. Upload PDF/DOC file
3. View uploaded CVs
4. Download/Delete options

**Expected**: File upload success + CV parsing

#### **C. Application Tracking**
1. Navigate to **"My Applications"**
2. View application status
3. Check application history

**Expected**: List of submitted applications with status

#### **D. Test Management**
1. Go to **"Tests"** section
2. View assigned tests
3. Take online assessments

**Expected**: Test interface + results tracking

---

### 6. 🔧 **Admin Features** (Admin Login Required)

#### **A. User Management**
**URL**: Admin dashboard

**What to Test:**
- ✅ **User List**: All registered users
- ✅ **User Details**: View user profiles
- ✅ **User Status**: Activate/Deactivate accounts
- ✅ **Statistics**: User metrics and analytics

#### **B. Job Moderation**
- ✅ **Pending Jobs**: Jobs awaiting approval
- ✅ **Job Approval**: Approve/Reject job postings
- ✅ **Job Statistics**: Job posting metrics

---

### 7. 👨‍💼 **HR/Recruiter Features**

#### **A. Job Posting**
1. Login as HR user
2. Navigate to **"Post New Job"**
3. Fill job details:
   - Title, Description, Requirements
   - Salary range, Location
   - Employment type, Experience level
4. Publish job

**Expected**: Job posted + pending approval

#### **B. Applicant Management**
1. Go to **"Job Applications"**
2. View applicants for posted jobs
3. Review CVs and profiles
4. Update application status

**Expected**: Applicant list + status management

---

## 🧪 API Testing

### **Direct API Calls**
```bash
# Health Check
curl http://localhost:4000/health

# Get Companies (Public)
curl http://localhost:4000/api/v1/companies

# Get Jobs (Public)  
curl http://localhost:4000/api/v1/jobs

# Login Test
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testdemo@example.com","password":"TestDemo123!"}'

# Protected Endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/v1/auth/me
```

---

## 📊 Performance Testing

### **Load Testing**
```bash
# Test concurrent requests
for i in {1..10}; do
  curl -s http://localhost:4000/api/v1/companies > /dev/null &
done
wait
echo "Load test completed"
```

### **Response Time Check**
```bash
# Measure API response time
time curl -s http://localhost:4000/api/v1/jobs > /dev/null
```

---

## 🐛 Troubleshooting

### **Common Issues**

1. **Port Already in Use**
   ```bash
   # Kill processes and restart
   pkill -f vite
   pkill -f node
   # Restart services
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   curl http://localhost:5001/health
   ```

3. **Frontend Not Loading**
   ```bash
   # Check service status
   netstat -tlnp | grep :5173
   # Restart frontend
   cd services/frontend-service && npm run dev
   ```

---

## 🎯 Success Criteria

### **✅ Demo Pass Criteria:**
- [ ] All 3 services running (ports 4000, 5001, 5173)
- [ ] Frontend loads without errors
- [ ] User can register and login
- [ ] Job listings display correctly
- [ ] Company profiles accessible
- [ ] API endpoints respond correctly
- [ ] Authentication flow works
- [ ] File upload functional
- [ ] Database operations successful

### **📈 Performance Benchmarks:**
- API Response Time: < 500ms
- Frontend Load Time: < 2 seconds
- Database Query Time: < 100ms
- Concurrent Users: 10+ without issues

---

## 🚀 Next Steps After Demo

1. **Production Deployment**
2. **SSL Certificate Setup**
3. **Database Optimization**
4. **Monitoring & Logging**
5. **User Acceptance Testing**
6. **Load Balancer Configuration**

---

**🎉 Happy Testing! Your CV Recruitment System is ready for demo!** 
---

# Database Documentation

> **Source**: `./database/README.md`

# 🗃️ Database Setup Guide

## Quick Start

### 1. Prerequisites
- PostgreSQL 12+ installed and running
- Node.js 16+ installed

### 2. Configuration
Copy and edit the database configuration:
```bash
# Database configuration is in database.env
# Default values work for local development
```

### 3. Setup Database
```bash
cd database

# Install dependencies
npm install

# First-time setup: Create database
node setup.js create-db

# Initialize with migrations and sample data
node setup.js init
```

## Commands

### Database Management
```bash
# Create database only (first-time setup)
node setup.js create-db

# Full initialization (migrations + seeds)
node setup.js init

# Run migrations only
node setup.js migrate

# Run seeds only (add sample data)
node setup.js seed

# Test database connection
node setup.js test

# Show database statistics
node setup.js stats

# Reset database (⚠️ DESTRUCTIVE)
node setup.js reset

# Show help
node setup.js help
```

## Configuration

### Environment Variables (database.env)
```env
# Database credentials
POSTGRES_USER=cv_user
POSTGRES_PASSWORD=cv_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=userdb

# Connection pool settings
DATABASE_MAX_CONNECTIONS=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=2000

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Database Schema

### Core Tables
- **users** - User accounts (candidates, recruiters, admins)
- **companies** - Company profiles
- **jobs** - Job postings
- **applications** - Job applications
- **candidate_cvs** - CV storage and metadata
- **tests** - Assessment tests
- **notifications** - System notifications

### AI/Vector Tables (New)
- **cv_embeddings** - CV vector embeddings for matching
- **job_embeddings** - Job description embeddings
- **vector_matches** - Precomputed CV-Job matches

### Features
- **UUID Primary Keys** - Distributed-friendly identifiers
- **pgvector Extension** - Vector similarity search for AI matching
- **Audit Trails** - created_at/updated_at timestamps
- **Comprehensive Indexes** - Optimized for recruitment workflows
- **Data Validation** - CHECK constraints for data integrity

## Migrations

Migrations are located in `migrations/` directory:
- `001_create_schema.sql` - Core tables and indexes
- `002_add_firebase_columns.sql` - Firebase integration
- `003_add_ai_embeddings_vector.sql` - AI/vector support

## Sample Data

Seeds are located in `seeds/` directory:
- `001_basic_data.sql` - Skills, cities, basic lookup data
- `002_sample_companies_jobs.sql` - Sample companies and job postings

## Troubleshooting

### Common Issues

#### 1. Database doesn't exist
```bash
# Run create-db first
node setup.js create-db
```

#### 2. PostgreSQL not running
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS with Homebrew
brew services start postgresql

# Windows
# Start PostgreSQL service from Services.msc
```

#### 3. Authentication failed
- Check username/password in `database.env`
- Ensure PostgreSQL user exists and has CREATE DATABASE privileges

#### 4. Connection refused
- Check if PostgreSQL is running
- Verify host/port settings
- Check firewall settings

### Create PostgreSQL User
```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create user and database
CREATE USER cv_user WITH PASSWORD 'cv_password';
CREATE DATABASE userdb OWNER cv_user;
GRANT ALL PRIVILEGES ON DATABASE userdb TO cv_user;

-- Grant necessary permissions
ALTER USER cv_user CREATEDB;
```

## Development

### Adding New Migrations
1. Create new file: `migrations/00X_description.sql`
2. Follow naming convention: sequential numbers
3. Include rollback instructions in comments
4. Test thoroughly before committing

### Database Reset
⚠️ **WARNING**: This will delete ALL data!
```bash
node setup.js reset
```

## Production Notes

### Environment Variables
Set these in production:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
LOG_LEVEL=error
```

### Security
- Use strong passwords
- Enable SSL connections
- Restrict database user permissions
- Regular backups

### Performance
- Monitor connection pool usage
- Add indexes for new query patterns
- Regular VACUUM and ANALYZE
- Consider read replicas for heavy loads 
---

# Database Sample Data Guide

> **Source**: `./database/SAMPLE_DATA_GUIDE.md`

# Sample Data Guide - Companies & Jobs

## Overview
This guide contains sample data for 3 companies and their corresponding job postings that can be used for testing the recruitment system APIs.

## Files Created
- `002_sample_companies_jobs.sql` - SQL script to insert sample data
- `sample_data.json` - JSON format of the same data for easy reference

## Sample Data Structure

### 3 Companies
1. **Tech Solutions Inc.** (Information Technology)
   - Tax Code: 0123456789
   - Size: 201-500 employees
   - Location: District 1, Ho Chi Minh City
   - Established: 2010

2. **Innovate Tech Vietnam** (Software Development)
   - Tax Code: 0234567890
   - Size: 51-200 employees  
   - Location: District 2, Ho Chi Minh City
   - Established: 2018

3. **Digital Corp Asia** (Digital Marketing)
   - Tax Code: 0345678901
   - Size: 11-50 employees
   - Location: District 7, Ho Chi Minh City
   - Established: 2020

### 3 Job Postings
1. **Senior Full Stack Developer** at Tech Solutions Inc.
   - Salary: 25-35M VND
   - Experience: Senior level (4-8 years)
   - Type: Full-time, Hybrid
   - Skills: React.js, Node.js, PostgreSQL, TypeScript, AWS

2. **Mobile App Developer (React Native)** at Innovate Tech Vietnam
   - Salary: 18-28M VND
   - Experience: Middle level (2-5 years)
   - Type: Full-time, Onsite
   - Skills: React Native, TypeScript, React.js

3. **Digital Marketing Specialist** at Digital Corp Asia
   - Salary: 15-22M VND
   - Experience: Middle level (2-4 years)
   - Type: Full-time, Hybrid
   - Skills: Google Ads, Google Analytics, SEO

### 3 Recruiters
- **Nguyễn Thị Mai** (hr@techsolutions.com) - Senior HR Manager at Tech Solutions
- **Trần Văn Nam** (recruiter@innovatetech.com) - Technical Recruiter at Innovate Tech
- **Lê Thị Hoa** (hiring@digitalcorp.com) - Talent Acquisition Lead at Digital Corp

## How to Load Sample Data

### Method 1: Using Database Setup Script
```bash
cd database
npm install  # Install dependencies if not done
node setup.js seed
```

### Method 2: Direct SQL Execution
Execute the SQL file directly in your PostgreSQL database:
```sql
\i /path/to/database/seeds/002_sample_companies_jobs.sql
```

### Method 3: Manual API Testing
Use the JSON data in `sample_data.json` to manually test the APIs:

#### Create Companies (POST /api/v1/companies)
```json
{
  "company_name": "Tech Solutions Inc.",
  "company_description": "A leading technology solutions provider",
  "company_website": "https://techsolutions.com",
  "company_email": "contact@techsolutions.com",
  "company_phone": "+84 123 456 789",
  "company_address": "123 Tech Street, Ho Chi Minh City",
  "industry": "Information Technology",
  "company_size": "201-500",
  "company_logo_url": "https://techsolutions.com/logo.png",
  "tax_code": "0123456789",
  "founded_year": 2010
}
```

#### Create Jobs (POST /api/v1/jobs)
```json
{
  "title": "Senior Full Stack Developer",
  "description": "We are seeking a highly skilled Senior Full Stack Developer...",
  "requirements": "Bachelor's degree in Computer Science or related field...",
  "benefits": "Competitive salary range 25-35M VND...",
  "employment_type": "FULL_TIME",
  "remote_work_option": "HYBRID",
  "salary_min": 25000000,
  "salary_max": 35000000,
  "currency": "VND",
  "experience_level": "SENIOR",
  "status": "PUBLISHED"
}
```

## API Testing Endpoints

After loading the sample data, you can test these endpoints:

### Jobs API
- `GET /api/v1/jobs` - Get all jobs
- `GET /api/v1/jobs?search=React` - Search for React jobs
- `GET /api/v1/jobs?employment_type=FULL_TIME` - Filter by employment type
- `GET /api/v1/jobs?work_type=HYBRID` - Filter by work arrangement
- `GET /api/v1/jobs?status=PUBLISHED` - Filter by status

### Companies API
- `GET /api/v1/companies` - Get all companies
- `GET /api/v1/companies/{company_id}` - Get specific company
- `GET /api/v1/companies/{company_id}/jobs` - Get jobs by company

### Expected Response Format
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": [
    {
      "job_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "title": "Senior Full Stack Developer",
      "description": "We are seeking a highly skilled...",
      "requirements": "Bachelor's degree in Computer Science...",
      "benefits": "Competitive salary range 25-35M VND...",
      "employment_type": "FULL_TIME",
      "remote_work_option": "HYBRID",
      "salary_min": 25000000,
      "salary_max": 35000000,
      "currency": "VND",
      "experience_level": "SENIOR",
      "status": "PUBLISHED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

## Notes
- All sample data uses realistic Vietnamese job market information
- Salary ranges are in VND (Vietnamese Dong)
- All jobs are located in Ho Chi Minh City
- Skills and requirements match real job market demands
- Companies represent different industries and sizes

## Cleanup
To remove sample data:
```sql
DELETE FROM job_skills WHERE job_id IN (
  SELECT job_id FROM jobs j 
  JOIN companies c ON j.company_id = c.company_id 
  WHERE c.tax_code IN ('0123456789', '0234567890', '0345678901')
);

DELETE FROM jobs WHERE company_id IN (
  SELECT company_id FROM companies 
  WHERE tax_code IN ('0123456789', '0234567890', '0345678901')
);

DELETE FROM recruiter_profiles WHERE company_id IN (
  SELECT company_id FROM companies 
  WHERE tax_code IN ('0123456789', '0234567890', '0345678901')
);

DELETE FROM companies WHERE tax_code IN ('0123456789', '0234567890', '0345678901');

DELETE FROM users WHERE email IN (
  'hr@techsolutions.com', 
  'recruiter@innovatetech.com', 
  'hiring@digitalcorp.com'
);
```
---

# AI Services Overview

> **Source**: `./AI_SERVICES_README.md`

# 🤖 AI Services - API Keys Setup Guide

## Quick Start

### 🔑 Setup API Keys
```bash
cd services/ai-service

# Interactive setup (recommended)
./setup-api-keys.sh

# Test setup
./setup-api-keys.sh --skip-prompt
```

### 🚀 Start All Services
```bash
# Start all AI services
./start-all-services.sh

# Test services
curl http://localhost:8001/health  # JD-CV Matching
curl http://localhost:8002/health  # Question Generation  
curl http://localhost:8003/health  # CV Extraction
```

## 📋 API Keys Required

### Groq API (Recommended)
- **Purpose**: Fast AI inference for all services
- **Get key**: https://console.groq.com/keys
- **Models**: llama3-8b-8192, mixtral-8x7b-32768
- **Advantages**: Fast, cost-effective

### OpenAI API (Optional)
- **Purpose**: Advanced GPT models for complex reasoning
- **Get key**: https://platform.openai.com/api-keys
- **Models**: gpt-3.5-turbo, gpt-4
- **Use case**: Fallback or advanced features

## 🎯 Services Overview

### 1. JD-CV Matching Service (Port 8001)
- **Function**: Semantic matching between job descriptions and CVs
- **AI Model**: SentenceTransformers (384D embeddings)
- **API Keys**: Groq (for reasoning), OpenAI (fallback)
- **Database**: Uses `cv_embeddings`, `job_embeddings` tables

### 2. Question Generation Service (Port 8002)
- **Function**: Generate interview questions from job descriptions
- **AI Model**: Groq Llama3 or OpenAI GPT
- **API Keys**: Required (Groq or OpenAI)
- **Database**: Uses `tests`, `test_questions` tables

### 3. CV Extraction Service (Port 8003)
- **Function**: Extract and improve CV content from PDF files
- **AI Model**: Groq or OpenAI for content analysis
- **API Keys**: Required (Groq or OpenAI)
- **File Support**: PDF, DOC, DOCX

## 🔧 Manual Configuration

If you prefer manual setup:

```bash
# Edit each .env file directly
nano jd-cv-matching/.env
nano generating-and-evaluating-questions-for-test/.env
nano extract_and_improve_cv/.env

# Add these lines:
GROQ_API_KEY=your_actual_groq_key_here
OPENAI_API_KEY=your_actual_openai_key_here
```

## 🛠️ Scripts Reference

### Setup Scripts
- `./setup-api-keys.sh` - Interactive API keys setup
- `./update-api-keys.sh` - Programmatic API keys update
- `./start-all-services.sh` - Start all AI services
- `./stop-all-services.sh` - Stop all AI services

### Usage Examples
```bash
# Setup with specific keys
GROQ_API_KEY='gsk_...' OPENAI_API_KEY='sk-...' ./update-api-keys.sh

# Interactive setup
./setup-api-keys.sh

# Test mode (placeholders)
./setup-api-keys.sh --skip-prompt

# Help
./setup-api-keys.sh --help
```

## 🔒 Security Best Practices

### API Key Security
- ✅ Never commit `.env` files to git
- ✅ Use environment variables in production
- ✅ Regenerate keys if compromised
- ✅ Use separate keys for dev/staging/prod
- ❌ Don't share keys in chat/email
- ❌ Don't hardcode keys in source code

### Production Setup
```bash
# Use environment variables instead of .env files
export GROQ_API_KEY="your_key_here"
export OPENAI_API_KEY="your_key_here"

# Or use Docker secrets, Kubernetes secrets, etc.
```

## 🧪 Testing Without API Keys

For development/testing without real API keys:

```bash
# Use placeholder setup
./setup-api-keys.sh --skip-prompt

# Services will start but AI features will show errors
# Good for testing basic connectivity and database operations
```

## 📊 API Documentation

Once services are running:
- **JD-CV Matching**: http://localhost:8001/docs
- **Question Generation**: http://localhost:8002/docs
- **CV Extraction**: http://localhost:8003/docs

## 🆘 Troubleshooting

### Common Issues

#### 1. API Key Invalid
```bash
# Check if keys are set correctly
grep -E "(GROQ|OPENAI)" */\.env

# Update keys
./setup-api-keys.sh
```

#### 2. Services Not Starting
```bash
# Check logs
cat */logs/*.log

# Restart services
./stop-all-services.sh && ./start-all-services.sh
```

#### 3. Database Connection Issues
```bash
# Check database is running
psql -h localhost -U cv_user -d userdb -c "SELECT 1"

# Check environment
grep POSTGRES */\.env
```

## 🔗 Related Documentation
- [Main Setup Guide](services/ai-service/SETUP_GUIDE.md)
- [Database Setup](database/README.md)
- [Frontend Setup](services/frontend-service/README.md) 
---

# AI Services Setup Guide

> **Source**: `./services/ai-service/SETUP_GUIDE.md`

# 🤖 AI Services Setup Guide

## Overview
This directory contains 3 AI microservices that work with the main database (`userdb`):

1. **jd-cv-matching** (Port 8001) - Job Description & CV matching using vector embeddings
2. **generating-and-evaluating-questions-for-test** (Port 8002) - Generate and evaluate test questions
3. **extract_and_improve_cv** (Port 8003) - Extract and improve CV content

## 🚀 Quick Setup (Recommended)

### One-Command Setup
```bash
# Complete setup in one command
./ai-services.sh setup

# Start all services
./ai-services.sh start

# Check status
./ai-services.sh status
```

### Master Script Commands
```bash
./ai-services.sh setup      # Complete setup (cleanup + dependencies + api-keys)
./ai-services.sh start      # Start all AI services
./ai-services.sh stop       # Stop all AI services
./ai-services.sh restart    # Restart all services
./ai-services.sh status     # Check service status
./ai-services.sh test       # Test service health
./ai-services.sh logs       # View recent logs
./ai-services.sh help       # Show help
```

## 📋 Manual Setup (If needed)

### 1. Environment Configuration
Each service needs its own `.env` file. Copy from examples:

```bash
# For JD-CV Matching Service
cd jd-cv-matching
cp env.example .env

# For Question Generation Service  
cd ../generating-and-evaluating-questions-for-test
cp env.example .env

# For CV Extraction Service
cd ../extract_and_improve_cv  
cp env.example .env
```

### 1.1. Setup API Keys (Required for AI Features)
Use the interactive setup script:

```bash
# Interactive setup (recommended)
./setup-api-keys.sh

# Or with help
./setup-api-keys.sh --help

# Or set manually with specific keys
GROQ_API_KEY='gsk_...' OPENAI_API_KEY='sk-...' ./update-api-keys.sh

# Or skip for testing (uses placeholders)
./setup-api-keys.sh --skip-prompt
```

**Get your API keys from:**
- Groq: https://console.groq.com/keys (recommended for fast inference)
- OpenAI: https://platform.openai.com/api-keys (for GPT models)

### 2. Database Setup
All AI services connect to the main `userdb` database. Make sure:
- PostgreSQL is running
- Database `userdb` exists  
- User `cv_user` has access
- pgvector extension is installed (handled by migration 003)

### 3. Install Dependencies
Use the shared `ai_env` virtual environment:

```bash
# Create shared virtual environment (if not exists)
python3 -m venv ai_env
source ai_env/bin/activate

# Install all dependencies at once
pip install -r jd-cv-matching/requirements.txt
pip install -r generating-and-evaluating-questions-for-test/requirements.txt
pip install -r extract_and_improve_cv/requirements.txt

# Or install individually if needed
cd jd-cv-matching
pip install -r requirements.txt

cd ../generating-and-evaluating-questions-for-test
pip install -r requirements.txt

cd ../extract_and_improve_cv
pip install -r requirements.txt
```

### 4. Run Services

#### Option A: Start All Services at Once (Recommended)
```bash
# Use the automated startup script
./start-all-services.sh

# To stop all services
./stop-all-services.sh
```

#### Option B: Start Services Manually
Start each service in separate terminals:

```bash
# Terminal 1 - JD-CV Matching
cd jd-cv-matching
source ../ai_env/bin/activate
cd app
python main.py

# Terminal 2 - Question Generation  
cd generating-and-evaluating-questions-for-test
source ../ai_env/bin/activate
cd app
python main.py

# Terminal 3 - CV Extraction
cd extract_and_improve_cv
source ../ai_env/bin/activate
python main.py
```

## Service Details

### JD-CV Matching (Port 8001)
- **Function**: Semantic matching between job descriptions and CVs
- **Technology**: SentenceTransformers, pgvector
- **Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Database Tables**: Uses `cv_embeddings`, `job_embeddings`, `vector_matches`

### Question Generation (Port 8002)  
- **Function**: Generate test questions based on job requirements
- **Technology**: OpenAI GPT / Groq
- **Database Tables**: Uses `tests`, `test_questions`
- **Requirements**: OPENAI_API_KEY or GROQ_API_KEY

### CV Extraction (Port 8003)
- **Function**: Extract and improve CV content from files
- **Technology**: NLP parsing, AI improvement suggestions
- **Database Tables**: Uses `candidate_cvs`, `cvs`
- **Requirements**: OPENAI_API_KEY or GROQ_API_KEY

## Configuration Details

### Database Connection
All services use these environment variables:
```env
POSTGRES_USER=cv_user
POSTGRES_PASSWORD=cv_password  
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=userdb
```

### API Keys Required
- **OPENAI_API_KEY**: For GPT-based services (Question Generation, CV Improvement)
- **GROQ_API_KEY**: Alternative to OpenAI for faster inference

### Service Ports
- **8001**: JD-CV Matching
- **8002**: Question Generation
- **8003**: CV Extraction

## Integration with Main System

### API Gateway Integration
The API Gateway (port 4000) can proxy to AI services:
```javascript
// In api-gateway/server.js (currently commented out)
app.use('/api/ai/matching', proxy('http://localhost:8001'));
app.use('/api/ai/questions', proxy('http://localhost:8002'));  
app.use('/api/ai/cv', proxy('http://localhost:8003'));
```

### Business Service Integration
The Business Service calls AI services directly:
```javascript
// Example: CV-Job matching
const response = await fetch('http://localhost:8001/match', {
  method: 'POST',
  body: JSON.stringify({ cv_id, job_id })
});
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Check if PostgreSQL is running
- Verify credentials in `.env` file
- Ensure `userdb` database exists
- Check if migration 003 ran successfully (adds pgvector support)

#### 2. Missing API Keys
- Add OPENAI_API_KEY or GROQ_API_KEY to relevant `.env` files
- Get API keys from:
  - OpenAI: https://platform.openai.com/api-keys
  - Groq: https://console.groq.com/keys

#### 3. Port Conflicts
- Check if ports 8001, 8002, 8003 are available
- Modify SERVICE_PORT in `.env` if needed

#### 4. Model Download Issues
- First run downloads sentence-transformers models
- Ensure internet connection for initial setup
- Models are cached locally after first download

### Logs and Debugging
- Each service logs to console by default
- Set `LOG_LEVEL=debug` for verbose output
- Check individual service health endpoints:
  - http://localhost:8001/health
  - http://localhost:8002/health  
  - http://localhost:8003/health

## Development

### Adding New AI Services
1. Create new directory under `ai-service/`
2. Add `env.example` with required configuration
3. Create `requirements.txt` with Python dependencies
4. Implement FastAPI app with health endpoint
5. Update this guide with service details

### Database Schema
AI services use these tables (created by migration 003):
- `cv_embeddings` - Store CV vector embeddings
- `job_embeddings` - Store job description embeddings  
- `vector_matches` - Precomputed similarity scores
- Plus existing tables: `users`, `jobs`, `candidate_cvs`, `tests`

### Vector Search
Services use pgvector for similarity search:
```sql
-- Example: Find similar CVs
SELECT cv_id, 1 - (embedding <=> query_vector) as similarity
FROM cv_embeddings  
ORDER BY embedding <=> query_vector
LIMIT 10;
``` 
---

# JD-CV Matching Service

> **Source**: `./services/ai-service/jd-cv-matching/readme.md`

# AI Matching API (JD-CV Similarity)

API này cung cấp chức năng tính toán **độ tương đồng ngữ nghĩa giữa mô tả công việc (JD) và hồ sơ ứng viên (CV)** dựa trên các phần nội dung chính như mô tả bản thân, kỹ năng, kinh nghiệm, học vấn, dự án… Sử dụng mô hình `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.

## 🚀 Khởi chạy

### 1. Yêu cầu
- Python 3.10+
- PostgreSQL (đã có schema)
- Docker (chỉ dùng cho PostgreSQL nếu muốn)
- Đã cài `venv`, `uvicorn`, `fastapi`

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Chạy API

```bash
uvicorn app.main:app --reload
```

---

## 🧠 Các Endpoint chính

### 1. Tính toán độ tương đồng JD - CV

**[POST] /api/v1/ai/calculate-match**

Tính embedding cho CV & JD → tính similarity → lưu vào `vector_matches`.

**Request body:**

```json
{
  "cv_id": 123,
  "candidate_id": 456,
  "job_id": 789
}
```

**Response:**

```json
{
  "match_id": 1,
  "job_id": 789,
  "candidate_id": 456,
  "cv_id": 123,
  "overall_similarity": 0.8123,
  "mo_ta_ban_than_similarity": 0.79,
  "ky_nang_similarity": 0.85,
  "kinh_nghiem_similarity": 0.81,
  "hoc_van_similarity": 0.74,
  "du_an_similarity": 0.66
}
```

---

### 2. Tra cứu độ tương đồng cosine theo embedding (phụ)

**[GET] /api/v1/ai/similarity**

Trả về cosine similarity giữa CV và JD embedding đã lưu.

**Query params:**

- `cv_id` (int): ID CV
- `job_id` (int): ID Job
- `section_type` (str): Loại văn bản so sánh, ví dụ: `full_text`, `ky_nang`, `kinh_nghiem_lam_viec`, ...

**Example:**

```http
GET /api/v1/ai/similarity?cv_id=123&job_id=789&section_type=ky_nang
```

**Response:**

```json
{
  "cv_id": 123,
  "job_id": 789,
  "section_type": "ky_nang",
  "cosine_similarity": 0.8467
}
```

---

## 🧼 Tiền xử lý dữ liệu CV

- Xoá cụm: `"tôi"`, `"tôi là"`, `"i'm"`, `"i am"`, email, số điện thoại, tên riêng.
- Cắt thành nhiều đoạn nhỏ ≤ 128 tokens (mô hình giới hạn).
- Lấy trung bình embedding để đại diện toàn văn bản.

---

## 🗃️ Cơ sở dữ liệu liên quan

- `cv_embeddings`: lưu vector từng phần của CV
- `job_embeddings`: lưu vector JD
- `vector_matches`: lưu kết quả similarity

---

## 🛠 Dev contact

- API maintainer: BEE
- Email: bee29082004@example.com
- Mô hình: `paraphrase-multilingual-MiniLM-L12-v2`

---

## 📌 Ghi chú

- Nếu CV đã được lưu embedding rồi → API sẽ tự cập nhật (UPSERT).
- JD cũng sẽ được embedding nếu chưa có.

---

# Question Generation Service

> **Source**: `./services/ai-service/generating-and-evaluating-questions-for-test/readme.md`

# Hệ thống sinh và đánh giá câu hỏi phỏng vấn từ JD

Backend này cung cấp các API dùng AI để:
- Sinh câu hỏi phỏng vấn từ bản mô tả công việc (JD)
- Tùy chỉnh và lưu câu hỏi cho từng bài test
- Đánh giá câu trả lời của ứng viên bằng API Groq (LLaMA)

## 🚀 Công nghệ sử dụng
- **FastAPI** (Python 3.10+)
- **PostgreSQL** (chạy bằng Docker)
- **SQLAlchemy ORM**
- **LLaMA-3 thông qua Groq API**

---

## 🔧 Hướng dẫn cài đặt

### 1. Tạo môi trường ảo
```bash
cd thu_muc_du_an
python -m venv venv
source venv/bin/activate  # hoặc .\venv\Scripts\activate trên Windows
```

### 2. Cài thư viện cần thiết
```bash
pip install -r requirements.txt
```

### 3. Tạo file cấu hình `.env`
```env
DATABASE_URL=postgresql://cv_user:cv_password@localhost:5432/userdb
LLM_API_URL=https://api.groq.com/openai/v1/chat/completions
LLM_MODEL_NAME=llama3-8b-8192
GROQ_API_KEY=your_groq_api_key
```

### 4. Chạy PostgreSQL bằng Docker
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_DB=userdb \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  postgres:15
```

(Có thể thêm `pgvector` nếu cần embedding)
```bash
docker exec -it postgres bash
apt update && apt install -y postgresql-15-pgvector
psql -U cv_user -d userdb -c "CREATE EXTENSION vector;"
```

### 5. Khởi tạo bảng dữ liệu
```bash
python
>>> from app.db import Base, engine
>>> Base.metadata.create_all(bind=engine)
```

### 6. Khởi chạy server
```bash
uvicorn app.main:app --reload
```
Truy cập tại: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📘 Danh sách API chính

### Sinh câu hỏi
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/ai/generate-interview-questions` | Sinh câu hỏi từ 1 JD |
| POST | `/api/v1/ai/questions/bulk-generate` | Sinh câu hỏi từ nhiều JD |

### Tùy chỉnh câu hỏi
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/ai/customize-questions` | Tạo câu hỏi tùy chỉnh |
| PUT  | `/api/v1/ai/questions/{questionId}/customize` | Cập nhật nội dung câu hỏi |

### Mẫu câu hỏi & đánh giá
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET  | `/api/v1/ai/question-templates` | Lấy danh sách câu hỏi mẫu |
| POST | `/api/v1/ai/questions/validate` | Đánh giá câu trả lời của ứng viên |

---

# Frontend API Integration Guide

> **Source**: `./services/frontend-service/API_INTEGRATION_GUIDE.md`

# API Integration Guide

Hướng dẫn tích hợp API cho hệ thống CV Recruitment System

## Tổng quan

Đã tích hợp thành công các API từ business service vào frontend với phân quyền rõ ràng cho từng role:

- **Admin**: Quản lý người dùng, thống kê hệ thống, phê duyệt job
- **HR**: Quản lý công ty, job posting, ứng viên, test
- **Candidate**: Tìm job, apply, quản lý CV, làm test

## Cấu trúc API Services

### 1. Admin API (`adminApi`)

```typescript
import { adminApi } from '../services/adminApi';

// User Management
await adminApi.getAllUsers();
await adminApi.getUserById(userId);
await adminApi.updateUserStatus(userId, status);
await adminApi.deleteUser(userId);

// Job Management
await adminApi.getAllJobs();
await adminApi.getPendingJobs();
await adminApi.approveJob(jobId);
await adminApi.rejectJob(jobId);

// Statistics
await adminApi.getSystemStatistics();
await adminApi.getUserStatistics();
await adminApi.getApplicationStats();

// Export Functions
await adminApi.exportUsers();
await adminApi.exportApplications();
```

### 2. HR API (`hrApi`)

```typescript
import { hrApi } from '../services/hrApi';

// Company Management
await hrApi.createCompany(companyData);
await hrApi.updateCompany(companyId, companyData);
await hrApi.getCompanyById(companyId);

// Job Management
await hrApi.createJob(jobData);
await hrApi.updateJob(jobId, jobData);
await hrApi.getMyJobs();
await hrApi.deleteJob(jobId);

// Application Management
await hrApi.getJobApplications(jobId);
await hrApi.updateApplicationStatus(applicationId, status);
await hrApi.shortlistCandidate(applicationId);
await hrApi.rejectCandidate(applicationId);

// Test Management
await hrApi.createTest(testData);
await hrApi.assignTestToCandidate(testId, candidateId);
await hrApi.getTestResults(testId);
```

### 3. Candidate API (`candidateApi`)

```typescript
import { candidateApi } from '../services/candidateApi';

// Job Search
await candidateApi.getAllJobs();
await candidateApi.searchJobs(searchParams);
await candidateApi.getJobRecommendations();
await candidateApi.getLatestJobs();

// Application Management
await candidateApi.createApplication(applicationData);
await candidateApi.getMyApplications();
await candidateApi.withdrawApplication(applicationId);
await candidateApi.getMatchScore(jobId);

// CV Management
await candidateApi.uploadCV(cvData);
await candidateApi.getMyCVs();
await candidateApi.updateCV(cvId, cvData);
await candidateApi.deleteCV(cvId);

// Test Taking
await candidateApi.getMyTests();
await candidateApi.startTest(testId);
await candidateApi.submitTest(testId, answers);
await candidateApi.getTestResult(testId);
```

### 4. Auth API (`authApi`)

```typescript
import { authApi } from '../services/index';

await authApi.login(credentials);
await authApi.register(userData);
await authApi.logout();
await authApi.getCurrentUser();
await authApi.forgotPassword(email);
await authApi.resetPassword(token, password);
```

## Component Integration Examples

### Admin Dashboard

```typescript
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemStats, pendingJobs, userStats] = await Promise.all([
          adminApi.getSystemStatistics(),
          adminApi.getPendingJobs(),
          adminApi.getUserStatistics()
        ]);
        
        setStats({
          pendingJobs: pendingJobs.length,
          violatedAccounts: systemStats.violatedAccounts,
          newFeedback: systemStats.newFeedback
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Rest of component...
};
```

### HR Job Management

```typescript
import React, { useState, useEffect } from 'react';
import { hrApi } from '../services/hrApi';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);

  const createJob = async (jobData) => {
    try {
      const newJob = await hrApi.createJob(jobData);
      setJobs(prev => [...prev, newJob]);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await hrApi.updateJobStatus(jobId, status);
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  // Rest of component...
};
```

### Candidate Job Search

```typescript
import React, { useState, useEffect } from 'react';
import { candidateApi } from '../services/candidateApi';

const JobSearch = () => {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const searchJobs = async () => {
    try {
      const searchParams = {
        query: searchQuery,
        location: location,
        type: filters.employmentType
      };
      
      const results = await candidateApi.searchJobs(searchParams);
      setJobs(results);
    } catch (error) {
      console.error('Error searching jobs:', error);
    }
  };

  const applyToJob = async (jobId) => {
    try {
      await candidateApi.createApplication({
        jobId: jobId,
        coverLetter: 'Application submitted'
      });
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  // Rest of component...
};
```

## Error Handling

```typescript
import { handleApiError } from '../services/apiIntegration';

try {
  const result = await adminApi.getAllUsers();
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error);
  setError(errorMessage);
}
```

## Loading States

```typescript
import { createLoadingState } from '../services/apiIntegration';

const MyComponent = () => {
  const { loading, error, execute } = createLoadingState();

  const handleAction = async () => {
    try {
      const result = await execute(() => adminApi.getAllUsers());
      setData(result);
    } catch (err) {
      // Error is automatically handled
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Rest of component...
};
```

## Data Transformers

```typescript
import { transformJobData, transformUserData } from '../services/apiIntegration';

// Transform raw API data to component format
const jobs = rawJobsData.map(transformJobData);
const users = rawUsersData.map(transformUserData);
```

## Best Practices

### 1. Error Handling
- Luôn wrap API calls trong try-catch
- Sử dụng `handleApiError` utility cho error handling nhất quán
- Hiển thị error messages thân thiện với user

### 2. Loading States
- Hiển thị loading indicators cho các API calls
- Disable buttons/forms khi đang loading
- Sử dụng `createLoadingState` utility

### 3. Data Validation
- Validate data trước khi gửi API
- Transform data sử dụng utility functions
- Handle edge cases (empty data, missing fields)

### 4. Performance
- Cache API responses khi có thể
- Implement pagination cho large datasets
- Debounce search queries

### 5. Security
- Token sẽ tự động được thêm vào headers
- Handle 401/403 errors appropriately
- Không store sensitive data trong localStorage

## Component Updates Made

### Admin Components
- ✅ **Dashboard**: Tích hợp system statistics, pending jobs, user stats
- ✅ **JobListings**: Tích hợp job management với approve/reject functionality
- ✅ **Statistics**: Tích hợp real-time statistics
- ✅ **UserManagement**: Tích hợp CRUD operations cho users

### HR Components  
- ✅ **HrDashboard**: Tích hợp job stats, application stats
- ✅ **PostNewJob**: Tích hợp job creation API
- ✅ **JobManagement**: Tích hợp job CRUD operations
- ✅ **JobApplications**: Tích hợp application management
- ✅ **CompanyProfile**: Tích hợp company management

### Candidate Components
- ✅ **FindJobsDashboard**: Tích hợp job search và filtering
- ✅ **MyApplications**: Tích hợp application tracking
- ✅ **Profile**: Tích hợp profile management
- ✅ **TestManagement**: Tích hợp test taking
- ✅ **BrowseCompanies**: Tích hợp company browsing

## File Structure

```
services/
├── api.ts                 # Base API client
├── adminApi.ts           # Admin-specific APIs
├── hrApi.ts              # HR-specific APIs  
├── candidateApi.ts       # Candidate-specific APIs
├── index.ts              # Central exports + auth/notifications
├── apiIntegration.ts     # Utilities and helpers
├── apiHooks.ts           # React hooks for API
├── otpApi.ts             # OTP verification APIs
├── firebaseApi.ts        # Firebase/Social auth APIs
├── settingsApi.ts        # User/System settings APIs
├── messageApi.ts         # Chat/messaging APIs
├── feedbackApi.ts        # Support/feedback APIs
├── scheduleApi.ts        # Calendar/scheduling APIs
├── analyticsApi.ts       # Analytics/reporting APIs
├── emailApi.ts           # Email service APIs
└── health.api.ts         # Health check endpoints
```

## Bổ sung API Services

### 7. OTP API (`otpApi`)

```typescript
import { otpApi } from '../services/otpApi';

// Send OTP for verification
await otpApi.sendOTP(email, 'registration');
await otpApi.verifyOTP(email, code, 'registration');
await otpApi.getOTPStatus(email);
```

### 8. Firebase API (`firebaseApi`)

```typescript
import { firebaseApi } from '../services/firebaseApi';

// Social authentication
await firebaseApi.getConfig();
await firebaseApi.socialAuth('google', idToken);
await firebaseApi.linkAccount(idToken);
```

### 9. Settings API (`settingsApi`)

```typescript
import { settingsApi } from '../services/settingsApi';

// User preferences
await settingsApi.getUserSettings();
await settingsApi.updateNotificationSettings(settings);
await settingsApi.updateUserTheme('dark');
```

### 10. Message API (`messageApi`)

```typescript
import { messageApi } from '../services/messageApi';

// Chat functionality
await messageApi.getConversations();
await messageApi.sendMessage(conversationId, content);
await messageApi.createConversation([userId1, userId2]);
```

### 11. Feedback API (`feedbackApi`)

```typescript
import { feedbackApi } from '../services/feedbackApi';

// Support system
await feedbackApi.submitFeedback(feedbackData);
await feedbackApi.getMyFeedback();
await feedbackApi.getFAQs();
```

### 12. Schedule API (`scheduleApi`)

```typescript
import { scheduleApi } from '../services/scheduleApi';

// Interview scheduling
await scheduleApi.scheduleInterview(interviewData);
await scheduleApi.getAvailableSlots([userId], date);
await scheduleApi.getUpcomingEvents();
```

### 13. Analytics API (`analyticsApi`)

```typescript
import { analyticsApi } from '../services/analyticsApi';

// Reporting and analytics
await analyticsApi.getDashboardStats('month');
await analyticsApi.getJobAnalytics(jobId);
await analyticsApi.generateReport(reportConfig);
```

### 14. Email API (`emailApi`)

```typescript
import { emailApi } from '../services/emailApi';

// Email functionality
await emailApi.sendEmail(emailData);
await emailApi.sendTemplatedEmail(templateData);
await emailApi.getEmailHistory();
```

## React Hooks

### API Hooks Usage

```typescript
import { useApi, useMutation, useSearch, usePagination } from '../services/apiHooks';

// Data fetching hook
const { data, loading, error, refresh } = useApi(() => candidateApi.getAllJobs());

// Mutation hook for actions
const { mutate: createJob, loading: creating } = useMutation(hrApi.createJob);

// Search with debouncing
const { query, setQuery, results, loading: searching } = useSearch(
  candidateApi.searchJobs, 
  300
);

// Pagination
const { page, totalPages, nextPage, prevPage } = usePagination(1, 10);
```

### Component Example with Hooks

```typescript
import React from 'react';
import { useApi, useMutation } from '../services/apiHooks';
import { candidateApi } from '../services';

const JobSearch = () => {
  const { data: jobs, loading, error, refresh } = useApi(() => candidateApi.getAllJobs());
  const { mutate: applyToJob, loading: applying } = useMutation(candidateApi.createApplication);

  const handleApply = async (jobId: string) => {
    try {
      await applyToJob({ jobId, coverLetter: 'Application' });
      refresh(); // Refresh job list
    } catch (error) {
      console.error('Apply failed:', error);
    }
  };

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {jobs?.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <button 
            onClick={() => handleApply(job.id)}
            disabled={applying}
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

## Testing

Các API endpoints đã được test với business service backend. Tất cả endpoints đều sử dụng prefix `/api/v1/` và support authentication headers.

## Next Steps

1. Test integration với real backend data
2. Implement proper error boundaries
3. Add loading skeletons cho better UX
4. Implement caching strategies
5. Add analytics tracking for API usage
6. Setup API monitoring and alerting

---

**Note**: Tất cả API calls đã được configured để sử dụng authentication tokens và handle common errors. Components đã được updated để sử dụng real API data thay vì hardcoded mock data. 
---

# Job API Guide

> **Source**: `./services/frontend-service/JOB_API_GUIDE.md`

# Job API Integration Guide

Hướng dẫn này mô tả việc tích hợp và sử dụng các Job API endpoints trong ứng dụng CV2.

## 📋 Danh sách API Endpoints

### Quản lý Tin tuyển dụng (/api/v1/jobs)

| Method | Endpoint | Mô tả | Vai trò |
|--------|----------|--------|---------|
| GET | `/api/v1/jobs` | Lấy danh sách tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/search` | Tìm kiếm tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/latest` | Lấy các tin tuyển dụng mới nhất | Admin, HR, Candidate |
| GET | `/api/v1/jobs/stats` | Lấy thống kê tin tuyển dụng | Admin, HR, Candidate |
| GET | `/api/v1/jobs/my-jobs` | Lấy các tin tuyển dụng của tôi | HR |
| GET | `/api/v1/jobs/pending` | Lấy các tin tuyển dụng đang chờ duyệt | Admin |
| GET | `/api/v1/jobs/recommendations` | Lấy các tin tuyển dụng được đề xuất | Candidate |
| GET | `/api/v1/jobs/bookmarked` | Lấy các tin tuyển dụng đã lưu | Candidate |
| GET | `/api/v1/jobs/:id` | Lấy chi tiết tin tuyển dụng | Admin, HR, Candidate |
| POST | `/api/v1/jobs` | Tạo tin tuyển dụng mới | HR |
| PUT | `/api/v1/jobs/:id` | Cập nhật tin tuyển dụng | HR |
| PATCH | `/api/v1/jobs/:id/status` | Cập nhật trạng thái tin tuyển dụng | HR |
| DELETE | `/api/v1/jobs/:id` | Xóa tin tuyển dụng | HR |
| GET | `/api/v1/jobs/company/:companyId` | Lấy tin tuyển dụng theo công ty | Admin, HR, Candidate |
| POST | `/api/v1/jobs/:id/bookmark` | Lưu tin tuyển dụng | Candidate |
| DELETE | `/api/v1/jobs/:id/bookmark` | Bỏ lưu tin tuyển dụng | Candidate |
| POST | `/api/v1/jobs/:id/approve` | Phê duyệt tin tuyển dụng | Admin |
| POST | `/api/v1/jobs/:id/reject` | Từ chối tin tuyển dụng | Admin |

## 🏗️ Cấu trúc API Services

### 1. Admin API (`adminApi.ts`)
```javascript
import adminApi from '../services/adminApi';

// Lấy tất cả jobs
const jobs = await adminApi.getAllJobs();

// Tìm kiếm jobs
const searchResults = await adminApi.searchJobs({ keyword: 'developer' });

// Lấy jobs đang chờ duyệt
const pendingJobs = await adminApi.getPendingJobs();

// Phê duyệt job
await adminApi.approveJob(jobId);

// Từ chối job
await adminApi.rejectJob(jobId);
```

### 2. HR API (`hrApi.ts`)
```javascript
import hrApi from '../services/hrApi';

// Tạo job mới
const newJob = await hrApi.createJob({
  title: 'Frontend Developer',
  description: 'Job description',
  requirements: 'Requirements',
  location: 'Ho Chi Minh City',
  salary_min: 1000,
  salary_max: 2000,
  type: 'full-time'
});

// Lấy jobs của tôi
const myJobs = await hrApi.getMyJobs();

// Cập nhật job
await hrApi.updateJob(jobId, updatedData);

// Cập nhật trạng thái job
await hrApi.updateJobStatus(jobId, 'active');

// Xóa job
await hrApi.deleteJob(jobId);
```

### 3. Candidate API (`candidateApi.ts`)
```javascript
import candidateApi from '../services/candidateApi';

// Lấy tất cả jobs
const jobs = await candidateApi.getAllJobs();

// Tìm kiếm jobs
const searchResults = await candidateApi.searchJobs({ 
  keyword: 'react',
  location: 'Ho Chi Minh City'
});

// Lấy jobs được đề xuất
const recommendations = await candidateApi.getJobRecommendations();

// Lưu job vào bookmark
await candidateApi.addJobToFavorites(jobId);

// Lấy jobs đã bookmark
const favoriteJobs = await candidateApi.getFavoriteJobs();

// Bỏ bookmark
await candidateApi.removeJobFromFavorites(jobId);
```

## 🧪 Testing

### Chạy Integration Test

```javascript
// Import test class
import JobApiTester from './src/utils/jobApiTest.js';

// Tạo instance và chạy test
const tester = new JobApiTester();
await tester.runAllTests();
```

### Test trong Browser Console

```javascript
// Tải class vào window
new JobApiTester().runAllTests();
```

## 📝 Sử dụng trong Components

### Admin Components
```javascript
// services/frontend-service/src/components/admin/JobListings.tsx
import adminApi from '../../services/adminApi';

const fetchJobs = async () => {
  const jobsData = await adminApi.getAllJobs();
  setJobs(jobsData);
};

const handleApprove = async (jobId) => {
  await adminApi.approveJob(jobId);
  // Refresh jobs list
};
```

### HR Components
```javascript
// services/frontend-service/src/components/hr/PostNewJob.tsx
import hrApi from '../../services/hrApi';

const handleSubmit = async (jobData) => {
  await hrApi.createJob(jobData);
  // Redirect or show success
};
```

### Candidate Components
```javascript
// services/frontend-service/src/components/candidate/FindJobs.tsx
import candidateApi from '../../services/candidateApi';

const handleSearch = async (searchParams) => {
  const results = await candidateApi.searchJobs(searchParams);
  setSearchResults(results);
};

const handleBookmark = async (jobId) => {
  await candidateApi.addJobToFavorites(jobId);
  // Update UI
};
```

## 🔧 Error Handling

Tất cả API methods đều có error handling tích hợp:

```javascript
try {
  const jobs = await candidateApi.getAllJobs();
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

### Authentication Errors
Các endpoint yêu cầu authentication sẽ tự động xử lý lỗi 401/403:

```javascript
// candidateApi automatically handles auth errors
const favorites = await candidateApi.getFavoriteJobs(); 
// Returns { data: [] } if not authenticated
```

## 🌐 API Client Configuration

Base API client được cấu hình trong `services/api.ts`:

```javascript
// Tự động thêm prefix /api/v1
// Tự động xử lý authentication headers
// Tự động refresh token khi cần
```

## 📊 Response Format

Tất cả API responses đều tuân theo format:

```javascript
{
  success: boolean,
  message: string,
  data: any,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## 🚀 Best Practices

1. **Always handle errors**: Sử dụng try-catch cho tất cả API calls
2. **Check authentication**: Đảm bảo user đã đăng nhập cho protected endpoints
3. **Use loading states**: Show loading indicators khi gọi API
4. **Validate data**: Validate dữ liệu trước khi gửi API
5. **Cache wisely**: Implement caching cho data ít thay đổi

## 🔍 Debugging

Để debug API calls:

1. Check browser Network tab
2. Check console logs
3. Use the test script for endpoint validation
4. Verify authentication tokens

---

*Cập nhật lần cuối: [Date]* 
---

# Test API Integration Guide

> **Source**: `./services/frontend-service/TEST_API_INTEGRATION_GUIDE.md`

# Test API Integration Guide

## 📋 Overview

Test API đã được tích hợp hoàn chỉnh cho 3 roles với các permissions khác nhau:

- **🔴 Admin**: Full access - quản lý tất cả tests, override permissions
- **🟡 HR/Recruiter**: Create & manage own tests, assign to candidates, view results
- **🟢 Candidate**: Take assigned tests, view own results

## 🚀 API Services Setup

### Import Services
```typescript
import { testApi, hrApi, candidateApi, adminApi } from '../services';
```

## 👨‍💼 HR/Recruiter Functions

### Create New Test
```typescript
const createTest = async () => {
  const testData = {
    job_id: "123e4567-e89b-12d3-a456-426614174000",
    test_name: "JavaScript Developer Assessment",
    test_description: "Technical assessment for JavaScript developers",
    test_type: "MULTIPLE_CHOICE",
    time_limit: 90,
    passing_score: 75,
    is_active: true,
    questions: [
      {
        question_text: "What is the correct way to declare a variable in JavaScript?",
        question_type: "MULTIPLE_CHOICE",
        options: [
          "var x = 1;",
          "let x = 1;",
          "const x = 1;",
          "All of the above"
        ],
        correct_answer: "All of the above",
        points: 5
      }
    ]
  };

  try {
    const result = await hrApi.createTest(testData);
    console.log('Test created:', result);
  } catch (error) {
    console.error('Failed to create test:', error);
  }
};
```

### Get HR's Tests
```typescript
const getMyTests = async () => {
  try {
    const tests = await hrApi.getMyTests({
      page: 1,
      limit: 10,
      test_type: "MULTIPLE_CHOICE",
      is_active: true
    });
    console.log('My tests:', tests);
  } catch (error) {
    console.error('Failed to fetch tests:', error);
  }
};
```

### Assign Test to Candidate
```typescript
const assignTest = async (testId: string) => {
  try {
    const assignment = await hrApi.assignTestToCandidate(testId, {
      candidate_id: "123e4567-e89b-12d3-a456-426614174001",
      application_id: "123e4567-e89b-12d3-a456-426614174002"
    });
    console.log('Test assigned:', assignment);
  } catch (error) {
    console.error('Failed to assign test:', error);
  }
};
```

### View Test Results
```typescript
const getTestResults = async (testId: string) => {
  try {
    const results = await hrApi.getTestResults(testId, {
      page: 1,
      limit: 20,
      status: "COMPLETED"
    });
    console.log('Test results:', results);
  } catch (error) {
    console.error('Failed to get results:', error);
  }
};
```

### Get Test Statistics
```typescript
const getStats = async (testId: string) => {
  try {
    const stats = await hrApi.getTestStatistics(testId);
    console.log('Test statistics:', stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};
```

## 👨‍🎓 Candidate Functions

### Get My Assigned Tests
```typescript
const getMyTests = async () => {
  try {
    const myTests = await candidateApi.getMyTests({
      status: "ASSIGNED",
      page: 1,
      limit: 10
    });
    console.log('My assigned tests:', myTests);
  } catch (error) {
    console.error('Failed to fetch my tests:', error);
  }
};
```

### Start a Test
```typescript
const startTest = async (testId: string) => {
  try {
    const testSession = await candidateApi.startTest(testId);
    console.log('Test started:', testSession);
    // Navigate to test taking page
  } catch (error) {
    console.error('Failed to start test:', error);
  }
};
```

### Submit Test Answers
```typescript
const submitTest = async (testId: string) => {
  const answers = {
    "123e4567-e89b-12d3-a456-426614174004": "All of the above",
    "123e4567-e89b-12d3-a456-426614174005": "True",
    "123e4567-e89b-12d3-a456-426614174006": "JavaScript is a programming language..."
  };

  try {
    const result = await candidateApi.submitTest(testId, answers);
    console.log('Test submitted:', result);
    // Show success message and results
  } catch (error) {
    console.error('Failed to submit test:', error);
  }
};
```

### Save Test Progress (Auto-save)
```typescript
const saveProgress = async (testId: string, currentAnswers: Record<string, string>) => {
  try {
    await candidateApi.saveTestProgress(testId, currentAnswers);
    console.log('Progress saved');
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

// Auto-save every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (currentAnswers && Object.keys(currentAnswers).length > 0) {
      saveProgress(testId, currentAnswers);
    }
  }, 30000);

  return () => clearInterval(interval);
}, [testId, currentAnswers]);
```

### Get Test Result
```typescript
const getMyResult = async (testId: string) => {
  try {
    const result = await candidateApi.getMyTestResult(testId);
    console.log('My test result:', result);
  } catch (error) {
    console.error('Failed to get result:', error);
  }
};
```

## 👨‍💻 Admin Functions

### Get All Tests in System
```typescript
const getAllTests = async () => {
  try {
    const allTests = await adminApi.getAllTests({
      page: 1,
      limit: 50,
      search: "JavaScript",
      test_type: "MULTIPLE_CHOICE",
      is_active: true
    });
    console.log('All tests:', allTests);
  } catch (error) {
    console.error('Failed to fetch all tests:', error);
  }
};
```

### Override Test (Admin Emergency Action)
```typescript
const overrideTest = async (testId: string, candidateId: string) => {
  try {
    const result = await adminApi.overrideTestAssignment(testId, candidateId, 'reset');
    console.log('Test overridden:', result);
  } catch (error) {
    console.error('Failed to override test:', error);
  }
};
```

### Bulk Test Actions
```typescript
const bulkActions = async (testIds: string[]) => {
  try {
    const result = await adminApi.bulkTestAction('deactivate', testIds);
    console.log('Bulk action completed:', result);
  } catch (error) {
    console.error('Bulk action failed:', error);
  }
};
```

### Get Test Analytics
```typescript
const getAnalytics = async () => {
  try {
    const analytics = await adminApi.getTestAnalytics({
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      test_type: "MULTIPLE_CHOICE"
    });
    console.log('Test analytics:', analytics);
  } catch (error) {
    console.error('Failed to get analytics:', error);
  }
};
```

## 🎯 Component Integration Examples

### HR Test Management Component
```typescript
import React, { useState, useEffect } from 'react';
import { hrApi } from '../services';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const result = await hrApi.getMyTests({ page: 1, limit: 10 });
      setTests(result.data || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = async (testData: any) => {
    try {
      await hrApi.createTest(testData);
      fetchTests(); // Refresh list
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  return (
    <div className="test-management">
      <h2>My Tests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="test-list">
          {tests.map((test: any) => (
            <div key={test.test_id} className="test-item">
              <h3>{test.test_name}</h3>
              <p>{test.test_description}</p>
              <button onClick={() => handleAssignTest(test.test_id)}>
                Assign to Candidate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Candidate Test Taking Component
```typescript
import React, { useState, useEffect } from 'react';
import { candidateApi } from '../services';

const TestTaking: React.FC<{ testId: string }> = ({ testId }) => {
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    loadTest();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [testId]);

  const loadTest = async () => {
    try {
      const testData = await candidateApi.getAssignedTest(testId);
      setTest(testData);
      setTimeRemaining(testData.time_limit * 60); // Convert to seconds
    } catch (error) {
      console.error('Failed to load test:', error);
    }
  };

  const updateTimer = async () => {
    try {
      const timeData = await candidateApi.getTestTimeRemaining(testId);
      setTimeRemaining(timeData.remaining_seconds);
      
      if (timeData.remaining_seconds <= 0) {
        handleSubmit(); // Auto-submit when time runs out
      }
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    // Auto-save progress
    candidateApi.saveTestProgress(testId, newAnswers);
  };

  const handleSubmit = async () => {
    try {
      const result = await candidateApi.submitTest(testId, answers);
      console.log('Test submitted:', result);
      // Navigate to results page
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="test-taking">
      <div className="test-header">
        <h2>{test?.test_name}</h2>
        <div className="timer">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="questions">
        {test?.questions?.map((question: any, index: number) => (
          <div key={question.question_id} className="question">
            <h3>Question {index + 1}</h3>
            <p>{question.question_text}</p>
            
            {question.question_type === 'MULTIPLE_CHOICE' && (
              <div className="options">
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex}>
                    <input
                      type="radio"
                      name={question.question_id}
                      value={option}
                      onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button onClick={handleSubmit} className="submit-btn">
        Submit Test
      </button>
    </div>
  );
};
```

## 🔗 API Endpoints Reference

| Role | Method | Endpoint | Description |
|------|--------|----------|-------------|
| HR | POST | `/api/v1/tests` | Create new test |
| HR | GET | `/api/v1/tests/{id}` | Get test details (with answers) |
| HR | PUT | `/api/v1/tests/{id}` | Update test |
| HR | DELETE | `/api/v1/tests/{id}` | Delete test |
| HR | POST | `/api/v1/tests/{id}/assign` | Assign test to candidate |
| HR | GET | `/api/v1/tests/{id}/results` | Get test results |
| HR | GET | `/api/v1/tests/{id}/stats` | Get test statistics |
| Candidate | GET | `/api/v1/tests/my-tests` | Get assigned tests |
| Candidate | GET | `/api/v1/tests/{id}` | Get test details (no answers) |
| Candidate | POST | `/api/v1/tests/{id}/start` | Start test |
| Candidate | POST | `/api/v1/tests/{id}/submit` | Submit test answers |
| Candidate | POST | `/api/v1/tests/{id}/save-progress` | Save progress |
| Admin | GET | `/api/v1/admin/tests` | Get all tests |
| Admin | PUT | `/api/v1/admin/tests/{id}` | Update any test |
| Admin | DELETE | `/api/v1/admin/tests/{id}` | Delete any test |
| Admin | POST | `/api/v1/admin/tests/bulk-action` | Bulk operations |
| Admin | POST | `/api/v1/admin/tests/{id}/override` | Override test assignment |

## ⚠️ Error Handling

```typescript
const handleApiCall = async () => {
  try {
    const result = await hrApi.createTest(testData);
    // Success handling
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('Permission denied');
    } else if (error.response?.status === 404) {
      console.error('Test not found');
    } else {
      console.error('API call failed:', error.message);
    }
  }
};
```

## 🎉 Ready to Use!

All test API integrations are now ready and can be used in your components. Each role has appropriate permissions and access levels as specified in the API documentation.
---

# Nginx SSL Setup

> **Source**: `./nginx/ssl-setup.md`

# 🔐 SSL Certificate Setup for topcv.click

## 📋 Prerequisites

1. Domain `topcv.click` pointing to your server IP
2. Nginx installed and running
3. Port 80 and 443 open in firewall

## 🚀 Method 1: Let's Encrypt (Free SSL) - RECOMMENDED

### Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Generate SSL Certificate
```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Stop nginx temporarily 
sudo systemctl stop nginx

# Get certificate for topcv.click
sudo certbot certonly --standalone -d topcv.click -d www.topcv.click

# Certificates will be saved to:
# /etc/letsencrypt/live/topcv.click/fullchain.pem
# /etc/letsencrypt/live/topcv.click/privkey.pem
```

### Update Nginx Config
```bash
# Update SSL certificate paths in nginx.conf:
ssl_certificate /etc/letsencrypt/live/topcv.click/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/topcv.click/privkey.pem;
```

### Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🔧 Method 2: Self-signed Certificate (Development)

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/topcv.click.key \
  -out /etc/nginx/ssl/topcv.click.crt \
  -subj "/C=VN/ST=HaNoi/L=HaNoi/O=TopCV/CN=topcv.click"

# Set proper permissions
sudo chmod 600 /etc/nginx/ssl/topcv.click.key
sudo chmod 644 /etc/nginx/ssl/topcv.click.crt
```

## 🧪 Testing SSL Setup

```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Test SSL certificate
curl -I https://topcv.click
openssl s_client -connect topcv.click:443 -servername topcv.click
```

## 🎯 Final URLs After Setup

✅ **Production URLs:**
- `https://topcv.click` → Frontend
- `https://topcv.click/api/v1/auth/register` → API via Gateway
- `https://topcv.click/direct-api/api/v1/auth/register` → Direct Business Service
- `https://topcv.click/api-docs/` → Swagger UI
- `https://topcv.click/health` → Health check

✅ **Development URLs:**
- `http://localhost` → Frontend  
- `http://localhost/api/v1/jobs` → API via Gateway
- `http://localhost/direct/api/v1/jobs` → Direct Business Service

## 🔒 Security Features Enabled

- **HTTPS redirect**: All HTTP → HTTPS
- **Rate limiting**: 10 req/s for APIs, 5 req/s for auth
- **Security headers**: XSS, CSRF, clickjacking protection
- **SSL/TLS**: Modern protocols only (TLS 1.2+)
- **Gzip compression**: Better performance 
---

# Project Cleanup Summary

> **Source**: `./PROJECT_CLEANUP_SUMMARY.md`

# 🧹 Project Cleanup Summary

## 📊 Overview
The CV Recruitment project has been thoroughly cleaned and optimized to remove unnecessary files and reduce complexity.

## 🎯 Cleanup Results

### 📉 Size Reduction
- **Before**: 46M
- **After**: 45M
- **Reduction**: ~1M (2.2% reduction)

### 🗂️ Files Removed

#### 📋 Backup Files (4 files)
- `./services/ai-service/generating-and-evaluating-questions-for-test/requirements.txt.backup`
- `./services/ai-service/requirements.txt.old`
- `./services/ai-service/jd-cv-matching/requirements.txt.backup`
- `./services/ai-service/extract_and_improve_cv/requirements.txt.backup`

#### 📝 Excessive Log Files (18 files)
Business Service logs cleaned (kept only essential logs):
- ✅ Kept: `business-service.log`, `errors.log`, `database.log`
- 🗑️ Removed: 15+ individual controller/module logs

AI Service logs completely removed:
- `./services/ai-service/extract_and_improve_cv/logs/`
- `./services/ai-service/generating-and-evaluating-questions-for-test/logs/`
- `./services/ai-service/jd-cv-matching/logs/`

#### 📂 Editor Config Directories (2 directories)
- `./.cursor/` (Cursor editor configuration)
- `./.vscode/` (VS Code configuration)

#### 🗄️ Redundant SQL Files (2 files)
- `./services/ai-service/jd-cv-matching/sample_data.sql`
- `./services/ai-service/jd-cv-matching/schema.sql`

#### 🧪 Development Test Files (3 files)
- `./services/business-service/test-email.js`
- `./services/frontend-service/src/utils/cleanUnusedImports.js`
- `./services/frontend-service/src/utils/jobApiTest.js`

#### 📚 Outdated Documentation (3 files)
- `./services/frontend-service/TYPESCRIPT_ERRORS_ANALYSIS.md`
- `./services/frontend-service/TEST_PLAN_FE_API.md`
- `./services/frontend-service/JOB_API_AUDIT_RESULTS.md`

## 📁 Current Project Structure

### 🔍 Key Directories
```
DATN/
├── api-gateway/
├── database/
│   ├── logs/
│   ├── migrations/
│   └── seeds/
├── nginx/
└── services/
    ├── ai-service/
    ├── business-service/
    └── frontend-service/
```

### 📊 File Statistics
- **JavaScript files**: 52
- **Python files**: 15
- **SQL files**: 6
- **Documentation**: 11

## ✅ What Was Preserved

### 🔒 Critical Files Kept
- ✅ All source code files
- ✅ Database migrations (`001_*.sql`, `002_*.sql`, `003_*.sql`)
- ✅ Database seeds
- ✅ Package configurations (`package.json`, `requirements.txt`)
- ✅ Main documentation files
- ✅ Configuration files
- ✅ Essential log files for debugging

### 📚 Important Documentation Kept
- ✅ `README.md` files in key directories
- ✅ `DEMO_GUIDE.md`
- ✅ `SAMPLE_DATA_GUIDE.md`
- ✅ `API_INTEGRATION_GUIDE.md`
- ✅ `JOB_API_GUIDE.md`
- ✅ `SETUP_GUIDE.md`

## 🎯 Benefits Achieved

### 🚀 Improved Organization
1. **Cleaner Directory Structure**: Removed clutter and confusion
2. **Easier Navigation**: Less files to wade through
3. **Focused Development**: Only relevant files remain
4. **Reduced Maintenance**: Fewer files to manage

### 💡 Better Development Experience
1. **Faster File Search**: Less noise in search results
2. **Clearer Purpose**: Each file has a clear reason for existence
3. **Simplified Onboarding**: New developers see only what matters
4. **Better Git Performance**: Fewer files to track changes

### 🔧 Maintenance Benefits
1. **Unified Dependencies**: AI services now use shared requirements
2. **Centralized Configuration**: Shared config for AI services
3. **Streamlined Scripts**: Master script for all AI service operations
4. **Consistent Structure**: Standardized across all services

## 🔗 Related Optimizations

This cleanup was part of a broader optimization effort that included:

1. **AI Services Unification** (`services/ai-service/`):
   - ✅ Unified requirements file
   - ✅ Shared configuration
   - ✅ Master management script
   - ✅ Cleanup scripts

2. **Database Consolidation**:
   - ✅ Unified database schema
   - ✅ Consistent migrations
   - ✅ AI tables integrated into main DB

## 📋 Future Maintenance

### 🔄 Regular Cleanup Commands
```bash
# Project-wide cleanup
./cleanup-project.sh

# AI services specific cleanup
cd services/ai-service
./ai-services.sh cleanup

# Clear logs manually if needed
find . -name "*.log" -exec truncate -s 0 {} +
```

### 🚨 Files to Watch
Monitor these for potential bloat:
- Log files in `services/*/logs/`
- Python cache `__pycache__/`
- Node.js cache files
- Backup files created by editors

## ✨ Conclusion

The project is now significantly cleaner and more maintainable. All essential functionality is preserved while removing clutter that could confuse developers or slow down development workflows.

**Total files removed**: ~35 files and directories  
**Project health**: ✅ Excellent  
**Maintainability**: ✅ Significantly Improved 
---


---

## 📞 Support & Contact

For questions about this documentation or the CV Recruitment platform:

- **Project**: CV Recruitment Platform (DATN)
- **Generated**: $(date)
- **Total Sections**: 12
- **Source Files**: 12 markdown files

## 🔄 Regeneration

To regenerate this documentation after changes:

```bash
./merge-documentation.sh
```

---

**📘 End of Complete Documentation**

