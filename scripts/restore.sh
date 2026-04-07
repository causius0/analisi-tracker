#!/bin/bash

################################################################################
# Restore Script for Analisi Tracker
#
# Description: Restores backups of Redis cache and application data
# Usage: ./scripts/restore.sh <backup_file>
# Example: ./scripts/restore.sh /opt/analisi-tracker/backups/redis/redis-2024-01-01_020000.rdb.gz
################################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/analisi-tracker/backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

################################################################################
# Confirm restoration
################################################################################
confirm_restore() {
    local backup_file="$1"

    echo ""
    echo "========================================="
    echo "⚠️  RESTORATION WARNING ⚠️"
    echo "========================================="
    echo ""
    echo "You are about to restore from backup:"
    echo "  File: ${backup_file}"
    echo ""
    echo "This will:"
    echo "  - STOP all running services"
    echo "  - OVERWRITE current data"
    echo "  - RESTART services after restoration"
    echo ""
    warning "This action cannot be undone!"
    echo ""
    echo "========================================="

    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

    if [ "${confirmation}" != "yes" ]; then
        log "Restoration cancelled by user"
        exit 0
    fi
}

################################################################################
# List available backups
################################################################################
list_backups() {
    log "Available backups:"

    echo ""
    echo "Redis Backups:"
    find "${BACKUP_DIR}/redis" -name "redis-*.rdb.gz" -type f | sort -r | head -10

    echo ""
    echo "Log Backups:"
    find "${BACKUP_DIR}/logs" -name "logs-*.tar.gz" -type f | sort -r | head -10

    echo ""
    echo "Environment Backups:"
    find "${BACKUP_DIR}/app" -name "env-*.txt" -type f | sort -r | head -10
}

################################################################################
# Restore Redis
################################################################################
restore_redis() {
    local backup_file="$1"

    log "Starting Redis restoration..."
    info "Backup file: ${backup_file}"

    # Verify backup file exists
    if [ ! -f "${backup_file}" ]; then
        error "Backup file not found: ${backup_file}"
        return 1
    fi

    # Stop application to prevent conflicts
    log "Stopping application..."
    docker-compose stop app

    # Stop Redis
    log "Stopping Redis..."
    docker-compose stop redis

    # Remove existing Redis data
    log "Clearing existing Redis data..."
    docker-compose rm -f redis

    # Start Redis container
    log "Starting Redis container..."
    docker-compose up -d redis

    # Wait for Redis to be ready
    log "Waiting for Redis to start..."
    sleep 10

    # Decompress and copy backup
    local temp_file="/tmp/redis-restore-$(date +%s).rdb"

    log "Decompressing backup..."
    gunzip -c "${backup_file}" > "${temp_file}"

    # Copy to container
    log "Copying backup to Redis container..."
    docker cp "${temp_file}" analisi-tracker-redis:/data/dump.rdb

    # Restart Redis to load the data
    log "Restarting Redis to load data..."
    docker-compose restart redis

    # Wait for Redis to be ready
    sleep 5

    # Verify Redis is working
    log "Verifying Redis..."
    if docker-compose exec -T redis redis-cli PING | grep -q "PONG"; then
        log "✅ Redis restoration successful"
    else
        error "❌ Redis restoration failed"
        return 1
    fi

    # Clean up temp file
    rm -f "${temp_file}"

    # Restart application
    log "Restarting application..."
    docker-compose start app

    # Wait for application to be ready
    sleep 10

    # Verify application health
    log "Verifying application health..."
    if docker-compose exec -T app curl -s http://localhost:3000/health | grep -q "ok"; then
        log "✅ Application is healthy"
    else
        warning "⚠️  Application health check failed"
    fi

    return 0
}

################################################################################
# Restore Logs
################################################################################
restore_logs() {
    local backup_file="$1"

    log "Starting log restoration..."
    info "Backup file: ${backup_file}"

    # Verify backup file exists
    if [ ! -f "${backup_file}" ]; then
        error "Backup file not found: ${backup_file}"
        return 1
    fi

    # Create log directory
    mkdir -p /opt/analisi-tracker/logs

    # Extract logs
    log "Extracting logs..."
    tar -xzf "${backup_file}" -C /

    log "✅ Log restoration completed"
    return 0
}

