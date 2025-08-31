# ✅ **DEPLOYMENT CHECKLIST - DATN CV RECRUITMENT**

## 📋 **PRE-DEPLOYMENT**

### **VPS Requirements:**
- [ ] Ubuntu 20.04+ 
- [ ] Min 4GB RAM, 50GB SSD
- [ ] Root access
- [ ] Public IP address

### **Domain Setup:**
- [ ] Domain `recruitaihub.online` purchased
- [ ] DNS A record pointing to VPS IP
- [ ] DNS propagated (check with `nslookup recruitaihub.online`)

### **Files Prepared:**
- [ ] ✅ Port configuration fixed (Business Service: 5001)
- [ ] ✅ Environment files ready
- [ ] ✅ PM2 ecosystem configured
- [ ] ✅ Nginx config prepared
- [ ] ✅ SSL setup automated
- [ ] ✅ Quick deploy script ready

---

## 🚀 **DEPLOYMENT PROCESS**

### **Step 1: Upload & Extract** (2 mins)
- [ ] Upload DATN.zip to `/opt/` 
- [ ] Extract: `unzip DATN.zip && cd DATN`
- [ ] Set permissions: `chmod +x deployment/*.sh`

### **Step 2: Quick Deploy** (10-15 mins)
- [ ] Run: `sudo ./deployment/quick-production-deploy.sh`
- [ ] Monitor output for errors
- [ ] Wait for completion message

### **Step 3: Verification** (2 mins)
- [ ] Check PM2: `pm2 status`
- [ ] Test API: `curl http://localhost:5001/health`
- [ ] Test Frontend: `curl http://localhost:5173`
- [ ] Test SSL: `curl https://recruitaihub.online`

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### **Service Health:**
- [ ] ✅ API Gateway (Port 4000): `curl localhost:4000/health`
- [ ] ✅ Business Service (Port 5001): `curl localhost:5001/health`  
- [ ] ✅ Frontend (Port 5173): `curl localhost:5173`
- [ ] ✅ AI CV Service (Port 8003): `curl localhost:8003/health`
- [ ] ✅ AI Matching (Port 8001): `curl localhost:8001/health`
- [ ] ✅ AI Questions (Port 8002): `curl localhost:8002/health`

### **Database:**
- [ ] ✅ PostgreSQL running: `systemctl status postgresql`
- [ ] ✅ Database accessible: `sudo -u postgres psql -d userdb -c "SELECT 1;"`
- [ ] ✅ Tables created: `sudo -u postgres psql -d userdb -c "\\dt"`

### **External Access:**
- [ ] ✅ Frontend loads: https://recruitaihub.online
- [ ] ✅ API responds: https://recruitaihub.online/api/health
- [ ] ✅ SSL valid: Check browser lock icon
- [ ] ✅ API Docs: https://recruitaihub.online/api-docs

### **Functionality Test:**
- [ ] ✅ User registration works
- [ ] ✅ User login works  
- [ ] ✅ Job search works
- [ ] ✅ Job posting works (HR)
- [ ] ✅ CV upload works
- [ ] ✅ Application submission works
- [ ] ✅ Admin dashboard accessible

---

## 🛠️ **PRODUCTION MANAGEMENT**

### **Process Management:**
```bash
pm2 status              # Check all services
pm2 logs                # View real-time logs
pm2 restart all         # Restart all services
pm2 monit               # Real-time monitoring UI
pm2 save                # Save current configuration
```

### **System Management:**
```bash
systemctl status nginx          # Check Nginx
systemctl status postgresql     # Check Database
ufw status                      # Check Firewall
certbot certificates            # Check SSL
```

### **Health Monitoring:**
```bash
/usr/local/bin/datn-health-check    # Manual health check
tail -f /var/log/datn-health.log    # Auto health logs
htop                                # System resources
```

### **Log Files:**
- **Deployment:** `/var/log/datn-deployment.log`
- **Health:** `/var/log/datn-health.log`
- **Services:** `/var/log/datn/`
- **Nginx:** `/var/log/nginx/`

---

## 🆘 **EMERGENCY PROCEDURES**

### **Quick Restart:**
```bash
pm2 restart all
systemctl restart nginx
systemctl restart postgresql
```

### **Rollback:**
```bash
# Stop services
pm2 stop all

# Restore previous version
cp /opt/backup/DATN-previous.zip /opt/
cd /opt && unzip -o DATN-previous.zip

# Restart
pm2 start ecosystem.config.js
```

### **Database Backup:**
```bash
sudo -u postgres pg_dump userdb > /opt/backup/userdb_$(date +%Y%m%d_%H%M).sql
```

---

## 📞 **SUPPORT CONTACTS**

- **Server Admin:** [Your contact]
- **Developer:** [Developer contact]  
- **Domain Provider:** [Domain support]
- **VPS Provider:** [VPS support]

---

## 🎯 **SUCCESS CRITERIA**

✅ **Deployment is successful when:**
- All 6 services running in PM2
- Frontend accessible via HTTPS
- API endpoints responding  
- Database connected and seeded
- SSL certificate valid
- User registration/login functional
- Core features (jobs, applications, CV) working

**🎉 Your CV Recruitment Platform is live and ready for users!**
