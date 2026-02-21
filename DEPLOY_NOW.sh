#!/bin/bash

# ================================================
# GROCERY20 - MANUAL DEPLOYMENT GUIDE
# ================================================
# Follow these commands step-by-step
# ================================================

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          GROCERY20 MANUAL DEPLOYMENT WALKTHROUGH             ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create MySQL Database in cPanel
echo "📋 STEP 1: CREATE DATABASE IN CPANEL"
echo "────────────────────────────────────────────────────────────────"
echo "1. Go to: https://grocery.dwaynecon.com:2083"
echo "2. Login with your cPanel credentials"
echo "3. Navigate to: MySQL Databases"
echo "4. Create database: grocery_planner"
echo "5. Create user: grocery_user"
echo "6. Generate a strong password and SAVE IT"
echo "7. Grant ALL PRIVILEGES to the user"
echo ""
read -p "Press ENTER when database is created..."
echo ""

# Step 2: Import Database Schema
echo "📋 STEP 2: IMPORT DATABASE SCHEMA"
echo "────────────────────────────────────────────────────────────────"
echo "1. In cPanel, go to: phpMyAdmin"
echo "2. Select your database: grocery_planner"
echo "3. Click 'Import' tab"
echo "4. Choose file: database_schema.sql"
echo "5. Click 'Go'"
echo "6. Verify 20 tables were created"
echo ""
read -p "Press ENTER when schema is imported..."
echo ""

# Step 3: Run Automated Upload
echo "📋 STEP 3: RUNNING DEPLOYMENT SCRIPT"
echo "────────────────────────────────────────────────────────────────"
echo "The script will now:"
echo "  - Upload client files"
echo "  - Upload server files"
echo "  - Install dependencies"
echo "  - Create configuration files"
echo ""
read -p "Press ENTER to start deployment..."
echo ""

# Run the actual deployment script
./deploy-godaddy.sh production

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║                    DEPLOYMENT COMPLETE!                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 NEXT: Configure environment and start server"
echo ""
echo "Run these commands:"
echo ""
echo "  ssh nq00klkavtq6@grocery.dwaynecon.com"
echo "  cd ~/public_html/grocery.dwaynecon.com/server"
echo "  nano .env"
echo ""
echo "Then start the server with:"
echo "  pm2 start dist/index.js --name grocery-api"
echo ""
