# GitHub Setup Guide for Mubble

Your local Git repository is ready to push to GitHub! Follow these steps:

## Step 1: Create the Repository on GitHub

1. Go to https://github.com/new
2. **Repository name:** `Mubble`
3. **Description:** `Open-source voice-to-text desktop app with AI-powered editing. Supports 14 STT + 4 LLM providers.`
4. **Visibility:** Public
5. **Add a README file:** NO (we already have one)
6. **Add .gitignore:** NO (we already have one)
7. **Choose a license:** MIT
8. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Copy your GitHub username and run these commands in PowerShell/CMD from the Mubble directory:

```bash
cd C:\Users\astam\Mubble

# Set the remote origin (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/Mubble.git
git branch -M main
git push -u origin main
```

## Step 3: Create Release

After pushing, create the first release:

```bash
git tag v0.1.0 -m "Mubble v0.1.0 - Initial Release"
git push origin v0.1.0
```

## Step 4: Enhance Repository Settings

### Add Topics
On GitHub, go to your repository settings and add these topics:
- `voice-dictation`
- `speech-to-text`
- `ai-powered`
- `electron`
- `desktop-app`
- `open-source`
- `typescript`
- `react`

### Add Repository Description
Copy this to your GitHub repository description:

```
🎤 Open-source voice-to-text desktop app with AI-powered editing
Dictate into any app • 14 STT providers • 4 LLM providers • Hands-free mode • Command mode
```

### Homepage URL (optional)
If you host a website, add it here

## Git Repository Status

Your local repository is at:
```
C:\Users\astam\Mubble\.git
```

Current commits:
- Initial commit with 140 TypeScript/TSX files
- 6 packages: shared, storage, stt-providers, llm-providers, audio-pipeline, desktop
- All packages building successfully ✅

## Troubleshooting

### If you need to change your GitHub username in the remote:
```bash
git remote set-url origin https://github.com/NEW_USERNAME/Mubble.git
```

### If you need to check what's configured:
```bash
git remote -v
```

## Next Steps After Pushing

1. ✅ Enable "Discussions" in GitHub Settings (for community support)
2. ✅ Create GitHub Pages for documentation (optional)
3. ✅ Set up branch protection rules for `main`
4. ✅ Enable GitHub Actions (CI/CD workflows are already in `.github/workflows/`)

---

Good luck with your open-source project! 🚀
