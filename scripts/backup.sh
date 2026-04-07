#!/bin/bash

################################################################################
# Backup Script for Analisi Tracker
#
# Description: Creates automated backups of Redis cache and application data
# Usage: ./scripts/backup.sh [redis|app|all]
# Schedule: Add to crontab: 0 2 * * * /opt/analisi-tracker/scripts/backup.sh all
################################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/analisi-tracker/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M%S)
TIMESTAMP="${DATE}_${TIME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}/redis"
mkdir -p "${BACKUP_DIR}/app"
mkdir -p "${BACKUP_DIR}/logs"

################################################################################
# Backup Redis
################################################################################
backup_redis() {
    log "Starting Redis backup..."

    # Check if Redis is running
    if ! docker-compose ps redis | grep -q "Up"; then
        error "Redis container is not running"
        return 1
    fi

    # Create Redis backup
    local redis_backup_file="${BACKUP_DIR}/redis/redis-${TIMESTAMP}.rdb"

    # Trigger Redis save
    docker-compose exec -T redis redis-cli BGSAVE

    # Wait for save to complete
    sleep 5

    # Copy RDB file from container
    docker cp analisi-tracker-redis:/data/dump.rdb "${redis_backup_file}"

    # Compress backup
    gzip "${redis_backup_file}"

    log "Redis backup completed: ${redis_backup_file}.gz"

    # Clean up old backups
    find "${BACKUP_DIR}/redis" -name "redis-*.rdb.gz" -mtime +${RETENTION_DAYS} -delete

    return 0
}

################################################################################
# Backup Application Data
################################################################################
backup_app() {
    log "Starting application data backup..."

    # Backup application logs
    local logs_backup_file="${BACKUP_DIR}/logs/logs-${TIMESTAMP}.tar.gz"

    if [ -d "/opt/analisi-tracker/logs" ]; then
        tar -czf "${logs_backup_file}" /opt/analisi-tracker/logs/
        log "Application logs backed up: ${logs_backup_file}"
    else
        warning "No application logs directory found"
    fi

    # Backup environment files (excluding secrets)
    local env_backup_file="${BACKUP_DIR}/app/env-${TIMESTAMP}.txt"

    # Create safe backup of environment variables (without secrets)
    cat > "${env_backup_file}" << EOF
# Environment configuration backup
# Generated: ${TIMESTAMP}
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-3000}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
# Note: Sensitive data (passwords, API keys) excluded
EOF

    log "Application data backup completed"

    # Clean up old backups
    find "${BACKUP_DIR}/app" -name "env-*.txt" -mtime +${RETENTION_DAYS} -delete
    find "${BACKUP_DIR}/logs" -name "logs-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

    return 0
}

################################################################################
# Backup Docker Volumes (if using database)
################################################################################
backup_volumes() {
    log "Starting Docker volumes backup..."

    # Check if postgres backup service exists
    if docker-compose ps | grep -q "postgres-backup"; then
        # Trigger postgres backup if you add database later
        log "PostgreSQL backup would be triggered here"
        # docker-compose exec postgres-backup /backup.sh
    fi

    return 0
}

################################################################################
# Upload to S3 (optional)
################################################################################
upload_to_s3() {
    if [ -z "${BACKUP_S3_BUCKET}" ]; then
        log "S3 backup not configured (BACKUP_S3_BUCKET not set)"
        return 0
    fi

    log "Uploading backups to S3..."

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        warning "AWS CLI not found. Skipping S3 upload."
        return 1
    fi

    # Upload today's backups to S3
    aws s3 sync "${BACKUP_DIR}" "s3://${BACKUP_S3_BUCKET}/analisi-tracker/" \
        --exclude "*" \
        --include "redis-${DATE}*" \
        --include "logs-${DATE}*" \
        --include "env-${DATE}*" \
        --storage-class STANDARD_IA

    log "S3 upload completed"
    return 0
}

################################################################################
# Generate backup report
################################################################################
generate_report() {
    local report_file="${BACKUP_DIR}/backup-report-${TIMESTAMP}.txt"

    cat > "${report_file}" << EOF
Analisi Tracker Backup Report
=============================
Date: ${TIMESTAMP}
Backup Directory: ${BACKUP_DIR}
Retention Period: ${RETENTION_DAYS} days

Redis Backups:
$(find "${BACKUP_DIR}/redis" -name "redis-*.rdb.gz" -type f | wc -l) files
$(du -sh "${BACKUP_DIR}/redis" 2>/dev/null || echo "N/A")

Application Backups:
$(find "${BACKUP_DIR}/app" -name "*.txt" -type f | wc -l) files
$(du -sh "${BACKUP_DIR}/app" 2>/dev/null || echo "N/A")

Log Backups:
$(find "${BACKUP_DIR}/logs" -name "*.tar.gz" -type f | wc -l) files
$(du -sh "${BACKUP_DIR}/logs" 2>/dev/null || echo "N/A")

Total Size:
$(du -sh "${BACKUP_DIR}" 2>/dev/null || echo "N/A")

Status: SUCCESS
EOF

    log "Backup report generated: ${report_file}"
    cat "${report_file}"
}

################################################################################
# Main execution
################################################################################
main() {
    local backup_type="${1:-all}"

    log "========================================="
    log "Analisi Tracker Backup Process Started"
    log "Backup Type: ${backup_type}"
    log "========================================="

    case "${backup_type}" in
        redis)
            backup_redis
            ;;
        app)
            backup_app
            ;;
        all)
            backup_redis
            backup_app
            backup_volumes
            upload_to_s3
            generate_report
            ;;
        *)
            error "Invalid backup type: ${backup_type}"
            echo "Usage: $0 [redis|app|all]"
            exit 1
            ;;
    esac

    log "========================================="
    log "Backup Process Completed Successfully"
    log "========================================="

    return 0
}

# Run main function
main "$@"
