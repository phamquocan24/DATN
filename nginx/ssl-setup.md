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