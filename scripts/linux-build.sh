#!/bin/bash

echo "Building PDF Editor for Linux..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for Linux
echo "Building AppImage and deb packages..."
npm run build:linux

echo "Linux build completed! Check the dist/ directory for output files."