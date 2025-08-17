#!/bin/bash
# Auto-monitor script for RevivaTech containers
# Monitors container health and restarts if needed

LOG_FILE="/tmp/reviva-auto-monitor.log"
PROJECT_ROOT="/opt/webapps/revivatech"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_container() {
    local container_name=$1
    local port=$2
    
    if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        log_message "❌ Container $container_name is not running"
        return 1
    fi
    
    if [ -n "$port" ]; then
        if ! curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}" | grep -q "200\|404"; then
            log_message "⚠️  Container $container_name (port $port) not responding"
            return 1
        fi
    fi
    
    return 0
}

restart_container() {
    local container_name=$1
    log_message "🔄 Restarting container: $container_name"
    docker restart "$container_name"
    sleep 10
}

# Main monitoring loop
log_message "🤖 Starting RevivaTech Auto-Monitor"

# Check containers
CONTAINERS=(
    "revivatech_frontend:3010"
    "revivatech_backend:3011"
    "revivatech_database:5435"
    "revivatech_redis:6383"
)

all_healthy=true

for container_info in "${CONTAINERS[@]}"; do
    IFS=':' read -r name port <<< "$container_info"
    
    if ! check_container "$name" "$port"; then
        all_healthy=false
        restart_container "$name"
    fi
done

if [ "$all_healthy" = true ]; then
    log_message "✅ All containers healthy"
else
    log_message "⚠️  Some containers required restart"
    # Run context loader after restarts
    sleep 5
    "$PROJECT_ROOT/.claude/context-loader.sh" >> "$LOG_FILE" 2>&1
fi

# Cleanup old logs (keep last 1000 lines)
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 1000 ]; then
    tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi