#!/bin/bash

# Console.log cleanup script for RevivaTech
# This script removes excessive console.log statements that are typical of AI-generated code

echo "🧹 Starting console.log cleanup..."

# Create backup of files with most console.logs before cleanup
BACKUP_DIR="archive/console-logs-backup"
mkdir -p "$BACKUP_DIR"

# Files with the most console.logs (based on our audit)
HIGH_CONSOLE_FILES=(
    "frontend/src/lib/notifications/pushService.ts"
    "frontend/src/lib/production/console-optimizer.ts"
    "frontend/src/lib/production/index.ts"
    "frontend/src/lib/debug/debug-integration.ts"
    "frontend/src/lib/services/cacheService.ts"
    "frontend/src/lib/analytics/setup.ts"
    "frontend/src/services/analyticsWebSocketService.ts"
    "backend/routes/analytics.js"
)

# Backup high-impact files
echo "📦 Creating backups..."
for file in "${HIGH_CONSOLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "Backed up: $file"
    fi
done

# Count current console.log statements
BEFORE_COUNT=$(grep -r "console\.(log\|error\|warn)" frontend/src backend/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
echo "📊 Found $BEFORE_COUNT console statements before cleanup"

# Remove development/debug console.logs (keep error and warn for production)
echo "🔧 Removing debug console.log statements..."

# Remove simple console.log statements but preserve error handling
find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*debug/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*test/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*loaded/d' {} \;

find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/archive/*" \
    -exec sed -i '/console\.log.*phase/d' {} \;

# Count after cleanup
AFTER_COUNT=$(grep -r "console\.(log\|error\|warn)" frontend/src backend/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | wc -l)
REMOVED=$((BEFORE_COUNT - AFTER_COUNT))

echo "✅ Cleanup completed!"
echo "📉 Removed $REMOVED console statements"
echo "📊 Remaining: $AFTER_COUNT console statements"
echo "💾 Backups saved in: $BACKUP_DIR"

# Create summary report
cat > "$BACKUP_DIR/cleanup-report.txt" << EOF
Console.log Cleanup Report
=========================
Date: $(date)
Files processed: $(find frontend/src backend/ -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -not -path "*/node_modules/*" -not -path "*/archive/*" | wc -l)
Console statements before: $BEFORE_COUNT
Console statements after: $AFTER_COUNT
Console statements removed: $REMOVED
Reduction: $(echo "scale=1; $REMOVED * 100 / $BEFORE_COUNT" | bc -l)%

High-impact files backed up:
$(printf '%s\n' "${HIGH_CONSOLE_FILES[@]}")
EOF

echo "📋 Report saved to: $BACKUP_DIR/cleanup-report.txt"