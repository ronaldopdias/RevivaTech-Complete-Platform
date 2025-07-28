#!/bin/bash

# Analytics Health Monitoring Script for RevivaTech
# Run this script periodically to monitor analytics system health

set -e

# Configuration
FRONTEND_URL="http://localhost:3010"
BACKEND_URL="http://localhost:3011"
LOG_FILE="/opt/webapps/revivatech/analytics-monitor.log"
ALERT_THRESHOLD=5  # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Health check function
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout=5
    
    log "🔍 Checking $service_name..."
    
    if timeout $timeout curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✅ $service_name: HEALTHY${NC}"
        log "✅ $service_name is healthy"
        return 0
    else
        echo -e "${RED}❌ $service_name: UNHEALTHY${NC}"
        log "❌ $service_name is unhealthy"
        return 1
    fi
}

# Test analytics event
test_analytics_event() {
    log "🧪 Testing analytics event submission..."
    
    local test_event=$(cat <<EOF
{
    "event": "health_check",
    "data": {
        "source": "monitoring_script",
        "timestamp": "$(date -Iseconds)",
        "monitor_id": "$(uuidgen 2>/dev/null || echo "monitor_$(date +%s)")"
    }
}
EOF
    )
    
    if curl -s -X POST "$BACKEND_URL/api/analytics/events" \
        -H "Content-Type: application/json" \
        -d "$test_event" | grep -q "success"; then
        echo -e "${GREEN}✅ Analytics Event API: WORKING${NC}"
        log "✅ Analytics event API is working"
        return 0
    else
        echo -e "${RED}❌ Analytics Event API: FAILED${NC}"
        log "❌ Analytics event API failed"
        return 1
    fi
}

# Check container status
check_containers() {
    log "📦 Checking container status..."
    
    local containers=("revivatech_frontend_dev" "revivatech_new_backend" "revivatech_new_database" "revivatech_new_redis")
    local healthy_containers=0
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            echo -e "${GREEN}✅ $container: RUNNING${NC}"
            healthy_containers=$((healthy_containers + 1))
        else
            echo -e "${RED}❌ $container: NOT RUNNING${NC}"
            log "❌ Container $container is not running"
        fi
    done
    
    log "📦 Container Status: $healthy_containers/${#containers[@]} healthy"
    
    if [ $healthy_containers -eq ${#containers[@]} ]; then
        return 0
    else
        return 1
    fi
}

# Performance check
check_performance() {
    log "⚡ Checking performance..."
    
    local start_time=$(date +%s%3N)
    curl -s -o /dev/null "$FRONTEND_URL"
    local end_time=$(date +%s%3N)
    
    local load_time=$((end_time - start_time))
    
    if [ $load_time -lt $((ALERT_THRESHOLD * 1000)) ]; then
        echo -e "${GREEN}✅ Performance: ${load_time}ms (Good)${NC}"
        log "✅ Performance: ${load_time}ms"
        return 0
    else
        echo -e "${YELLOW}⚠️ Performance: ${load_time}ms (Slow)${NC}"
        log "⚠️ Performance degraded: ${load_time}ms"
        return 1
    fi
}

# Generate status report
generate_status_report() {
    local timestamp=$(date -Iseconds)
    local report_file="/opt/webapps/revivatech/analytics-status-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" <<EOF
{
    "timestamp": "$timestamp",
    "status": "$1",
    "checks": {
        "frontend": $2,
        "backend": $3,
        "containers": $4,
        "analytics_api": $5,
        "performance": $6
    },
    "environment": "development",
    "monitoring_version": "1.0"
}
EOF
    
    log "📄 Status report generated: $report_file"
}

# Main monitoring function
main() {
    echo "🔍 RevivaTech Analytics Health Monitor"
    echo "======================================"
    echo "⏰ $(date)"
    echo ""
    
    log "🚀 Starting analytics health check"
    
    # Initialize counters
    local checks_passed=0
    local total_checks=6
    
    # Run health checks
    if check_service "Frontend" "$FRONTEND_URL"; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_service "Backend" "$BACKEND_URL/api/analytics/events"; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_containers; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if test_analytics_event; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if check_performance; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Always count this as a check
    total_checks=5
    
    # Calculate health percentage
    local health_percentage=$(( (checks_passed * 100) / total_checks ))
    
    echo ""
    echo "📊 Health Summary:"
    echo "=================="
    echo -e "✅ Passed: $checks_passed/$total_checks"
    echo -e "📈 Health: $health_percentage%"
    
    # Determine overall status
    if [ $checks_passed -eq $total_checks ]; then
        echo -e "${GREEN}🎉 Overall Status: HEALTHY${NC}"
        log "🎉 Analytics system is fully healthy ($health_percentage%)"
        generate_status_report "healthy" true true true true true
    elif [ $health_percentage -ge 80 ]; then
        echo -e "${YELLOW}⚠️ Overall Status: MOSTLY HEALTHY${NC}"
        log "⚠️ Analytics system is mostly healthy ($health_percentage%)"
        generate_status_report "mostly_healthy" true true true true false
    else
        echo -e "${RED}❌ Overall Status: UNHEALTHY${NC}"
        log "❌ Analytics system needs attention ($health_percentage%)"
        generate_status_report "unhealthy" false false false false false
    fi
    
    echo ""
    echo "📝 Log file: $LOG_FILE"
    echo "⏰ Next check recommended in 5-10 minutes"
    echo "🔄 To run continuously: watch -n 300 $0"
    
    log "✅ Health check completed ($health_percentage% healthy)"
}

# Run main function
main "$@"