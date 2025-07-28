#!/bin/bash

# Production Monitoring and Alerting System for RevivaTech
# Comprehensive monitoring with health checks, performance metrics, and alerting

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITOR_CONFIG_FILE="${MONITOR_CONFIG_FILE:-/opt/webapps/revivatech/config/monitoring.conf}"
LOG_FILE="${LOG_FILE:-/var/log/revivatech/monitoring.log}"
METRICS_FILE="${METRICS_FILE:-/var/log/revivatech/metrics.json}"
ALERT_STATE_FILE="${ALERT_STATE_FILE:-/var/lib/revivatech/alert_state.json}"

# Services to monitor
SERVICES=(
    "revivatech_new_frontend:3010:http://localhost:3010/health"
    "revivatech_new_backend:3011:http://localhost:3011/health"
    "revivatech_new_database:5435:postgres"
    "revivatech_new_redis:6383:redis"
)

# External services
EXTERNAL_SERVICES=(
    "revivatech.co.uk:443:https://revivatech.co.uk"
    "revivatech.com.br:443:https://revivatech.com.br"
)

# Thresholds
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-85}"
DISK_THRESHOLD="${DISK_THRESHOLD:-90}"
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-5000}"
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"

# Monitoring intervals
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-60}"
METRICS_COLLECTION_INTERVAL="${METRICS_COLLECTION_INTERVAL:-300}"
ALERT_COOLDOWN="${ALERT_COOLDOWN:-1800}"

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERT="${EMAIL_ALERT:-admin@revivatech.co.uk}"
PAGERDUTY_INTEGRATION_KEY="${PAGERDUTY_INTEGRATION_KEY:-}"

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

# Setup monitoring infrastructure
setup_monitoring() {
    log "Setting up monitoring infrastructure"
    
    # Create directories
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$METRICS_FILE")"
    mkdir -p "$(dirname "$ALERT_STATE_FILE")"
    
    # Set permissions
    chmod 750 "$(dirname "$LOG_FILE")"
    chmod 640 "$LOG_FILE" 2>/dev/null || touch "$LOG_FILE"
    touch "$METRICS_FILE" "$ALERT_STATE_FILE"
    
    # Initialize alert state if not exists
    if [[ ! -s "$ALERT_STATE_FILE" ]]; then
        echo '{}' > "$ALERT_STATE_FILE"
    fi
    
    success "Monitoring infrastructure setup completed"
}

# Load alert state
load_alert_state() {
    if [[ -f "$ALERT_STATE_FILE" ]]; then
        cat "$ALERT_STATE_FILE"
    else
        echo '{}'
    fi
}

# Save alert state
save_alert_state() {
    local state="$1"
    echo "$state" > "$ALERT_STATE_FILE"
}

# Check if alert should be sent (respect cooldown)
should_alert() {
    local alert_key="$1"
    local current_time=$(date +%s)
    local state=$(load_alert_state)
    
    local last_alert_time
    last_alert_time=$(echo "$state" | jq -r ".\"$alert_key\" // 0" 2>/dev/null || echo "0")
    
    local time_diff=$((current_time - last_alert_time))
    
    if [[ $time_diff -gt $ALERT_COOLDOWN ]]; then
        # Update alert state
        local new_state
        new_state=$(echo "$state" | jq ". + {\"$alert_key\": $current_time}" 2>/dev/null || echo "{\"$alert_key\": $current_time}")
        save_alert_state "$new_state"
        return 0
    else
        return 1
    fi
}

