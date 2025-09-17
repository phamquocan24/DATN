# 🚀 QUICK VPS DEPLOYMENT GUIDE

## ⏱️ **Thời gian:** 10-15 phút | **Difficulty:** Easy

### 📋 **Prerequisites**
- ✅ VPS với Ubuntu 20.04+ 
- ✅ Domain `recruitaihub.online` đã point về VPS
- ✅ Root access
- ✅ File DATN.zip đã upload

---

## 🎯 **OPTION 1: SUPER QUICK DEPLOY (KHUYẾN NGHỊ)**

### **1. Upload File Zip**
```bash
# SSH vào VPS
ssh root@your-vps-ip

# Upload file zip (tên gì cũng được: DATN.zip, DATN(new).zip, v.v.)
cd /opt

# Option A: Download trực tiếp (nếu có URL)
wget [your-file-url]/DATN.zip

# Option B: Upload qua SCP
scp "DATN(new).zip" root@your-vps-ip:/opt/

# Option C: Upload qua WinSCP/FileZilla
# Upload file zip vào thư mục /opt/
```

### **2. Smart Auto Deploy**
```bash
# OPTION A: Super Smart (Auto-detect & Deploy)
sudo ./deployment/smart-vps-deploy.sh

# OPTION B: Manual Quick Deploy
sudo ./deployment/quick-production-deploy.sh
```

**🎉 DONE!** Script sẽ tự động:
- Install dependencies (Node.js, Python, PostgreSQL, Nginx, PM2)
- Setup database với migrations
- Configure services với PM2
- Setup SSL certificate
- Configure firewall & security

---

## 🎯 **OPTION 2: EXISTING AUTOMATION**

### **1. Upload & Setup**
```bash
cd /opt
unzip DATN.zip
cd DATN
chmod +x deployment/*.sh
```

### **2. Run Original Automation**
```bash
sudo ./deployment/start-deployment.sh
# Chọn: 1) Full Auto Setup
```

---

## 🎯 **OPTION 3: DOCKER DEPLOY**

### **1. Quick Docker Deploy**
```bash
cd /opt/DATN
sudo ./deployment/start-deployment.sh
# Chọn: 3) Docker Deployment
```

---

## 🔧 **POST-DEPLOYMENT**

### **Service URLs:**
- 🌐 **Frontend:** https://recruitaihub.online
- 🔗 **API Gateway:** https://recruitaihub.online/api (Port 4000)
- 📚 **API Docs:** https://recruitaihub.online/api-docs

### **Management Commands:**
```bash
# Check all services
pm2 status

# View logs  
pm2 logs

# Restart service
pm2 restart business-service

# Health check
curl https://recruitaihub.online/api/health

# System health
/usr/local/bin/datn-health-check
```

### **Monitoring:**
- 📊 **Logs:** `/var/log/datn/`
- 🔍 **Health:** Auto-check every 5 minutes
- 🚨 **SSL:** Auto-renewal configured

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues:**

#### **Port conflicts:**
```bash
sudo netstat -tulpn | grep :5001
sudo kill -9 $(sudo lsof -t -i:5001)
```

#### **Database issues:**
```bash
sudo systemctl restart postgresql
sudo -u postgres psql -d userdb -c "SELECT 1;"
```

#### **SSL issues:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

#### **Service restart:**
```bash
pm2 restart all
sudo systemctl restart nginx
```

---

## 📞 **SUPPORT**

- **Logs:** `/var/log/datn-deployment.log`
- **Health Check:** `/usr/local/bin/datn-health-check`
- **PM2 Monitoring:** `pm2 monit`

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify:

- [ ] ✅ Frontend loads at `https://recruitaihub.online`
- [ ] ✅ API responds at `https://recruitaihub.online/api/health` 
- [ ] ✅ Database connection works
- [ ] ✅ SSL certificate valid
- [ ] ✅ All PM2 processes running
- [ ] ✅ User registration/login works
- [ ] ✅ Job posting/searching works
- [ ] ✅ CV upload works
- [ ] ✅ AI services respond

**🎉 Congratulations! Your CV Recruitment Platform is live!**
