#!/bin/bash

# Shopify Variant Expander Deployment Script
# This script automates the deployment process for the Shopify Variant Expander app

# Exit on error
set -e

# Configuration (modify these variables)
APP_DIR="/var/www/variant-expander"
DOMAIN="variant-expander.apps3000.ch"
BACKUP_DIR="/var/backups/variant-expander"
GITHUB_REPO=""  # Optional: GitHub repository URL

# Color codes for console output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_section() {
  echo -e "\n${BLUE}===${NC} $1 ${BLUE}===${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
  print_error "This script must be run as root"
  exit 1
fi

# Create directories if they don't exist
print_section "Setting up directories"
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p $APP_DIR/nginx/conf.d
mkdir -p $APP_DIR/nginx/ssl
mkdir -p $APP_DIR/nginx/logs
print_success "Directories created"

# Check if this is an update or a new installation
if [ -f "$APP_DIR/docker-compose.yml" ]; then
  IS_UPDATE=true
  print_warning "Existing installation detected - running as update"
else
  IS_UPDATE=false
  print_warning "No existing installation detected - running as new installation"
fi

# Backup existing application if updating
if [ "$IS_UPDATE" = true ]; then
  print_section "Backing up existing application"
  BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/app_backup_$BACKUP_TIMESTAMP.tar.gz"
  
  # Create temporary backup directory
  TMP_BACKUP_DIR=$(mktemp -d)
  
  # Copy app files to temp directory
  cp -r $APP_DIR/* $TMP_BACKUP_DIR/
  
  # Exclude node_modules and other large directories
  rm -rf $TMP_BACKUP_DIR/*/node_modules
  rm -rf $TMP_BACKUP_DIR/*/build
  rm -rf $TMP_BACKUP_DIR/*/dist
  
  # Create compressed backup
  tar -czf $BACKUP_FILE -C $TMP_BACKUP_DIR .
  rm -rf $TMP_BACKUP_DIR
  
  print_success "Backup created: $BACKUP_FILE"
  
  # Backup MongoDB database
  if docker ps | grep -q variant-expander_mongo; then
    print_section "Backing up MongoDB database"
    MONGO_BACKUP_DIR="$BACKUP_DIR/mongodb_$BACKUP_TIMESTAMP"
    mkdir -p $MONGO_BACKUP_DIR
    
    docker exec variant-expander_mongo_1 mongodump --out=/dump
    docker cp variant-expander_mongo_1:/dump $MONGO_BACKUP_DIR
    
    tar -czf "$MONGO_BACKUP_DIR.tar.gz" -C $MONGO_BACKUP_DIR .
    rm -rf $MONGO_BACKUP_DIR
    
    print_success "MongoDB backup created: $MONGO_BACKUP_DIR.tar.gz"
    
    # Keep only the 10 most recent backups
    ls -t "$BACKUP_DIR"/mongodb_*.tar.gz | tail -n +11 | xargs -r rm
    ls -t "$BACKUP_DIR"/app_backup_*.tar.gz | tail -n +11 | xargs -r rm
    
    print_success "Old backups cleaned up"
  fi
  
  # Stop existing containers
  print_section "Stopping existing containers"
  cd $APP_DIR
  docker-compose down
  print_success "Containers stopped"
fi

# Pull latest code if GitHub repo is provided
if [ -n "$GITHUB_REPO" ]; then
  print_section "Updating code from GitHub"
  
  if [ "$IS_UPDATE" = true ] && [ -d "$APP_DIR/.git" ]; then
    # Update existing repository
    cd $APP_DIR
    git pull
    print_success "Code updated from GitHub"
  else
    # Clone repository
    rm -rf $APP_DIR
    git clone $GITHUB_REPO $APP_DIR
    print_success "Code cloned from GitHub"
  fi
else
  print_warning "No GitHub repository specified - assuming manual file upload"
fi

