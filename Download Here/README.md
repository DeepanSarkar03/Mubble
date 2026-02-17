# Download Mubble

## Windows Installer (.exe)

The Windows installer will be available here once built.

### Option 1: Download from GitHub Releases (Recommended)
Visit the [Releases page](https://github.com/DeepanSarkar03/Mubble/releases) to download the latest version.

### Option 2: Build from Source
To build the installer yourself:

```bash
# Install dependencies
pnpm install

# Build packages
pnpm run build

# Build Windows installer
cd apps/desktop
pnpm run dist:win
```

The installer will be created at:
`apps/desktop/dist/Mubble Setup [version].exe`

### Option 3: GitHub Actions (Automatic)
Push a new tag to trigger automatic build:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The installer will be automatically built and uploaded to GitHub Releases.

## macOS (.dmg)
For macOS users, the .dmg installer is also available on the [Releases page](https://github.com/DeepanSarkar03/Mubble/releases).

## System Requirements

### Windows
- Windows 10 or later (64-bit)
- 100 MB free disk space
- Microphone access

### macOS
- macOS 10.15 (Catalina) or later
- 100 MB free disk space
- Microphone access

## Installation Instructions

### Windows
1. Download `Mubble Setup [version].exe`
2. Run the installer
3. Follow the setup wizard
4. Launch Mubble from the Start Menu or Desktop shortcut

### macOS
1. Download `Mubble-[version].dmg`
2. Open the DMG file
3. Drag Mubble to Applications folder
4. Launch from Applications

## Updates
Mubble includes automatic update checking. When a new version is available, you'll be notified within the app.

## Support
Having issues? [Create an issue](https://github.com/DeepanSarkar03/Mubble/issues) on GitHub.