# Check Docker container health
check_container_health() {
    local container_name="$1"
    local port="$2"
    local health_url="$3"
    
    local status="UNKNOWN"
    local response_time=0
    local error_message=""
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^$container_name$"; then
        status="DOWN"
        error_message="Container not running"
    else
        # Check container status
        local container_status
        container_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        
        if [[ "$container_status" != "running" ]]; then
            status="DOWN"
            error_message="Container status: $container_status"
        else
            # Check service health endpoint
            if [[ "$health_url" == "postgres" ]]; then
                # PostgreSQL health check
                if timeout 5 nc -z localhost "$port" 2>/dev/null; then
                    status="UP"
                    response_time=100
                else
                    status="DOWN"
                    error_message="PostgreSQL port not accessible"
                fi
            elif [[ "$health_url" == "redis" ]]; then
                # Redis health check
                if timeout 5 redis-cli -p "$port" ping 2>/dev/null | grep -q "PONG"; then
                    status="UP"
                    response_time=50
                else
                    status="DOWN"
                    error_message="Redis not responding"
                fi
            else
                # HTTP health check
                local start_time=$(date +%s%3N)
                if curl -s -f -m 5 "$health_url" > /dev/null 2>&1; then
                    local end_time=$(date +%s%3N)
                    response_time=$((end_time - start_time))
                    status="UP"
                else
                    status="DOWN"
                    error_message="HTTP health check failed"
                fi
            fi
        fi
    fi
    
    # Create result object
    local result=$(cat <<EOF
{
    "service": "$container_name",
    "port": $port,
    "status": "$status",
    "response_time_ms": $response_time,
    "error_message": "$error_message",
    "timestamp": "$(date -Iseconds)"
}
EOF
    )
    
    echo "$result"
    
    # Alert if service is down
    if [[ "$status" == "DOWN" ]] && should_alert "service_down_$container_name"; then
        send_alert "Service Down: $container_name" "CRITICAL" "Service $container_name is down: $error_message"
    elif [[ "$status" == "UP" && "$response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]] && should_alert "slow_response_$container_name"; then
        send_alert "Slow Response: $container_name" "WARNING" "Service $container_name response time: ${response_time}ms (threshold: ${RESPONSE_TIME_THRESHOLD}ms)"
    fi
}

# Check external service health
check_external_service() {
    local service_name="$1"
    local port="$2"
    local url="$3"
    
    local status="UNKNOWN"
    local response_time=0
    local http_status=0
    local error_message=""
    
    # HTTP health check with detailed metrics
    local start_time=$(date +%s%3N)
    local response
    response=$(curl -s -w "%{http_code},%{time_total},%{size_download}" -m 10 "$url" 2>&1 || echo "000,10.000,0")
    local end_time=$(date +%s%3N)
    
    if [[ "$response" =~ ^[0-9]{3},[0-9]+\.[0-9]+,[0-9]+ ]]; then
        http_status=$(echo "$response" | cut -d',' -f1)
        local curl_time=$(echo "$response" | cut -d',' -f2)
        local size=$(echo "$response" | cut -d',' -f3)
        response_time=$((end_time - start_time))
        
        if [[ "$http_status" -ge 200 && "$http_status" -lt 400 ]]; then
            status="UP"
        else
            status="DOWN"
            error_message="HTTP $http_status"
        fi
    else
        status="DOWN"
        error_message="Connection failed"
        response_time=$((end_time - start_time))
    fi
    
    # Create result object
    local result=$(cat <<EOF
{
    "service": "$service_name",
    "port": $port,
    "url": "$url",
    "status": "$status",
    "http_status": $http_status,
    "response_time_ms": $response_time,
    "error_message": "$error_message",
    "timestamp": "$(date -Iseconds)"
}
EOF
    )
    
    echo "$result"
    
    # Alert if external service is down
    if [[ "$status" == "DOWN" ]] && should_alert "external_down_$service_name"; then
        send_alert "External Service Down: $service_name" "CRITICAL" "External service $service_name is down: $error_message"
    fi
}

# Collect system metrics
collect_system_metrics() {
    local cpu_usage
    local memory_usage
    local disk_usage
    local load_average
    local disk_io
    local network_io
    
    # CPU usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' | cut -d'%' -f1 || echo "0")
    
    # Memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}' || echo "0")
    
    # Disk usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1 || echo "0")
    
    # Load average
    load_average=$(uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1 | xargs || echo "0")
    
    # Disk I/O (if iostat is available)
    if command -v iostat &> /dev/null; then
        disk_io=$(iostat -d 1 2 | tail -n +4 | tail -1 | awk '{print $3+$4}' || echo "0")
    else
        disk_io="0"
    fi
    
    # Network I/O (if available)
    if [[ -f /proc/net/dev ]]; then
        network_io=$(awk '/eth0|ens|enp/ {print $2+$10}' /proc/net/dev | head -1 || echo "0")
    else
        network_io="0"
    fi
    
    # Create metrics object
    local metrics=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "cpu_usage_percent": $cpu_usage,
    "memory_usage_percent": $memory_usage,
    "disk_usage_percent": $disk_usage,
    "load_average": $load_average,
    "disk_io_mbps": $disk_io,
    "network_io_bytes": $network_io
}
EOF
    )
    
    echo "$metrics"
    
    # Check thresholds and alert
    if [[ $(echo "$cpu_usage >= $CPU_THRESHOLD" | bc -l 2>/dev/null || echo "0") -eq 1 ]] && should_alert "high_cpu"; then
        send_alert "High CPU Usage" "WARNING" "CPU usage is ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
    fi
    
    if [[ $(echo "$memory_usage >= $MEMORY_THRESHOLD" | bc -l 2>/dev/null || echo "0") -eq 1 ]] && should_alert "high_memory"; then
        send_alert "High Memory Usage" "WARNING" "Memory usage is ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
    fi
    
    if [[ "$disk_usage" -ge "$DISK_THRESHOLD" ]] && should_alert "high_disk"; then
        send_alert "High Disk Usage" "CRITICAL" "Disk usage is ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
    fi
}