# Update environment variables
print_section "Configuring environment variables"
if [ ! -f "$APP_DIR/.env" ]; then
  if [ -f "$APP_DIR/.env.example" ]; then
    cp $APP_DIR/.env.example $APP_DIR/.env
    print_warning "Created .env file from template. Please edit $APP_DIR/.env with your actual values"
    print_warning "Run this script again after updating the .env file"
    exit 0
  else
    print_error "No .env.example file found. Please create $APP_DIR/.env manually"
    exit 1
  fi
fi

# Configure Nginx
print_section "Configuring Nginx"
if [ -f "$APP_DIR/nginx/conf.d/default.conf" ]; then
  # Update domain in Nginx config
  sed -i "s/server_name .*;/server_name $DOMAIN;/g" $APP_DIR/nginx/conf.d/default.conf
  print_success "Updated domain in Nginx configuration"
else
  print_error "Nginx configuration not found. Please check your installation"
  exit 1
fi

# Check for SSL certificates
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  print_warning "SSL certificates not found. Attempting to obtain them..."
  
  # Install certbot if not already installed
  if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
  fi
  
  # Get certificates
  certbot --nginx -d $DOMAIN -d www.$DOMAIN
  
  if [ $? -ne 0 ]; then
    print_error "Failed to obtain SSL certificates. Please check DNS configuration"
    exit 1
  fi
  
  print_success "SSL certificates obtained"
fi

# Copy SSL certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/nginx/ssl/
print_success "SSL certificates copied"

# Build and start containers
print_section "Starting application"
cd $APP_DIR
docker-compose build
docker-compose up -d

print_success "Application deployed successfully!"
print_success "Your Variant Expander app is now running at https://$DOMAIN"

# Display container status
print_section "Container status"
docker-compose ps

# Setup auto-renewal for SSL certificates
print_section "Setting up SSL certificate auto-renewal"
if ! grep -q "variant-expander" /etc/crontab; then
  echo "0 0 * * * root certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $APP_DIR/nginx/ssl/ && docker exec variant-expander_nginx_1 nginx -s reload" >> /etc/crontab
  print_success "SSL auto-renewal configured"
else
  print_success "SSL auto-renewal already configured"
fi

# Set up daily backups
print_section "Setting up daily backups"
if ! grep -q "backup-variant-expander" /etc/cron.d/variant-expander-backup; then
  cat > /usr/local/bin/backup-variant-expander.sh << EOF
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_DIR"
cd $APP_DIR
docker-compose exec mongo mongodump --out=/dump
docker cp variant-expander_mongo_1:/dump "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
tar -zcf "\$BACKUP_DIR/mongodb_\$TIMESTAMP.tar.gz" "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
rm -rf "\$BACKUP_DIR/mongodb_\$TIMESTAMP"
# Keep only the 10 most recent backups
ls -t "\$BACKUP_DIR"/mongodb_*.tar.gz | tail -n +11 | xargs -r rm
ls -t "\$BACKUP_DIR"/app_backup_*.tar.gz | tail -n +11 | xargs -r rm
EOF

  chmod +x /usr/local/bin/backup-variant-expander.sh
  echo "0 2 * * * root /usr/local/bin/backup-variant-expander.sh" > /etc/cron.d/variant-expander-backup
  print_success "Daily backups configured"
else
  print_success "Daily backups already configured"
fi

print_section "Next steps"
echo "1. Visit https://$DOMAIN/auth to complete the Shopify OAuth flow"
echo "2. Configure your app settings in the admin dashboard"
echo "3. Add collections to enable the variant expander"
echo "4. Test the functionality on your Shopify store"

print_section "Troubleshooting"
echo "If you encounter issues, check the logs with: docker-compose logs"
echo "For detailed logs: docker-compose logs -f [service]"
echo "Restart the app with: docker-compose restart"
echo "For support, refer to the README.md file or contact support"

print_success "Deployment completed successfully!"
