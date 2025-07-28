#!/bin/bash

# Security Audit and Penetration Testing Framework for RevivaTech
# Comprehensive security testing including vulnerability scanning, penetration testing, and compliance checks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="${PROJECT_ROOT:-/opt/webapps/revivatech}"
SECURITY_REPORT_DIR="${SECURITY_REPORT_DIR:-/var/log/revivatech/security}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$SECURITY_REPORT_DIR/security_audit_$TIMESTAMP.json"
HTML_REPORT_FILE="$SECURITY_REPORT_DIR/security_audit_$TIMESTAMP.html"

# Target URLs
TARGET_URLS=(
    "http://localhost:3010"
    "http://localhost:3011"
    "https://revivatech.co.uk"
    "https://revivatech.com.br"
)

# Database connection details
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5435}"
DB_NAME="${DB_NAME:-revivatech_new}"
DB_USER="${DB_USER:-revivatech_user}"

# Security test categories
SECURITY_TESTS=(
    "ssl_tls_config"
    "http_headers"
    "authentication"
    "authorization"
    "input_validation"
    "sql_injection"
    "xss_vulnerabilities"
    "csrf_protection"
    "session_management"
    "file_upload_security"
    "api_security"
    "container_security"
    "database_security"
    "dependency_vulnerabilities"
    "configuration_security"
)

# Functions
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${message}${NC}"
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}${message}${NC}"
}

warning() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}"
}

