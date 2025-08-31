#!/bin/bash
# Duplicate File Check Script
# As required by PRD Phase 7.2 - validates no duplicate auth files exist

echo "🔍 Checking for duplicate authentication files..."
echo "================================================"

cd /opt/webapps/revivatech

# Initialize counters
ISSUES_FOUND=0

echo ""
echo "📁 Backend Auth Files:"
echo "----------------------"

# Check for multiple auth files in backend/lib
AUTH_FILES=$(find backend/lib -name "*auth*.js" -type f 2>/dev/null | wc -l)
if [ $AUTH_FILES -gt 1 ]; then
  echo "❌ Found $AUTH_FILES auth files in backend/lib (should be 1):"
  find backend/lib -name "*auth*.js" -type f
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "✅ Single auth file in backend/lib: $AUTH_FILES"
fi

# Check for old test auth files
TEST_AUTH_FILES=$(find . -name "test*auth*.js" -type f 2>/dev/null | wc -l)
if [ $TEST_AUTH_FILES -gt 0 ]; then
  echo "❌ Found $TEST_AUTH_FILES test auth files (should be 0):"
  find . -name "test*auth*.js" -type f
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "✅ No test auth files found"
fi

echo ""
echo "📁 Schema Files:"
echo "----------------"

# Check for multiple Prisma schema files
SCHEMA_FILES=$(find backend -name "*.prisma" -type f 2>/dev/null | wc -l)
if [ $SCHEMA_FILES -gt 1 ]; then
  echo "❌ Found $SCHEMA_FILES Prisma schema files (should be 1):"
  find backend -name "*.prisma" -type f
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "✅ Single Prisma schema file: $SCHEMA_FILES"
fi

echo ""
echo "📁 Route Files:"
echo "---------------"

# Check for old auth route files in dist/
DIST_AUTH_ROUTES=$(find backend/dist -name "*auth*" -type f 2>/dev/null | wc -l)
if [ $DIST_AUTH_ROUTES -gt 0 ]; then
  echo "⚠️ Found $DIST_AUTH_ROUTES compiled auth files in dist/ (cleaned automatically):"
  find backend/dist -name "*auth*" -type f
  # Auto-cleanup dist files
  find backend/dist -name "*auth*" -type f -delete
  echo "   Cleaned up automatically"
else
  echo "✅ No old auth files in dist/"
fi

echo ""
echo "📁 Frontend Auth Files:"
echo "-----------------------"

# Check for multiple auth client files
FRONTEND_AUTH_FILES=$(find frontend/src/lib -name "*auth*.ts" -type f 2>/dev/null | wc -l)
if [ $FRONTEND_AUTH_FILES -gt 1 ]; then
  echo "❌ Found $FRONTEND_AUTH_FILES auth client files (should be 1):"
  find frontend/src/lib -name "*auth*.ts" -type f
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "✅ Single auth client file: $FRONTEND_AUTH_FILES"
fi

echo ""
echo "📋 DUPLICATE CHECK SUMMARY:"
echo "============================"

if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ PASSED - No duplicate files found"
  echo "🎯 Clean codebase maintained"
  exit 0
else
  echo "❌ FAILED - Found $ISSUES_FOUND duplicate file issues"
  echo ""
  echo "💡 RECOMMENDATIONS:"
  echo "   1. Remove duplicate auth files keeping only the latest version"
  echo "   2. Ensure single source of truth for each component"
  echo "   3. Clear Prisma cache: rm -rf backend/node_modules/.prisma"
  echo "   4. Rebuild containers after cleanup"
  exit 1
fi