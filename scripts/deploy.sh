#!/bin/bash

# Automated Deployment Pipeline for RevivaTech
# Handles zero-downtime deployments with health checks, rollbacks, and monitoring

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV="${DEPLOY_ENV:-production}"
PROJECT_ROOT="${PROJECT_ROOT:-/opt/webapps/revivatech}"
DEPLOY_CONFIG_FILE="${DEPLOY_CONFIG_FILE:-$PROJECT_ROOT/config/deploy.conf}"
LOG_FILE="${LOG_FILE:-/var/log/revivatech/deploy.log}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/deployments}"

# Deployment settings
DEPLOYMENT_STRATEGY="${DEPLOYMENT_STRATEGY:-rolling}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
ROLLBACK_TIMEOUT="${ROLLBACK_TIMEOUT:-600}"
PRE_DEPLOYMENT_BACKUP="${PRE_DEPLOYMENT_BACKUP:-true}"

# Services configuration
SERVICES=(
    "revivatech_new_frontend:3010:http://localhost:3010/health"
    "revivatech_new_backend:3011:http://localhost:3011/health"
    "revivatech_new_database:5435:postgres"
    "revivatech_new_redis:6383:redis"
)

# Git configuration
GIT_BRANCH="${GIT_BRANCH:-main}"
GIT_REMOTE="${GIT_REMOTE:-origin}"

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERT="${EMAIL_ALERT:-admin@revivatech.co.uk}"

# Functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

warning() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

# Setup deployment infrastructure
setup_deployment() {
    log "Setting up deployment infrastructure"
    
    # Create directories
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Set permissions
    chmod 750 "$BACKUP_DIR"
    chmod 640 "$LOG_FILE" 2>/dev/null || touch "$LOG_FILE"
    
    success "Deployment infrastructure setup completed"
}

# Load deployment configuration
load_config() {
    if [[ -f "$DEPLOY_CONFIG_FILE" ]]; then
        source "$DEPLOY_CONFIG_FILE"
        log "Loaded deployment configuration from $DEPLOY_CONFIG_FILE"
    else
        log "No deployment configuration file found, using defaults"
    fi
}

# Validate deployment prerequisites
validate_prerequisites() {
    log "Validating deployment prerequisites"
    
    # Check if we're in a git repository
    if ! git rev-parse --is-inside-work-tree &> /dev/null; then
        error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        error "Uncommitted changes detected. Please commit or stash changes before deployment."
        exit 1
    fi
    
    # Check required tools
    for tool in docker docker-compose git curl jq; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool not found. Please install required tools."
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon not running"
        exit 1
    fi
    
    success "Prerequisites validation passed"
}

# Get current deployment version
get_current_version() {
    local current_commit
    current_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    echo "$current_commit"
}

# Get target deployment version
get_target_version() {
    local target_branch="${1:-$GIT_BRANCH}"
    
    # Fetch latest changes
    git fetch "$GIT_REMOTE" "$target_branch" &> /dev/null
    
    local target_commit
    target_commit=$(git rev-parse "$GIT_REMOTE/$target_branch" 2>/dev/null || echo "unknown")
    echo "$target_commit"
}

