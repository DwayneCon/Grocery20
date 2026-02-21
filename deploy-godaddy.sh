#!/bin/bash

# ================================================
# GROCERY20 - GODADDY DEPLOYMENT SCRIPT
# ================================================
# This script automates the deployment process to GoDaddy
#
# Prerequisites:
# 1. Changed cPanel password
# 2. Rotated OpenAI API key
# 3. MySQL database created in cPanel
# 4. SSH access enabled in cPanel
#
# Usage:
#   ./deploy-godaddy.sh [production|staging]
#
# Created: 2025-11-26
# ================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
LOCAL_DIR="$(pwd)"
REMOTE_USER="nq00klkavtq6"
REMOTE_HOST="grocery.dwaynecon.com"
REMOTE_PATH="~/public_html/grocery.dwaynecon.com"

# ================================================
# FUNCTIONS
# ================================================

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "$1"
    echo "================================================"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}→ $1${NC}"
}

check_prerequisites() {
    print_header "CHECKING PREREQUISITES"

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Not in Grocery20 root directory"
        exit 1
    fi
    print_success "In Grocery20 root directory"

    # Check if build directories exist
    if [ ! -d "client/dist" ]; then
        print_error "Client build not found. Run: npm run build"
        exit 1
    fi
    print_success "Client build exists"

    if [ ! -d "server/dist" ]; then
        print_error "Server build not found. Run: npm run build"
        exit 1
    fi
    print_success "Server build exists"

    # Check if .env.production.template exists
    if [ ! -f ".env.production.template" ]; then
        print_error "Production .env template not found"
        exit 1
    fi
    print_success "Production .env template exists"

    # Check if database schema exists
    if [ ! -f "database_schema.sql" ]; then
        print_error "Database schema file not found"
        exit 1
    fi
    print_success "Database schema file exists"

    # Check if SSH key exists
    if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
        print_warning "No SSH key found. You'll need to enter password multiple times"
    else
        print_success "SSH key exists"
    fi
}

confirm_deployment() {
    print_header "DEPLOYMENT CONFIRMATION"
    echo ""
    print_info "Environment: $ENVIRONMENT"
    print_info "Remote Host: $REMOTE_HOST"
    print_info "Remote User: $REMOTE_USER"
    print_info "Remote Path: $REMOTE_PATH"
    echo ""
    print_warning "This will:"
    echo "  - Upload client build to remote server"
    echo "  - Upload server code to remote server"
    echo "  - Install dependencies on remote"
    echo "  - Restart Node.js application"
    echo ""
    read -p "Continue with deployment? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
}

create_backup() {
    print_header "CREATING REMOTE BACKUP"

    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        if [ -d ~/public_html/grocery.dwaynecon.com ]; then
            BACKUP_DIR=~/backups/grocery_$(date +%Y%m%d_%H%M%S)
            mkdir -p ~/backups
            cp -r ~/public_html/grocery.dwaynecon.com $BACKUP_DIR
            echo "Backup created at: $BACKUP_DIR"
        else
            echo "No existing installation to backup"
        fi
ENDSSH

    print_success "Backup complete"
}

upload_client() {
    print_header "UPLOADING CLIENT BUILD"

    # Create remote directory if it doesn't exist
    ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}"

    # Upload client dist folder
    print_info "Uploading client files..."
    rsync -avz --delete \
        client/dist/ \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

    print_success "Client uploaded"
}

upload_server() {
    print_header "UPLOADING SERVER CODE"

    # Create server directory
    ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}/server"

    # Upload server files (excluding node_modules and dev files)
    print_info "Uploading server files..."
    rsync -avz --exclude='node_modules' --exclude='.env' \
        server/dist/ \
        server/package.json \
        server/package-lock.json \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/server/

    print_success "Server uploaded"
}

upload_config() {
    print_header "UPLOADING CONFIGURATION FILES"

    # Upload .env template (user needs to edit)
    print_info "Uploading .env template..."
    scp .env.production.template \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/server/.env.template

    # Upload database schema
    print_info "Uploading database schema..."
    scp database_schema.sql \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

    print_success "Configuration files uploaded"
}

install_dependencies() {
    print_header "INSTALLING SERVER DEPENDENCIES"

    ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
        cd ${REMOTE_PATH}/server
        npm install --production
ENDSSH

    print_success "Dependencies installed"
}

