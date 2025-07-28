#!/bin/bash

# RevivaTech Production Deployment Script
# Automated deployment with safety checks and rollback capability

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="/opt/backups/revivatech"
LOG_FILE="/var/log/revivatech-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "curl" "jq" "nginx")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command not found: $cmd"
        fi
    done
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_DIR/.env.production" ]]; then
        error "Production environment file not found: $PROJECT_DIR/.env.production"
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/backup_$timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    log "Backing up database..."
    docker exec revivatech_database_prod pg_dump -U revivatech_user revivatech_prod > "$backup_path/database.sql" || warning "Database backup failed"
    
    # Backup redis data
    log "Backing up Redis data..."
    docker exec revivatech_redis_prod redis-cli --rdb /data/dump.rdb
    docker cp revivatech_redis_prod:/data/dump.rdb "$backup_path/redis.rdb" || warning "Redis backup failed"
    
    # Backup nginx configuration
    log "Backing up Nginx configuration..."
    cp -r /etc/nginx "$backup_path/nginx_config" || warning "Nginx config backup failed"
    
    # Backup application files
    log "Backing up application files..."
    tar -czf "$backup_path/application.tar.gz" -C "$PROJECT_DIR" . --exclude='.git' --exclude='node_modules' --exclude='.next'
    
    echo "$backup_path" > "$BACKUP_DIR/latest_backup"
    success "Backup created: $backup_path"
}

# Health check function
health_check() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts=30
    local attempt=1
    
    log "Performing health check for $service_name..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f "$service_url/health" &>/dev/null; then
            success "$service_name is healthy"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "$service_name health check failed after $max_attempts attempts"
}

# Deploy function
deploy() {
    log "Starting production deployment..."
    
    cd "$PROJECT_DIR"
    
    # Pull latest code (if using git deployment)
    if [[ -d .git ]]; then
        log "Pulling latest code..."
        git pull origin main
    fi
    
    # Build production images
    log "Building production images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Stop existing services gracefully
    log "Stopping existing services..."
    docker-compose -f docker-compose.production.yml down --timeout 30
    
    # Start new services
    log "Starting new services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Health checks
    health_check "http://localhost:3010/api" "Frontend"
    health_check "http://localhost:3011" "Backend API"
    
    # Test external endpoints
    log "Testing external endpoints..."
    if curl -f -k "https://revivatech.co.uk/api/health" &>/dev/null; then
        success "External endpoint test passed"
    else
        warning "External endpoint test failed - check Cloudflare/DNS configuration"
    fi
    
    success "Production deployment completed successfully"
}

# Rollback function
rollback() {
    local backup_path="$1"
    
    log "Starting rollback to backup: $backup_path"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup path not found: $backup_path"
    fi
    
    cd "$PROJECT_DIR"
    
    # Stop current services
    log "Stopping current services..."
    docker-compose -f docker-compose.production.yml down --timeout 30
    
    # Restore application files
    log "Restoring application files..."
    tar -xzf "$backup_path/application.tar.gz" -C "$PROJECT_DIR"
    
    # Restore database
    log "Restoring database..."
    if [[ -f "$backup_path/database.sql" ]]; then
        docker-compose -f docker-compose.production.yml up -d revivatech_database_prod
        sleep 30
        docker exec -i revivatech_database_prod psql -U revivatech_user -d revivatech_prod < "$backup_path/database.sql"
    fi
    
    # Start services
    log "Starting restored services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Health checks
    sleep 30
    health_check "http://localhost:3010/api" "Frontend"
    health_check "http://localhost:3011" "Backend API"
    
    success "Rollback completed successfully"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    find "$BACKUP_DIR" -name "backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    success "Backup cleanup completed"
}

# Main execution
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            check_prerequisites
            create_backup
            deploy
            cleanup_backups
            ;;
        "rollback")
            local backup_path="${2:-$(cat $BACKUP_DIR/latest_backup 2>/dev/null || echo '')}"
            if [[ -z "$backup_path" ]]; then
                error "No backup path specified and no latest backup found"
            fi
            rollback "$backup_path"
            ;;
        "health")
            health_check "http://localhost:3010/api" "Frontend"
            health_check "http://localhost:3011" "Backend API"
            ;;
        "backup")
            create_backup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback [backup_path]|health|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy          - Full production deployment"
            echo "  rollback        - Rollback to latest backup"
            echo "  rollback <path> - Rollback to specific backup"
            echo "  health          - Check service health"
            echo "  backup          - Create backup only"
            exit 1
            ;;
    esac
}

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Execute main function
main "$@"