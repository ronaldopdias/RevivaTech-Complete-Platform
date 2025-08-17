#!/bin/bash
# Test All Claude Code Features
# Validates that all optimization features are working correctly

echo "🧪 Testing All Claude Code Features"
echo "=================================="

failures=0

# Test 1: Context Loader
echo "📊 Testing Context Loader..."
if /opt/webapps/revivatech/.claude/context-loader.sh >/dev/null 2>&1; then
    echo "✅ Context Loader - Working"
else
    echo "❌ Context Loader - Failed"
    ((failures++))
fi

# Test 2: Memory Optimization
echo "💾 Testing Memory Optimization..."
if /opt/webapps/revivatech/.claude/memory-optimization.sh >/dev/null 2>&1; then
    echo "✅ Memory Optimization - Working"
else
    echo "❌ Memory Optimization - Failed"
    ((failures++))
fi

# Test 3: Best Practices Enforcer
echo "🛡️  Testing Best Practices Enforcer..."
if /opt/webapps/revivatech/.claude/best-practices-enforcer.sh >/dev/null 2>&1; then
    echo "✅ Best Practices Enforcer - Working"
else
    echo "❌ Best Practices Enforcer - Failed"
    ((failures++))
fi

# Test 4: Backend Health
echo "🔌 Testing Backend Health..."
if curl -s http://localhost:3011/api/health >/dev/null 2>&1; then
    echo "✅ Backend Health - Working"
else
    echo "❌ Backend Health - Failed"
    ((failures++))
fi

# Test 5: Claude Analytics
echo "📈 Testing Claude Analytics..."
if curl -s http://localhost:3011/api/claude-analytics/efficiency >/dev/null 2>&1; then
    echo "✅ Claude Analytics - Working"
else
    echo "❌ Claude Analytics - Failed"
    ((failures++))
fi

# Test 6: Claude Dashboard (HTTPS)
echo "🎯 Testing Claude Dashboard..."
if curl -k -s https://localhost:3010/claude-dashboard >/dev/null 2>&1; then
    echo "✅ Claude Dashboard - Working"
else
    echo "❌ Claude Dashboard - Failed"
    ((failures++))
fi

# Test 7: Diagnostics Dashboard (HTTPS)
echo "🩺 Testing Diagnostics Dashboard..."
if curl -k -s https://localhost:3010/diagnostics >/dev/null 2>&1; then
    echo "✅ Diagnostics Dashboard - Working"
else
    echo "❌ Diagnostics Dashboard - Failed"
    ((failures++))
fi

# Test 8: NPM Scripts
echo "📦 Testing NPM Scripts..."
cd /opt/webapps/revivatech/frontend
if grep -q "claude:check" package.json; then
    echo "✅ NPM Scripts - Configured"
else
    echo "❌ NPM Scripts - Not Configured"
    ((failures++))
fi

# Summary
echo ""
echo "🎯 Test Results Summary"
echo "======================"

if [ $failures -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Claude Code optimization is fully functional."
    echo ""
    echo "🚀 Ready to use:"
    echo "  • HTTPS Claude Dashboard: https://localhost:3010/claude-dashboard"
    echo "  • HTTPS Diagnostics: https://localhost:3010/diagnostics"
    echo "  • Backend Health: http://localhost:3011/api/health"
    echo "  • Analytics API: http://localhost:3011/api/claude-analytics/efficiency"
else
    echo "⚠️  $failures test(s) failed. Some features may need attention."
fi

echo ""
echo "💡 Quick Commands:"
echo "  source /opt/webapps/revivatech/.claude/aliases.sh  # Load aliases"
echo "  reviva-check                                        # System health"
echo "  reviva-dashboard                                    # Show dashboard info"

exit $failures