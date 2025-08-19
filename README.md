# 📘 CV Recruitment Platform (DATN)

> **Hệ thống tuyển dụng thông minh sử dụng AI**

## 🚀 Quick Start

### 📚 Complete Documentation
Tất cả tài liệu hướng dẫn đã được gộp vào một file duy nhất:

```bash
# Xem toàn bộ documentation
cat COMPLETE_DOCUMENTATION.md

# Hoặc mở bằng markdown viewer
code COMPLETE_DOCUMENTATION.md  # VS Code
```

### 🔧 Setup & Run

#### 1. Database Setup
```bash
cd database
node setup.js init      # Create database and run migrations
node setup.js seed      # Add sample data
```

#### 2. AI Services
```bash
cd services/ai-service
./ai-services.sh setup  # Complete AI services setup
./ai-services.sh start  # Start all AI services
```

#### 3. Business Service
```bash
cd services/business-service
npm install
npm start
```

#### 4. Frontend
```bash
cd services/frontend-service
npm install
npm run dev
```

#### 5. API Gateway
```bash
cd api-gateway
npm install
npm start
```

## 🏗️ Architecture

```
DATN/
├── 📄 COMPLETE_DOCUMENTATION.md  # 📚 ALL DOCUMENTATION HERE
├── 🗄️ database/                   # PostgreSQL setup & migrations
├── 🌐 api-gateway/                # API Gateway (Port 3000)
├── ⚙️ nginx/                      # Nginx configuration
└── 🔧 services/
    ├── 🤖 ai-service/             # AI Services (Ports 8001-8003)
    ├── 💼 business-service/       # Main API (Port 5000)
    └── 🎨 frontend-service/       # React App (Port 5173)
```

## 🎯 Key Features

- **🤖 AI-Powered**: CV-Job matching, Question generation, CV improvement
- **🔐 Secure**: JWT authentication, Role-based authorization
- **📊 Analytics**: Real-time dashboards for HR and Admin
- **📱 Responsive**: Modern React UI with Tailwind CSS
- **🚀 Scalable**: Microservices architecture
- **🗄️ Unified DB**: Single PostgreSQL with vector embeddings

## 📊 Services Status

Check all services:
```bash
# AI Services
cd services/ai-service && ./ai-services.sh status

# All services health check
curl http://localhost:3000/health  # API Gateway
curl http://localhost:5000/health  # Business Service
curl http://localhost:5173         # Frontend
```

## 🛠️ Maintenance

### Clean Project
```bash
./cleanup-project.sh  # Remove unnecessary files
```

### Regenerate Documentation
```bash
./merge-documentation.sh  # Merge all .md files again
```

### AI Services Management
```bash
cd services/ai-service
./ai-services.sh help  # See all commands
```

## 📞 Support

- **📄 Full Documentation**: `COMPLETE_DOCUMENTATION.md`
- **🔧 Scripts**: Use `.sh` scripts for automation
- **🐛 Issues**: Check logs in `services/*/logs/`

---

**🎓 DATN Project - CV Recruitment Platform**  
*Tất cả documentation chi tiết trong file `COMPLETE_DOCUMENTATION.md`* 
