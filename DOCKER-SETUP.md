# 🐳 Docker Setup Guide - DATN CV Recruitment Platform

> **Complete Docker containerization for the CV Recruitment Platform**

## 📋 Quick Start

### 1. Prerequisites
- **Docker** 20.10+ installed
- **Docker Compose** 2.0+ installed
- **4GB RAM** minimum
- **10GB disk space** for images and volumes

### 2. Setup Environment
```bash
# Copy environment template
cp env.example .env

# Edit with your API keys
nano .env
```

### 3. Test Configuration
```bash
# Run configuration test
./docker-test.sh
```

### 4. Start Services
```bash
# Build and start all services
docker-compose up -d --build

# View startup logs
docker-compose logs -f
```

### 5. Verify Services
```bash
# Check service status
docker-compose ps

# Test health endpoints
curl http://localhost:5173      # Frontend
curl http://localhost:4000/health   # API Gateway  
curl http://localhost:5001/health   # Business Service
curl http://localhost:8001/health   # AI Matching
curl http://localhost:8002/health   # AI Questions
curl http://localhost:8003/health   # AI CV Processing
```

## 🏗️ Architecture

### Services Overview
| Service | Port | Description | Dependencies |
|---------|------|-------------|--------------|
| **postgres** | 5432 | PostgreSQL 17 with pgvector | None |
| **business-service** | 5001 | Main API & Business Logic | postgres |
| **api-gateway** | 4000 | API Gateway & Routing | business-service |
| **frontend-service** | 5173 | React Frontend (Nginx) | None |
| **ai-matching-service** | 8001 | Job-CV Matching AI | postgres |
| **ai-cv-service** | 8003 | CV Processing AI | None |
| **ai-question-service** | 8002 | Question Generation AI | None |

### Network Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │ Business Service│
│   (React/Nginx) │────│   (Express)     │────│   (Express)     │
│   Port: 5173    │    │   Port: 4000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                       ┌─────────────────┐            │
                       │  PostgreSQL 17  │────────────┘
                       │   (pgvector)    │
                       │   Port: 5432    │
                       └─────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼────────┐    ┌────────▼───────┐
│ AI CV Service  │    │ AI Matching Svc  │    │ AI Question Svc│
│ (FastAPI)      │    │ (FastAPI)        │    │ (FastAPI)      │
│ Port: 8003     │    │ Port: 8001       │    │ Port: 8002     │
└────────────────┘    └──────────────────┘    └────────────────┘
```

## ⚙️ Configuration

### Required Environment Variables
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=userdb

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# AI Services (Required)
OPENAI_API_KEY=sk-your_openai_api_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here  # Optional alternative

# CORS (Update for production)
CORS_ORIGINS=http://localhost:5173,http://localhost:4000

# Frontend API URL
REACT_APP_API_URL=http://localhost:4000/api
```

### Optional Environment Variables
```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,jpg,jpeg,png
```

## 🚀 Development Workflow

### Daily Development
```bash
# Start services
docker-compose up -d

# View logs for specific service
docker-compose logs -f business-service
docker-compose logs -f frontend-service

# Restart specific service after code changes
docker-compose restart business-service
docker-compose up -d --build business-service

# Stop all services
docker-compose down
```

### Debugging
```bash
# Execute commands in running container
docker-compose exec business-service bash
docker-compose exec postgres psql -U postgres -d userdb

# View container resource usage
docker stats

# Clean up unused resources
docker system prune -f
docker volume prune -f
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d userdb

# Backup database
docker-compose exec postgres pg_dump -U postgres userdb > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d userdb

# View database logs
docker-compose logs postgres
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :5001

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:5001)

# Or change port in docker-compose.yml
```

#### 2. Build Failures
```bash
# Clean build cache
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down -v
docker-compose up -d --build
```

#### 3. Database Connection Issues
```bash
# Check postgres health
docker-compose exec postgres pg_isready -U postgres

# Reset database volume
docker-compose down -v
docker volume rm datn_postgres_data
docker-compose up -d
```

#### 4. AI Services Not Starting
```bash
# Check environment variables
docker-compose exec ai-matching-service env | grep API_KEY

# View detailed logs
docker-compose logs ai-matching-service
```

#### 5. Frontend Build Issues
```bash
# Check build arguments
docker-compose config

# Rebuild with verbose output
docker-compose build --no-cache frontend-service
```

### Health Checks
```bash
# All services status
docker-compose ps

# Individual health checks
curl -f http://localhost:5173 && echo "Frontend OK"
curl -f http://localhost:4000/health && echo "API Gateway OK"
curl -f http://localhost:5001/health && echo "Business Service OK"
curl -f http://localhost:8001/health && echo "AI Matching OK"
curl -f http://localhost:8002/health && echo "AI Questions OK"
curl -f http://localhost:8003/health && echo "AI CV OK"
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Container logs with timestamps
docker-compose logs -t -f

# Disk usage
docker system df
```

## 📊 Production Deployment

### Production Configuration
```bash
# Use production environment file
cp deployment/production.env .env

# Update domains and SSL
REACT_APP_API_URL=https://yourdomain.com/api
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Use production compose file
docker-compose -f deployment/docker-compose.yml up -d --build
```

### Security Considerations
- Change default database passwords
- Use strong JWT secrets (32+ characters)
- Configure proper CORS origins
- Set up SSL certificates
- Use environment-specific API keys
- Enable firewall rules for production

### Scaling
```bash
# Scale specific services
docker-compose up -d --scale business-service=2
docker-compose up -d --scale ai-matching-service=2

# Use Docker Swarm for production scaling
docker swarm init
docker stack deploy -c docker-compose.yml datn-stack
```

## 🔗 Useful Commands

### Docker Compose Commands
```bash
# Build specific service
docker-compose build business-service

# Start in background
docker-compose up -d

# Follow logs for all services
docker-compose logs -f

# Stop and remove containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Update and restart services
docker-compose pull && docker-compose up -d
```

### Docker Commands
```bash
# List all containers
docker ps -a

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

## 📞 Support

### Getting Help
1. **Check logs**: `docker-compose logs -f [service-name]`
2. **Test configuration**: `./docker-test.sh`
3. **Verify health**: `curl http://localhost:PORT/health`
4. **Check resources**: `docker stats`

### Common URLs
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:4000/api-docs (if available)
- **Health Checks**: http://localhost:PORT/health

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| **Start all services** | `docker-compose up -d` |
| **View logs** | `docker-compose logs -f` |
| **Restart service** | `docker-compose restart SERVICE_NAME` |
| **Rebuild service** | `docker-compose up -d --build SERVICE_NAME` |
| **Stop all** | `docker-compose down` |
| **Clean rebuild** | `docker-compose down && docker-compose up -d --build` |
| **Database access** | `docker-compose exec postgres psql -U postgres -d userdb` |
| **Service shell** | `docker-compose exec SERVICE_NAME bash` |

**🎉 Happy containerizing!** 🐳
