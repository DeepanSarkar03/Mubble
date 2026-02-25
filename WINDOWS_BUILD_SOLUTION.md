# Windows Build Solution for Mubble

## Goal
Produce a **downloadable Windows setup `.exe`** that installs Mubble like a regular desktop app.

## Current approach (implemented)
Mubble now uses **NSIS** via `electron-builder` to generate a setup executable.

### Output artifact
- `release/Mubble-<version>-Windows-Setup-x64.exe`

### Local build command
```bash
./scripts/build-windows-release.sh 0.1.0
```

This script:
1. builds the workspace (`pnpm run build`)
2. runs `electron-builder --win nsis`
3. renames the generated installer to a stable release filename

## Electron Builder config
Windows packaging in `apps/desktop/electron-builder.yml` uses:
- `win.target: nsis`
- installer UX options:
  - one-click install disabled
  - installation directory selection enabled
  - Start Menu + Desktop shortcuts enabled

## GitHub Releases
The release workflow builds on `windows-latest` and uploads the setup `.exe` directly to GitHub Releases, alongside macOS DMG and Linux AppImage artifacts.

## Notes on signing
Unsigned installers will still run, but Windows SmartScreen may show a warning. For production trust:
- configure code-signing certificate secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`)
- enable signing in CI and electron-builder

