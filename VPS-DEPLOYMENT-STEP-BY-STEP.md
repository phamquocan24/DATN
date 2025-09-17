# 🚀 **VPS DEPLOYMENT - STEP BY STEP GUIDE**

## 📋 **Prerequisites**
- ✅ VPS Ubuntu 20.04+ (Min 4GB RAM, 50GB SSD)
- ✅ Domain `recruitaihub.online` đã point về VPS IP
- ✅ Root access SSH
- ✅ File `DATN(new).zip` ready to upload

---

## 📝 **STEP 1: UPLOAD FILE LÊN VPS**

### **Option A: Upload qua SCP (Recommended)**

```bash
# Từ máy local (Windows)
# Mở Command Prompt hoặc PowerShell
scp "D:\CMC_DATN\DATN(new)\DATN(new).zip" root@YOUR_VPS_IP:/opt/

# Nhập password khi được hỏi
```

### **Option B: Upload qua WinSCP/FileZilla**

1. **Mở WinSCP hoặc FileZilla**
2. **Connect tới VPS:**
   - Host: `YOUR_VPS_IP`
   - User: `root`
   - Password: `YOUR_ROOT_PASSWORD`
3. **Navigate to `/opt/` folder**
4. **Drag & drop** file `DATN(new).zip` vào `/opt/`

### **Option C: Upload qua wget (nếu có URL)**

```bash
# SSH vào VPS trước
ssh root@YOUR_VPS_IP

# Download file
cd /opt
wget "YOUR_FILE_URL/DATN(new).zip"
```

---

## 🖥️ **STEP 2: SSH VÀO VPS**

```bash
# Từ máy local
ssh root@YOUR_VPS_IP

# Nhập password
# Sau khi vào VPS, check file đã upload chưa
ls -la /opt/
# Phải thấy file DATN(new).zip
```

---

## 🚀 **STEP 3: CHẠY DEPLOYMENT**

### **Option A: Super Smart Deploy (Khuyến nghị)**

```bash
# Tại VPS, chạy smart script
cd /opt
# Extract để có script
unzip -q "DATN(new).zip"
cd "DATN(new)"

# Make scripts executable
chmod +x deployment/*.sh

# Run smart deployment
sudo ./deployment/smart-vps-deploy.sh
```

### **Option B: Manual Deploy**

```bash
# Tại VPS
cd /opt
unzip -q "DATN(new).zip"
cd "DATN(new)"
chmod +x deployment/*.sh

# Run quick deploy
sudo ./deployment/quick-production-deploy.sh
```

---

## ⏱️ **STEP 4: CHỜ DEPLOYMENT HOÀN TẤT**

**Thời gian:** 10-15 phút

Script sẽ tự động:
- ✅ Install Node.js, Python, PostgreSQL, Nginx, PM2
- ✅ Setup database với migrations
- ✅ Install dependencies cho tất cả services
- ✅ Build frontend
- ✅ Configure PM2 process management
- ✅ Setup Nginx reverse proxy
- ✅ Generate SSL certificate
- ✅ Configure firewall & security
- ✅ Start all services

**Monitor output để đảm bảo không có errors!**

---

## ✅ **STEP 5: VERIFICATION**

### **5.1. Check Services Status**
```bash
# Check PM2 processes
pm2 status

# Should see:
# - api-gateway (Port 4000)
# - business-service (Port 5001) 
# - frontend-service (Port 5173)
# - ai-cv-service (Port 8003)
# - ai-matching-service (Port 8001)
# - ai-question-service (Port 8002)
```

### **5.2. Test Service Health**
```bash
# API Gateway
curl http://localhost:4000/health

# Business Service
curl http://localhost:5001/health

# Frontend
curl http://localhost:5173

# All services health check
/usr/local/bin/datn-health-check
```

### **5.3. Test External Access**
```bash
# Test HTTPS
curl https://recruitaihub.online

# Test API
curl https://recruitaihub.online/api/health

# Test API Docs
curl https://recruitaihub.online/api-docs
```

### **5.4. Browser Testing**
1. **Open browser:** https://recruitaihub.online
2. **Should see:** CV Recruitment Platform homepage
3. **Test registration/login**
4. **Check API docs:** https://recruitaihub.online/api-docs

---

## 🎯 **SUCCESS CRITERIA**

✅ **Deployment successful when:**
- All 6 PM2 processes running
- Frontend loads via HTTPS
- API endpoints responding
- SSL certificate valid
- Database connected
- User registration works

---

## 🆘 **TROUBLESHOOTING**

### **Problem: Port conflicts**
```bash
# Check what's using ports
sudo netstat -tulpn | grep :4000
sudo netstat -tulpn | grep :5001

# Kill conflicting processes
sudo kill -9 $(sudo lsof -t -i:4000)
```

### **Problem: Services not starting**
```bash
# Check PM2 logs
pm2 logs

# Restart all services
pm2 restart all

# Check system logs
journalctl -f
```

### **Problem: Database issues**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d userdb -c "SELECT 1;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### **Problem: SSL issues**
```bash
# Check certificates
sudo certbot certificates

# Test SSL renewal
sudo certbot renew --dry-run

# Check Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### **Problem: Firewall blocking**
```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 4000
sudo ufw allow 5001
sudo ufw allow 5173
```

---

## 🔧 **POST-DEPLOYMENT MANAGEMENT**

### **Service Management:**
```bash
pm2 status          # Check all services
pm2 restart all     # Restart all services
pm2 logs            # View logs
pm2 monit           # Monitoring UI
```

### **System Monitoring:**
```bash
htop                              # System resources
tail -f /var/log/datn-deployment.log  # Deployment logs
tail -f /var/log/datn/              # Service logs
```

### **Backup:**
```bash
# Database backup
sudo -u postgres pg_dump userdb > backup_$(date +%Y%m%d).sql

# Project backup
tar -czf datn-backup-$(date +%Y%m%d).tar.gz /opt/datn-recruitment/
```

---

## 📞 **SUPPORT INFORMATION**

- **Project Directory:** `/opt/datn-recruitment/`
- **Logs:** `/var/log/datn/`
- **Health Script:** `/usr/local/bin/datn-health-check`
- **PM2 Config:** `/opt/datn-recruitment/ecosystem.config.js`
- **Nginx Config:** `/etc/nginx/nginx.conf`

---

## 🎉 **DEPLOYMENT COMPLETE!**

**Your CV Recruitment Platform is now live at:**
- 🌐 **Frontend:** https://recruitaihub.online
- 🔗 **API:** https://recruitaihub.online/api
- 📚 **Docs:** https://recruitaihub.online/api-docs

**Next Steps:**
1. Test all functionality
2. Create admin accounts
3. Setup monitoring alerts
4. Configure regular backups
5. Train users on the platform

**🚀 Congratulations! Your production deployment is successful!**