# Create deployment backup
create_deployment_backup() {
    local version="$1"
    local backup_name="deployment_backup_${version}_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log "Creating deployment backup: $backup_name"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup application code
    log "Backing up application code..."
    tar -czf "$backup_path/application.tar.gz" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.log' \
        -C "$PROJECT_ROOT" .
    
    # Backup database if enabled
    if [[ "$PRE_DEPLOYMENT_BACKUP" == "true" ]]; then
        log "Backing up database..."
        if [[ -f "$PROJECT_ROOT/scripts/database-backup.sh" ]]; then
            BACKUP_DIR="$backup_path" "$PROJECT_ROOT/scripts/database-backup.sh" &> /dev/null
        fi
    fi
    
    # Backup Docker images
    log "Backing up Docker images..."
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        
        if docker ps --format '{{.Names}}' | grep -q "^$container_name$"; then
            local image_id
            image_id=$(docker inspect --format='{{.Image}}' "$container_name" 2>/dev/null || echo "")
            
            if [[ -n "$image_id" ]]; then
                docker save "$image_id" | gzip > "$backup_path/${container_name}_image.tar.gz"
            fi
        fi
    done
    
    # Create backup metadata
    cat > "$backup_path/metadata.json" << EOF
{
    "backup_name": "$backup_name",
    "created_at": "$(date -Iseconds)",
    "git_commit": "$version",
    "git_branch": "$GIT_BRANCH",
    "environment": "$DEPLOY_ENV",
    "services": [$(printf '"%s",' "${SERVICES[@]}" | sed 's/,$//')],
    "backup_path": "$backup_path"
}
EOF
    
    success "Deployment backup created: $backup_path"
    echo "$backup_path"
}

# Health check for service
check_service_health() {
    local container_name="$1"
    local port="$2"
    local health_url="$3"
    local timeout="${4:-30}"
    
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # Check if container is running
        if ! docker ps --format '{{.Names}}' | grep -q "^$container_name$"; then
            log "Container $container_name is not running"
            return 1
        fi
        
        # Check service endpoint
        if [[ "$health_url" == "postgres" ]]; then
            if timeout 5 nc -z localhost "$port" 2>/dev/null; then
                return 0
            fi
        elif [[ "$health_url" == "redis" ]]; then
            if timeout 5 redis-cli -p "$port" ping 2>/dev/null | grep -q "PONG"; then
                return 0
            fi
        else
            if curl -s -f -m 5 "$health_url" > /dev/null 2>&1; then
                return 0
            fi
        fi
        
        sleep 2
    done
    
    return 1
}

# Wait for all services to be healthy
wait_for_services() {
    local timeout="${1:-$HEALTH_CHECK_TIMEOUT}"
    local failed_services=()
    
    log "Waiting for services to become healthy (timeout: ${timeout}s)"
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        
        log "Checking health of $container_name..."
        
        if check_service_health "$container_name" "$port" "$health_url" "$timeout"; then
            success "Service $container_name is healthy"
        else
            error "Service $container_name failed health check"
            failed_services+=("$container_name")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        error "Health check failed for services: ${failed_services[*]}"
        return 1
    else
        success "All services are healthy"
        return 0
    fi
}

# Rolling deployment strategy
deploy_rolling() {
    local target_version="$1"
    
    log "Starting rolling deployment to version $target_version"
    
    # Update application code
    log "Updating application code..."
    git checkout "$GIT_REMOTE/$GIT_BRANCH"
    git reset --hard "$target_version"
    
    # Deploy services one by one
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        
        # Skip database and redis for rolling updates
        if [[ "$container_name" =~ (database|redis) ]]; then
            log "Skipping $container_name in rolling deployment"
            continue
        fi
        
        log "Deploying $container_name..."
        
        # Build and start new container
        if [[ "$container_name" == "revivatech_new_frontend" ]]; then
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" build frontend
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d frontend
        elif [[ "$container_name" == "revivatech_new_backend" ]]; then
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" build backend
            docker-compose -f "$PROJECT_ROOT/docker-compose.yml" up -d backend
        fi
        
        # Wait for service to be healthy
        if check_service_health "$container_name" "$port" "$health_url" "$HEALTH_CHECK_TIMEOUT"; then
            success "Successfully deployed $container_name"
        else
            error "Failed to deploy $container_name"
            return 1
        fi
        
        # Brief pause between service deployments
        sleep 5
    done
    
    success "Rolling deployment completed"
}

# Blue-green deployment strategy
deploy_blue_green() {
    local target_version="$1"
    
    log "Starting blue-green deployment to version $target_version"
    
    # This would require setting up blue-green infrastructure
    # For now, we'll use rolling deployment
    warning "Blue-green deployment not fully implemented, falling back to rolling deployment"
    deploy_rolling "$target_version"
}