# Collect application metrics
collect_application_metrics() {
    local frontend_metrics="{}"
    local backend_metrics="{}"
    local database_metrics="{}"
    
    # Frontend metrics (if available)
    if curl -s -f -m 5 "http://localhost:3010/api/metrics" > /dev/null 2>&1; then
        frontend_metrics=$(curl -s -m 5 "http://localhost:3010/api/metrics" || echo "{}")
    fi
    
    # Backend metrics (if available)
    if curl -s -f -m 5 "http://localhost:3011/api/metrics" > /dev/null 2>&1; then
        backend_metrics=$(curl -s -m 5 "http://localhost:3011/api/metrics" || echo "{}")
    fi
    
    # Database metrics
    if command -v psql &> /dev/null && docker ps --format '{{.Names}}' | grep -q "revivatech_new_database"; then
        local db_connections
        local db_size
        db_connections=$(docker exec revivatech_new_database psql -U revivatech_user -d revivatech_new -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "0")
        db_size=$(docker exec revivatech_new_database psql -U revivatech_user -d revivatech_new -t -c "SELECT pg_size_pretty(pg_database_size('revivatech_new'));" 2>/dev/null | xargs || echo "Unknown")
        
        database_metrics=$(cat <<EOF
{
    "connections": $db_connections,
    "database_size": "$db_size"
}
EOF
        )
    fi
    
    # Combine metrics
    local app_metrics=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "frontend": $frontend_metrics,
    "backend": $backend_metrics,
    "database": $database_metrics
}
EOF
    )
    
    echo "$app_metrics"
}

