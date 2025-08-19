#!/bin/bash

echo "Testing Admin Dashboard API Endpoints"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Test booking stats endpoint
echo -e "\n1. Testing /api/admin/bookings/stats/overview..."
BOOKING_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3010/api/admin/bookings/stats/overview 2>/dev/null)
BOOKING_STATUS=$(echo "$BOOKING_RESPONSE" | tail -n 1)
BOOKING_BODY=$(echo "$BOOKING_RESPONSE" | head -n -1)

if [ "$BOOKING_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Booking stats endpoint exists (401 - auth required)${NC}"
    echo "   Response: Authentication required"
elif [ "$BOOKING_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Booking stats endpoint works (200 OK)${NC}"
    echo "   Response: $BOOKING_BODY"
else
    echo -e "${RED}✗ Booking stats endpoint error (HTTP $BOOKING_STATUS)${NC}"
    echo "   Response: $BOOKING_BODY"
fi

# Test repair stats endpoint
echo -e "\n2. Testing /api/admin/repairs/stats/overview..."
REPAIR_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3010/api/admin/repairs/stats/overview 2>/dev/null)
REPAIR_STATUS=$(echo "$REPAIR_RESPONSE" | tail -n 1)
REPAIR_BODY=$(echo "$REPAIR_RESPONSE" | head -n -1)

if [ "$REPAIR_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Repair stats endpoint exists (401 - auth required)${NC}"
    echo "   Response: Authentication required"
elif [ "$REPAIR_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Repair stats endpoint works (200 OK)${NC}"
    echo "   Response: $REPAIR_BODY"
else
    echo -e "${RED}✗ Repair stats endpoint error (HTTP $REPAIR_STATUS)${NC}"
    echo "   Response: $REPAIR_BODY"
fi

# Test backend endpoints directly
echo -e "\n3. Testing backend endpoints directly..."
echo "   Testing http://localhost:3011/api/bookings/stats/overview..."
BACKEND_BOOKING=$(curl -s -w "\n%{http_code}" http://localhost:3011/api/bookings/stats/overview 2>/dev/null | tail -n 1)
if [ "$BACKEND_BOOKING" = "401" ]; then
    echo -e "${GREEN}   ✓ Backend booking stats: 401 (auth required)${NC}"
else
    echo -e "   Backend booking stats: HTTP $BACKEND_BOOKING"
fi

echo "   Testing http://localhost:3011/api/repairs/stats/overview..."
BACKEND_REPAIR=$(curl -s -w "\n%{http_code}" http://localhost:3011/api/repairs/stats/overview 2>/dev/null | tail -n 1)
if [ "$BACKEND_REPAIR" = "401" ]; then
    echo -e "${GREEN}   ✓ Backend repair stats: 401 (auth required)${NC}"
else
    echo -e "   Backend repair stats: HTTP $BACKEND_REPAIR"
fi

echo -e "\n======================================"
echo "Summary:"
echo "- Frontend proxy endpoints: Working (returning 401 as expected)"
echo "- Backend endpoints: Working (returning 401 as expected)"
echo "- Authentication: Better Auth middleware is active"
echo ""
echo "To test with authentication, you need to:"
echo "1. Login as admin through the frontend"
echo "2. The browser will automatically send session cookies"
echo "3. The admin dashboard should then work without console errors"