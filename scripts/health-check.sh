#!/bin/bash

################################################################################
# Health Check Script for Analisi Tracker
#
# Description: Comprehensive health monitoring for the application
# Usage: ./scripts/health-check.sh [--verbose|--alert]
################################################################################

set -e

# Configuration
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
ISSUES=0
WARNINGS=0

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; ((ISSUES++)); }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; ((WARNINGS++)); }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

################################################################################
# Check application health endpoint
################################################################################
check_app_health() {
    log "Checking application health endpoint..."

    local response=$(curl -s -w "\n%{http_code}" "${HEALTH_URL}" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "200" ]; then
        success "Application health check passed"

        # Display health info
        if [ "$1" == "--verbose" ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    else
        error "Application health check failed (HTTP $http_code)"
    fi
}

################################################################################
# Check Redis connection
################################################################################
check_redis() {
    log "Checking Redis connection..."

    if command -v redis-cli &> /dev/null; then
        local response=$(redis-cli -h "${REDIS_HOST}" -p "${REDIS_PORT}" PING 2>/dev/null)

        if [ "$response" == "PONG" ]; then
            success "Redis is responsive"
        else
            error "Redis is not responding"
        fi
    else
        # Try using Docker
        if docker-compose exec redis redis-cli PING | grep -q "PONG" 2>/dev/null; then
            success "Redis is responsive (via Docker)"
        else
            error "Redis is not responding"
        fi
    fi
}

################################################################################
# Check Docker containers
################################################################################
check_docker() {
    log "Checking Docker containers..."

    local containers=$(docker-compose ps 2>/dev/null | grep -c "Up" || true)

    if [ "$containers" -ge 2 ]; then
        success "Docker containers running ($containers containers)"
    else
        error "Not all Docker containers are running"
        docker-compose ps
    fi
}

################################################################################
# Check disk space
################################################################################
check_disk_space() {
    log "Checking disk space..."

    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -lt 80 ]; then
        success "Disk space OK (${disk_usage}% used)"
    elif [ "$disk_usage" -lt 90 ]; then
        warning "Disk space getting high (${disk_usage}% used)"
    else
        error "Disk space critically low (${disk_usage}% used)"
    fi
}

################################################################################
# Check memory usage
################################################################################
check_memory() {
    log "Checking memory usage..."

    local mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2 }')

    if [ "$mem_usage" -lt 80 ]; then
        success "Memory usage OK (${mem_usage}% used)"
    elif [ "$mem_usage" -lt 90 ]; then
        warning "Memory usage getting high (${mem_usage}% used)"
    else
        error "Memory usage critically high (${mem_usage}% used)"
    fi
}

################################################################################
# Check CPU load
################################################################################
check_cpu() {
    log "Checking CPU load..."

    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)

    # Convert load to integer for comparison
    local load_int=$(echo "$load_avg" | cut -d. -f1)

    if [ "$load_int" -lt "$cpu_count" ]; then
        success "CPU load OK (${load_avg}, ${cpu_count} cores)"
    elif [ "$load_int" -lt $((cpu_count * 2)) ]; then
        warning "CPU load getting high (${load_avg}, ${cpu_count} cores)"
    else
        error "CPU load critically high (${load_avg}, ${cpu_count} cores)"
    fi
}

################################################################################
# Check application logs for errors
################################################################################
check_logs() {
    log "Checking recent logs for errors..."

    local error_count=$(docker-compose logs --tail=100 app 2>/dev/null | grep -i "error" | wc -l)

    if [ "$error_count" -eq 0 ]; then
        success "No errors in recent logs"
    elif [ "$error_count" -lt 5 ]; then
        warning "Found $error_count errors in recent logs"
    else
        error "Found $error_count errors in recent logs"
    fi
}

################################################################################
# Check SSL certificate (if applicable)
################################################################################
check_ssl() {
    log "Checking SSL certificate..."

    local domain=$(echo "${HEALTH_URL}" | sed -e 's|^[^/]*//||' -e 's|/.*$||')

    if [ "$domain" != "localhost" ] && [ "$domain" != "127.0.0.1" ]; then
        local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)

        if [ -n "$expiry_date" ]; then
            local expiry_epoch=$(date -d "$expiry_date" +%s)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))

            if [ "$days_until_expiry" -gt 30 ]; then
                success "SSL certificate valid ($days_until_expiry days remaining)"
            elif [ "$days_until_expiry" -gt 7 ]; then
                warning "SSL certificate expiring soon ($days_until_expiry days remaining)"
            else
                error "SSL certificate expiring very soon ($days_until_expiry days remaining)"
            fi
        else
            warning "Could not check SSL certificate"
        fi
    else
        log "Skipping SSL check for localhost"
    fi
}

################################################################################
# Send alert if issues found
################################################################################
send_alert() {
    local status="$1"

    if [ "$ISSUES" -gt 0 ] && [ -n "${ALERT_WEBHOOK}" ]; then
        log "Sending alert notification..."

        local color="danger"
        [ "${status}" == "warning" ] && color="warning"

        curl -X POST "${ALERT_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"Health Check Alert\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"${status}\", \"short\": true},
                        {\"title\": \"Issues\", \"value\": \"${ISSUES}\", \"short\": true},
                        {\"title\": \"Warnings\", \"value\": \"${WARNINGS}\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" 2>/dev/null || true
    fi
}

################################################################################
# Main health check
################################################################################
main() {
    local verbose="$1"

    echo ""
    echo "========================================="
    echo "Analisi Tracker Health Check"
    echo "Time: $(date)"
    echo "========================================="
    echo ""

    # Run all checks
    check_docker
    check_app_health "$verbose"
    check_redis
    check_disk_space
    check_memory
    check_cpu
    check_logs
    check_ssl

    # Summary
    echo ""
    echo "========================================="
    echo "Health Check Summary"
    echo "========================================="

    if [ "$ISSUES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        success "All systems operational"
        echo ""
        return 0
    elif [ "$ISSUES" -eq 0 ]; then
        warning "System operational with ${WARNINGS} warnings"
        send_alert "warning"
        echo ""
        return 0
    else
        error "System has ${ISSUES} issues and ${WARNINGS} warnings"
        send_alert "critical"
        echo ""
        return 1
    fi
}

# Run main function
main "$@"