# Run comprehensive health check
run_health_check() {
    log "Running comprehensive health check"
    
    local health_results=()
    local failed_services=0
    
    # Check internal services
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r container_name port health_url <<< "$service_info"
        local result
        result=$(check_container_health "$container_name" "$port" "$health_url")
        health_results+=("$result")
        
        local status
        status=$(echo "$result" | jq -r '.status')
        if [[ "$status" == "DOWN" ]]; then
            failed_services=$((failed_services + 1))
        fi
    done
    
    # Check external services
    for service_info in "${EXTERNAL_SERVICES[@]}"; do
        IFS=':' read -r service_name port url <<< "$service_info"
        local result
        result=$(check_external_service "$service_name" "$port" "https://$service_name")
        health_results+=("$result")
        
        local status
        status=$(echo "$result" | jq -r '.status')
        if [[ "$status" == "DOWN" ]]; then
            failed_services=$((failed_services + 1))
        fi
    done
    
    # Create health report
    local health_report=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "total_services": $((${#SERVICES[@]} + ${#EXTERNAL_SERVICES[@]})),
    "failed_services": $failed_services,
    "health_status": "$(if [[ $failed_services -eq 0 ]]; then echo "HEALTHY"; elif [[ $failed_services -lt 3 ]]; then echo "DEGRADED"; else echo "CRITICAL"; fi)",
    "services": [$(IFS=','; echo "${health_results[*]}")]
}
EOF
    )
    
    echo "$health_report"
    
    # Overall system health alert
    if [[ $failed_services -gt 0 ]] && should_alert "system_health"; then
        local health_status
        if [[ $failed_services -lt 3 ]]; then
            health_status="DEGRADED"
            send_alert "System Health Degraded" "WARNING" "$failed_services service(s) are down or experiencing issues"
        else
            health_status="CRITICAL"
            send_alert "System Health Critical" "CRITICAL" "$failed_services service(s) are down - immediate attention required"
        fi
    fi
}

# Collect all metrics
collect_metrics() {
    log "Collecting comprehensive metrics"
    
    # Collect system metrics
    local system_metrics
    system_metrics=$(collect_system_metrics)
    
    # Collect application metrics
    local app_metrics
    app_metrics=$(collect_application_metrics)
    
    # Run health check
    local health_check
    health_check=$(run_health_check)
    
    # Combine all metrics
    local combined_metrics=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "system": $system_metrics,
    "application": $app_metrics,
    "health": $health_check
}
EOF
    )
    
    # Save metrics to file
    echo "$combined_metrics" >> "$METRICS_FILE"
    
    # Keep only last 1000 entries
    tail -1000 "$METRICS_FILE" > "${METRICS_FILE}.tmp" && mv "${METRICS_FILE}.tmp" "$METRICS_FILE"
    
    success "Metrics collection completed"
}

# Send alert notification
send_alert() {
    local title="$1"
    local severity="${2:-INFO}"
    local message="${3:-$title}"
    
    log "Sending $severity alert: $title"
    
    # Send Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji="ℹ️"
        local color="good"
        case "$severity" in
            "CRITICAL") emoji="🚨"; color="danger" ;;
            "WARNING") emoji="⚠️"; color="warning" ;;
            "SUCCESS") emoji="✅"; color="good" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "text": "$emoji RevivaTech Production Alert",
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "fields": [
                {
                    "title": "Severity",
                    "value": "$severity",
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
    
    # Send PagerDuty alert for critical issues
    if [[ "$severity" == "CRITICAL" && -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        local pd_payload=$(cat <<EOF
{
    "routing_key": "$PAGERDUTY_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
        "summary": "$title",
        "source": "RevivaTech Production Monitor",
        "severity": "critical",
        "custom_details": {
            "message": "$message",
            "timestamp": "$(date -Iseconds)"
        }
    }
}
EOF
        )
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$pd_payload" \
            "https://events.pagerduty.com/v2/enqueue" &> /dev/null || true
    fi
    
    # Send email notification
    if [[ -n "$EMAIL_ALERT" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "RevivaTech Alert: $title ($severity)" "$EMAIL_ALERT" || true
    fi
}

# Generate monitoring report
generate_report() {
    local report_period="${1:-24h}"
    local report_file="/tmp/monitoring_report_$(date +%Y%m%d_%H%M%S).json"
    
    log "Generating monitoring report for last $report_period"
    
    # Calculate time window
    local since_time
    case "$report_period" in
        "1h") since_time=$(date -d '1 hour ago' -Iseconds) ;;
        "24h") since_time=$(date -d '24 hours ago' -Iseconds) ;;
        "7d") since_time=$(date -d '7 days ago' -Iseconds) ;;
        *) since_time=$(date -d '24 hours ago' -Iseconds) ;;
    esac
    
    # Extract metrics from log
    local metrics_data="[]"
    if [[ -f "$METRICS_FILE" ]]; then
        metrics_data=$(jq -s "[.[] | select(.timestamp >= \"$since_time\")]" "$METRICS_FILE" 2>/dev/null || echo "[]")
    fi
    
    # Generate summary statistics
    local total_checks
    local failed_checks
    local avg_cpu
    local avg_memory
    local avg_response_time
    
    total_checks=$(echo "$metrics_data" | jq 'length' 2>/dev/null || echo "0")
    failed_checks=$(echo "$metrics_data" | jq '[.[] | select(.health.health_status != "HEALTHY")] | length' 2>/dev/null || echo "0")
    avg_cpu=$(echo "$metrics_data" | jq '[.[] | .system.cpu_usage_percent] | add / length' 2>/dev/null || echo "0")
    avg_memory=$(echo "$metrics_data" | jq '[.[] | .system.memory_usage_percent] | add / length' 2>/dev/null || echo "0")
    
    # Create report
    local report=$(cat <<EOF
{
    "period": "$report_period",
    "generated_at": "$(date -Iseconds)",
    "since": "$since_time",
    "summary": {
        "total_health_checks": $total_checks,
        "failed_health_checks": $failed_checks,
        "availability_percent": $(echo "scale=2; ($total_checks - $failed_checks) * 100 / $total_checks" | bc -l 2>/dev/null || echo "100"),
        "average_cpu_usage": $avg_cpu,
        "average_memory_usage": $avg_memory
    },
    "metrics": $metrics_data
}
EOF
    )
    
    echo "$report" > "$report_file"
    
    log "Monitoring report generated: $report_file"
    echo "$report_file"
}

