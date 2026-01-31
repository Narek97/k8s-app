#!/bin/bash
set -e  # Exit on any error

# Get current version from git
VERSION=$(git rev-parse --short HEAD)
DATE=$(date +%Y%m%d-%H%M%S)

echo "Building version: $VERSION"
echo "Build date: $DATE"

# Get the script directory to handle paths correctly
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Update version in package.json files
echo "Updating backend version..."
cd "$PROJECT_ROOT/backend"
npm version patch --no-git-tag-version

echo "Updating frontend version..."
cd "$PROJECT_ROOT/frontend"
npm version patch --no-git-tag-version

cd "$PROJECT_ROOT"
echo "✅ Version updated to $VERSION"
