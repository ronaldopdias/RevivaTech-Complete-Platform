#!/bin/bash

# API Cleanup Script for RevivaTech
# Remove test endpoints and debug routes from production code

echo "🧹 Starting API endpoint cleanup..."

# Create backup of files before modification
BACKUP_DIR="archive/api-cleanup"
mkdir -p "$BACKUP_DIR"

# Count current test/debug endpoints
TEST_ENDPOINTS=$(grep -r "router\.get.*test\|router\.post.*test\|router\.get.*debug" backend/routes/ | wc -l)
echo "📊 Found $TEST_ENDPOINTS test/debug endpoints before cleanup"

# Files to clean
API_FILES=(
    "backend/routes/analytics.js"
    "backend/routes/ai-advanced.js" 
    "backend/routes/ai-chatbot.js"
    "backend/routes/ai-chatbot-phase3.js"
    "backend/routes/auth.js"
    "backend/routes/pdfRoutes.js"
)

# Backup files before cleanup
echo "📦 Creating backups..."
for file in "${API_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "Backed up: $file"
    fi
done

# Remove common test endpoint patterns from analytics.js
echo "🎯 Cleaning analytics.js test endpoints..."
if [ -f "backend/routes/analytics.js" ]; then
    # Remove specific test routes
    sed -i '/router\.get.*test-route-working/,/^});$/d' backend/routes/analytics.js
    sed -i '/router\.get.*ml-test-fixed/,/^});$/d' backend/routes/analytics.js  
    sed -i '/router\.get.*simple-test/,/^});$/d' backend/routes/analytics.js
    sed -i '/router\.get.*working-test/,/^});$/d' backend/routes/analytics.js
    
    # Remove debug route comments
    sed -i '/PHASE 8: CRITICAL ROUTE DEBUG/d' backend/routes/analytics.js
    sed -i '/debug-route-phase8/,/^});$/d' backend/routes/analytics.js
fi

# Remove test endpoints from other files
echo "🎯 Cleaning other API files..."
for file in "${API_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Remove simple test routes
        sed -i '/router\.get.*\/test/,/^});$/d' "$file"
        sed -i '/router\.post.*\/test/,/^});$/d' "$file"
        sed -i '/router\.get.*debug/,/^});$/d' "$file"
        
        # Remove test permission routes
        sed -i '/router\.get.*test-permissions/,/^});$/d' "$file"
        
        echo "Cleaned: $file"
    fi
done

# Count after cleanup
TEST_ENDPOINTS_AFTER=$(grep -r "router\.get.*test\|router\.post.*test\|router\.get.*debug" backend/routes/ | wc -l)
REMOVED=$((TEST_ENDPOINTS - TEST_ENDPOINTS_AFTER))

echo "✅ API cleanup completed!"
echo "📉 Removed $REMOVED test/debug endpoints"
echo "📊 Remaining: $TEST_ENDPOINTS_AFTER endpoints"
echo "💾 Backups saved in: $BACKUP_DIR"

# Show what's left (should be legitimate A/B testing endpoints)
echo "📋 Remaining test-related endpoints:"
grep -r "router\.get.*test\|router\.post.*test" backend/routes/ | grep -v "/test$" || echo "No test endpoints remaining"