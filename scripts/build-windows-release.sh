#!/bin/bash

# Build Mubble Windows Release Package
# Creates a portable executable and compresses it for distribution

set -e

cd "$(dirname "$0")/.."

echo "🔨 Building Mubble..."
pnpm run build

echo "📦 Packaging Windows portable..."
cd apps/desktop

# Clear previous release
rm -rf ../../release

# Build the unpacked app (this creates the exe despite code signing attempt failure)
npm_config_cache=/tmp npx electron-builder --win --dir -c.win.certificateFile="" 2>&1 | grep -E "(packaging|updating|completed|✓|⨯)" || true

if [ -f "../../release/win-unpacked/Mubble.exe" ]; then
  echo "✅ Mubble.exe created successfully"

  # Create distributable zip
  cd ../../release

  if command -v zip &> /dev/null; then
    zip -r "Mubble-${1:-0.1.0}-portable.zip" win-unpacked/
    echo "✅ Created Mubble-${1:-0.1.0}-portable.zip"
  elif command -v 7z &> /dev/null; then
    7z a "Mubble-${1:-0.1.0}-portable.7z" win-unpacked/
    echo "✅ Created Mubble-${1:-0.1.0}-portable.7z"
  else
    echo "⚠️  zip or 7z not found, skipping compression"
    echo "   Portable app available at: release/win-unpacked/"
  fi

  ls -lh *.zip *.7z 2>/dev/null || true
  cd ../..
else
  echo "❌ Failed to create Mubble.exe"
  exit 1
fi

echo "✅ Release package ready!"
