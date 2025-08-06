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