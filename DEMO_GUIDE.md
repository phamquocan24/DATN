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