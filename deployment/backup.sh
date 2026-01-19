#!/bin/bash

# SPWMS Database Backup Script
# This script creates a backup of the production database

set -e  # Exit on error

# Configuration
DB_USER="spwms_user"
DB_NAME="spwms_production"
BACKUP_DIR="/var/backups/spwms"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/spwms_backup_$DATE.sql"
KEEP_DAYS=30  # Number of days to keep backups

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗄️  Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo -e "${YELLOW}📦 Creating backup: $BACKUP_FILE${NC}"
pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Compress backup
echo -e "${YELLOW}🗜️  Compressing backup...${NC}"
gzip $BACKUP_FILE

echo -e "${GREEN}✅ Backup completed: ${BACKUP_FILE}.gz${NC}"

# Show backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo -e "${GREEN}📊 Backup size: $BACKUP_SIZE${NC}"

# Clean old backups
echo -e "${YELLOW}🧹 Cleaning old backups (older than $KEEP_DAYS days)...${NC}"
find $BACKUP_DIR -name "spwms_backup_*.sql.gz" -mtime +$KEEP_DAYS -delete

# List recent backups
echo -e "\n${YELLOW}📋 Recent backups:${NC}"
ls -lh $BACKUP_DIR/spwms_backup_*.sql.gz | tail -5

echo -e "\n${GREEN}✅ Backup process completed successfully!${NC}"
