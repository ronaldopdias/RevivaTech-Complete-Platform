#!/bin/bash

# Smart Console.log cleanup script for RevivaTech
# This script removes specific AI-generated console.log patterns while preserving important logging

echo "🧹 Starting smart console.log cleanup..."

# Count before cleanup (excluding generated files and node_modules)
BEFORE_COUNT=$(find frontend/src backend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v "/generated/" | \
    xargs grep "console\." | wc -l)

echo "📊 Found $BEFORE_COUNT console statements before cleanup (excluding generated files)"

# Create targeted cleanup for common AI-generated patterns
echo "🎯 Removing AI-generated console.log patterns..."

# Remove debug console.logs with common AI patterns
find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*🚀/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*🎯/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*loaded/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*Loading/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*Initializing/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*test.*working/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*hit/d' {} \;

# Remove empty console.log statements
find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/^[[:space:]]*console\.log();[[:space:]]*$/d' {} \;

# Remove console.log with simple string messages (likely debug)
find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/generated/*" \
    -not-path "*/archive/*" \
    -exec grep -l "console\.log(''" {} \; | \
    xargs sed -i "/console\.log(''/d"

# Count after cleanup
AFTER_COUNT=$(find frontend/src backend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v "/generated/" | \
    xargs grep "console\." | wc -l)

REMOVED=$((BEFORE_COUNT - AFTER_COUNT))

echo "✅ Smart cleanup completed!"
echo "📉 Removed $REMOVED console statements"
echo "📊 Remaining: $AFTER_COUNT console statements"

# Show breakdown of remaining console statements
echo "📋 Breakdown of remaining console statements:"
echo "Errors (should keep): $(find frontend/src backend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v "/generated/" | xargs grep "console\.error" | wc -l)"
echo "Warnings (should keep): $(find frontend/src backend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v "/generated/" | xargs grep "console\.warn" | wc -l)"
echo "Logs (review needed): $(find frontend/src backend/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v "/generated/" | xargs grep "console\.log" | wc -l)"