################################################################################
# Restore Environment
################################################################################
restore_environment() {
    local backup_file="$1"

    log "Starting environment restoration..."
    info "Backup file: ${backup_file}"

    # Verify backup file exists
    if [ ! -f "${backup_file}" ]; then
        error "Backup file not found: ${backup_file}"
        return 1
    fi

    # Show environment variables
    log "Environment variables in backup:"
    cat "${backup_file}"

    warning "Note: Sensitive data (passwords, API keys) need to be manually set"

    return 0
}

################################################################################
# Download from S3
################################################################################
download_from_s3() {
    local s3_path="$1"

    log "Downloading backup from S3: ${s3_path}"

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install it first."
        return 1
    fi

    # Download from S3
    local local_file="${BACKUP_DIR}/$(basename ${s3_path})"
    aws s3 cp "${s3_path}" "${local_file}"

    if [ $? -eq 0 ]; then
        log "✅ Download completed: ${local_file}"
        echo "${local_file}"
    else
        error "❌ Download failed"
        return 1
    fi
}

################################################################################
# Verify restoration
################################################################################
verify_restoration() {
    local backup_type="$1"

    log "Verifying restoration..."

    case "${backup_type}" in
        redis)
            # Check Redis
            log "Checking Redis..."
            docker-compose exec redis redis-cli INFO server | head -5

            # Check application
            log "Checking application..."
            curl -s http://localhost:3000/health | jq '.'
            ;;
        logs)
            log "Log files restored:"
            ls -lh /opt/analisi-tracker/logs/ | tail -5
            ;;
        env)
            log "Environment file:"
            cat /opt/analisi-tracker/.env.production | head -10
            ;;
    esac

    log "✅ Restoration verification completed"
}

################################################################################
# Main execution
################################################################################
main() {
    local backup_path="$1"

    # Check if backup path is provided
    if [ -z "${backup_path}" ]; then
        error "No backup file specified"
        echo ""
        echo "Usage: $0 <backup_file>"
        echo "   or: $0 s3://bucket/path/backup-file.gz"
        echo ""
        echo "Examples:"
        echo "  $0 /opt/analisi-tracker/backups/redis/redis-2024-01-01_020000.rdb.gz"
        echo "  $0 s3://my-backup-bucket/analisi-tracker/redis-2024-01-01_020000.rdb.gz"
        echo ""
        echo "To list available backups:"
        echo "  $0 --list"
        echo ""
        exit 1
    fi

    # List backups if requested
    if [ "${backup_path}" == "--list" ]; then
        list_backups
        exit 0
    fi

    # Download from S3 if path starts with s3://
    if [[ "${backup_path}" == s3://* ]]; then
        backup_path=$(download_from_s3 "${backup_path}")
        if [ $? -ne 0 ]; then
            exit 1
        fi
    fi

    # Confirm restoration
    confirm_restore "${backup_path}"

    # Determine backup type and restore
    local backup_type=""

    if [[ "${backup_path}" == *"/redis/"* ]]; then
        backup_type="redis"
        restore_redis "${backup_path}"
    elif [[ "${backup_path}" == *"/logs/"* ]]; then
        backup_type="logs"
        restore_logs "${backup_path}"
    elif [[ "${backup_path}" == *"/app/env-"* ]]; then
        backup_type="env"
        restore_environment "${backup_path}"
    else
        error "Unknown backup type. File path should contain /redis/, /logs/, or /app/env-"
        exit 1
    fi

    # Verify restoration
    if [ $? -eq 0 ]; then
        verify_restoration "${backup_type}"

        echo ""
        log "========================================="
        log "✅ Restoration Completed Successfully"
        log "========================================="
        echo ""
        info "Backup restored from: ${backup_path}"
        info "Time: $(date)"
        echo ""
        warning "Please verify everything is working correctly"
        warning "Check logs: docker-compose logs -f --tail=100"
    else
        error "Restoration failed. Please check the logs above."
        exit 1
    fi
}

# Run main function
main "$@"
