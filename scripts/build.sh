#!/bin/bash

# Burger Week Map Deployment Script
# This script builds the project and deploys it to GitHub Pages

echo "🍔 Building Burger Week Map for deployment..."

# Clean previous build
rm -rf dist/

# Create dist directory
mkdir -p dist

# Copy static files
echo "📁 Copying files..."
cp index.html dist/
cp style.css dist/
cp app.js dist/
cp -r data dist/

# Copy GitHub Pages specific files
echo "🚀 Preparing for GitHub Pages..."

# Create .nojekyll file to prevent Jekyll processing
touch dist/.nojekyll

# Create CNAME file if domain is specified
if [ ! -z "$DOMAIN" ]; then
    echo "$DOMAIN" > dist/CNAME
fi

echo "✅ Build complete! Files are ready in ./dist directory"
echo ""
echo "To deploy manually:"
echo "1. Push your changes to the main branch"
echo "2. GitHub Actions will automatically deploy to GitHub Pages"
echo ""
echo "Or deploy now with: npm run deploy"
