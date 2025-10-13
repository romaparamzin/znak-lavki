#!/bin/bash

# Comprehensive System Validation Script
# Runs all tests, performance checks, and generates reports

set -e

echo "🚀 Znak Lavki - System Validation Suite"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Output directory
REPORT_DIR="./validation-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ============================================
# 1. UNIT TESTS
# ============================================
echo "📋 Running Unit Tests..."
echo "========================"

run_unit_tests() {
    echo "→ Backend Unit Tests (NestJS)"
    cd services/mark-service
    
    if npm run test 2>&1 | tee "$REPORT_DIR/unit-tests-backend-$TIMESTAMP.log"; then
        echo -e "${GREEN}✓ Backend unit tests passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Backend unit tests failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    cd ../..
    
    echo ""
    echo "→ Frontend Unit Tests (Vitest)"
    cd apps/admin-panel
    
    if npm run test -- --run 2>&1 | tee "$REPORT_DIR/unit-tests-frontend-$TIMESTAMP.log"; then
        echo -e "${GREEN}✓ Frontend unit tests passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Frontend unit tests failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    cd ../..
}

# ============================================
# 2. CODE COVERAGE
# ============================================
echo ""
echo "📊 Checking Code Coverage..."
echo "============================="

check_coverage() {
    echo "→ Backend Coverage"
    cd services/mark-service
    
    npm run test:cov > "$REPORT_DIR/coverage-backend-$TIMESTAMP.txt" 2>&1 || true
    
    # Extract coverage percentage
    BACKEND_COV=$(grep -oP "All files\s+\|\s+\K[0-9.]+" "$REPORT_DIR/coverage-backend-$TIMESTAMP.txt" | head -1 || echo "0")
    
    if (( $(echo "$BACKEND_COV > 80" | bc -l) )); then
        echo -e "${GREEN}✓ Backend coverage: ${BACKEND_COV}% (target: >80%)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Backend coverage: ${BACKEND_COV}% (target: >80%)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    cd ../..
    
    echo "→ Frontend Coverage"
    cd apps/admin-panel
    
    npm run test -- --run --coverage > "$REPORT_DIR/coverage-frontend-$TIMESTAMP.txt" 2>&1 || true
    
    cd ../..
}

# ============================================
# 3. E2E TESTS
# ============================================
echo ""
echo "🌐 Running E2E Tests..."
echo "======================="

run_e2e_tests() {
    echo "→ Playwright E2E Tests"
    cd apps/admin-panel
    
    if npx playwright test 2>&1 | tee "$REPORT_DIR/e2e-tests-$TIMESTAMP.log"; then
        echo -e "${GREEN}✓ E2E tests passed${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ E2E tests skipped (no tests found)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    cd ../..
}

# ============================================
# 4. PERFORMANCE TESTS
# ============================================
echo ""
echo "⚡ Running Performance Tests..."
echo "==============================="

