#!/bin/bash

echo "Building PDF Editor for Windows..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for Windows
echo "Building NSIS installer and portable executable..."
npm run build:windows

echo "Windows build completed! Check the dist/ directory for output files."