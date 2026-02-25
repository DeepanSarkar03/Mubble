#!/bin/bash

# Build Mubble Windows setup executable
# Creates a distributable NSIS installer (.exe)

set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="${1:-0.1.0}"

echo "🔨 Building workspace..."
pnpm run build

echo "📦 Building Windows setup installer..."
cd apps/desktop
npm_config_cache=/tmp npx electron-builder --win nsis --publish never

cd ../../release

SETUP_FILE=$(find . -maxdepth 1 -type f -name "*Setup*.exe" | head -n 1 || true)
if [ -z "$SETUP_FILE" ]; then
  echo "❌ Could not find generated setup .exe in release/"
  ls -lah
  exit 1
fi

TARGET="Mubble-${VERSION}-Windows-Setup-x64.exe"
mv "$SETUP_FILE" "$TARGET"

echo "✅ Setup installer created: release/$TARGET"
ls -lh "$TARGET"