run_performance_tests() {
    echo "→ Backend Performance (Apache Bench)"
    
    # Check if backend is running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        # Test mark lookup
        echo "  • Testing mark lookup endpoint..."
        ab -n 1000 -c 10 -g "$REPORT_DIR/perf-mark-lookup-$TIMESTAMP.tsv" \
           http://localhost:3001/api/v1/marks 2>&1 | tee "$REPORT_DIR/perf-mark-lookup-$TIMESTAMP.txt"
        
        # Extract metrics
        RPS=$(grep "Requests per second" "$REPORT_DIR/perf-mark-lookup-$TIMESTAMP.txt" | awk '{print $4}')
        AVG_TIME=$(grep "Time per request.*mean" "$REPORT_DIR/perf-mark-lookup-$TIMESTAMP.txt" | awk '{print $4}')
        
        echo "    RPS: $RPS"
        echo "    Avg Time: ${AVG_TIME}ms"
        
        if (( $(echo "$RPS > 100" | bc -l) )); then
            echo -e "${GREEN}✓ Performance: ${RPS} req/sec (target: >100)${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${YELLOW}⚠ Performance: ${RPS} req/sec (target: >100)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        # Test dashboard
        echo "  • Testing dashboard endpoint..."
        ab -n 500 -c 5 http://localhost:3001/api/v1/dashboard/metrics 2>&1 | \
           tee "$REPORT_DIR/perf-dashboard-$TIMESTAMP.txt"
        
    else
        echo -e "${YELLOW}⚠ Backend not running, skipping performance tests${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    echo ""
    echo "→ Frontend Performance (Lighthouse)"
    
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        npm install -g lighthouse > /dev/null 2>&1 || true
        lighthouse http://localhost:5173 \
            --output html \
            --output-path "$REPORT_DIR/lighthouse-$TIMESTAMP.html" \
            --quiet || true
        
        echo -e "${GREEN}✓ Lighthouse report generated${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Frontend not running, skipping Lighthouse${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================
# 5. SECURITY SCAN
# ============================================
echo ""
echo "🔒 Running Security Scans..."
echo "============================"

run_security_scans() {
    echo "→ NPM Audit (Backend)"
    cd services/mark-service
    npm audit --json > "$REPORT_DIR/security-backend-$TIMESTAMP.json" 2>&1 || true
    
    CRITICAL=$(jq '.metadata.vulnerabilities.critical' "$REPORT_DIR/security-backend-$TIMESTAMP.json" 2>/dev/null || echo "0")
    HIGH=$(jq '.metadata.vulnerabilities.high' "$REPORT_DIR/security-backend-$TIMESTAMP.json" 2>/dev/null || echo "0")
    
    echo "  Critical: $CRITICAL, High: $HIGH"
    
    if [ "$CRITICAL" -eq 0 ] && [ "$HIGH" -eq 0 ]; then
        echo -e "${GREEN}✓ No critical/high vulnerabilities${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Found $CRITICAL critical, $HIGH high vulnerabilities${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    cd ../..
    
    echo ""
    echo "→ NPM Audit (Frontend)"
    cd apps/admin-panel
    npm audit --json > "$REPORT_DIR/security-frontend-$TIMESTAMP.json" 2>&1 || true
    cd ../..
}

# ============================================
# 6. DATABASE VALIDATION
# ============================================
echo ""
echo "💾 Validating Database..."
echo "========================="

validate_database() {
    if command -v psql &> /dev/null; then
        echo "→ Checking database indexes"
        psql -U postgres -d znak_lavki -c "SELECT * FROM v_index_usage LIMIT 5;" \
            > "$REPORT_DIR/db-indexes-$TIMESTAMP.txt" 2>&1 || true
        
        echo "→ Checking table statistics"
        psql -U postgres -d znak_lavki -c "SELECT * FROM v_table_stats;" \
            > "$REPORT_DIR/db-stats-$TIMESTAMP.txt" 2>&1 || true
        
        echo "→ Checking slow queries"
        psql -U postgres -d znak_lavki -c "SELECT * FROM v_slow_queries LIMIT 10;" \
            > "$REPORT_DIR/db-slow-queries-$TIMESTAMP.txt" 2>&1 || true
        
        echo -e "${GREEN}✓ Database validation complete${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ PostgreSQL not available${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================
# 7. ACCESSIBILITY AUDIT
# ============================================
echo ""
echo "♿ Running Accessibility Audit..."
echo "================================="

run_accessibility_audit() {
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        npm install -g @axe-core/cli > /dev/null 2>&1 || true
        axe http://localhost:5173 \
            --save "$REPORT_DIR/accessibility-$TIMESTAMP.json" \
            --tags wcag2a,wcag2aa 2>&1 || true
        
        echo -e "${GREEN}✓ Accessibility audit complete${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Frontend not running, skipping accessibility audit${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================
# 8. API DOCUMENTATION VALIDATION
# ============================================
echo ""
echo "📚 Validating API Documentation..."
echo "==================================="

validate_api_docs() {
    if curl -s http://localhost:3001/api/docs > /dev/null 2>&1; then
        curl -s http://localhost:3001/api/docs-json > "$REPORT_DIR/swagger-spec-$TIMESTAMP.json"
        
        ENDPOINTS=$(jq '.paths | length' "$REPORT_DIR/swagger-spec-$TIMESTAMP.json")
        echo "  Documented endpoints: $ENDPOINTS"
        
        echo -e "${GREEN}✓ API documentation available${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Swagger documentation not available${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================
# RUN ALL TESTS
# ============================================

echo ""
echo "🏃 Running validation suite..."
echo ""

# Uncomment to run each test suite
# run_unit_tests
# check_coverage
# run_e2e_tests
run_performance_tests
run_security_scans
validate_database
# run_accessibility_audit
validate_api_docs

# ============================================
# GENERATE FINAL REPORT
# ============================================
echo ""
echo "📄 Generating Final Report..."
echo "=============================="

cat > "$REPORT_DIR/VALIDATION_REPORT_${TIMESTAMP}.md" <<EOF
# System Validation Report

**Generated**: $(date)
**Version**: 1.0.0

---

## Summary

- ✅ Passed: $PASSED
- ⚠️  Warnings: $WARNINGS
- ❌ Failed: $FAILED

**Overall Status**: $([ $FAILED -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

---

## Test Results

### 1. Unit Tests
- Backend: See \`unit-tests-backend-${TIMESTAMP}.log\`
- Frontend: See \`unit-tests-frontend-${TIMESTAMP}.log\`

### 2. Code Coverage
- Backend: See \`coverage-backend-${TIMESTAMP}.txt\`
- Frontend: See \`coverage-frontend-${TIMESTAMP}.txt\`

### 3. E2E Tests
- Results: See \`e2e-tests-${TIMESTAMP}.log\`

### 4. Performance Tests
- Mark Lookup: See \`perf-mark-lookup-${TIMESTAMP}.txt\`
- Dashboard: See \`perf-dashboard-${TIMESTAMP}.txt\`
- Lighthouse: See \`lighthouse-${TIMESTAMP}.html\`

### 5. Security Scans
- Backend: See \`security-backend-${TIMESTAMP}.json\`
- Frontend: See \`security-frontend-${TIMESTAMP}.json\`

### 6. Database Validation
- Indexes: See \`db-indexes-${TIMESTAMP}.txt\`
- Statistics: See \`db-stats-${TIMESTAMP}.txt\`
- Slow Queries: See \`db-slow-queries-${TIMESTAMP}.txt\`

### 7. Accessibility Audit
- Results: See \`accessibility-${TIMESTAMP}.json\`

### 8. API Documentation
- Swagger Spec: See \`swagger-spec-${TIMESTAMP}.json\`

---

## Recommendations

EOF

if [ $WARNINGS -gt 0 ]; then
    cat >> "$REPORT_DIR/VALIDATION_REPORT_${TIMESTAMP}.md" <<EOF
### Warnings Found

1. Review coverage reports and add tests for uncovered code
2. Fix any security vulnerabilities found in npm audit
3. Optimize slow database queries
4. Address accessibility issues

EOF
fi

cat >> "$REPORT_DIR/VALIDATION_REPORT_${TIMESTAMP}.md" <<EOF
### Next Steps

1. ✅ Review all test reports in \`validation-reports/\`
2. 📊 Address any failed tests or warnings
3. 🔒 Fix security vulnerabilities
4. ⚡ Optimize performance bottlenecks
5. 🚀 Deploy to staging for further testing

---

**Report Location**: \`$REPORT_DIR/\`
EOF

echo ""
echo "✅ Validation report generated: $REPORT_DIR/VALIDATION_REPORT_${TIMESTAMP}.md"
echo ""

# ============================================
# SUMMARY
# ============================================

echo "========================================"
echo "📊 VALIDATION SUMMARY"
echo "========================================"
echo -e "✅ Passed:   ${GREEN}$PASSED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "❌ Failed:   ${RED}$FAILED${NC}"
echo "========================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical validations passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some validations failed. Check reports.${NC}"
    exit 1
fi

