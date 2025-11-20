#!/bin/bash

# AI Grocery Planner - Deployment Script for GoDaddy
# This script automates the deployment process to GoDaddy hosting

set -e  # Exit on error

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration (update these values)
SERVER_USER="your-godaddy-username"
SERVER_HOST="your-server-ip"
SERVER_PATH="~/public_html/grocery.dwaynecon.com"
DB_NAME="grocery_planner"

echo -e "${YELLOW}📦 Building application...${NC}"

# Build frontend
echo "Building frontend..."
cd client
npm run build
cd ..

# Build backend
echo "Building backend..."
cd server
npm run build
cd ..

echo -e "${GREEN}✅ Build completed${NC}"

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
mkdir -p deployment
cp -r client/dist deployment/client
cp -r server/dist deployment/server
cp -r server/node_modules deployment/node_modules
cp server/package.json deployment/
cp -r scripts deployment/

# Create tarball
tar -czf grocery-planner-deploy.tar.gz deployment/

echo -e "${GREEN}✅ Deployment package created${NC}"

# Upload to server (requires SSH access)
echo -e "${YELLOW}📤 Uploading to server...${NC}"

# Option 1: Using SCP
# scp grocery-planner-deploy.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH

# Option 2: Using rsync (recommended)
# rsync -avz --delete deployment/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH

echo -e "${YELLOW}Note: Manual upload required or uncomment and configure upload method above${NC}"

# SSH commands to run on server (manual or via SSH)
cat << 'EOF' > server-commands.sh
#!/bin/bash
# Run these commands on the server after uploading

cd ~/public_html/grocery.dwaynecon.com

# Extract deployment
tar -xzf grocery-planner-deploy.tar.gz
mv deployment/* .
rm -rf deployment grocery-planner-deploy.tar.gz

# Install production dependencies
cd server
npm install --production

# Set up database (first time only)
# mysql -u username -p < ../scripts/schema.sql

# Restart server with PM2
pm2 restart grocery-api || pm2 start dist/index.js --name grocery-api

# Save PM2 configuration
pm2 save

echo "Deployment completed!"
EOF

chmod +x server-commands.sh

echo -e "${GREEN}✅ Deployment preparation complete${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Upload grocery-planner-deploy.tar.gz to your server"
echo "2. Run the commands in server-commands.sh on your server"
echo "3. Configure environment variables on the server"
echo "4. Verify the application is running"

# Cleanup
rm -rf deployment

echo -e "${GREEN}✅ Deployment script completed${NC}"