# Run database migrations
run_migrations() {
    log "Running database migrations"
    
    if [[ -f "$PROJECT_ROOT/scripts/database-migration.sh" ]]; then
        if "$PROJECT_ROOT/scripts/database-migration.sh" migrate; then
            success "Database migrations completed"
        else
            error "Database migrations failed"
            return 1
        fi
    else
        log "No migration script found, skipping database migrations"
    fi
}

# Rollback deployment
rollback_deployment() {
    local backup_path="$1"
    local force="${2:-false}"
    
    log "Starting deployment rollback from backup: $backup_path"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup path not found: $backup_path"
        exit 1
    fi
    
    # Load backup metadata
    local metadata_file="$backup_path/metadata.json"
    if [[ ! -f "$metadata_file" ]]; then
        error "Backup metadata not found"
        exit 1
    fi
    
    local backup_commit
    backup_commit=$(jq -r '.git_commit' "$metadata_file" 2>/dev/null || echo "unknown")
    
    log "Rolling back to commit: $backup_commit"
    
    # Restore application code
    log "Restoring application code..."
    tar -xzf "$backup_path/application.tar.gz" -C "$PROJECT_ROOT"
    
    # Restore database if backup exists
    if [[ -f "$backup_path/revivatech_db_"*.sql.gz ]]; then
        log "Restoring database..."
        local db_backup
        db_backup=$(ls "$backup_path"/revivatech_db_*.sql.gz | head -1)
        
        if [[ -n "$db_backup" && "$force" == "true" ]]; then
            # Restore database (requires confirmation in production)
            warning "Database restore requires manual intervention in production"
        fi
    fi
    
    # Restore Docker images and restart services
    log "Restoring and restarting services..."
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        
        local image_backup="$backup_path/${container_name}_image.tar.gz"
        if [[ -f "$image_backup" ]]; then
            log "Restoring image for $container_name..."
            docker load < "$image_backup"
        fi
        
        # Restart container
        docker restart "$container_name" || true
    done
    
    # Wait for services to be healthy
    if wait_for_services; then
        success "Rollback completed successfully"
    else
        error "Rollback completed but some services are not healthy"
        return 1
    fi
}