setup_environment() {
    print_header "ENVIRONMENT SETUP INSTRUCTIONS"

    echo ""
    print_warning "MANUAL STEPS REQUIRED:"
    echo ""
    echo "1. SSH into your server:"
    echo "   ${BLUE}ssh ${REMOTE_USER}@${REMOTE_HOST}${NC}"
    echo ""
    echo "2. Edit the .env file:"
    echo "   ${BLUE}cd ${REMOTE_PATH}/server${NC}"
    echo "   ${BLUE}cp .env.template .env${NC}"
    echo "   ${BLUE}nano .env${NC}"
    echo ""
    echo "3. Update these values in .env:"
    echo "   - DB_PASSWORD (from cPanel MySQL)"
    echo "   - OPENAI_API_KEY (your NEW rotated key)"
    echo "   - SMTP_USER and SMTP_PASS (if using email)"
    echo ""
    echo "4. Set proper permissions:"
    echo "   ${BLUE}chmod 600 .env${NC}"
    echo ""
    echo "5. Import database schema:"
    echo "   ${BLUE}cd ${REMOTE_PATH}${NC}"
    echo "   ${BLUE}mysql -u YOUR_DB_USER -p YOUR_DB_NAME < database_schema.sql${NC}"
    echo ""
}

setup_pm2() {
    print_header "SETTING UP PM2 PROCESS MANAGER"

    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        fi

        cd ~/public_html/grocery.dwaynecon.com/server

        # Stop existing process if running
        pm2 stop grocery-api 2>/dev/null || true
        pm2 delete grocery-api 2>/dev/null || true

        # Start new process
        pm2 start dist/index.js --name grocery-api --time

        # Save PM2 process list
        pm2 save

        # Setup PM2 to start on reboot
        pm2 startup || true

        # Show status
        pm2 status
ENDSSH

    print_success "PM2 configured"
}

setup_htaccess() {
    print_header "CREATING .HTACCESS FILE"

    ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
        cd ~/public_html/grocery.dwaynecon.com

        cat > .htaccess << 'EOF'
# ================================================
# GROCERY20 - APACHE CONFIGURATION
# ================================================

RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy API requests to Node.js server
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Serve static files directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route all other requests to React app
RewriteRule ^(.*)$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
EOF

        echo ".htaccess file created"
ENDSSH

    print_success ".htaccess configured"
}

verify_deployment() {
    print_header "VERIFYING DEPLOYMENT"

    echo ""
    print_info "Checking API endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://${REMOTE_HOST}/api/health || echo "000")

    if [ "$RESPONSE" == "200" ]; then
        print_success "API is responding (HTTP 200)"
    else
        print_warning "API returned HTTP $RESPONSE (may need manual .env configuration)"
    fi

    echo ""
    print_info "Checking website..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://${REMOTE_HOST} || echo "000")

    if [ "$RESPONSE" == "200" ]; then
        print_success "Website is accessible (HTTP 200)"
    else
        print_warning "Website returned HTTP $RESPONSE"
    fi
}

print_summary() {
    print_header "DEPLOYMENT SUMMARY"

    echo ""
    print_success "Files uploaded successfully!"
    echo ""
    print_info "Next steps:"
    echo ""
    echo "1. Configure environment variables:"
    echo "   ${BLUE}ssh ${REMOTE_USER}@${REMOTE_HOST}${NC}"
    echo "   ${BLUE}nano ${REMOTE_PATH}/server/.env${NC}"
    echo ""
    echo "2. Import database schema (via cPanel phpMyAdmin or MySQL command line)"
    echo ""
    echo "3. Verify API is running:"
    echo "   ${BLUE}pm2 logs grocery-api${NC}"
    echo ""
    echo "4. Test your application:"
    echo "   ${BLUE}https://${REMOTE_HOST}${NC}"
    echo ""
    echo "5. Monitor for errors:"
    echo "   ${BLUE}pm2 monit${NC}"
    echo ""
    print_warning "SECURITY REMINDER:"
    echo "- Rotate cPanel password if not done already"
    echo "- Rotate OpenAI API key if not done already"
    echo "- Set proper file permissions: chmod 600 .env"
    echo ""
}

# ================================================
# MAIN EXECUTION
# ================================================

main() {
    clear
    print_header "GROCERY20 GODADDY DEPLOYMENT"

    # Run deployment steps
    check_prerequisites
    confirm_deployment
    create_backup
    upload_client
    upload_server
    upload_config
    install_dependencies
    setup_htaccess
    setup_environment

    echo ""
    read -p "Do you want to setup PM2 now? (requires .env to be configured) (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        setup_pm2
        verify_deployment
    else
        print_info "Skipping PM2 setup. Run manually after configuring .env"
    fi

    print_summary
}

# Run main function
main

exit 0
