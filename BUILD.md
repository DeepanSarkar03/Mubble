# Building Mubble from Source

This guide explains how to build the Mubble application and create installable packages.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10 or later
- **Windows**: Visual Studio Build Tools (for native modules)
- **macOS**: Xcode Command Line Tools

## Quick Build

### Windows

```bash
# Run the automated build script
build-windows.bat
```

Or manually:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build Windows installer
cd apps/desktop
pnpm run dist:win

# Copy to Download folder
node ../../scripts/copy-installer.js
```

### macOS

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build macOS installer
cd apps/desktop
pnpm run dist:mac

# Copy to Download folder
node ../../scripts/copy-installer.js
```

## Build Outputs

After building, the installer will be available at:

- **Windows**: `Download Here/Mubble Setup [version].exe`
- **macOS**: `Download Here/Mubble-[version].dmg`

## Build Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build all packages |
| `pnpm run dist:win` | Build Windows installer and copy to Download folder |
| `pnpm run dist:mac` | Build macOS installer and copy to Download folder |
| `pnpm run dev` | Start development mode |
| `pnpm run clean` | Clean all build outputs |

## Troubleshooting

### Windows Build Issues

**Error: Cannot find Visual Studio installation**
```bash
# Install Visual Studio Build Tools
npm install --global windows-build-tools
```

**Error: better-sqlite3 build failed**
```bash
# Rebuild native modules
cd apps/desktop
pnpm rebuild
```

### macOS Build Issues

**Error: Code signing failed**
- Make sure you have a valid Apple Developer certificate
- Or build for local use only: `pnpm run dist:mac -- --publish never`

### General Issues

**Clean build**
```bash
pnpm run clean
rm -rf node_modules
pnpm install
pnpm run build
```

## GitHub Actions (Automated Builds)

The project includes GitHub Actions workflows that automatically build installers:

1. Push a new tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. GitHub Actions will automatically:
   - Build for Windows and macOS
   - Create a new release
   - Upload installers to GitHub Releases

3. Download the installers from:
   https://github.com/DeepanSarkar03/Mubble/releases

## Custom Build Configuration

Edit `apps/desktop/electron-builder.yml` to customize:
- App metadata (name, version, copyright)
- Installer options
- Code signing certificates
- Auto-update settings

## Need Help?

If you encounter issues, please [create an issue](https://github.com/DeepanSarkar03/Mubble/issues) on GitHub.
