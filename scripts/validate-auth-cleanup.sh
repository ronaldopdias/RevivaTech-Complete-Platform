#!/bin/bash
# Auth Cleanup Validation Script
# Ensures no duplicate auth files remain after Phase 1 cleanup

echo "🔍 RULE 1 COMPLIANCE VALIDATION - AUTH FILE CLEANUP"
echo "=================================================="

# Define expected single source of truth files
EXPECTED_BACKEND_AUTH="/opt/webapps/revivatech/backend/lib/better-auth-clean.js"
EXPECTED_FRONTEND_AUTH="/opt/webapps/revivatech/frontend/src/lib/auth/better-auth-client.ts"
EXPECTED_HANDLER="/opt/webapps/revivatech/backend/lib/better-auth-express-handler.js"

# Check if expected files exist
echo "✅ CHECKING REQUIRED FILES:"
if [ -f "$EXPECTED_BACKEND_AUTH" ]; then
    echo "✅ Backend auth: $EXPECTED_BACKEND_AUTH"
else
    echo "❌ MISSING: $EXPECTED_BACKEND_AUTH"
    exit 1
fi

if [ -f "$EXPECTED_FRONTEND_AUTH" ]; then
    echo "✅ Frontend auth: $EXPECTED_FRONTEND_AUTH"
else
    echo "❌ MISSING: $EXPECTED_FRONTEND_AUTH"
    exit 1
fi

if [ -f "$EXPECTED_HANDLER" ]; then
    echo "✅ Express handler: $EXPECTED_HANDLER"
else
    echo "❌ MISSING: $EXPECTED_HANDLER"
    exit 1
fi

# Check for forbidden duplicate files
echo ""
echo "🚫 CHECKING FOR FORBIDDEN DUPLICATES:"

# Backend duplicates that should be removed
FORBIDDEN_FILES=(
    "/opt/webapps/revivatech/backend/routes/auth.js"
    "/opt/webapps/revivatech/backend/auth.ts"
    "/opt/webapps/revivatech/backend/server-auth-only.js"
    "/opt/webapps/revivatech/backend/src/routes/auth.ts"
    "/opt/webapps/revivatech/frontend/prisma/migrations/001_add_nextauth_tables.sql"
    "/opt/webapps/revivatech/frontend/prisma/schema.nextauth.prisma"
    "/opt/webapps/revivatech/frontend/database/"
    "/opt/webapps/revivatech/frontend/better-auth-migration.sql"
)

DUPLICATES_FOUND=0
for file in "${FORBIDDEN_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "❌ DUPLICATE FOUND: $file"
        DUPLICATES_FOUND=$((DUPLICATES_FOUND + 1))
    else
        echo "✅ Removed: $file"
    fi
done

# Check for any remaining auth files in wrong locations
echo ""
echo "🔍 SCANNING FOR UNEXPECTED AUTH FILES:"
UNEXPECTED_AUTH=$(find /opt/webapps/revivatech -name "*auth*" -type f | grep -v node_modules | grep -v .git | grep -v archive | grep -v serena | grep -v "$EXPECTED_BACKEND_AUTH" | grep -v "$EXPECTED_FRONTEND_AUTH" | grep -v "$EXPECTED_HANDLER" | grep -v "/scripts/")

if [ -n "$UNEXPECTED_AUTH" ]; then
    echo "⚠️ UNEXPECTED AUTH FILES FOUND:"
    echo "$UNEXPECTED_AUTH"
else
    echo "✅ No unexpected auth files found"
fi

# Final validation
echo ""
echo "📊 VALIDATION SUMMARY:"
if [ $DUPLICATES_FOUND -eq 0 ] && [ -z "$UNEXPECTED_AUTH" ]; then
    echo "✅ RULE 1 COMPLIANCE ACHIEVED"
    echo "✅ Single source of truth established:"
    echo "   - Backend: 1 file ($EXPECTED_BACKEND_AUTH)"
    echo "   - Frontend: 1 file ($EXPECTED_FRONTEND_AUTH)"
    echo "   - Handler: 1 file ($EXPECTED_HANDLER)"
    echo "✅ All duplicates successfully removed"
    exit 0
else
    echo "❌ RULE 1 COMPLIANCE FAILED"
    echo "❌ $DUPLICATES_FOUND forbidden duplicates found"
    [ -n "$UNEXPECTED_AUTH" ] && echo "❌ Unexpected auth files present"
    exit 1
fi