# DigitalOcean Deployment Guide

This guide provides step-by-step instructions for deploying the Shopify Variant Expander app on a DigitalOcean droplet using Docker.

## Prerequisites

- A DigitalOcean account
- A domain name (pointed to your DigitalOcean droplet)
- Shopify Partner account with app credentials
- Basic knowledge of the command line and SSH

## 1. Create a DigitalOcean Droplet

1. Log in to your [DigitalOcean account](https://cloud.digitalocean.com/login)
2. Click "Create" and select "Droplets"
3. Choose the following options:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU options**: Regular with SSD (Standard)
   - **Size**: 
     - For development/testing: $12/month (2GB RAM, 1 CPU, 50GB SSD)
     - For production: $24/month (4GB RAM, 2 CPU, 80GB SSD)
   - **Datacenter Region**: Choose the region closest to your target audience
   - **VPC Network**: Default
   - **Authentication**: SSH keys (recommended) or Password
   - **Hostname**: variant-expander (or your preferred name)
4. Click "Create Droplet"

## 2. Set Up Your Domain

1. Go to the "Networking" section in your DigitalOcean account
2. Add your domain `variant-expander.apps3000.ch` (or your custom domain)
3. Create an A record pointing to your droplet's IP address:
   - `@` → Droplet IP
   - `www` → Droplet IP

## 3. Initial Server Setup

Connect to your droplet via SSH:

```bash
ssh root@your-droplet-ip
```

Update the system and install basic dependencies:

```bash
# Update packages
apt update && apt upgrade -y

# Install basic tools
apt install -y curl wget git vim unzip apt-transport-https ca-certificates gnupg lsb-release

# Set timezone
timedatectl set-timezone UTC
```

## 4. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

## 5. Set Up Firewall

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow ssh
ufw allow http
ufw allow https

# Enable firewall
ufw enable
```

## 6. Install Certbot for SSL

```bash
apt install -y certbot python3-certbot-nginx
```

## 7. Set Up Application Directory

```bash
# Create app directory
mkdir -p /var/www/variant-expander

# Clone repository
git clone https://github.com/apps3000/shopify-variant-expander.git /var/www/variant-expander

# Create required directories
mkdir -p /var/www/variant-expander/nginx/conf.d
mkdir -p /var/www/variant-expander/nginx/ssl
mkdir -p /var/www/variant-expander/nginx/logs
mkdir -p /var/backups/variant-expander
```

## 8. Configure SSL Certificates

```bash
# Obtain SSL certificates
certbot --nginx -d variant-expander.apps3000.ch -d www.variant-expander.apps3000.ch

# Copy certificates to app directory
cp /etc/letsencrypt/live/variant-expander.apps3000.ch/fullchain.pem /var/www/variant-expander/nginx/ssl/
cp /etc/letsencrypt/live/variant-expander.apps3000.ch/privkey.pem /var/www/variant-expander/nginx/ssl/
```

## 9. Configure Environment Variables

Create a `.env` file in your app directory:

```bash
cd /var/www/variant-expander
cp .env.example .env
```

Edit the `.env` file with your actual values:

```bash
# Edit using your preferred text editor
nano .env
```

Add the following environment variables:

```
# Server Configuration
NODE_ENV=production
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://mongo:27017/variant-expander

# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
HOST=https://variant-expander.apps3000.ch

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Admin Configuration
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD_HASH=your_hashed_password
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

To generate secure random values for secrets:

```bash
# Generate random secure strings for JWT_SECRET and ADMIN_JWT_SECRET
openssl rand -base64 32
```

For the ADMIN_PASSWORD_HASH, generate a SHA-256 hash of your chosen password:

```bash
# Replace 'your-secure-password' with your actual admin password
echo -n 'your-secure-password' | sha256sum
```

## 10. Update Nginx Configuration

Edit the Nginx configuration file:

```bash
nano /var/www/variant-expander/nginx/conf.d/default.conf
```

Ensure it contains the correct domain:

```nginx
server {
    listen 80;
    server_name variant-expander.apps3000.ch www.variant-expander.apps3000.ch;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name variant-expander.apps3000.ch www.variant-expander.apps3000.ch;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    # ... rest of the SSL configuration ...
}
```

## 11. Start the Application

```bash
cd /var/www/variant-expander

# Start the Docker containers
docker-compose up -d
```

## 12. Check Application Status

```bash
docker-compose ps
```

All services should be running and healthy. To check logs:

```bash
docker-compose logs
```

For specific service logs:

```bash
docker-compose logs -f server
```

## 13. Set Up Automatic Updates

### Configure Docker to Start on Boot

```bash
systemctl enable docker
```

### Set Up Auto-Restart Script

Create a daily restart script:

```bash
cat > /etc/cron.daily/restart-variant-expander << EOF
#!/bin/bash
cd /var/www/variant-expander
docker-compose down
docker-compose up -d
EOF

chmod +x /etc/cron.daily/restart-variant-expander
```

### Set Up SSL Certificate Auto-Renewal

```bash
echo "0 0 * * * root certbot renew --quiet && cp /etc/letsencrypt/live/variant-expander.apps3000.ch/fullchain.pem /var/www/variant-expander/nginx/ssl/ && cp /etc/letsencrypt/live/variant-expander.apps3000.ch/privkey.pem /var/www/variant-expander/nginx/ssl/ && docker exec variant-expander_nginx_1 nginx -s reload" >> /etc/crontab
```

## 14. Set Up Backups

Create a backup script:

```bash
cat > /usr/local/bin/backup-variant-expander.sh << EOF
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/variant-expander"
docker exec variant-expander_mongo_1 mongodump --out=/dump
docker cp variant-expander_mongo_1:/dump "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
tar -zcf "\$BACKUP_DIR/mongodb_\$TIMESTAMP.tar.gz" "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
rm -rf "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
# Keep only the 7 most recent backups
ls -t "\$BACKUP_DIR"/mongodb_*.tar.gz | tail -n +8 | xargs -r rm
EOF

chmod +x /usr/local/bin/backup-variant-expander.sh
```

Schedule daily backups:

```bash
echo "0 2 * * * root /usr/local/bin/backup-variant-expander.sh" > /etc/cron.d/variant-expander-backup
```

## 15. Optional: Set Up Monitoring

Install a lightweight monitoring tool like Netdata:

```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Access the monitoring dashboard at `http://your-server-ip:19999`.

## Updating the Application

To update the application:

```bash
# Go to the application directory
cd /var/www/variant-expander

# Pull the latest changes from GitHub
git pull

# Restart the containers
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Check Container Logs

```bash
docker-compose logs -f
```

### Verify Nginx Configuration

```bash
nginx -t
```

### Check MongoDB Connection

```bash
docker exec -it variant-expander_mongo_1 mongo
```

### Restart Services

```bash
docker-compose restart
```

### Check SSL Certificate Status

```bash
certbot certificates
```

## Security Best Practices

1. **Regularly update the system**:
   ```bash
   apt update && apt upgrade -y
   ```

2. **Set up automatic security updates**:
   ```bash
   apt install -y unattended-upgrades
   dpkg-reconfigure -plow unattended-upgrades
   ```

3. **Use strong, unique passwords** for all accounts

4. **Enable fail2ban** to protect against brute force attacks:
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

5. **Regularly back up your data** and test restoration procedures

## Support

If you encounter issues during deployment, contact support at help@apps3000.ch or refer to the project documentation.
