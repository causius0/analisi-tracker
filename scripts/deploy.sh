#!/bin/bash

################################################################################
# Deployment Script for Analisi Tracker
#
# Description: Automated deployment script for Docker-based deployments
# Usage: ./scripts/deploy.sh [staging|production]
################################################################################

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "${SCRIPT_DIR}")"
DEPLOY_USER="${DEPLOY_USER:-appuser}"
DEPLOY_HOST="${DEPLOY_HOST:-localhost}"
DEPLOY_ENV="${1:-staging}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

################################################################################
# Pre-deployment checks
################################################################################
pre_deploy_checks() {
    log "Running pre-deployment checks..."

    # Check if we're in the right directory
    if [ ! -f "${PROJECT_DIR}/docker-compose.yml" ]; then
        error "docker-compose.yml not found. Are you in the project directory?"
        exit 1
    fi

    # Check if .env file exists
    if [ ! -f "${PROJECT_DIR}/.env.production" ]; then
        error ".env.production not found. Please create it first."
        exit 1
    fi

    # Check Docker is running
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed."
        exit 1
    fi

    log "✅ Pre-deployment checks passed"
}

################################################################################
# Backup before deployment
################################################################################
backup_before_deploy() {
    log "Creating backup before deployment..."

    "${SCRIPT_DIR}/backup.sh" all

    if [ $? -eq 0 ]; then
        log "✅ Backup created successfully"
    else
        error "❌ Backup failed. Aborting deployment."
        exit 1
    fi
}

################################################################################
# Pull latest code
################################################################################
pull_code() {
    log "Pulling latest code..."

    cd "${PROJECT_DIR}"
    git fetch origin
    git pull origin "${DEPLOY_ENV}"

    log "✅ Code updated"
}

################################################################################
# Build Docker images
################################################################################
build_images() {
    log "Building Docker images..."

    cd "${PROJECT_DIR}"
    docker-compose build --no-cache

    if [ $? -eq 0 ]; then
        log "✅ Docker images built successfully"
    else
        error "❌ Docker build failed"
        exit 1
    fi
}

################################################################################
# Run database migrations (if applicable)
################################################################################
run_migrations() {
    log "Checking for database migrations..."

    # Add migration logic here if you add a database
    # docker-compose exec app npm run migrate

    log "✅ Migrations completed (or not applicable)"
}

################################################################################
# Deploy application
################################################################################
deploy() {
    log "Deploying application..."

    cd "${PROJECT_DIR}"

    # Stop existing containers
    docker-compose down

    # Start new containers
    docker-compose up -d

    # Wait for application to be ready
    log "Waiting for application to start..."
    sleep 15

    log "✅ Application deployed"
}

################################################################################
# Health check
################################################################################
health_check() {
    log "Running health checks..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T app curl -s http://localhost:3000/health | grep -q "ok"; then
            log "✅ Health check passed"
            return 0
        fi

        log "Attempt $attempt/$max_attempts: Application not ready yet..."
        sleep 2
        ((attempt++))
    done

    error "❌ Health check failed after $max_attempts attempts"
    return 1
}

################################################################################
# Cleanup old Docker images
################################################################################
cleanup() {
    log "Cleaning up old Docker images..."

    docker image prune -f

    log "✅ Cleanup completed"
}

################################################################################
# Rollback on failure
################################################################################
rollback() {
    error "Deployment failed. Rolling back..."

    # Restore from backup
    "${SCRIPT_DIR}/restore.sh" "$(ls -t ${PROJECT_DIR}/backups/redis/redis-*.rdb.gz | head -1)"

    error "Rollback completed. Please check logs for details."
}

################################################################################
# Post-deployment notification
################################################################################
notify() {
    local status="$1"

    log "Sending deployment notification..."

    # Slack notification (if configured)
    if [ -n "${SLACK_WEBHOOK}" ]; then
        local color="good"
        [ "${status}" == "failed" ] && color="danger"

        curl -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"Deployment ${status}\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"${DEPLOY_ENV}\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"Host\", \"value\": \"${DEPLOY_HOST}\", \"short\": true}
                    ]
                }]
            }" 2>/dev/null || true
    fi

    log "✅ Notification sent"
}

################################################################################
# Main deployment flow
################################################################################
main() {
    log "========================================="
    log "Starting Deployment: ${DEPLOY_ENV}"
    log "Environment: ${DEPLOY_ENV}"
    log "Host: ${DEPLOY_HOST}"
    log "Time: $(date)"
    log "========================================="

    # Run deployment steps
    pre_deploy_checks
    backup_before_deploy
    pull_code
    build_images
    run_migrations
    deploy

    # Verify deployment
    if health_check; then
        cleanup
        notify "success"

        log "========================================="
        log "✅ Deployment Completed Successfully"
        log "========================================="
        log ""
        log "Application URL: http://${DEPLOY_HOST}:3000"
        log "Health check: http://${DEPLOY_HOST}:3000/health"
        log ""
        log "View logs: docker-compose logs -f"
        log "View status: docker-compose ps"
    else
        rollback
        notify "failed"
        exit 1
    fi
}

# Run main function
main "$@"
