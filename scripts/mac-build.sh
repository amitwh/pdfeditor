#!/bin/bash

echo "Building PDF Editor for macOS..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Warning: Not running on macOS. Cross-compilation may not work properly."
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for macOS
echo "Building DMG and ZIP packages..."
npm run build:mac

echo "macOS build completed! Check the dist/ directory for output files."