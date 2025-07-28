#!/bin/bash

# Security Headers Testing Script
# Tests HTTP security headers for both domains

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAINS=("revivatech.co.uk" "revivatech.com.br")
TEST_RESULTS=()

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test SSL/TLS configuration
test_ssl_config() {
    local domain=$1
    log "Testing SSL/TLS configuration for $domain"
    
    # Test SSL Labs grade (simplified check)
    local ssl_output
    ssl_output=$(timeout 10 openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -text 2>/dev/null || echo "SSL_ERROR")
    
    if [[ "$ssl_output" == "SSL_ERROR" ]]; then
        error "SSL connection failed for $domain"
        TEST_RESULTS+=("SSL:$domain:FAIL")
        return 1
    fi
    
    # Check certificate validity
    local exp_date
    exp_date=$(echo "$ssl_output" | grep "Not After" | cut -d: -f2- | xargs)
    if [[ -n "$exp_date" ]]; then
        success "SSL certificate valid until: $exp_date"
        TEST_RESULTS+=("SSL:$domain:PASS")
    else
        error "Could not verify SSL certificate expiration for $domain"
        TEST_RESULTS+=("SSL:$domain:WARN")
    fi
}

# Test security headers
test_security_headers() {
    local domain=$1
    log "Testing security headers for $domain"
    
    local headers
    headers=$(curl -sI "https://$domain" --max-time 10 2>/dev/null || echo "CURL_ERROR")
    
    if [[ "$headers" == "CURL_ERROR" ]]; then
        error "Could not fetch headers for $domain"
        TEST_RESULTS+=("HEADERS:$domain:FAIL")
        return 1
    fi
    
    # Test individual headers
    test_header "$domain" "$headers" "Strict-Transport-Security" "HSTS"
    test_header "$domain" "$headers" "X-Frame-Options" "Clickjacking Protection"
    test_header "$domain" "$headers" "X-Content-Type-Options" "MIME Type Sniffing Protection"
    test_header "$domain" "$headers" "X-XSS-Protection" "XSS Protection"
    test_header "$domain" "$headers" "Content-Security-Policy" "CSP"
    test_header "$domain" "$headers" "Referrer-Policy" "Referrer Policy"
    test_header "$domain" "$headers" "Permissions-Policy" "Permissions Policy"
    
    # Test HTTPS redirect
    test_https_redirect "$domain"
}

# Test individual header
test_header() {
    local domain=$1
    local headers=$2
    local header_name=$3
    local description=$4
    
    if echo "$headers" | grep -qi "$header_name:"; then
        local header_value
        header_value=$(echo "$headers" | grep -i "$header_name:" | head -1 | cut -d: -f2- | xargs)
        success "$description header present: $header_value"
        TEST_RESULTS+=("HEADER:$domain:$header_name:PASS")
    else
        warning "$description header missing"
        TEST_RESULTS+=("HEADER:$domain:$header_name:FAIL")
    fi
}

# Test HTTPS redirect
test_https_redirect() {
    local domain=$1
    log "Testing HTTPS redirect for $domain"
    
    local redirect_response
    redirect_response=$(curl -sI "http://$domain" --max-time 10 2>/dev/null || echo "CURL_ERROR")
    
    if [[ "$redirect_response" == "CURL_ERROR" ]]; then
        error "Could not test HTTPS redirect for $domain"
        TEST_RESULTS+=("REDIRECT:$domain:FAIL")
        return 1
    fi
    
    if echo "$redirect_response" | grep -qi "location: https://"; then
        success "HTTPS redirect working"
        TEST_RESULTS+=("REDIRECT:$domain:PASS")
    else
        error "HTTPS redirect not working"
        TEST_RESULTS+=("REDIRECT:$domain:FAIL")
    fi
}

# Test API endpoints security
test_api_security() {
    local domain=$1
    log "Testing API security for $domain"
    
    # Test API rate limiting (should get rate limited after many requests)
    local api_url="https://$domain/api/info"
    local rate_limit_test=true
    
    # Make rapid requests to test rate limiting
    for i in {1..20}; do
        local response_code
        response_code=$(curl -s -o /dev/null -w "%{http_code}" "$api_url" --max-time 5 2>/dev/null || echo "000")
        
        if [[ "$response_code" == "429" ]]; then
            success "Rate limiting active (got 429 after $i requests)"
            TEST_RESULTS+=("RATE_LIMIT:$domain:PASS")
            rate_limit_test=false
            break
        fi
        
        sleep 0.1
    done
    
    if $rate_limit_test; then
        warning "Rate limiting not triggered after 20 requests"
        TEST_RESULTS+=("RATE_LIMIT:$domain:WARN")
    fi
    
    # Test CORS headers
    local cors_response
    cors_response=$(curl -sI -H "Origin: https://evil.com" "$api_url" --max-time 10 2>/dev/null || echo "CURL_ERROR")
    
    if [[ "$cors_response" != "CURL_ERROR" ]]; then
        if echo "$cors_response" | grep -qi "access-control-allow-origin: https://evil.com"; then
            error "CORS allows arbitrary origins"
            TEST_RESULTS+=("CORS:$domain:FAIL")
        else
            success "CORS properly configured"
            TEST_RESULTS+=("CORS:$domain:PASS")
        fi
    else
        warning "Could not test CORS configuration"
        TEST_RESULTS+=("CORS:$domain:WARN")
    fi
}

