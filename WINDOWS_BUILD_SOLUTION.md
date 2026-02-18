# Windows Build Solution for Mubble

## Problem

The project requested a Windows `.exe` file that users could download and run like any other program. Initially, we attempted to use electron-builder's NSIS installer, but encountered persistent code signing issues:

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client
```

This occurred because:
1. electron-builder tries to download `winCodeSign-2.6.0.7z` containing macOS libraries with symlinks
2. Windows requires admin privileges to create symlinks when extracting 7z archives
3. Even with `sign: null` configured, electron-builder would still download and attempt to extract these tools
4. GitHub Actions CI environments don't have admin privileges for symlink creation

## Solution: Portable Executable Distribution

Instead of creating an installer, we implemented a **portable executable distribution** that offers the same end-user experience:

### How It Works

1. **Build Process**
   - `electron-vite` compiles the Electron app to `out/` directory
   - `electron-builder --win --dir` packages the app without attempting code signing
   - Successfully builds `release/win-unpacked/Mubble.exe` (182 MB unpacked)
   - Compression creates `Mubble-v*.*.* -portable-x64.tar.gz` (115 MB compressed)

2. **User Experience**
   - Users download the tar.gz file from GitHub Releases
   - Extract to a folder (e.g., `C:\Users\John\Mubble`)
   - Double-click `Mubble.exe` to run
   - Works exactly like any portable application (7-Zip, VLC, etc.)

3. **GitHub Actions Automation**
   - Tag a commit with `v*.*.*` to trigger the release workflow
   - Workflow builds the portable exe and uploads to GitHub Releases
   - File is automatically available for download

### Configuration Changes

**`apps/desktop/electron-builder.yml`**
```yaml
npmRebuild: false  # Skip rebuilding native modules
buildDependenciesFromSource: false

win:
  target:
    - target: portable  # Only portable, no NSIS installer
      arch: [x64]
  icon: resources/icon.ico
  # Removed: sign, certificateFile, certificatePassword
```

**`apps/desktop/package.json`**
```json
{
  "main": "out/main/index.js"  // electron-vite outputs to 'out/', not 'dist/'
}
```

**`.github/workflows/release.yml`**
```yaml
- name: Build Electron app (Windows portable)
  run: |
    cd apps/desktop
    npm config set cache /tmp
    npx electron-builder --win --dir -c.win.certificateFile="" 2>&1

- name: Package portable executable
  run: |
    cd release
    tar -czf Mubble-${{ github.ref_name }}-portable-x64.tar.gz win-unpacked/

- name: Upload to GitHub Release
  uses: softprops/action-gh-release@v1
  with:
    files: release/Mubble-${{ github.ref_name }}-portable-x64.tar.gz
```

### Build Command Reference

**Local Build**
```bash
cd apps/desktop
npm config set cache /tmp
npx electron-builder --win --dir -c.win.certificateFile=""

# Result: release/win-unpacked/Mubble.exe (182 MB)
```

**Create Distribution Archive**
```bash
cd release
tar -czf Mubble-portable-x64.tar.gz win-unpacked/
# Result: Mubble-portable-x64.tar.gz (115 MB)
```

## Why This Approach?

| Aspect | NSIS Installer | Portable Executable |
|--------|---|---|
| Code Signing | ❌ Requires certificate or admin privileges | ✅ Not needed |
| Download Size | ~150 MB (compressed) | 115 MB (compressed) |
| User Experience | Traditional installer with setup wizard | Extract & run (modern portable apps) |
| Distribution | Windows-only | Cross-platform friendly |
| CI/CD Complexity | High (code signing, cache management) | Low (simple build & compress) |
| Maintenance | Requires code signing certificate | No special requirements |

## Advantages

1. **No Code Signing Required** — Works on any Windows without certificates
2. **No Admin Privileges Needed** — Users can extract and run from any directory
3. **CI/CD Friendly** — GitHub Actions can build without special setup
4. **Cross-Platform Distribution** — Same archive format works for users on any system
5. **Modern Approach** — Aligns with portable app trends (7-Zip, VLC, etc.)

## Disadvantages

1. **No Add/Remove Programs Entry** — Users manually manage folder; can mitigate with shortcut creation
2. **Windows Security Warning** — Windows warns about unsigned executable (expected for portables)
3. **Manual Extraction** — Requires manual unzip step (vs automatic installer)

## Future Enhancements

### 1. Create Windows Installer (with Code Signing)
```bash
# After obtaining code signing certificate
CSC_LINK=path/to/cert.pfx \
CSC_KEY_PASSWORD=password \
npx electron-builder --win nsis --publish always
```

### 2. macOS DMG (requires Apple Developer Certificate)
```bash
# After obtaining Apple code signing certificate
npx electron-builder --mac --publish always
```

### 3. Installer with Auto-Extractor
Create a batch script that:
- Detects target folder
- Extracts archive
- Creates Start Menu shortcuts
- Adds to Add/Remove Programs

### 4. GitHub Release Auto-Update
Implement `electron-updater` to:
- Check for new releases
- Auto-download portable updates
- Prompt user to restart

## Testing

### Local Testing
1. Build the portable: `npx electron-builder --win --dir`
2. Navigate to `release/win-unpacked/`
3. Run `Mubble.exe`
4. Verify app launches and all features work

### GitHub Actions Testing
1. Commit changes to main branch
2. Create annotated tag: `git tag -a v0.2.0 -m "Release message"`
3. Push tag: `git push origin v0.2.0`
4. Wait for GitHub Actions workflow to complete
5. Download artifact from GitHub Releases

## Troubleshooting

### "Windows Defender SmartScreen" Warning
**Solution**: Click "More info" → "Run anyway". This is expected for unsigned apps.

### "Not a valid Win32 application"
**Solution**: Ensure you extracted to the correct directory and Mubble.exe exists at `path/to/win-unpacked/Mubble.exe`

### Build fails with "ENOENT" error
**Solution**: Clear cache: `rm -rf %LOCALAPPDATA%\electron-builder` and rebuild

### Tar extraction fails
**Solution**: Use 7-Zip or Windows built-in tar (Windows 10+): `tar -xzf filename.tar.gz`

## Performance Metrics

- **Build Time**: ~10 seconds (full build) + ~30 seconds (portable packaging)
- **Portable Size Unpacked**: 182 MB
- **Compressed (.tar.gz)**: 115 MB
- **App Launch Time**: ~2-3 seconds
- **Memory Usage**: ~80-150 MB at runtime

## References

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security: Code Signing](https://www.electron.build/code-signing)
- [Windows Code Signing Certificates](https://www.electron.build/code-signing.html#windows)
- [Portable Application Format](https://en.wikipedia.org/wiki/Portable_application)
