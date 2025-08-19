#!/bin/bash

# Test Unified Redirection System
# Tests admin login and redirect behavior

echo "🧪 Testing Unified Redirection System"
echo "======================================="

# Backend endpoint
BACKEND_URL="http://localhost:3011"
FRONTEND_URL="http://localhost:3010"

# Test credentials
ADMIN_EMAIL="admin@revivatech.co.uk"
ADMIN_PASSWORD="admin123"

echo ""
echo "1. Testing Frontend Auth Endpoint Availability..."
curl -s -o /dev/null -w "HTTP %{http_code} - %{url_effective}" "$FRONTEND_URL/api/auth/sign-in"
echo ""
echo ""

echo "2. Testing Admin Login via API..."
LOGIN_RESPONSE=$(curl -s -X POST "$FRONTEND_URL/api/auth/sign-in" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -w "\nHTTP_CODE:%{http_code}")

echo "Login Response:"
echo "$LOGIN_RESPONSE"
echo ""

# Extract session cookie if present
SESSION_COOKIE=$(echo "$LOGIN_RESPONSE" | grep -o 'better-auth\.session_token=[^;]*' | head -1)

if [ -n "$SESSION_COOKIE" ]; then
    echo "3. Session Cookie Found: $SESSION_COOKIE"
    echo ""
    
    echo "4. Testing Frontend Redirect with Session..."
    # Test accessing admin page with session
    ADMIN_PAGE_RESPONSE=$(curl -s -b "$SESSION_COOKIE" -w "HTTP %{http_code} - %{url_effective}" "$FRONTEND_URL/admin")
    echo "Admin page access: $ADMIN_PAGE_RESPONSE"
else
    echo "❌ No session cookie found in login response"
fi

echo ""
echo "5. Checking Frontend Logs for Redirect Debugging..."
docker logs revivatech_frontend --tail 20 | grep -E "(redirect|auth|role)" || echo "No relevant logs found"

echo ""
echo "🔍 Test completed. Check the results above."