# Deploy specific version
deploy_version() {
    local target_version="$1"
    local skip_backup="${2:-false}"
    
    local current_version
    current_version=$(get_current_version)
    
    log "Starting deployment from $current_version to $target_version"
    
    # Send deployment start notification
    send_notification "Deployment Started" "INFO" "Deploying RevivaTech from $current_version to $target_version"
    
    local backup_path=""
    local deployment_failed=false
    
    # Create backup if not skipped
    if [[ "$skip_backup" != "true" ]]; then
        backup_path=$(create_deployment_backup "$current_version")
    fi
    
    # Run pre-deployment hooks
    if [[ -f "$PROJECT_ROOT/scripts/pre-deploy.sh" ]]; then
        log "Running pre-deployment hooks..."
        if ! "$PROJECT_ROOT/scripts/pre-deploy.sh"; then
            error "Pre-deployment hooks failed"
            deployment_failed=true
        fi
    fi
    
    # Run database migrations
    if [[ "$deployment_failed" != "true" ]]; then
        if ! run_migrations; then
            deployment_failed=true
        fi
    fi
    
    # Deploy using selected strategy
    if [[ "$deployment_failed" != "true" ]]; then
        case "$DEPLOYMENT_STRATEGY" in
            "rolling")
                if ! deploy_rolling "$target_version"; then
                    deployment_failed=true
                fi
                ;;
            "blue-green")
                if ! deploy_blue_green "$target_version"; then
                    deployment_failed=true
                fi
                ;;
            *)
                error "Unknown deployment strategy: $DEPLOYMENT_STRATEGY"
                deployment_failed=true
                ;;
        esac
    fi
    
    # Wait for services to be healthy
    if [[ "$deployment_failed" != "true" ]]; then
        if ! wait_for_services; then
            deployment_failed=true
        fi
    fi
    
    # Run post-deployment hooks
    if [[ "$deployment_failed" != "true" && -f "$PROJECT_ROOT/scripts/post-deploy.sh" ]]; then
        log "Running post-deployment hooks..."
        if ! "$PROJECT_ROOT/scripts/post-deploy.sh"; then
            warning "Post-deployment hooks failed, but deployment continues"
        fi
    fi
    
    # Handle deployment result
    if [[ "$deployment_failed" == "true" ]]; then
        error "Deployment failed!"
        send_notification "Deployment Failed" "CRITICAL" "Deployment of RevivaTech to $target_version failed"
        
        if [[ -n "$backup_path" ]]; then
            read -p "Do you want to rollback to the previous version? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback_deployment "$backup_path"
            fi
        fi
        
        exit 1
    else
        success "Deployment completed successfully!"
        send_notification "Deployment Completed" "SUCCESS" "RevivaTech successfully deployed to version $target_version"
        
        # Clean up old backups (keep last 5)
        cleanup_old_backups
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old deployment backups"
    
    local backup_count
    backup_count=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "deployment_backup_*" | wc -l)
    
    if [[ $backup_count -gt 5 ]]; then
        local to_remove=$((backup_count - 5))
        log "Removing $to_remove old backup(s)"
        
        find "$BACKUP_DIR" -maxdepth 1 -type d -name "deployment_backup_*" -printf '%T+ %p\n' | \
        sort | head -n "$to_remove" | cut -d' ' -f2- | \
        while read -r backup_dir; do
            log "Removing old backup: $(basename "$backup_dir")"
            rm -rf "$backup_dir"
        done
    fi
}