# Setup security audit infrastructure
setup_security_audit() {
    log "Setting up security audit infrastructure"
    
    # Create directories
    mkdir -p "$SECURITY_REPORT_DIR"
    
    # Check for required tools
    local missing_tools=()
    
    # Essential tools
    local required_tools=(
        "curl"
        "nmap"
        "openssl"
        "jq"
        "docker"
    )
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    # Optional security tools
    local optional_tools=(
        "nikto"
        "sqlmap"
        "gobuster"
        "nuclei"
        "bandit"
        "semgrep"
    )
    
    local available_optional_tools=()
    for tool in "${optional_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            available_optional_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        error "Missing required tools: ${missing_tools[*]}"
        log "Please install missing tools before running security audit"
        exit 1
    fi
    
    if [[ ${#available_optional_tools[@]} -gt 0 ]]; then
        log "Available security tools: ${available_optional_tools[*]}"
    else
        warning "No advanced security tools found. Install nikto, sqlmap, nuclei for comprehensive testing"
    fi
    
    success "Security audit infrastructure setup completed"
}

# Initialize security report
init_security_report() {
    local report_data=$(cat <<EOF
{
    "audit_info": {
        "timestamp": "$(date -Iseconds)",
        "audit_id": "security_audit_$TIMESTAMP",
        "target_urls": [$(printf '"%s",' "${TARGET_URLS[@]}" | sed 's/,$//')],
        "test_categories": [$(printf '"%s",' "${SECURITY_TESTS[@]}" | sed 's/,$//')],
        "environment": "production",
        "auditor": "$(whoami)",
        "hostname": "$(hostname)"
    },
    "summary": {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "warnings": 0,
        "critical_issues": 0,
        "high_issues": 0,
        "medium_issues": 0,
        "low_issues": 0
    },
    "test_results": {}
}
EOF
    )
    
    echo "$report_data" > "$REPORT_FILE"
    log "Security report initialized: $REPORT_FILE"
}

# Add test result to report
add_test_result() {
    local test_name="$1"
    local status="$2"
    local severity="${3:-LOW}"
    local description="$4"
    local details="${5:-{}}"
    
    local test_result=$(cat <<EOF
{
    "test_name": "$test_name",
    "status": "$status",
    "severity": "$severity",
    "description": "$description",
    "timestamp": "$(date -Iseconds)",
    "details": $details
}
EOF
    )
    
    # Update report file
    local updated_report
    updated_report=$(jq ".test_results[\"$test_name\"] = $test_result" "$REPORT_FILE")
    echo "$updated_report" > "$REPORT_FILE"
}

# SSL/TLS Configuration Test
test_ssl_tls_config() {
    log "Testing SSL/TLS configuration"
    
    local ssl_results=()
    local issues_found=0
    
    for url in "${TARGET_URLS[@]}"; do
        if [[ "$url" =~ ^https:// ]]; then
            local hostname
            hostname=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
            
            log "Testing SSL for $hostname"
            
            # Test SSL certificate
            local cert_info
            if cert_info=$(openssl s_client -connect "$hostname:443" -servername "$hostname" < /dev/null 2>/dev/null); then
                local cert_expiry
                cert_expiry=$(echo "$cert_info" | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" | cut -d= -f2)
                
                local ssl_version
                ssl_version=$(echo "$cert_info" | grep "Protocol" | head -1 | awk '{print $3}' || echo "Unknown")
                
                local cipher
                cipher=$(echo "$cert_info" | grep "Cipher" | head -1 | awk '{print $3}' || echo "Unknown")
                
                ssl_results+=("{\"hostname\": \"$hostname\", \"cert_expiry\": \"$cert_expiry\", \"protocol\": \"$ssl_version\", \"cipher\": \"$cipher\", \"status\": \"valid\"}")
                
                # Check for weak protocols
                if [[ "$ssl_version" =~ (SSLv2|SSLv3|TLSv1\.0|TLSv1\.1) ]]; then
                    issues_found=$((issues_found + 1))
                    warning "Weak SSL/TLS protocol detected: $ssl_version on $hostname"
                fi
            else
                ssl_results+=("{\"hostname\": \"$hostname\", \"status\": \"error\", \"error\": \"SSL connection failed\"}")
                issues_found=$((issues_found + 1))
                error "SSL connection failed for $hostname"
            fi
        fi
    done
    
    local ssl_details
    ssl_details=$(printf '%s\n' "${ssl_results[@]}" | jq -s '.')
    
    if [[ $issues_found -eq 0 ]]; then
        add_test_result "ssl_tls_config" "PASS" "LOW" "SSL/TLS configuration is secure" "$ssl_details"
        success "SSL/TLS configuration test passed"
    else
        add_test_result "ssl_tls_config" "FAIL" "HIGH" "SSL/TLS configuration issues found: $issues_found" "$ssl_details"
        error "SSL/TLS configuration test failed"
    fi
}

# HTTP Security Headers Test
test_http_headers() {
    log "Testing HTTP security headers"
    
    local header_results=()
    local missing_headers=0
    
    # Required security headers
    local required_headers=(
        "Strict-Transport-Security"
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Content-Security-Policy"
        "Referrer-Policy"
    )
    
    for url in "${TARGET_URLS[@]}"; do
        log "Testing headers for $url"
        
        local headers
        if headers=$(curl -s -I -m 10 "$url" 2>/dev/null); then
            local header_status=()
            
            for header in "${required_headers[@]}"; do
                if echo "$headers" | grep -qi "^$header:"; then
                    local header_value
                    header_value=$(echo "$headers" | grep -i "^$header:" | cut -d: -f2- | xargs)
                    header_status+=("{\"header\": \"$header\", \"present\": true, \"value\": \"$header_value\"}")
                else
                    header_status+=("{\"header\": \"$header\", \"present\": false}")
                    missing_headers=$((missing_headers + 1))
                    warning "Missing security header: $header on $url"
                fi
            done
            
            local url_result
            url_result=$(printf '%s\n' "${header_status[@]}" | jq -s .)
            header_results+=("{\"url\": \"$url\", \"headers\": $url_result}")
        else
            header_results+=("{\"url\": \"$url\", \"error\": \"Failed to fetch headers\"}")
            error "Failed to fetch headers for $url"
        fi
    done
    
    local header_details
    header_details=$(printf '%s\n' "${header_results[@]}" | jq -s '.')
    
    if [[ $missing_headers -eq 0 ]]; then
        add_test_result "http_headers" "PASS" "LOW" "All required security headers are present" "$header_details"
        success "HTTP security headers test passed"
    else
        add_test_result "http_headers" "FAIL" "MEDIUM" "Missing security headers: $missing_headers" "$header_details"
        warning "HTTP security headers test failed"
    fi
}

# Authentication Security Test
test_authentication() {
    log "Testing authentication security"
    
    local auth_issues=0
    local auth_results=()
    
    # Test login endpoint
    local login_url="http://localhost:3011/auth/login"
    
    # Test for common authentication vulnerabilities
    log "Testing authentication endpoint: $login_url"
    
    # Test 1: Brute force protection
    log "Testing brute force protection"
    local failed_attempts=0
    for i in {1..5}; do
        local response
        response=$(curl -s -w "%{http_code}" -X POST "$login_url" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"wrongpassword"}' \
            2>/dev/null || echo "000")
        
        local http_code="${response: -3}"
        if [[ "$http_code" == "401" ]]; then
            failed_attempts=$((failed_attempts + 1))
        elif [[ "$http_code" == "429" ]]; then
            log "Rate limiting detected after $failed_attempts attempts"
            break
        fi
    done
    
    if [[ $failed_attempts -ge 5 ]]; then
        auth_issues=$((auth_issues + 1))
        auth_results+=("{\"test\": \"brute_force_protection\", \"status\": \"fail\", \"details\": \"No rate limiting detected\"}")
        warning "No brute force protection detected"
    else
        auth_results+=("{\"test\": \"brute_force_protection\", \"status\": \"pass\", \"details\": \"Rate limiting active\"}")
    fi
    
    # Test 2: Password complexity (if registration endpoint exists)
    local register_url="http://localhost:3011/auth/register"
    log "Testing password complexity requirements"
    
    local weak_passwords=("123" "password" "admin" "test")
    local weak_password_accepted=false
    
    for password in "${weak_passwords[@]}"; do
        local response
        response=$(curl -s -w "%{http_code}" -X POST "$register_url" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"test$(date +%s)@example.com\",\"password\":\"$password\",\"name\":\"Test User\"}" \
            2>/dev/null || echo "000")
        
        local http_code="${response: -3}"
        if [[ "$http_code" == "201" || "$http_code" == "200" ]]; then
            weak_password_accepted=true
            auth_issues=$((auth_issues + 1))
            warning "Weak password accepted: $password"
            break
        fi
    done
    
    if [[ "$weak_password_accepted" == "true" ]]; then
        auth_results+=("{\"test\": \"password_complexity\", \"status\": \"fail\", \"details\": \"Weak passwords accepted\"}")
    else
        auth_results+=("{\"test\": \"password_complexity\", \"status\": \"pass\", \"details\": \"Strong password requirements enforced\"}")
    fi
    
    # Test 3: Session management
    log "Testing session security"
    
    # Test for secure cookie attributes
    local cookie_response
    cookie_response=$(curl -s -I -X POST "$login_url" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@revivatech.co.uk","password":"validpassword"}' \
        2>/dev/null || echo "")
    
    local secure_cookies=true
    if echo "$cookie_response" | grep -i "set-cookie" | grep -v -i "secure"; then
        secure_cookies=false
        auth_issues=$((auth_issues + 1))
        warning "Cookies not marked as Secure"
    fi
    
    if echo "$cookie_response" | grep -i "set-cookie" | grep -v -i "httponly"; then
        secure_cookies=false
        auth_issues=$((auth_issues + 1))
        warning "Cookies not marked as HttpOnly"
    fi
    
    if [[ "$secure_cookies" == "true" ]]; then
        auth_results+=("{\"test\": \"secure_cookies\", \"status\": \"pass\", \"details\": \"Cookies properly secured\"}")
    else
        auth_results+=("{\"test\": \"secure_cookies\", \"status\": \"fail\", \"details\": \"Insecure cookie configuration\"}")
    fi
    
    local auth_details
    auth_details=$(printf '%s\n' "${auth_results[@]}" | jq -s '.')
    
    if [[ $auth_issues -eq 0 ]]; then
        add_test_result "authentication" "PASS" "LOW" "Authentication security is adequate" "$auth_details"
        success "Authentication security test passed"
    else
        add_test_result "authentication" "FAIL" "HIGH" "Authentication security issues found: $auth_issues" "$auth_details"
        error "Authentication security test failed"
    fi
}

# SQL Injection Test
test_sql_injection() {
    log "Testing for SQL injection vulnerabilities"
    
    local sql_issues=0
    local sql_results=()
    
    # Common SQL injection payloads
    local sql_payloads=(
        "' OR '1'='1"
        "'; DROP TABLE users; --"
        "' UNION SELECT * FROM users --"
        "admin'--"
        "' OR 1=1 --"
    )
    
    # Test endpoints that might be vulnerable
    local test_endpoints=(
        "http://localhost:3011/api/devices?search="
        "http://localhost:3011/api/users?email="
        "http://localhost:3010/api/search?q="
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        log "Testing SQL injection on: $endpoint"
        
        for payload in "${sql_payloads[@]}"; do
            local encoded_payload
            encoded_payload=$(echo "$payload" | sed 's/ /%20/g' | sed 's/'\''/%27/g')
            
            local test_url="${endpoint}${encoded_payload}"
            local response
            response=$(curl -s -w "%{http_code}" -m 10 "$test_url" 2>/dev/null || echo "000")
            
            local http_code="${response: -3}"
            local response_body="${response%???}"
            
            # Look for SQL error messages
            if echo "$response_body" | grep -qi -E "(sql|syntax|mysql|postgres|database|column|table).*error"; then
                sql_issues=$((sql_issues + 1))
                sql_results+=("{\"endpoint\": \"$endpoint\", \"payload\": \"$payload\", \"status\": \"vulnerable\", \"details\": \"SQL error detected\"}")
                warning "Potential SQL injection vulnerability: $endpoint"
                break
            fi
            
            # Look for unusual response patterns
            if [[ ${#response_body} -gt 10000 ]] && echo "$response_body" | grep -qi "select\|union\|from"; then
                sql_issues=$((sql_issues + 1))
                sql_results+=("{\"endpoint\": \"$endpoint\", \"payload\": \"$payload\", \"status\": \"suspicious\", \"details\": \"Unusual response pattern\"}")
                warning "Suspicious response pattern: $endpoint"
                break
            fi
        done
        
        if [[ ${#sql_results[@]} -eq 0 ]] || ! echo "${sql_results[-1]}" | grep -q "\"endpoint\": \"$endpoint\""; then
            sql_results+=("{\"endpoint\": \"$endpoint\", \"status\": \"safe\", \"details\": \"No SQL injection detected\"}")
        fi
    done
    
    local sql_details
    sql_details=$(printf '%s\n' "${sql_results[@]}" | jq -s '.')
    
    if [[ $sql_issues -eq 0 ]]; then
        add_test_result "sql_injection" "PASS" "LOW" "No SQL injection vulnerabilities detected" "$sql_details"
        success "SQL injection test passed"
    else
        add_test_result "sql_injection" "FAIL" "CRITICAL" "SQL injection vulnerabilities found: $sql_issues" "$sql_details"
        error "SQL injection test failed"
    fi
}

# XSS Vulnerability Test
test_xss_vulnerabilities() {
    log "Testing for XSS vulnerabilities"
    
    local xss_issues=0
    local xss_results=()
    
    # XSS payloads
    local xss_payloads=(
        "<script>alert('XSS')</script>"
        "javascript:alert('XSS')"
        "<img src=x onerror=alert('XSS')>"
        "<svg onload=alert('XSS')>"
        "'\"><script>alert('XSS')</script>"
    )
    
    # Test endpoints
    local test_endpoints=(
        "http://localhost:3010/search?q="
        "http://localhost:3011/api/search?query="
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        log "Testing XSS on: $endpoint"
        
        for payload in "${xss_payloads[@]}"; do
            local encoded_payload
            encoded_payload=$(echo "$payload" | sed 's/</%3C/g' | sed 's/>/%3E/g' | sed 's/ /%20/g')
            
            local test_url="${endpoint}${encoded_payload}"
            local response
            response=$(curl -s -m 10 "$test_url" 2>/dev/null || echo "")
            
            # Check if payload is reflected without encoding
            if echo "$response" | grep -F "$payload" > /dev/null; then
                xss_issues=$((xss_issues + 1))
                xss_results+=("{\"endpoint\": \"$endpoint\", \"payload\": \"$payload\", \"status\": \"vulnerable\", \"details\": \"Unescaped payload reflected\"}")
                warning "Potential XSS vulnerability: $endpoint"
                break
            fi
        done
        
        if [[ ${#xss_results[@]} -eq 0 ]] || ! echo "${xss_results[-1]}" | grep -q "\"endpoint\": \"$endpoint\""; then
            xss_results+=("{\"endpoint\": \"$endpoint\", \"status\": \"safe\", \"details\": \"No XSS vulnerability detected\"}")
        fi
    done
    
    local xss_details
    xss_details=$(printf '%s\n' "${xss_results[@]}" | jq -s '.')
    
    if [[ $xss_issues -eq 0 ]]; then
        add_test_result "xss_vulnerabilities" "PASS" "LOW" "No XSS vulnerabilities detected" "$xss_details"
        success "XSS vulnerability test passed"
    else
        add_test_result "xss_vulnerabilities" "FAIL" "HIGH" "XSS vulnerabilities found: $xss_issues" "$xss_details"
        error "XSS vulnerability test failed"
    fi
}

# Container Security Test
test_container_security() {
    log "Testing container security"
    
    local container_issues=0
    local container_results=()
    
    # Test running containers
    local containers=("revivatech_new_frontend" "revivatech_new_backend" "revivatech_new_database" "revivatech_new_redis")
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
            log "Testing security of container: $container"
            
            # Check if running as root
            local user_info
            user_info=$(docker exec "$container" whoami 2>/dev/null || echo "unknown")
            
            if [[ "$user_info" == "root" ]]; then
                container_issues=$((container_issues + 1))
                container_results+=("{\"container\": \"$container\", \"issue\": \"running_as_root\", \"severity\": \"medium\"}")
                warning "Container $container is running as root"
            fi
            
            # Check for privileged mode
            local privileged
            privileged=$(docker inspect "$container" --format='{{.HostConfig.Privileged}}' 2>/dev/null || echo "false")
            
            if [[ "$privileged" == "true" ]]; then
                container_issues=$((container_issues + 1))
                container_results+=("{\"container\": \"$container\", \"issue\": \"privileged_mode\", \"severity\": \"high\"}")
                warning "Container $container is running in privileged mode"
            fi
            
            # Check for exposed sensitive ports
            local port_info
            port_info=$(docker port "$container" 2>/dev/null || echo "")
            
            if echo "$port_info" | grep -q "0.0.0.0"; then
                # Check if database ports are exposed
                if [[ "$container" =~ (database|redis) ]] && echo "$port_info" | grep -q "0.0.0.0"; then
                    container_issues=$((container_issues + 1))
                    container_results+=("{\"container\": \"$container\", \"issue\": \"database_port_exposed\", \"severity\": \"high\"}")
                    warning "Database container $container has ports exposed to 0.0.0.0"
                fi
            fi
            
            if [[ ${#container_results[@]} -eq 0 ]] || ! echo "${container_results[-1]}" | grep -q "\"container\": \"$container\""; then
                container_results+=("{\"container\": \"$container\", \"status\": \"secure\"}")
            fi
        else
            container_results+=("{\"container\": \"$container\", \"status\": \"not_running\"}")
        fi
    done
    
    local container_details
    container_details=$(printf '%s\n' "${container_results[@]}" | jq -s '.')
    
    if [[ $container_issues -eq 0 ]]; then
        add_test_result "container_security" "PASS" "LOW" "Container security is adequate" "$container_details"
        success "Container security test passed"
    else
        add_test_result "container_security" "FAIL" "MEDIUM" "Container security issues found: $container_issues" "$container_details"
        warning "Container security test failed"
    fi
}

# Database Security Test
test_database_security() {
    log "Testing database security"
    
    local db_issues=0
    local db_results=()
    
    # Test database connection security
    if docker ps --format '{{.Names}}' | grep -q "revivatech_new_database"; then
        log "Testing PostgreSQL security configuration"
        
        # Test for default passwords (if accessible)
        local weak_passwords=("postgres" "password" "admin" "revivatech")
        
        for password in "${weak_passwords[@]}"; do
            if PGPASSWORD="$password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
                db_issues=$((db_issues + 1))
                db_results+=("{\"test\": \"weak_password\", \"status\": \"fail\", \"password\": \"$password\"}")
                error "Weak database password detected: $password"
                break
            fi
        done
        
        # Test SSL configuration
        local ssl_status
        ssl_status=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW ssl;" 2>/dev/null | xargs || echo "off")
        
        if [[ "$ssl_status" != "on" ]]; then
            db_issues=$((db_issues + 1))
            db_results+=("{\"test\": \"ssl_disabled\", \"status\": \"fail\", \"details\": \"SSL not enabled\"}")
            warning "Database SSL is disabled"
        else
            db_results+=("{\"test\": \"ssl_enabled\", \"status\": \"pass\"}")
        fi
        
        # Test for dangerous extensions
        local dangerous_extensions
        dangerous_extensions=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT extname FROM pg_extension WHERE extname IN ('plpython3u', 'plperlu', 'plpythonu');" 2>/dev/null | xargs || echo "")
        
        if [[ -n "$dangerous_extensions" ]]; then
            db_issues=$((db_issues + 1))
            db_results+=("{\"test\": \"dangerous_extensions\", \"status\": \"fail\", \"extensions\": \"$dangerous_extensions\"}")
            warning "Dangerous database extensions found: $dangerous_extensions"
        else
            db_results+=("{\"test\": \"dangerous_extensions\", \"status\": \"pass\"}")
        fi
        
        # Test user privileges
        local superuser_count
        superuser_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_user WHERE usesuper = true;" 2>/dev/null | xargs || echo "0")
        
        if [[ "$superuser_count" -gt 1 ]]; then
            db_issues=$((db_issues + 1))
            db_results+=("{\"test\": \"excessive_superusers\", \"status\": \"fail\", \"count\": $superuser_count}")
            warning "Too many database superusers: $superuser_count"
        else
            db_results+=("{\"test\": \"superuser_count\", \"status\": \"pass\", \"count\": $superuser_count}")
        fi
    else
        db_results+=("{\"test\": \"database_accessibility\", \"status\": \"fail\", \"details\": \"Database container not accessible\"}")
        db_issues=$((db_issues + 1))
    fi
    
    local db_details
    db_details=$(printf '%s\n' "${db_results[@]}" | jq -s '.')
    
    if [[ $db_issues -eq 0 ]]; then
        add_test_result "database_security" "PASS" "LOW" "Database security is adequate" "$db_details"
        success "Database security test passed"
    else
        add_test_result "database_security" "FAIL" "HIGH" "Database security issues found: $db_issues" "$db_details"
        error "Database security test failed"
    fi
}

# Dependency Vulnerability Test
test_dependency_vulnerabilities() {
    log "Testing for dependency vulnerabilities"
    
    local dep_issues=0
    local dep_results=()
    
    # Check for npm audit (if package.json exists)
    if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
        log "Running npm audit for frontend dependencies"
        
        cd "$PROJECT_ROOT/frontend"
        local npm_audit_output
        if npm_audit_output=$(npm audit --json 2>/dev/null); then
            local vulnerabilities
            vulnerabilities=$(echo "$npm_audit_output" | jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0)) | length' 2>/dev/null || echo "0")
            
            if [[ "$vulnerabilities" -gt 0 ]]; then
                dep_issues=$((dep_issues + vulnerabilities))
                dep_results+=("{\"component\": \"frontend\", \"vulnerabilities\": $vulnerabilities, \"audit_output\": $npm_audit_output}")
                warning "Frontend dependencies have $vulnerabilities vulnerabilities"
            else
                dep_results+=("{\"component\": \"frontend\", \"vulnerabilities\": 0}")
            fi
        else
            dep_results+=("{\"component\": \"frontend\", \"status\": \"audit_failed\"}")
        fi
        cd - > /dev/null
    fi
    
    # Check for backend dependencies (if package.json exists)
    if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
        log "Running npm audit for backend dependencies"
        
        cd "$PROJECT_ROOT/backend"
        local npm_audit_output
        if npm_audit_output=$(npm audit --json 2>/dev/null); then
            local vulnerabilities
            vulnerabilities=$(echo "$npm_audit_output" | jq '.metadata.vulnerabilities | to_entries | map(select(.value > 0)) | length' 2>/dev/null || echo "0")
            
            if [[ "$vulnerabilities" -gt 0 ]]; then
                dep_issues=$((dep_issues + vulnerabilities))
                dep_results+=("{\"component\": \"backend\", \"vulnerabilities\": $vulnerabilities, \"audit_output\": $npm_audit_output}")
                warning "Backend dependencies have $vulnerabilities vulnerabilities"
            else
                dep_results+=("{\"component\": \"backend\", \"vulnerabilities\": 0}")
            fi
        else
            dep_results+=("{\"component\": \"backend\", \"status\": \"audit_failed\"}")
        fi
        cd - > /dev/null
    fi
    
    # Check Docker images for vulnerabilities (if available)
    if command -v docker &> /dev/null; then
        log "Checking Docker images for vulnerabilities"
        
        local containers=("revivatech_new_frontend" "revivatech_new_backend")
        for container in "${containers[@]}"; do
            if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
                # Simple check for outdated base images
                local image_info
                image_info=$(docker inspect "$container" --format='{{.Config.Image}}' 2>/dev/null || echo "unknown")
                
                if [[ "$image_info" =~ (ubuntu|debian|alpine):.*[0-9]{4} ]]; then
                    # Image has a year-based tag, might be outdated
                    local image_year
                    image_year=$(echo "$image_info" | grep -o '[0-9]\{4\}' | head -1)
                    local current_year
                    current_year=$(date +%Y)
                    
                    if [[ $((current_year - image_year)) -gt 1 ]]; then
                        dep_issues=$((dep_issues + 1))
                        dep_results+=("{\"container\": \"$container\", \"issue\": \"outdated_base_image\", \"image\": \"$image_info\"}")
                        warning "Container $container may have outdated base image: $image_info"
                    fi
                fi
            fi
        done
    fi
    
    local dep_details
    dep_details=$(printf '%s\n' "${dep_results[@]}" | jq -s '.')
    
    if [[ $dep_issues -eq 0 ]]; then
        add_test_result "dependency_vulnerabilities" "PASS" "LOW" "No dependency vulnerabilities detected" "$dep_details"
        success "Dependency vulnerability test passed"
    else
        add_test_result "dependency_vulnerabilities" "FAIL" "MEDIUM" "Dependency vulnerabilities found: $dep_issues" "$dep_details"
        warning "Dependency vulnerability test failed"
    fi
}

# Configuration Security Test
test_configuration_security() {
    log "Testing configuration security"
    
    local config_issues=0
    local config_results=()
    
    # Check for exposed configuration files
    local sensitive_files=(
        ".env"
        ".env.local"
        ".env.production"
        "config/database.yml"
        "docker-compose.yml"
        "package.json"
    )
    
    for file in "${sensitive_files[@]}"; do
        local file_path="$PROJECT_ROOT/$file"
        if [[ -f "$file_path" ]]; then
            # Check file permissions
            local permissions
            permissions=$(stat -c "%a" "$file_path" 2>/dev/null || stat -f "%A" "$file_path" 2>/dev/null || echo "unknown")
            
            if [[ "$permissions" =~ ^[0-9]{3}$ ]] && [[ "${permissions:2:1}" -gt 0 ]]; then
                config_issues=$((config_issues + 1))
                config_results+=("{\"file\": \"$file\", \"issue\": \"world_readable\", \"permissions\": \"$permissions\"}")
                warning "Sensitive file $file is world-readable: $permissions"
            fi
            
            # Check for exposed secrets in config files
            if grep -q -E "(password|secret|key|token).*=.*[a-zA-Z0-9]" "$file_path" 2>/dev/null; then
                config_issues=$((config_issues + 1))
                config_results+=("{\"file\": \"$file\", \"issue\": \"exposed_secrets\", \"details\": \"Contains potential secrets\"}")
                warning "File $file may contain exposed secrets"
            fi
        fi
    done
    
    # Check for debug mode in production
    local debug_indicators=(
        "DEBUG=true"
        "NODE_ENV=development"
        "RAILS_ENV=development"
        "APP_DEBUG=true"
    )
    
    for indicator in "${debug_indicators[@]}"; do
        if grep -r "$indicator" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example" | grep -q .; then
            config_issues=$((config_issues + 1))
            config_results+=("{\"issue\": \"debug_mode_enabled\", \"indicator\": \"$indicator\"}")
            warning "Debug mode may be enabled in production: $indicator"
        fi
    done
    
    # Check for default credentials
    local default_creds=(
        "admin:admin"
        "admin:password"
        "root:root"
        "test:test"
    )
    
    for cred in "${default_creds[@]}"; do
        if grep -r "$cred" "$PROJECT_ROOT" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example" | grep -q .; then
            config_issues=$((config_issues + 1))
            config_results+=("{\"issue\": \"default_credentials\", \"credential\": \"$cred\"}")
            error "Default credentials found: $cred"
        fi
    done
    
    local config_details
    config_details=$(printf '%s\n' "${config_results[@]}" | jq -s '.')
    
    if [[ $config_issues -eq 0 ]]; then
        add_test_result "configuration_security" "PASS" "LOW" "Configuration security is adequate" "$config_details"
        success "Configuration security test passed"
    else
        add_test_result "configuration_security" "FAIL" "MEDIUM" "Configuration security issues found: $config_issues" "$config_details"
        warning "Configuration security test failed"
    fi
}

# Generate final security report
generate_security_report() {
    log "Generating final security report"
    
    # Calculate summary statistics
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local critical_issues=0
    local high_issues=0
    local medium_issues=0
    local low_issues=0
    
    while IFS= read -r test_result; do
        total_tests=$((total_tests + 1))
        
        local status
        status=$(echo "$test_result" | jq -r '.status')
        
        local severity
        severity=$(echo "$test_result" | jq -r '.severity')
        
        if [[ "$status" == "PASS" ]]; then
            passed_tests=$((passed_tests + 1))
        else
            failed_tests=$((failed_tests + 1))
            
            case "$severity" in
                "CRITICAL") critical_issues=$((critical_issues + 1)) ;;
                "HIGH") high_issues=$((high_issues + 1)) ;;
                "MEDIUM") medium_issues=$((medium_issues + 1)) ;;
                "LOW") low_issues=$((low_issues + 1)) ;;
            esac
        fi
    done < <(jq -r '.test_results | to_entries[] | .value' "$REPORT_FILE")
    
    # Update summary in report
    local updated_report
    updated_report=$(jq ".summary = {
        \"total_tests\": $total_tests,
        \"passed_tests\": $passed_tests,
        \"failed_tests\": $failed_tests,
        \"warnings\": $medium_issues,
        \"critical_issues\": $critical_issues,
        \"high_issues\": $high_issues,
        \"medium_issues\": $medium_issues,
        \"low_issues\": $low_issues
    }" "$REPORT_FILE")
    
    echo "$updated_report" > "$REPORT_FILE"
    
    # Generate HTML report
    generate_html_report
    
    success "Security audit completed"
    log "JSON Report: $REPORT_FILE"
    log "HTML Report: $HTML_REPORT_FILE"
    
    # Display summary
    echo
    echo "=== SECURITY AUDIT SUMMARY ==="
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo
    echo "Issues by Severity:"
    echo "  Critical: $critical_issues"
    echo "  High: $high_issues"
    echo "  Medium: $medium_issues"
    echo "  Low: $low_issues"
    echo
    
    if [[ $critical_issues -gt 0 ]]; then
        error "CRITICAL security issues found - immediate action required!"
        return 1
    elif [[ $high_issues -gt 0 ]]; then
        warning "HIGH severity security issues found - action recommended"
        return 1
    elif [[ $medium_issues -gt 0 ]]; then
        warning "MEDIUM severity security issues found - review recommended"
    else
        success "No significant security issues found"
    fi
}

# Generate HTML report
generate_html_report() {
    local json_data
    json_data=$(cat "$REPORT_FILE")
    
    cat > "$HTML_REPORT_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RevivaTech Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007AFF; margin-bottom: 20px; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .metric { padding: 15px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0; font-size: 2em; }
        .metric p { margin: 5px 0 0 0; color: #666; }
        .pass { background: #d4edda; border-left: 4px solid #28a745; }
        .fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .critical { background: #721c24; color: white; }
        .high { background: #f5c6cb; border-left: 4px solid #dc3545; }
        .medium { background: #fff3cd; border-left: 4px solid #ffc107; }
        .low { background: #cce7ff; border-left: 4px solid #007AFF; }
        .test-results { margin-top: 30px; }
        .test-item { margin-bottom: 20px; padding: 15px; border-radius: 6px; border-left: 4px solid #ddd; }
        .test-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .test-name { font-weight: bold; font-size: 1.1em; }
        .test-status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 0.8em; }
        .status-pass { background: #28a745; }
        .status-fail { background: #dc3545; }
        .details { margin-top: 10px; font-size: 0.9em; color: #666; }
        .severity { padding: 2px 6px; border-radius: 3px; font-size: 0.7em; color: white; margin-left: 10px; }
        .sev-critical { background: #721c24; }
        .sev-high { background: #dc3545; }
        .sev-medium { background: #ffc107; color: #212529; }
        .sev-low { background: #007AFF; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 RevivaTech Security Audit Report</h1>
            <p>Generated on: <span id="timestamp"></span></p>
        </div>
        
        <div class="summary" id="summary">
            <!-- Summary will be populated by JavaScript -->
        </div>
        
        <div class="test-results" id="test-results">
            <!-- Test results will be populated by JavaScript -->
        </div>
    </div>
    
    <script>
EOF
    
    echo "const reportData = $json_data;" >> "$HTML_REPORT_FILE"
    
    cat >> "$HTML_REPORT_FILE" << 'EOF'
        
        // Populate timestamp
        document.getElementById('timestamp').textContent = new Date(reportData.audit_info.timestamp).toLocaleString();
        
        // Populate summary
        const summary = reportData.summary;
        const summaryHtml = `
            <div class="metric ${summary.failed_tests > 0 ? 'fail' : 'pass'}">
                <h3>${summary.total_tests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric pass">
                <h3>${summary.passed_tests}</h3>
                <p>Passed</p>
            </div>
            <div class="metric ${summary.failed_tests > 0 ? 'fail' : 'pass'}">
                <h3>${summary.failed_tests}</h3>
                <p>Failed</p>
            </div>
            <div class="metric ${summary.critical_issues > 0 ? 'critical' : 'pass'}">
                <h3>${summary.critical_issues}</h3>
                <p>Critical Issues</p>
            </div>
            <div class="metric ${summary.high_issues > 0 ? 'high' : 'pass'}">
                <h3>${summary.high_issues}</h3>
                <p>High Issues</p>
            </div>
            <div class="metric ${summary.medium_issues > 0 ? 'medium' : 'pass'}">
                <h3>${summary.medium_issues}</h3>
                <p>Medium Issues</p>
            </div>
        `;
        document.getElementById('summary').innerHTML = summaryHtml;
        
        // Populate test results
        const testResults = reportData.test_results;
        let testResultsHtml = '<h2>Test Results</h2>';
        
        for (const [testName, result] of Object.entries(testResults)) {
            const severityClass = `sev-${result.severity.toLowerCase()}`;
            const statusClass = `status-${result.status.toLowerCase()}`;
            
            testResultsHtml += `
                <div class="test-item">
                    <div class="test-header">
                        <span class="test-name">${testName.replace(/_/g, ' ').toUpperCase()}</span>
                        <div>
                            <span class="test-status ${statusClass}">${result.status}</span>
                            <span class="severity ${severityClass}">${result.severity}</span>
                        </div>
                    </div>
                    <div class="details">${result.description}</div>
                    ${result.details && typeof result.details === 'object' ? 
                        `<pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.8em;">${JSON.stringify(result.details, null, 2)}</pre>` : 
                        ''
                    }
                </div>
            `;
        }
        
        document.getElementById('test-results').innerHTML = testResultsHtml;
    </script>
</body>
</html>
EOF
    
    log "HTML report generated: $HTML_REPORT_FILE"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [COMMAND] [OPTIONS]

RevivaTech Security Audit and Penetration Testing

COMMANDS:
    full-audit           Run complete security audit
    ssl-test             Test SSL/TLS configuration only
    headers-test         Test HTTP security headers only
    auth-test            Test authentication security only
    sql-test             Test for SQL injection only
    xss-test             Test for XSS vulnerabilities only
    container-test       Test container security only
    database-test        Test database security only
    deps-test            Test dependency vulnerabilities only
    config-test          Test configuration security only
    
OPTIONS:
    --target URL         Additional target URL to test
    --report-dir DIR     Custom report directory
    --verbose            Show detailed output
    --help               Show this help message

EXAMPLES:
    $0 full-audit                    Run complete security audit
    $0 ssl-test                      Test SSL configuration only
    $0 sql-test --verbose            Test SQL injection with verbose output
    $0 full-audit --target https://example.com

EOF
}

# Main execution
main() {
    local command="${1:-full-audit}"
    local verbose=false
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --target)
                TARGET_URLS+=("$2")
                shift 2
                ;;
            --report-dir)
                SECURITY_REPORT_DIR="$2"
                REPORT_FILE="$SECURITY_REPORT_DIR/security_audit_$TIMESTAMP.json"
                HTML_REPORT_FILE="$SECURITY_REPORT_DIR/security_audit_$TIMESTAMP.html"
                shift 2
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            full-audit|ssl-test|headers-test|auth-test|sql-test|xss-test|container-test|database-test|deps-test|config-test)
                command="$1"
                shift
                break
                ;;
            *)
                if [[ "$1" =~ ^-- ]]; then
                    error "Unknown option: $1"
                    usage
                    exit 1
                else
                    command="$1"
                    shift
                    break
                fi
                ;;
        esac
    done
    
    # Setup
    setup_security_audit
    init_security_report
    
    log "Starting security audit: $command"
    
    # Execute command
    case "$command" in
        full-audit)
            test_ssl_tls_config
            test_http_headers
            test_authentication
            test_sql_injection
            test_xss_vulnerabilities
            test_container_security
            test_database_security
            test_dependency_vulnerabilities
            test_configuration_security
            generate_security_report
            ;;
        ssl-test)
            test_ssl_tls_config
            generate_security_report
            ;;
        headers-test)
            test_http_headers
            generate_security_report
            ;;
        auth-test)
            test_authentication
            generate_security_report
            ;;
        sql-test)
            test_sql_injection
            generate_security_report
            ;;
        xss-test)
            test_xss_vulnerabilities
            generate_security_report
            ;;
        container-test)
            test_container_security
            generate_security_report
            ;;
        database-test)
            test_database_security
            generate_security_report
            ;;
        deps-test)
            test_dependency_vulnerabilities
            generate_security_report
            ;;
        config-test)
            test_configuration_security
            generate_security_report
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi