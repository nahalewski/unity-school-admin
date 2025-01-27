#!/bin/bash
echo "Node version:"
node --version
echo "NPM version:"
npm --version

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building the application..."
npm run build