# Send notification
send_notification() {
    local title="$1"
    local severity="${2:-INFO}"
    local message="${3:-$title}"
    
    log "Sending $severity notification: $title"
    
    # Send Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji="ℹ️"
        local color="good"
        case "$severity" in
            "CRITICAL") emoji="🚨"; color="danger" ;;
            "WARNING") emoji="⚠️"; color="warning" ;;
            "SUCCESS") emoji="✅"; color="good" ;;
            "INFO") emoji="ℹ️"; color="#36a64f" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "text": "$emoji RevivaTech Deployment",
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$DEPLOY_ENV",
                    "short": true
                },
                {
                    "title": "Time",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Details",
                    "value": "$message",
                    "short": false
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # Send email notification
    if [[ -n "$EMAIL_ALERT" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "RevivaTech Deployment: $title ($severity)" "$EMAIL_ALERT" || true
    fi
}

# Show deployment status
show_status() {
    log "Deployment status"
    
    local current_version
    current_version=$(get_current_version)
    
    local target_version
    target_version=$(get_target_version)
    
    echo
    echo "Current version: $current_version"
    echo "Target version:  $target_version"
    echo "Environment:     $DEPLOY_ENV"
    echo "Strategy:        $DEPLOYMENT_STRATEGY"
    echo
    
    if [[ "$current_version" == "$target_version" ]]; then
        success "Deployment is up to date"
    else
        warning "Deployment is behind target version"
        echo "Changes to deploy:"
        git log --oneline "$current_version..$target_version" 2>/dev/null || echo "Unable to show changes"
    fi
    
    echo
    log "Service status:"
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        
        if docker ps --format '{{.Names}}' | grep -q "^$container_name$"; then
            local status="RUNNING"
            if [[ "$health_url" != "postgres" && "$health_url" != "redis" ]]; then
                if curl -s -f -m 5 "$health_url" > /dev/null 2>&1; then
                    status="HEALTHY"
                else
                    status="UNHEALTHY"
                fi
            fi
            echo "  $container_name: $status"
        else
            echo "  $container_name: STOPPED"
        fi
    done
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

RevivaTech Automated Deployment Pipeline

COMMANDS:
    deploy [VERSION]     Deploy specific version (default: latest)
    rollback BACKUP_PATH Rollback to previous deployment
    status               Show deployment status
    list-backups         List available deployment backups
    
OPTIONS:
    --strategy STRATEGY  Deployment strategy (rolling, blue-green)
    --env ENVIRONMENT    Target environment (default: production)
    --skip-backup        Skip creating deployment backup
    --force              Force operation
    --help               Show this help message

ENVIRONMENT VARIABLES:
    DEPLOY_ENV                Deployment environment
    DEPLOYMENT_STRATEGY       Deployment strategy
    GIT_BRANCH               Git branch to deploy
    SLACK_WEBHOOK_URL        Slack webhook for notifications
    EMAIL_ALERT              Email for notifications
    HEALTH_CHECK_TIMEOUT     Service health check timeout

EXAMPLES:
    $0 deploy                              Deploy latest version
    $0 deploy abc123                       Deploy specific commit
    $0 deploy --strategy blue-green        Deploy using blue-green strategy
    $0 rollback /opt/backups/deployment_*  Rollback to specific backup
    $0 status                              Show deployment status

EOF
}

# List available backups
list_backups() {
    log "Available deployment backups:"
    
    if ls "$BACKUP_DIR"/deployment_backup_* 1> /dev/null 2>&1; then
        for backup_dir in "$BACKUP_DIR"/deployment_backup_*; do
            if [[ -d "$backup_dir" ]]; then
                local metadata_file="$backup_dir/metadata.json"
                if [[ -f "$metadata_file" ]]; then
                    local backup_name created_at git_commit
                    backup_name=$(jq -r '.backup_name' "$metadata_file" 2>/dev/null || echo "unknown")
                    created_at=$(jq -r '.created_at' "$metadata_file" 2>/dev/null || echo "unknown")
                    git_commit=$(jq -r '.git_commit' "$metadata_file" 2>/dev/null || echo "unknown")
                    
                    echo "  $backup_name"
                    echo "    Created: $created_at"
                    echo "    Commit:  $git_commit"
                    echo "    Path:    $backup_dir"
                    echo
                else
                    echo "  $(basename "$backup_dir") (no metadata)"
                fi
            fi
        done
    else
        log "No deployment backups found"
    fi
}

# Main execution
main() {
    local command="${1:-deploy}"
    local deployment_strategy="$DEPLOYMENT_STRATEGY"
    local deploy_env="$DEPLOY_ENV"
    local skip_backup=false
    local force=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --strategy)
                deployment_strategy="$2"
                shift 2
                ;;
            --env)
                deploy_env="$2"
                shift 2
                ;;
            --skip-backup)
                skip_backup=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            deploy|rollback|status|list-backups)
                command="$1"
                shift
                break
                ;;
            *)
                if [[ "$1" =~ ^-- ]]; then
                    error "Unknown option: $1"
                    usage
                    exit 1
                else
                    command="$1"
                    shift
                    break
                fi
                ;;
        esac
    done
    
    # Update environment variables
    export DEPLOYMENT_STRATEGY="$deployment_strategy"
    export DEPLOY_ENV="$deploy_env"
    
    # Setup
    setup_deployment
    load_config
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Execute command
    case "$command" in
        deploy)
            validate_prerequisites
            local target_version="${1:-$(get_target_version)}"
            deploy_version "$target_version" "$skip_backup"
            ;;
        rollback)
            local backup_path="${1:-}"
            if [[ -z "$backup_path" ]]; then
                error "Backup path required for rollback"
                usage
                exit 1
            fi
            rollback_deployment "$backup_path" "$force"
            ;;
        status)
            show_status
            ;;
        list-backups)
            list_backups
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi