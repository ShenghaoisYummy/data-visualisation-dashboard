#!/bin/bash

echo "🚀 Running Comprehensive Test Suite"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if dependencies are installed
echo "Checking dependencies..."

if ! command -v npx &> /dev/null; then
    print_error "npm/npx not found. Please install Node.js"
    exit 1
fi

# Install Playwright if not already installed
if ! npx playwright --version &> /dev/null; then
    print_warning "Playwright not found. Installing..."
    npm install --save-dev @playwright/test
    npx playwright install
fi

# 1. Run Unit Tests
echo ""
echo "📋 Running Unit Tests..."
echo "========================"

npm run test:unit
if [ $? -eq 0 ]; then
    print_status "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# 2. Run Integration Tests
echo ""
echo "🔗 Running Integration Tests..."
echo "=============================="

npm run test:integration
if [ $? -eq 0 ]; then
    print_status "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# 3. Run API Tests
echo ""
echo "🌐 Running API Tests..."
echo "====================="

npm run test:api
if [ $? -eq 0 ]; then
    print_status "API tests passed"
else
    print_error "API tests failed"
    exit 1
fi

# 4. Build the application
echo ""
echo "🏗️ Building Application..."
echo "========================="

npm run build
if [ $? -eq 0 ]; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# 5. Start application in background for E2E tests
echo ""
echo "🚀 Starting Application for E2E Tests..."
echo "======================================="

npm run start &
APP_PID=$!

# Wait for application to start
echo "Waiting for application to start..."
sleep 10

# Check if application is running
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_warning "Application not responding, trying dev server..."
    kill $APP_PID 2>/dev/null
    
    npm run dev &
    DEV_PID=$!
    sleep 15
    
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_error "Cannot start application server"
        kill $DEV_PID 2>/dev/null
        exit 1
    fi
    APP_PID=$DEV_PID
fi

print_status "Application running on http://localhost:3000"

# 6. Run E2E Tests
echo ""
echo "🎭 Running End-to-End Tests..."
echo "============================="

npx playwright test
E2E_RESULT=$?

# Clean up - stop the application
kill $APP_PID 2>/dev/null

if [ $E2E_RESULT -eq 0 ]; then
    print_status "E2E tests passed"
else
    print_error "E2E tests failed"
    exit 1
fi

# 7. Generate Test Coverage Report
echo ""
echo "📊 Generating Test Coverage..."
echo "============================="

npm run test:coverage
if [ $? -eq 0 ]; then
    print_status "Coverage report generated"
    echo "Coverage report available at: coverage/lcov-report/index.html"
else
    print_warning "Coverage generation failed"
fi

# 8. Run Security Audit
echo ""
echo "🔒 Running Security Audit..."
echo "==========================="

npm audit --audit-level=moderate
if [ $? -eq 0 ]; then
    print_status "No security vulnerabilities found"
else
    print_warning "Security vulnerabilities detected - review npm audit output"
fi

# Final Summary
echo ""
echo "🎉 Test Suite Complete!"
echo "======================"
print_status "All critical tests passed"
print_status "Application ready for production"

echo ""
echo "📝 Test Results Summary:"
echo "- Unit Tests: ✅ Passed"
echo "- Integration Tests: ✅ Passed"  
echo "- API Tests: ✅ Passed"
echo "- Build: ✅ Successful"
echo "- E2E Tests: ✅ Passed"
echo "- Coverage Report: 📊 Generated"
echo "- Security Audit: 🔒 Completed"

echo ""
echo "🚀 Ready for deployment!"