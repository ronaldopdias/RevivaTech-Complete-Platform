#!/bin/bash

# RevivaTech Platform Deployment Test Script
# This script verifies that the new platform is working correctly

echo "🔧 RevivaTech Platform Deployment Test"
echo "======================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_backend_health() {
    echo -n "Testing backend health... "
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/health)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

test_backend_api() {
    echo -n "Testing backend API... "
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/api/info)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

test_nginx_routing() {
    echo -n "Testing nginx routing... "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: revivatech.co.uk" http://localhost/)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

test_nginx_api_routing() {
    echo -n "Testing nginx API routing... "
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: revivatech.co.uk" http://localhost/api/info)
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
        return 1
    fi
}

check_database_connection() {
    echo -n "Testing database connection... "
    if docker exec revivatech_new_database pg_isready -U revivatech_user -d revivatech_new > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

check_redis_connection() {
    echo -n "Testing Redis connection... "
    if docker exec revivatech_new_redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

check_containers() {
    echo -n "Checking container status... "
    containers=$(docker-compose -f docker-compose.dev.yml ps -q)
    if [ -n "$containers" ]; then
        unhealthy=$(docker-compose -f docker-compose.dev.yml ps | grep -c "unhealthy\|Exit")
        if [ "$unhealthy" -eq 0 ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL ($unhealthy unhealthy containers)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (no containers running)${NC}"
        return 1
    fi
}

test_preserved_services() {
    echo -n "Testing preserved services... "
    pt_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    crm_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
    
    if [ "$pt_response" = "200" ] && [ "$crm_response" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (PT: $pt_response, CRM: $crm_response)${NC}"
        return 1
    fi
}

# Main test execution
echo "🧪 Running deployment tests..."
echo

# Infrastructure tests
echo "📦 Infrastructure Tests"
echo "----------------------"
check_containers
check_database_connection
check_redis_connection
echo

# Backend tests
echo "🔧 Backend Tests"
echo "----------------"
test_backend_health
test_backend_api
echo

# Frontend & Routing tests
echo "🌐 Frontend & Routing Tests"
echo "---------------------------"
test_nginx_routing
test_nginx_api_routing
echo

# Preserved services tests
echo "🔒 Preserved Services Tests"
echo "---------------------------"
test_preserved_services
echo

# Display service information
echo "📊 Service Information"
echo "---------------------"
echo "New Platform Services:"
echo "- Frontend: http://localhost:3010"
echo "- Backend:  http://localhost:3011"
echo "- Database: PostgreSQL on port 5435"
echo "- Redis:    Redis on port 6383"
echo
echo "Preserved Services:"
echo "- PT Frontend: http://localhost:3000"
echo "- CRM Frontend: http://localhost:3001"
echo "- Backend: http://localhost:5000"
echo "- CRM Backend: http://localhost:5001"
echo

# Display container status
echo "🐳 Container Status"
echo "------------------"
docker-compose -f docker-compose.dev.yml ps
echo

# Display system resources
echo "💾 System Resources"
echo "------------------"
echo "Docker disk usage:"
docker system df
echo

echo "🎉 Test completed!"
echo "For more details, check:"
echo "- CLAUDE.md for complete documentation"
echo "- DEPLOYMENT_SUMMARY.md for deployment overview"
echo "- docker-compose -f docker-compose.dev.yml logs for service logs"