# Monitoring daemon
run_daemon() {
    log "Starting monitoring daemon"
    
    local health_check_counter=0
    local metrics_collection_counter=0
    
    while true; do
        # Health checks every minute
        if [[ $((health_check_counter % HEALTH_CHECK_INTERVAL)) -eq 0 ]]; then
            run_health_check > /dev/null
        fi
        
        # Metrics collection every 5 minutes
        if [[ $((metrics_collection_counter % METRICS_COLLECTION_INTERVAL)) -eq 0 ]]; then
            collect_metrics > /dev/null
        fi
        
        health_check_counter=$((health_check_counter + 1))
        metrics_collection_counter=$((metrics_collection_counter + 1))
        
        sleep 1
    done
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

RevivaTech Production Monitoring System

COMMANDS:
    health-check         Run comprehensive health check
    collect-metrics      Collect system and application metrics
    report [PERIOD]      Generate monitoring report (1h, 24h, 7d)
    daemon               Run monitoring daemon
    test-alerts          Test alert notifications
    
OPTIONS:
    --verbose           Show detailed output
    --help              Show this help message

ENVIRONMENT VARIABLES:
    MONITOR_CONFIG_FILE     Monitoring configuration file
    LOG_FILE               Log file path
    METRICS_FILE           Metrics storage file
    SLACK_WEBHOOK_URL      Slack webhook for notifications
    EMAIL_ALERT            Email for notifications
    PAGERDUTY_INTEGRATION_KEY  PagerDuty integration key
    CPU_THRESHOLD          CPU usage alert threshold (default: 80)
    MEMORY_THRESHOLD       Memory usage alert threshold (default: 85)
    DISK_THRESHOLD         Disk usage alert threshold (default: 90)

EXAMPLES:
    $0 health-check                    Run health check
    $0 collect-metrics                 Collect metrics
    $0 report 24h                      Generate 24-hour report
    $0 daemon                          Run monitoring daemon
    $0 test-alerts                     Test alert system

EOF
}

# Test alert system
test_alerts() {
    log "Testing alert system"
    
    send_alert "Test Alert - INFO" "INFO" "This is a test info alert from RevivaTech monitoring system"
    sleep 2
    send_alert "Test Alert - WARNING" "WARNING" "This is a test warning alert from RevivaTech monitoring system"
    sleep 2
    send_alert "Test Alert - CRITICAL" "CRITICAL" "This is a test critical alert from RevivaTech monitoring system"
    
    success "Alert tests completed"
}

# Main execution
main() {
    local command="${1:-health-check}"
    local verbose=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                verbose=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            health-check|collect-metrics|report|daemon|test-alerts)
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
    setup_monitoring
    
    # Execute command
    case "$command" in
        health-check)
            run_health_check
            ;;
        collect-metrics)
            collect_metrics
            ;;
        report)
            local period="${1:-24h}"
            generate_report "$period"
            ;;
        daemon)
            run_daemon
            ;;
        test-alerts)
            test_alerts
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