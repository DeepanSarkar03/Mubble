# Mubble v0.2.0 Release Notes

## 🎉 Windows Portable Executable Release

Mubble v0.2.0 introduces a portable Windows executable distribution, making it easy for users to download and run the app without any installation process.

### What's New

- ✅ **Portable Executable** — Download, extract, and run Mubble.exe with no installer needed
- ✅ **Automated Release Pipeline** — GitHub Actions automatically builds and uploads binaries on version tags
- ✅ **Simplified Distribution** — No code signing delays or installer complexities

### Download

**Windows Portable (x64)**
- Download: `Mubble-v0.2.0-portable-x64.tar.gz` from [GitHub Releases](https://github.com/DeepanSarkar03/Mubble/releases)
- Extract: Unzip/untar the archive to a folder
- Run: Double-click `Mubble.exe`

### System Requirements

- **OS**: Windows 10 or later (x64)
- **Memory**: 512 MB minimum
- **Disk**: ~200 MB for the portable app

### Getting Started

1. Extract the downloaded archive
2. Run `Mubble.exe` from the extracted folder
3. Go to **Settings > STT Providers** and configure a provider (OpenAI, Groq, etc.)
4. Enter your API key and validate
5. Press `Ctrl+Shift+Space` to start dictating!

### Known Issues

- **Windows Security Warning**: Windows may prompt about an unsigned executable. This is expected for portable apps. Click "Run anyway" to proceed.
- **Microphone Permission**: Windows may request microphone access. Grant permission for Mubble to function.

### Architecture Changes

- **electron-builder**: Configured for portable distribution (no NSIS installer)
- **Code Signing**: Disabled for portable builds to avoid symlink extraction errors
- **Build Output**: `out/` directory (electron-vite) instead of `dist/`

### Build Instructions for Contributors

```bash
# Full build
pnpm run build

# Build portable Windows app
cd apps/desktop
npm config set cache /tmp
npx electron-builder --win --dir -c.win.certificateFile=""

# Create distribution archive
cd ../../release
tar -czf Mubble-portable-x64.tar.gz win-unpacked/
```

### Roadmap

**Future Releases**
- [ ] macOS portable app (.dmg) — Requires code signing certificates
- [ ] Linux AppImage distribution
- [ ] Installer (.exe with setup wizard) — Will require code signing certificate
- [ ] Auto-updater integration

### Support

For issues or questions:
1. Check [GitHub Issues](https://github.com/DeepanSarkar03/Mubble/issues)
2. Read the [README](README.md) for detailed setup instructions
3. See [CONTRIBUTING](CONTRIBUTING.md) for development guidelines

### Contributors

Mubble is an open-source project built by the community. Contributions welcome!

---

**Release Date**: February 18, 2026
**Version**: 0.2.0
**Status**: Stable
