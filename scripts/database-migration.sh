#!/bin/bash

# Production Database Migration Script for RevivaTech
# Handles database schema migrations, data migrations, and rollback procedures

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5435}"
DB_NAME="${DB_NAME:-revivatech_new}"
DB_USER="${DB_USER:-revivatech_user}"
DB_PASSWORD="${DB_PASSWORD:-revivatech_password}"

# Migration configuration
MIGRATION_DIR="${MIGRATION_DIR:-/opt/webapps/revivatech/migrations}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/migrations}"
LOG_FILE="/var/log/revivatech/migration.log"
MIGRATION_TABLE="schema_migrations"

# Monitoring
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

# Setup directories and migration tracking
setup_migration_infrastructure() {
    log "Setting up migration infrastructure"
    
    # Create directories
    mkdir -p "$MIGRATION_DIR"/{up,down,data}
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Set permissions
    chmod 750 "$MIGRATION_DIR" "$BACKUP_DIR"
    chmod 640 "$LOG_FILE" 2>/dev/null || touch "$LOG_FILE"
    
    # Create migration tracking table
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        CREATE TABLE IF NOT EXISTS $MIGRATION_TABLE (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            checksum VARCHAR(64),
            execution_time_ms INTEGER,
            rollback_script TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON $MIGRATION_TABLE(version);
    " &> /dev/null
    
    success "Migration infrastructure setup completed"
}

# Check prerequisites
check_prerequisites() {
    log "Checking migration prerequisites"
    
    # Check database connection
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" &> /dev/null; then
        error "Cannot connect to database $DB_NAME on $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    # Check required tools
    for tool in psql pg_dump sha256sum; do
        if ! command -v "$tool" &> /dev/null; then
            error "$tool not found. Please install PostgreSQL client tools."
            exit 1
        fi
    done
    
    success "Prerequisites check passed"
}

# Create migration backup
create_migration_backup() {
    local migration_version="$1"
    local backup_filename="pre_migration_${migration_version}_$(date +%Y%m%d_%H%M%S).sql"
    local backup_path="$BACKUP_DIR/$backup_filename"
    
    log "Creating pre-migration backup: $backup_filename"
    
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --no-owner \
        --no-privileges > "$backup_path"
    
    if [[ $? -eq 0 ]] && [[ -s "$backup_path" ]]; then
        # Compress backup
        gzip "$backup_path"
        success "Pre-migration backup created: ${backup_path}.gz"
        echo "${backup_path}.gz"
    else
        error "Failed to create pre-migration backup"
        exit 1
    fi
}

# Get pending migrations
get_pending_migrations() {
    local pending_migrations=()
    
    # Get applied migrations
    local applied_migrations
    applied_migrations=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version FROM $MIGRATION_TABLE ORDER BY version;" 2>/dev/null | tr -d ' ' || echo "")
    
    # Find migration files
    if [[ -d "$MIGRATION_DIR/up" ]]; then
        for migration_file in "$MIGRATION_DIR/up"/*.sql; do
            if [[ -f "$migration_file" ]]; then
                local version=$(basename "$migration_file" .sql)
                
                # Check if migration is already applied
                if [[ ! "$applied_migrations" =~ $version ]]; then
                    pending_migrations+=("$version")
                fi
            fi
        done
    fi
    
    # Sort migrations
    IFS=$'\n' sorted_migrations=($(sort -V <<< "${pending_migrations[*]}"))
    printf '%s\n' "${sorted_migrations[@]}"
}

# Calculate migration checksum
calculate_checksum() {
    local migration_file="$1"
    sha256sum "$migration_file" | cut -d' ' -f1
}

# Execute single migration
execute_migration() {
    local version="$1"
    local migration_file="$MIGRATION_DIR/up/${version}.sql"
    local rollback_file="$MIGRATION_DIR/down/${version}.sql"
    
    if [[ ! -f "$migration_file" ]]; then
        error "Migration file not found: $migration_file"
        return 1
    fi
    
    log "Executing migration: $version"
    
    # Calculate checksum
    local checksum=$(calculate_checksum "$migration_file")
    
    # Read rollback script if exists
    local rollback_script=""
    if [[ -f "$rollback_file" ]]; then
        rollback_script=$(cat "$rollback_file")
    fi
    
    # Execute migration with timing
    local start_time=$(date +%s%3N)
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" &> /tmp/migration_output_${version}.log; then
        local end_time=$(date +%s%3N)
        local execution_time=$((end_time - start_time))
        
        # Record migration
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO $MIGRATION_TABLE (version, description, checksum, execution_time_ms, rollback_script)
            VALUES ('$version', 'Migration $version', '$checksum', $execution_time, \$\$${rollback_script}\$\$);
        " &> /dev/null
        
        success "Migration $version completed in ${execution_time}ms"
        
        # Show migration output if verbose
        if [[ "${VERBOSE:-false}" == "true" ]]; then
            cat "/tmp/migration_output_${version}.log"
        fi
        
        return 0
    else
        error "Migration $version failed"
        cat "/tmp/migration_output_${version}.log"
        return 1
    fi
}

# Rollback migration
rollback_migration() {
    local version="$1"
    local force="${2:-false}"
    
    log "Rolling back migration: $version"
    
    # Get rollback script
    local rollback_script
    rollback_script=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT rollback_script FROM $MIGRATION_TABLE WHERE version = '$version';" 2>/dev/null | xargs || echo "")
    
    if [[ -z "$rollback_script" ]] && [[ "$force" != "true" ]]; then
        error "No rollback script found for migration $version"
        return 1
    fi
    
    # Execute rollback
    if [[ -n "$rollback_script" ]]; then
        if echo "$rollback_script" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
            # Remove migration record
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM $MIGRATION_TABLE WHERE version = '$version';" &> /dev/null
            success "Migration $version rolled back successfully"
            return 0
        else
            error "Rollback failed for migration $version"
            return 1
        fi
    else
        warning "No rollback script available for migration $version"
        if [[ "$force" == "true" ]]; then
            # Force remove migration record
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM $MIGRATION_TABLE WHERE version = '$version';" &> /dev/null
            warning "Migration $version record removed (forced)"
        fi
        return 1
    fi
}

# Run all pending migrations
run_migrations() {
    local dry_run="${1:-false}"
    
    log "Starting database migration process"
    
    # Get pending migrations
    local pending_migrations
    mapfile -t pending_migrations < <(get_pending_migrations)
    
    if [[ ${#pending_migrations[@]} -eq 0 ]]; then
        success "No pending migrations found. Database is up to date."
        return 0
    fi
    
    log "Found ${#pending_migrations[@]} pending migration(s):"
    for migration in "${pending_migrations[@]}"; do
        log "  - $migration"
    done
    
    if [[ "$dry_run" == "true" ]]; then
        log "Dry run mode - migrations not executed"
        return 0
    fi
    
    # Create backup before migrations
    local backup_path
    backup_path=$(create_migration_backup "batch_$(date +%Y%m%d_%H%M%S)")
    
    local failed_migration=""
    local successful_count=0
    
    # Execute migrations
    for migration in "${pending_migrations[@]}"; do
        if execute_migration "$migration"; then
            successful_count=$((successful_count + 1))
            send_alert "Migration $migration completed successfully" "SUCCESS"
        else
            failed_migration="$migration"
            send_alert "Migration $migration failed" "CRITICAL"
            break
        fi
    done
    
    if [[ -n "$failed_migration" ]]; then
        error "Migration process failed at: $failed_migration"
        log "Successfully applied $successful_count migration(s) before failure"
        log "Backup available at: $backup_path"
        
        # Offer rollback option
        read -p "Do you want to rollback the failed migration? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_migration "$failed_migration"
        fi
        
        exit 1
    else
        success "All $successful_count migration(s) completed successfully"
        send_alert "$successful_count database migrations completed successfully" "SUCCESS"
    fi
}

# Show migration status
show_status() {
    log "Database migration status"
    
    # Applied migrations
    log "Applied migrations:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            version,
            description,
            applied_at,
            execution_time_ms || 'ms' as duration
        FROM $MIGRATION_TABLE 
        ORDER BY applied_at DESC 
        LIMIT 10;
    " 2>/dev/null || log "No applied migrations found"
    
    # Pending migrations
    local pending_migrations
    mapfile -t pending_migrations < <(get_pending_migrations)
    
    if [[ ${#pending_migrations[@]} -gt 0 ]]; then
        log "Pending migrations:"
        for migration in "${pending_migrations[@]}"; do
            log "  - $migration"
        done
    else
        log "No pending migrations"
    fi
}

# Validate migration files
validate_migrations() {
    log "Validating migration files"
    
    local errors=0
    
    if [[ ! -d "$MIGRATION_DIR/up" ]]; then
        error "Migration directory not found: $MIGRATION_DIR/up"
        return 1
    fi
    
    for migration_file in "$MIGRATION_DIR/up"/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local version=$(basename "$migration_file" .sql)
            local rollback_file="$MIGRATION_DIR/down/${version}.sql"
            
            # Check SQL syntax
            if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --set=ON_ERROR_STOP=1 --quiet --no-psqlrc -f "$migration_file" --single-transaction --dry-run &> /dev/null; then
                error "Syntax error in migration: $migration_file"
                errors=$((errors + 1))
            else
                log "✓ Migration syntax valid: $version"
            fi
            
            # Check rollback file exists
            if [[ ! -f "$rollback_file" ]]; then
                warning "No rollback script found for migration: $version"
            else
                log "✓ Rollback script exists: $version"
            fi
        fi
    done
    
    if [[ $errors -gt 0 ]]; then
        error "Migration validation failed with $errors error(s)"
        return 1
    else
        success "All migration files are valid"
        return 0
    fi
}

# Create new migration template
create_migration() {
    local description="$1"
    
    if [[ -z "$description" ]]; then
        error "Migration description is required"
        exit 1
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local version="${timestamp}_$(echo "$description" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')"
    
    local up_file="$MIGRATION_DIR/up/${version}.sql"
    local down_file="$MIGRATION_DIR/down/${version}.sql"
    
    # Create migration template
    cat > "$up_file" << EOF
-- Migration: $description
-- Created: $(date)
-- Version: $version

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

COMMIT;
EOF

    cat > "$down_file" << EOF
-- Rollback for: $description
-- Created: $(date)
-- Version: $version

BEGIN;

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;

COMMIT;
EOF

    success "Migration created: $version"
    log "Up migration: $up_file"
    log "Down migration: $down_file"
    
    echo "$version"
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
    "text": "$emoji RevivaTech Database Migration Alert",
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
        echo "$message" | mail -s "RevivaTech Database Migration Alert: $severity" "$EMAIL_ALERT" || true
    fi
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

RevivaTech Database Migration Management

COMMANDS:
    migrate              Run all pending migrations
    rollback VERSION     Rollback specific migration
    status               Show migration status
    validate             Validate migration files
    create DESCRIPTION   Create new migration template
    
OPTIONS:
    --dry-run           Show what would be migrated without executing
    --force             Force operation (for rollbacks)
    --verbose           Show detailed output
    --help              Show this help message

ENVIRONMENT VARIABLES:
    DB_HOST             Database host (default: localhost)
    DB_PORT             Database port (default: 5435)
    DB_NAME             Database name (default: revivatech_new)
    DB_USER             Database user (default: revivatech_user)
    DB_PASSWORD         Database password (required)
    MIGRATION_DIR       Migration directory (default: /opt/webapps/revivatech/migrations)
    BACKUP_DIR          Backup directory (default: /opt/backups/migrations)
    SLACK_WEBHOOK_URL   Slack webhook for notifications (optional)
    EMAIL_ALERT         Email for notifications (default: admin@revivatech.co.uk)

EXAMPLES:
    $0 migrate                                  Run all pending migrations
    $0 migrate --dry-run                        Show pending migrations without running
    $0 rollback 20250713_120000_add_user_table  Rollback specific migration
    $0 status                                   Show migration status
    $0 validate                                 Validate all migration files
    $0 create "Add user authentication table"   Create new migration

EOF
}

# Main execution
main() {
    local command="${1:-migrate}"
    local dry_run=false
    local force=false
    local verbose=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --verbose)
                verbose=true
                export VERBOSE=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            migrate|rollback|status|validate|create)
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
    
    # Setup
    setup_migration_infrastructure
    check_prerequisites
    
    # Execute command
    case "$command" in
        migrate)
            run_migrations "$dry_run"
            ;;
        rollback)
            local version="${1:-}"
            if [[ -z "$version" ]]; then
                error "Migration version required for rollback"
                usage
                exit 1
            fi
            rollback_migration "$version" "$force"
            ;;
        status)
            show_status
            ;;
        validate)
            validate_migrations
            ;;
        create)
            local description="${1:-}"
            if [[ -z "$description" ]]; then
                error "Migration description required"
                usage
                exit 1
            fi
            create_migration "$description"
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