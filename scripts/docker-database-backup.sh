#!/bin/bash

# Docker-based Database Backup Script for RevivaTech
# Uses Docker to perform PostgreSQL backups without requiring PostgreSQL client tools on host

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-revivatech_new_database}"
DB_NAME="${DB_NAME:-revivatech_new}"
DB_USER="${DB_USER:-revivatech_user}"
DB_PASSWORD="${DB_PASSWORD:-revivatech_password}"

# Backup configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/database}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_PREFIX="revivatech_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="${BACKUP_PREFIX}_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILENAME}.gz"

# Monitoring
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERT="${EMAIL_ALERT:-admin@revivatech.co.uk}"
LOG_FILE="/var/log/revivatech/backup.log"

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

# Create directories and log file
setup_directories() {
    log "Setting up backup directories and logging"
    
    # Create backup directory
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$(dirname "$LOG_FILE")"
    
    # Set proper permissions
    sudo chmod 755 "$BACKUP_DIR"
    sudo chown "$USER:$USER" "$BACKUP_DIR"
    touch "$LOG_FILE" 2>/dev/null || sudo touch "$LOG_FILE"
    
    success "Directories and logging configured"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Please install Docker."
        exit 1
    fi
    
    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        error "Database container $CONTAINER_NAME is not running"
        exit 1
    fi
    
    # Check if gzip is available on host
    if ! command -v gzip &> /dev/null; then
        error "gzip not found. Please install gzip for compression."
        exit 1
    fi
    
    # Test database connection through Docker
    if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Cannot connect to database $DB_NAME in container $CONTAINER_NAME"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Perform database backup using Docker
perform_backup() {
    log "Starting database backup for $DB_NAME using Docker container $CONTAINER_NAME"
    
    local backup_path="$BACKUP_DIR/$BACKUP_FILENAME"
    local compressed_path="$BACKUP_DIR/$BACKUP_COMPRESSED"
    local start_time=$(date +%s)
    
    # Create backup with pg_dump inside container
    log "Creating database dump using Docker..."
    docker exec "$CONTAINER_NAME" pg_dump \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --no-owner \
        --no-privileges > "$backup_path"
    
    if [[ $? -ne 0 ]]; then
        error "Database backup failed"
        cleanup_failed_backup "$backup_path"
        exit 1
    fi
    
    # Verify backup file was created and has content
    if [[ ! -f "$backup_path" ]] || [[ ! -s "$backup_path" ]]; then
        error "Backup file is empty or was not created"
        cleanup_failed_backup "$backup_path"
        exit 1
    fi
    
    # Compress backup on host
    log "Compressing backup..."
    gzip "$backup_path"
    
    if [[ $? -ne 0 ]]; then
        error "Backup compression failed"
        cleanup_failed_backup "$compressed_path"
        exit 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local backup_size=$(du -h "$compressed_path" | cut -f1)
    
    success "Backup completed successfully"
    log "Backup file: $compressed_path"
    log "Backup size: $backup_size"
    log "Duration: ${duration} seconds"
    
    # Verify backup integrity
    verify_backup "$compressed_path"
}

# Verify backup integrity
verify_backup() {
    local compressed_path="$1"
    log "Verifying backup integrity"
    
    # Test gzip integrity
    if ! gzip -t "$compressed_path"; then
        error "Backup compression integrity check failed"
        send_alert "CRITICAL: Backup integrity check failed for $compressed_path"
        exit 1
    fi
    
    # Test if SQL content looks valid
    if ! zcat "$compressed_path" | head -20 | grep -q "PostgreSQL database dump"; then
        warning "Backup may not contain valid PostgreSQL dump"
        send_alert "WARNING: Backup content verification failed for $compressed_path"
    fi
    
    success "Backup integrity verification passed"
}

# Cleanup failed backup
cleanup_failed_backup() {
    local backup_path="$1"
    log "Cleaning up failed backup"
    
    [[ -f "$backup_path" ]] && rm -f "$backup_path"
    [[ -f "${backup_path}.gz" ]] && rm -f "${backup_path}.gz"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days"
    
    local deleted_count=0
    local total_size_freed=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        local size=$(stat -c%s "$file" 2>/dev/null || echo 0)
        total_size_freed=$((total_size_freed + size))
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
    
    if [[ $deleted_count -gt 0 ]]; then
        local size_mb=$((total_size_freed / 1024 / 1024))
        success "Cleaned up $deleted_count old backup(s), freed ${size_mb}MB"
    else
        log "No old backups to clean up"
    fi
}

# List current backups
list_backups() {
    log "Current backups in $BACKUP_DIR:"
    
    if ls "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql.gz 1> /dev/null 2>&1; then
        ls -lah "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql.gz | while read -r line; do
            log "  $line"
        done
        
        local count=$(ls -1 "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql.gz | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "Unknown")
        log "Total: $count backup(s), $total_size total size"
    else
        log "No backups found"
    fi
}

# Send alert notification
send_alert() {
    local message="$1"
    local severity="${2:-INFO}"
    
    log "Sending $severity alert: $message"
    
    # Send Slack notification if webhook is configured
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji="ℹ️"
        case "$severity" in
            "CRITICAL") emoji="🚨" ;;
            "WARNING") emoji="⚠️" ;;
            "SUCCESS") emoji="✅" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "text": "$emoji RevivaTech Database Backup Alert",
    "attachments": [
        {
            "color": "$(case "$severity" in "CRITICAL") echo "danger" ;; "WARNING") echo "warning" ;; "SUCCESS") echo "good" ;; *) echo "good" ;; esac)",
            "fields": [
                {
                    "title": "Severity",
                    "value": "$severity",
                    "short": true
                },
                {
                    "title": "Database",
                    "value": "$DB_NAME",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Timestamp",
                    "value": "$(date)",
                    "short": true
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
    
    # Send email notification if configured
    if [[ -n "$EMAIL_ALERT" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "RevivaTech Database Backup Alert: $severity" "$EMAIL_ALERT" || true
    fi
}

# Generate backup report
generate_report() {
    local report_file="/tmp/backup_report_${TIMESTAMP}.txt"
    
    {
        echo "RevivaTech Database Backup Report"
        echo "=================================="
        echo "Date: $(date)"
        echo "Database: $DB_NAME"
        echo "Container: $CONTAINER_NAME"
        echo
        echo "Backup Details:"
        echo "---------------"
        if [[ -f "$BACKUP_DIR/$BACKUP_COMPRESSED" ]]; then
            echo "✅ Backup completed successfully"
            echo "File: $BACKUP_DIR/$BACKUP_COMPRESSED"
            echo "Size: $(du -h "$BACKUP_DIR/$BACKUP_COMPRESSED" | cut -f1)"
            echo "Created: $(date -r "$BACKUP_DIR/$BACKUP_COMPRESSED")"
        else
            echo "❌ Backup failed or file missing"
        fi
        echo
        echo "Backup History:"
        echo "---------------"
        if ls "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql.gz 1> /dev/null 2>&1; then
            ls -lah "$BACKUP_DIR"/${BACKUP_PREFIX}_*.sql.gz | tail -10
        else
            echo "No backup files found"
        fi
        echo
        echo "System Information:"
        echo "-------------------"
        echo "Disk space: $(df -h "$BACKUP_DIR" | tail -1)"
        echo "Container status: $(docker ps --format "{{.Names}}\t{{.Status}}" | grep "$CONTAINER_NAME" || echo "Not running")"
        echo "Database size: $(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs || echo "Unknown")"
        echo
    } > "$report_file"
    
    log "Backup report generated: $report_file"
    cat "$report_file"
}

# Health check using Docker
health_check() {
    log "Performing database health check using Docker"
    
    # Check container status
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        error "Container $CONTAINER_NAME is not running"
        return 1
    fi
    
    # Check database connection
    if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Database connection failed"
        return 1
    fi
    
    # Check database size
    local db_size
    db_size=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs || echo "Unknown")
    log "Database size: $db_size"
    
    # Check table count
    local table_count
    table_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "Unknown")
    log "Table count: $table_count"
    
    # Check container health
    local container_health
    container_health=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
    log "Container health: $container_health"
    
    success "Database health check completed"
}

# Validate backup by testing restore to temporary database
validate_backup() {
    local compressed_path="$1"
    local test_db_name="${DB_NAME}_backup_test_${TIMESTAMP}"
    
    log "Validating backup by testing restore to temporary database"
    
    # Create test database inside container
    docker exec "$CONTAINER_NAME" createdb -U "$DB_USER" "$test_db_name" 2>/dev/null || {
        warning "Could not create test database for validation"
        return 1
    }
    
    # Restore backup to test database
    if zcat "$compressed_path" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$test_db_name" --quiet > /dev/null 2>&1; then
        success "Backup validation successful - restore test passed"
        
        # Cleanup test database
        docker exec "$CONTAINER_NAME" dropdb -U "$DB_USER" "$test_db_name" 2>/dev/null || true
        return 0
    else
        error "Backup validation failed - restore test failed"
        
        # Cleanup test database
        docker exec "$CONTAINER_NAME" dropdb -U "$DB_USER" "$test_db_name" 2>/dev/null || true
        return 1
    fi
}

# Setup automated backups with cron
setup_automated_backups() {
    log "Setting up automated backup cron jobs"
    
    local daily_backup_script="/opt/webapps/revivatech/scripts/daily-backup.sh"
    local weekly_validation_script="/opt/webapps/revivatech/scripts/weekly-backup-validation.sh"
    
    # Create daily backup script
    cat > "$daily_backup_script" << 'EOF'
#!/bin/bash
# Daily database backup for RevivaTech
cd /opt/webapps/revivatech/scripts
./docker-database-backup.sh
EOF
    
    # Create weekly validation script
    cat > "$weekly_validation_script" << 'EOF'
#!/bin/bash
# Weekly backup validation for RevivaTech
cd /opt/webapps/revivatech/scripts
./docker-database-backup.sh --validate
EOF
    
    chmod +x "$daily_backup_script" "$weekly_validation_script"
    
    # Add to crontab
    local daily_cron="0 2 * * * $daily_backup_script"
    local weekly_cron="0 3 * * 0 $weekly_validation_script"  # Sunday at 3 AM
    local cleanup_cron="0 4 * * 0 $0 --cleanup"  # Sunday at 4 AM
    
    local current_cron
    current_cron=$(crontab -l 2>/dev/null || echo "")
    
    # Add daily backup cron if not exists
    if ! echo "$current_cron" | grep -q "daily-backup.sh"; then
        (echo "$current_cron"; echo "$daily_cron") | crontab -
        success "Daily backup cron job added (2 AM daily)"
    fi
    
    # Add weekly validation cron if not exists
    if ! echo "$current_cron" | grep -q "weekly-backup-validation.sh"; then
        (echo "$current_cron"; echo "$weekly_cron") | crontab -
        success "Weekly validation cron job added (3 AM Sunday)"
    fi
    
    # Add cleanup cron if not exists
    if ! echo "$current_cron" | grep -q "docker-database-backup.sh --cleanup"; then
        (echo "$current_cron"; echo "$cleanup_cron") | crontab -
        success "Weekly cleanup cron job added (4 AM Sunday)"
    fi
    
    success "Automated backup system configured"
    log "Daily backups: 2 AM every day"
    log "Weekly validation: 3 AM every Sunday"
    log "Cleanup old backups: 4 AM every Sunday"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

RevivaTech Docker-based Database Backup Script

OPTIONS:
    --validate          Validate backup by testing restore
    --list             List current backups
    --cleanup          Clean up old backups only
    --health-check     Perform database health check
    --setup-cron       Setup automated backup cron jobs
    --help             Show this help message

ENVIRONMENT VARIABLES:
    CONTAINER_NAME     Database container name (default: revivatech_new_database)
    DB_NAME            Database name (default: revivatech_new)
    DB_USER            Database user (default: revivatech_user)
    DB_PASSWORD        Database password (default: revivatech_password)
    BACKUP_DIR         Backup directory (default: /opt/backups/database)
    RETENTION_DAYS     Backup retention in days (default: 30)
    SLACK_WEBHOOK_URL  Slack webhook for notifications (optional)
    EMAIL_ALERT        Email for notifications (default: admin@revivatech.co.uk)

EXAMPLES:
    $0                 Perform full backup
    $0 --validate      Perform backup with validation
    $0 --list          List current backups
    $0 --cleanup       Clean up old backups only
    $0 --setup-cron    Setup automated backups

EOF
}

# Main execution
main() {
    local validate=false
    local list_only=false
    local cleanup_only=false
    local health_check_only=false
    local setup_cron_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --validate)
                validate=true
                shift
                ;;
            --list)
                list_only=true
                shift
                ;;
            --cleanup)
                cleanup_only=true
                shift
                ;;
            --health-check)
                health_check_only=true
                shift
                ;;
            --setup-cron)
                setup_cron_only=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Setup
    setup_directories
    
    if [[ "$setup_cron_only" == true ]]; then
        setup_automated_backups
        exit 0
    fi
    
    if [[ "$health_check_only" == true ]]; then
        health_check
        exit 0
    fi
    
    if [[ "$list_only" == true ]]; then
        list_backups
        exit 0
    fi
    
    if [[ "$cleanup_only" == true ]]; then
        cleanup_old_backups
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Perform health check
    health_check
    
    # Perform backup
    perform_backup
    
    # Validate backup if requested
    if [[ "$validate" == true ]]; then
        if ! validate_backup "$BACKUP_DIR/$BACKUP_COMPRESSED"; then
            send_alert "Backup validation failed for $BACKUP_DIR/$BACKUP_COMPRESSED" "CRITICAL"
            exit 1
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # List current backups
    list_backups
    
    # Generate report
    generate_report
    
    # Send success notification
    send_alert "Database backup completed successfully: $BACKUP_DIR/$BACKUP_COMPRESSED" "SUCCESS"
    
    success "Database backup process completed successfully"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi