# 📋 **DEPLOYMENT COMMANDS REFERENCE**

## 🚀 **QUICK DEPLOYMENT COMMANDS**

### **1. Upload File (Choose one method)**

#### **Method A: SCP Upload**
```bash
# From your local machine
scp "D:\CMC_DATN\DATN(new)\DATN(new).zip" root@YOUR_VPS_IP:/opt/
```

#### **Method B: Direct download (if you have URL)**
```bash
# SSH to VPS first
ssh root@YOUR_VPS_IP
cd /opt
wget "YOUR_FILE_URL/DATN(new).zip"
```

### **2. SSH to VPS**
```bash
ssh root@YOUR_VPS_IP
```

### **3. Deploy (Choose one method)**

#### **Method A: Super Smart Deploy**
```bash
cd /opt
unzip -q "DATN(new).zip"
cd "DATN(new)"
chmod +x deployment/*.sh
sudo ./deployment/smart-vps-deploy.sh
```

#### **Method B: Manual Deploy**  
```bash
cd /opt
unzip -q "DATN(new).zip"
cd "DATN(new)"
chmod +x deployment/*.sh
sudo ./deployment/quick-production-deploy.sh
```

---

## ✅ **VERIFICATION COMMANDS**

### **Check Services Status**
```bash
pm2 status
```

### **Health Checks**
```bash
# All services health
/usr/local/bin/datn-health-check

# Individual services
curl http://localhost:4000/health    # API Gateway
curl http://localhost:5001/health    # Business Service  
curl http://localhost:5173           # Frontend
curl http://localhost:8001/health    # AI Matching
curl http://localhost:8002/health    # AI Questions
curl http://localhost:8003/health    # AI CV
```

### **External Access Test**
```bash
curl https://recruitaihub.online
curl https://recruitaihub.online/api/health
curl https://recruitaihub.online/api-docs
```

### **Database Test**
```bash
sudo -u postgres psql -d userdb -c "SELECT count(*) FROM users;"
```

---

## 🔧 **MANAGEMENT COMMANDS**

### **PM2 Process Management**
```bash
pm2 status               # Check all processes
pm2 restart all          # Restart all services
pm2 stop all            # Stop all services
pm2 start all           # Start all services
pm2 logs                # View logs
pm2 logs business-service # View specific service logs
pm2 monit               # Real-time monitoring UI
pm2 save                # Save current configuration
```

### **System Services**
```bash
sudo systemctl status nginx        # Check Nginx
sudo systemctl status postgresql   # Check Database
sudo systemctl restart nginx       # Restart Nginx
sudo systemctl restart postgresql  # Restart Database
```

### **Logs & Monitoring**
```bash
tail -f /var/log/datn-deployment.log      # Deployment logs
tail -f /var/log/datn/*.log                # Service logs
tail -f /var/log/nginx/access.log         # Nginx access logs
tail -f /var/log/nginx/error.log          # Nginx error logs
htop                                       # System resources
```

### **Firewall Management**
```bash
sudo ufw status                    # Check firewall
sudo ufw allow 80                  # Allow HTTP
sudo ufw allow 443                 # Allow HTTPS
sudo ufw allow 4000                # Allow API Gateway
sudo ufw reload                    # Reload firewall rules
```

### **SSL Certificate**
```bash
sudo certbot certificates          # Check certificates
sudo certbot renew --dry-run      # Test renewal
sudo nginx -t                     # Test Nginx config
```

---

## 🆘 **TROUBLESHOOTING COMMANDS**

### **Port Conflicts**
```bash
sudo netstat -tulpn | grep :4000   # Check what's using port 4000
sudo lsof -i :5001                 # Check what's using port 5001
sudo kill -9 PID                   # Kill process by PID
sudo kill -9 $(sudo lsof -t -i:4000) # Kill all processes on port 4000
```

### **Service Issues**
```bash
pm2 restart business-service       # Restart specific service
pm2 delete business-service        # Delete service
pm2 start ecosystem.config.js      # Start from config file
pm2 flush                          # Clear all logs
```

### **Database Issues**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l           # List databases
sudo -u postgres psql -d userdb -c "\dt"  # List tables
sudo systemctl restart postgresql
```

### **Disk Space Issues**
```bash
df -h                              # Check disk usage
du -sh /opt/datn-recruitment/     # Check project size
du -sh /var/log/*                 # Check log sizes
sudo rm -rf /var/log/datn/*.log   # Clear service logs (if needed)
```

### **Memory Issues**
```bash
free -h                           # Check memory usage
ps aux --sort=-%mem | head        # Top memory consumers
sudo service mysql stop          # Stop unused services if needed
```

---

## 🔄 **UPDATE & MAINTENANCE**

### **Update Application**
```bash
cd /opt
mv DATN DATN-backup-$(date +%Y%m%d)
# Upload new zip file
unzip new-version.zip
cd DATN
sudo ./deployment/quick-production-deploy.sh
```

### **Backup Commands**
```bash
# Database backup
sudo -u postgres pg_dump userdb > backup_$(date +%Y%m%d).sql

# Full project backup
tar -czf datn-backup-$(date +%Y%m%d).tar.gz /opt/datn-recruitment/

# PM2 config backup
pm2 save
cp ~/.pm2/dump.pm2 backup-pm2-$(date +%Y%m%d).json
```

### **Cleanup Commands**
```bash
# Clear PM2 logs
pm2 flush

# Clear system logs
sudo journalctl --vacuum-time=7d

# Clear old backups
find /opt/ -name "*backup*" -type f -mtime +30 -delete
```

---

## 📊 **MONITORING COMMANDS**

### **Real-time Monitoring**
```bash
watch pm2 status                  # Auto-refresh PM2 status
watch "curl -s localhost:4000/health | jq ."  # Auto-refresh health
htop                              # System resources
iotop                             # Disk I/O
```

### **Log Analysis**
```bash
# Error counting
grep -i error /var/log/datn/*.log | wc -l

# Recent errors
tail -100 /var/log/datn/*error.log

# Access patterns
tail -100 /var/log/nginx/access.log | grep -E "(POST|GET)" | cut -d' ' -f7 | sort | uniq -c | sort -nr
```

---

## 🎯 **ONE-LINER COMMANDS**

### **Quick Health Check**
```bash
pm2 status && curl -s localhost:4000/health && curl -s localhost:5001/health
```

### **Quick Restart All**
```bash
pm2 restart all && sudo systemctl restart nginx
```

### **Quick Status Report**
```bash
echo "=== PM2 Status ===" && pm2 status && echo "=== Disk Usage ===" && df -h && echo "=== Memory ===" && free -h
```

### **Emergency Stop All**
```bash
pm2 stop all && sudo systemctl stop nginx
```

### **Emergency Start All**
```bash
sudo systemctl start nginx && pm2 start all
```

---

## 📞 **QUICK REFERENCE**

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 4000 | `curl localhost:4000/health` |
| Business Service | 5001 | `curl localhost:5001/health` |
| Frontend | 5173 | `curl localhost:5173` |
| AI CV Service | 8003 | `curl localhost:8003/health` |
| AI Matching | 8001 | `curl localhost:8001/health` |
| AI Questions | 8002 | `curl localhost:8002/health` |

**🚀 Keep this reference handy for quick VPS management!**
