#!/bin/bash
set -e

echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

echo "Building frontend..."
npm run build

echo "Build complete!"
