#!/bin/bash

# Build script for Tosho-in Wariate-kun monorepo packages
# This script builds all packages in the correct dependency order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Change to root directory
cd "$ROOT_DIR"

log_info "Starting build process for Tosho-in Wariate-kun monorepo"
log_info "Root directory: $ROOT_DIR"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if turbo is available
if ! command -v turbo &> /dev/null; then
    log_error "turbo is not installed. Please install turbo first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
    log_success "Dependencies installed"
fi

# Build packages in dependency order
log_info "Building shared packages..."

# 1. Build shared types first (no dependencies)
log_info "Building @tosho/shared..."
if pnpm --filter shared build; then
    log_success "@tosho/shared built successfully"
else
    log_error "Failed to build @tosho/shared"
    exit 1
fi

# 2. Build utils (depends on shared types)
log_info "Building @tosho/utils..."
if pnpm --filter utils build; then
    log_success "@tosho/utils built successfully"
else
    log_error "Failed to build @tosho/utils"
    exit 1
fi

# 3. Build UI components (depends on shared types and utils)
log_info "Building @tosho/ui..."
if pnpm --filter ui build; then
    log_success "@tosho/ui built successfully"
else
    log_error "Failed to build @tosho/ui"
    exit 1
fi

# 4. Build applications (depend on all shared packages)
log_info "Building applications..."

# Build frontend
log_info "Building frontend application..."
if pnpm --filter frontend build; then
    log_success "Frontend built successfully"
else
    log_error "Failed to build frontend"
    exit 1
fi

# Build backend
log_info "Building backend application..."
if pnpm --filter backend build; then
    log_success "Backend built successfully"
else
    log_error "Failed to build backend"
    exit 1
fi

# Generate build report
log_info "Generating build report..."

BUILD_REPORT_FILE="build-report.txt"
{
    echo "Tosho-in Wariate-kun Build Report"
    echo "================================="
    echo "Build Date: $(date)"
    echo "Node Version: $(node --version)"
    echo "pnpm Version: $(pnpm --version)"
    echo "Turbo Version: $(turbo --version)"
    echo ""
    echo "Built Packages:"
    echo "- @tosho/shared"
    echo "- @tosho/utils"
    echo "- @tosho/ui"
    echo "- frontend"
    echo "- backend"
    echo ""
    echo "Package Sizes:"
    if [ -d "packages/shared/dist" ]; then
        echo "- @tosho/shared: $(du -sh packages/shared/dist | cut -f1)"
    fi
    if [ -d "packages/utils/dist" ]; then
        echo "- @tosho/utils: $(du -sh packages/utils/dist | cut -f1)"
    fi
    if [ -d "packages/ui/dist" ]; then
        echo "- @tosho/ui: $(du -sh packages/ui/dist | cut -f1)"
    fi
    if [ -d "apps/frontend/.next" ]; then
        echo "- frontend: $(du -sh apps/frontend/.next | cut -f1)"
    fi
    if [ -d "apps/backend/dist" ]; then
        echo "- backend: $(du -sh apps/backend/dist | cut -f1)"
    fi
} > "$BUILD_REPORT_FILE"

log_success "Build completed successfully!"
log_info "Build report saved to: $BUILD_REPORT_FILE"

# Optional: Clean up build artifacts older than 7 days
if [ "$1" = "--cleanup" ]; then
    log_info "Cleaning up old build artifacts..."
    find . -name "dist" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    find . -name ".next" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    find . -name "coverage" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    log_success "Cleanup completed"
fi

log_success "All packages built successfully! 🎉"