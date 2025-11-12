#!/bin/bash

# Test Runner Script
# Comprehensive test execution with different modes and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[TEST RUNNER]${NC} $1"
}

# Help function
show_help() {
    echo "Test Runner - The Hangout App Testing Suite"
    echo ""
    echo "Usage: ./scripts/test-runner.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  unit              Run unit tests"
    echo "  integration       Run integration tests"
    echo "  e2e              Run end-to-end tests"
    echo "  security         Run security-specific tests"
    echo "  performance      Run performance tests"
    echo "  coverage         Run tests with coverage report"
    echo "  watch            Run tests in watch mode"
    echo "  ci               Run all tests for CI/CD"
    echo "  setup            Set up testing environment"
    echo "  clean            Clean test artifacts"
    echo "  all              Run all test suites"
    echo ""
    echo "Options:"
    echo "  --silent         Run tests silently"
    echo "  --verbose        Run tests with verbose output"
    echo "  --ios            Run iOS-specific tests (for E2E)"
    echo "  --android        Run Android-specific tests (for E2E)"
    echo "  --device DEVICE  Specify device for E2E tests"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/test-runner.sh unit --verbose"
    echo "  ./scripts/test-runner.sh e2e --ios"
    echo "  ./scripts/test-runner.sh coverage"
    echo "  ./scripts/test-runner.sh ci"
}

# Check if Node modules are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Node modules not found. Installing dependencies..."
        npm install
    fi
}

# Setup testing environment
setup_tests() {
    print_header "Setting up testing environment..."
    
    check_dependencies
    
    # Create test artifacts directory
    mkdir -p test-results
    mkdir -p coverage
    mkdir -p e2e/artifacts
    
    # Install additional testing dependencies if needed
    if [ ! -d "node_modules/@testing-library" ]; then
        print_status "Installing testing dependencies..."
        npm install --save-dev
    fi
    
    print_status "Testing environment setup complete"
}

# Clean test artifacts
clean_tests() {
    print_header "Cleaning test artifacts..."
    
    rm -rf coverage/
    rm -rf test-results/
    rm -rf e2e/artifacts/
    rm -rf .nyc_output/
    
    print_status "Test artifacts cleaned"
}

# Run unit tests
run_unit_tests() {
    print_header "Running unit tests..."
    
    local jest_args=""
    
    if [ "$VERBOSE" = "true" ]; then
        jest_args="$jest_args --verbose"
    fi
    
    if [ "$SILENT" = "true" ]; then
        jest_args="$jest_args --silent"
    fi
    
    npm run test -- $jest_args
    
    print_status "Unit tests completed"
}

# Run integration tests
run_integration_tests() {
    print_header "Running integration tests..."
    
    # Run tests that test component integration
    npm run test -- --testPathPattern="integration|__integration__" --verbose
    
    print_status "Integration tests completed"
}

# Run security tests
run_security_tests() {
    print_header "Running security tests..."
    
    npm run test:security
    
    print_status "Security tests completed"
}

# Run performance tests
run_performance_tests() {
    print_header "Running performance tests..."
    
    # Run performance-related tests
    npm run test -- --testPathPattern="performance|__performance__" --verbose
    
    print_status "Performance tests completed"
}

# Run E2E tests
run_e2e_tests() {
    print_header "Running E2E tests..."
    
    local device_config="ios.sim.debug"
    
    if [ "$PLATFORM" = "android" ]; then
        device_config="android.emu.debug"
    elif [ "$PLATFORM" = "ios" ]; then
        device_config="ios.sim.debug"
    fi
    
    if [ -n "$DEVICE" ]; then
        device_config="$DEVICE"
    fi
    
    print_status "Building app for E2E tests..."
    npm run test:e2e:build
    
    print_status "Running E2E tests on $device_config..."
    npx detox test --configuration $device_config --artifacts-location e2e/artifacts
    
    print_status "E2E tests completed"
}

# Run tests with coverage
run_coverage_tests() {
    print_header "Running tests with coverage..."
    
    npm run test:coverage
    
    print_status "Coverage report generated in coverage/ directory"
    
    # Open coverage report if on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open coverage/lcov-report/index.html
    fi
}

# Run tests in watch mode
run_watch_tests() {
    print_header "Running tests in watch mode..."
    
    npm run test:watch
}

# Run CI tests
run_ci_tests() {
    print_header "Running CI test suite..."
    
    # Clean previous artifacts
    clean_tests
    
    # Setup environment
    setup_tests
    
    # Run linting
    if command -v npx &> /dev/null && npm run lint:test &> /dev/null; then
        print_status "Running linter on test files..."
        npm run lint:test
    fi
    
    # Run unit tests with coverage
    print_status "Running unit tests with coverage..."
    npm run test:ci
    
    # Run security tests
    run_security_tests
    
    # Run performance tests
    run_performance_tests
    
    print_status "CI test suite completed successfully"
}

# Run all tests
run_all_tests() {
    print_header "Running all test suites..."
    
    setup_tests
    run_unit_tests
    run_integration_tests
    run_security_tests
    run_performance_tests
    
    print_status "All test suites completed"
}

# Parse command line arguments
COMMAND=""
VERBOSE="false"
SILENT="false"
PLATFORM=""
DEVICE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        unit|integration|e2e|security|performance|coverage|watch|ci|setup|clean|all)
            COMMAND="$1"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --silent)
            SILENT="true"
            shift
            ;;
        --ios)
            PLATFORM="ios"
            shift
            ;;
        --android)
            PLATFORM="android"
            shift
            ;;
        --device)
            DEVICE="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    if [ -z "$COMMAND" ]; then
        show_help
        exit 1
    fi
    
    case $COMMAND in
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        security)
            run_security_tests
            ;;
        performance)
            run_performance_tests
            ;;
        coverage)
            run_coverage_tests
            ;;
        watch)
            run_watch_tests
            ;;
        ci)
            run_ci_tests
            ;;
        setup)
            setup_tests
            ;;
        clean)
            clean_tests
            ;;
        all)
            run_all_tests
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            exit 1
            ;;
    esac
}

# Check if script is being sourced or executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi