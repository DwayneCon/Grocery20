#!/bin/bash

# Database Backup Script for Grocery20
# This script creates automated MySQL backups with rotation

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${HOME}/backups/grocery20"
DB_NAME="grocery_planner"
DB_USER="${DB_USER:-grocery_user}"
DB_PASSWORD="${DB_PASSWORD}"
DB_HOST="${DB_HOST:-localhost}"
RETENTION_DAYS=30  # Keep backups for 30 days

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🔄 Starting database backup...${NC}"
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Perform the backup
if [ -z "$DB_PASSWORD" ]; then
    # No password provided, prompt for it
    mysqldump -h "$DB_HOST" -u "$DB_USER" -p \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        --quick \
        --lock-tables=false \
        "$DB_NAME" > "$BACKUP_FILE" 2>&1
else
    # Use password from environment
    mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --hex-blob \
        --quick \
        --lock-tables=false \
        "$DB_NAME" > "$BACKUP_FILE" 2>&1
fi

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ Backup created successfully${NC}"

    # Compress the backup
    echo "📦 Compressing backup..."
    gzip "$BACKUP_FILE"

    if [ -f "$COMPRESSED_FILE" ]; then
        BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo -e "${GREEN}✅ Backup compressed: ${BACKUP_SIZE}${NC}"
        echo "Location: $COMPRESSED_FILE"

        # Calculate checksum for verification
        CHECKSUM=$(md5sum "$COMPRESSED_FILE" | cut -d' ' -f1)
        echo "$CHECKSUM" > "${COMPRESSED_FILE}.md5"
        echo "Checksum: $CHECKSUM"

        # Remove old backups
        echo "🗑️  Removing backups older than $RETENTION_DAYS days..."
        find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
        find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz.md5" -type f -mtime +$RETENTION_DAYS -delete

        # Show remaining backups
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f | wc -l)
        echo -e "${GREEN}📊 Total backups: ${BACKUP_COUNT}${NC}"

        # Optional: Upload to S3 (uncomment if using AWS)
        # if command -v aws &> /dev/null; then
        #     echo "☁️  Uploading to S3..."
        #     aws s3 cp "$COMPRESSED_FILE" "s3://your-bucket/backups/grocery20/"
        #     if [ $? -eq 0 ]; then
        #         echo -e "${GREEN}✅ Uploaded to S3${NC}"
        #     fi
        # fi

    else
        echo -e "${RED}❌ Compression failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Backup failed${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo -e "${GREEN}🎉 Backup process completed successfully!${NC}"

# Optional: Send notification (uncomment if using email)
# echo "Database backup completed: $COMPRESSED_FILE" | mail -s "Grocery20 Backup Success" admin@example.com

exit 0
