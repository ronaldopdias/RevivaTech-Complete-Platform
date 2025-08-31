#!/bin/bash
# RevivaTech Environment Validation Script
# Prevents Claude CLI configuration conflicts and ensures environment integrity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 RevivaTech Environment Validation${NC}"
echo "=========================================="

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

VALIDATION_PASSED=true

# Function to report validation errors
validation_error() {
    echo -e "${RED}❌ VALIDATION ERROR:${NC} $1"
    VALIDATION_PASSED=false
}

validation_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

validation_success() {
    echo -e "${GREEN}✅${NC} $1"
}

echo -e "\n${BLUE}📋 Checking for conflicting configuration files...${NC}"

# Check for conflicting environment files that cause Claude CLI confusion
CONFLICT_FILES=(
    "frontend/.env"
    "frontend/.env.development" 
    "frontend/.env.production"
    "frontend/.env.ssl"
    "frontend/.env.staging"
    "frontend/.env.debug.js"
    "frontend/.env.local.example"
    "backend/.env.production.example"
    ".env.production.example"
    "docker-compose.dev.yml"
)

CONFLICTS_FOUND=0
for file in "${CONFLICT_FILES[@]}"; do
    if [ -f "$file" ]; then
        validation_error "Found conflicting file: $file (should be removed)"
        CONFLICTS_FOUND=$((CONFLICTS_FOUND + 1))
    fi
done

if [ $CONFLICTS_FOUND -eq 0 ]; then
    validation_success "No conflicting configuration files found"
fi

echo -e "\n${BLUE}🔧 Checking required configuration files...${NC}"

# Check for required configuration files
REQUIRED_FILES=(
    ".env"
    ".env.production"
    "frontend/.env.local"
    "backend/.env"
    "docker-compose.override.yml"
    "docker-compose.prod.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        validation_success "Required file exists: $file"
    else
        validation_error "Missing required file: $file"
    fi
done

echo -e "\n${BLUE}🌍 Validating environment variables...${NC}"

# Load environment based on NODE_ENV
if [ "${NODE_ENV:-development}" = "production" ]; then
    ENV_FILE=".env.production"
    echo "📍 Validating PRODUCTION environment"
    
    # Required production variables
    REQUIRED_PROD_VARS=("POSTGRES_PASSWORD" "JWT_SECRET" "BETTER_AUTH_SECRET")
    for var in "${REQUIRED_PROD_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            validation_error "Missing required production variable: $var"
        else
            validation_success "Production variable set: $var"
        fi
    done
    
    # Check for development URLs in production
    if grep -q "localhost" .env.production; then
        validation_warning "Found localhost URLs in production config"
    fi
    
    # Check for debug flags in production
    if grep -q "DEBUG.*=true" .env.production; then
        validation_error "Debug flags enabled in production"
    fi
    
else
    ENV_FILE=".env"
    echo "📍 Validating DEVELOPMENT environment"
    
    # Check development configurations
    if [ -f "frontend/.env.local" ]; then
        if grep -q "NODE_ENV=production" frontend/.env.local; then
            validation_error "Production NODE_ENV found in development override file"
        fi
    fi
fi

echo -e "\n${BLUE}🐳 Validating Docker configurations...${NC}"

# Check Docker Compose structure
if [ -f "docker-compose.override.yml" ]; then
    validation_success "Development override file exists"
    
    # Check for development-specific settings
    if grep -q "user.*0:0" docker-compose.override.yml; then
        validation_success "Development user permissions configured"
    fi
    
    if grep -q "volumes:" docker-compose.override.yml; then
        validation_success "Development volume mounts configured"
    fi
else
    validation_error "Missing development override file: docker-compose.override.yml"
fi

if [ -f "docker-compose.prod.yml" ]; then
    validation_success "Production compose file exists"
    
    # Check production settings
    if grep -q "_prod" docker-compose.prod.yml; then
        validation_success "Production container naming configured"
    fi
    
    if grep -q "restart.*always" docker-compose.prod.yml; then
        validation_success "Production restart policy configured"
    fi
else
    validation_error "Missing production compose file: docker-compose.prod.yml"
fi

echo -e "\n${BLUE}🔌 Checking port conflicts...${NC}"

# Check for port conflicts between development and production
DEV_PORTS=$(grep -o ":[0-9]\{4\}:" docker-compose.override.yml 2>/dev/null | sort -u || true)
PROD_PORTS=$(grep -o ":[0-9]\{4\}:" docker-compose.prod.yml 2>/dev/null | sort -u || true)

if [ "$DEV_PORTS" = "$PROD_PORTS" ]; then
    validation_success "Port configurations consistent between dev and prod"
else
    validation_warning "Different ports between dev and prod - this is expected"
fi

echo -e "\n${BLUE}🔒 Checking for security issues...${NC}"

# Check for hardcoded Tailscale IPs (100.x.x.x format)
TAILSCALE_IPS=$(grep -r "100\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" frontend/next.config.ts backend/server.js backend/lib/ 2>/dev/null || true)
if [ -n "$TAILSCALE_IPS" ]; then
    validation_error "Hardcoded Tailscale IPs found in configuration:"
    echo "$TAILSCALE_IPS"
else
    validation_success "No hardcoded Tailscale IPs found"
fi

# Check for test credentials in production
if [ -f ".env.production" ] && grep -q "test_" .env.production; then
    validation_error "Test credentials found in production environment"
fi

# Check for placeholder values that need replacement
PLACEHOLDER_COUNT=$(grep -h "PLACEHOLDER\|REPLACE_WITH\|placeholder" .env .env.production 2>/dev/null | wc -l)
if [ "$PLACEHOLDER_COUNT" -gt 0 ]; then
    validation_warning "Found $PLACEHOLDER_COUNT placeholder values that need real configuration"
fi

echo -e "\n${BLUE}📊 Environment Validation Summary${NC}"
echo "=================================="

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 VALIDATION PASSED${NC}"
    echo "✅ Environment configuration is clean and consistent"
    echo "✅ No Claude CLI conflicts detected"
    echo "✅ Development and production environments properly separated"
    
    echo -e "\n${BLUE}🚀 Ready to deploy:${NC}"
    echo "   Development: docker-compose up -d"
    echo "   Production:  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "Please fix the errors above before deploying"
    echo -e "\n${YELLOW}💡 Common fixes:${NC}"
    echo "   - Remove conflicting .env files"
    echo "   - Set required environment variables"
    echo "   - Remove hardcoded IPs and test credentials"
    echo "   - Ensure proper file permissions"
    
    exit 1
fi