# Test for common vulnerabilities
test_vulnerabilities() {
    local domain=$1
    log "Testing for common vulnerabilities on $domain"
    
    # Test for server information disclosure
    local server_header
    server_header=$(curl -sI "https://$domain" --max-time 10 2>/dev/null | grep -i "server:" | cut -d: -f2- | xargs || echo "")
    
    if [[ -z "$server_header" ]] || [[ "$server_header" == "nginx" ]]; then
        success "Server information properly hidden"
        TEST_RESULTS+=("SERVER_INFO:$domain:PASS")
    else
        warning "Server information disclosed: $server_header"
        TEST_RESULTS+=("SERVER_INFO:$domain:WARN")
    fi
    
    # Test for directory traversal (basic check)
    local traversal_response
    traversal_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/../../../etc/passwd" --max-time 10 2>/dev/null || echo "000")
    
    if [[ "$traversal_response" == "404" ]] || [[ "$traversal_response" == "403" ]]; then
        success "Directory traversal protection active"
        TEST_RESULTS+=("DIR_TRAVERSAL:$domain:PASS")
    else
        error "Potential directory traversal vulnerability (HTTP $traversal_response)"
        TEST_RESULTS+=("DIR_TRAVERSAL:$domain:FAIL")
    fi
    
    # Test for common sensitive files
    local sensitive_files=("/.env" "/config.json" "/backup.sql" "/.git/config")
    local exposed_files=()
    
    for file in "${sensitive_files[@]}"; do
        local file_response
        file_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain$file" --max-time 5 2>/dev/null || echo "000")
        
        if [[ "$file_response" == "200" ]]; then
            exposed_files+=("$file")
        fi
    done
    
    if [[ ${#exposed_files[@]} -eq 0 ]]; then
        success "No sensitive files exposed"
        TEST_RESULTS+=("SENSITIVE_FILES:$domain:PASS")
    else
        error "Sensitive files exposed: ${exposed_files[*]}"
        TEST_RESULTS+=("SENSITIVE_FILES:$domain:FAIL")
    fi
}

# Generate security report
generate_report() {
    log "Generating security test report"
    
    local report_file="/opt/webapps/revivatech/security-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "RevivaTech Security Headers Test Report"
        echo "Generated: $(date)"
        echo "========================================"
        echo
        
        local total_tests=0
        local passed_tests=0
        local failed_tests=0
        local warning_tests=0
        
        for result in "${TEST_RESULTS[@]}"; do
            IFS=':' read -r category domain test_name status <<< "$result"
            total_tests=$((total_tests + 1))
            
            case "$status" in
                "PASS") passed_tests=$((passed_tests + 1)) ;;
                "FAIL") failed_tests=$((failed_tests + 1)) ;;
                "WARN") warning_tests=$((warning_tests + 1)) ;;
            esac
            
            echo "[$status] $category - $domain - $test_name"
        done
        
        echo
        echo "Summary:"
        echo "========="
        echo "Total tests: $total_tests"
        echo "Passed: $passed_tests"
        echo "Failed: $failed_tests"
        echo "Warnings: $warning_tests"
        echo
        
        if [[ $failed_tests -eq 0 ]]; then
            echo "✅ All critical security tests passed!"
        else
            echo "❌ $failed_tests critical security tests failed - immediate attention required"
        fi
        
        if [[ $warning_tests -gt 0 ]]; then
            echo "⚠️  $warning_tests tests generated warnings - review recommended"
        fi
        
        echo
        echo "Recommendations:"
        echo "================"
        
        if [[ $failed_tests -gt 0 ]] || [[ $warning_tests -gt 0 ]]; then
            echo "1. Review failed tests and warnings above"
            echo "2. Update nginx configuration if needed"
            echo "3. Restart nginx after configuration changes"
            echo "4. Re-run this test script to verify fixes"
        else
            echo "1. Security configuration looks good!"
            echo "2. Continue monitoring with regular security scans"
            echo "3. Keep SSL certificates up to date"
            echo "4. Review and update security headers periodically"
        fi
        
    } > "$report_file"
    
    success "Report generated: $report_file"
    
    # Also display summary on screen
    echo
    echo "======================================"
    echo "Security Test Summary"
    echo "======================================"
    
    local total_tests=${#TEST_RESULTS[@]}
    local passed_tests=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c ":PASS" || echo 0)
    local failed_tests=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c ":FAIL" || echo 0)
    local warning_tests=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c ":WARN" || echo 0)
    
    echo "Total tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    echo "Warnings: $warning_tests"
    echo
    
    if [[ $failed_tests -eq 0 ]]; then
        success "All critical security tests passed!"
    else
        error "$failed_tests critical security tests failed"
    fi
}

# Main execution
main() {
    log "Starting RevivaTech Security Headers Test"
    echo
    
    for domain in "${DOMAINS[@]}"; do
        echo "Testing domain: $domain"
        echo "=========================="
        
        test_ssl_config "$domain"
        test_security_headers "$domain"
        test_api_security "$domain"
        test_vulnerabilities "$domain"
        
        echo
    done
    
    generate_report
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi