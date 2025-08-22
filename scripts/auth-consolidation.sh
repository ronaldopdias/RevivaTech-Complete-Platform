#!/bin/bash

# Authentication Middleware Consolidation Script
# Replace better-auth-db-direct with better-auth-official across all routes

echo "🔐 Starting Better Auth consolidation..."

# Create backup
BACKUP_DIR="archive/auth-consolidation"
mkdir -p "$BACKUP_DIR"

# Find all files using better-auth-db-direct
FILES_TO_UPDATE=$(grep -r "better-auth-db-direct" backend/routes/ --include="*.js" -l)

echo "📦 Creating backups..."
for file in $FILES_TO_UPDATE; do
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    echo "Backed up: $file"
done

echo "🔄 Updating authentication imports..."
# Replace middleware import
find backend/routes/ -name "*.js" -exec sed -i 's/better-auth-db-direct/better-auth-official/g' {} \;

echo "✅ Authentication consolidation completed!"
echo "📊 Files updated:"
echo "$FILES_TO_UPDATE"
echo "💾 Backups saved in: $BACKUP_DIR"