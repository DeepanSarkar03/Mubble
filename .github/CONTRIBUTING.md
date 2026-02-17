# Contributing to Mubble

Thank you for your interest in contributing to Mubble! We welcome contributions from everyone.

## Code of Conduct

Please be respectful and constructive. We are committed to providing a welcoming and inspiring community for all.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Mubble.git
   cd Mubble
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** and test them
6. **Commit your changes:**
   ```bash
   git commit -m "Add your feature description"
   ```
7. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** on GitHub

## Development Workflow

### Building
```bash
pnpm run build          # Build all packages
pnpm run dev            # Start Electron app in dev mode with hot reload
pnpm run test           # Run tests
pnpm run lint           # Lint all packages
pnpm run clean          # Clean all build outputs
```

### Adding a New STT Provider

1. Create `packages/stt-providers/src/providers/your-provider.ts`
2. Implement the `STTProvider` interface from `packages/stt-providers/src/types.ts`
3. Add your provider to `sttRegistry` in `packages/stt-providers/src/provider-registry.ts`
4. Export from `packages/stt-providers/src/index.ts`
5. Add tests if available
6. Update the providers table in `README.md`

### Adding a New LLM Provider

1. Create `packages/llm-providers/src/providers/your-provider.ts`
2. Implement the `LLMProvider` interface from `packages/llm-providers/src/types.ts`
3. Add your provider to `llmRegistry` in `packages/llm-providers/src/provider-registry.ts`
4. Export from `packages/llm-providers/src/index.ts`
5. Update the providers table in `README.md`

## Code Style

- **TypeScript** — Strict mode enabled, no `any` without good reason
- **Imports** — Use `import type` for types, regular `import` for runtime
- **Comments** — Use `//` for comments, avoid commented-out code
- **File naming** — kebab-case for files, PascalCase for classes/components

## Pull Request Process

1. Update the README.md with any new features or changes
2. Ensure the build passes: `pnpm run build`
3. Add a clear description of what your PR does
4. Reference any related issues with `Closes #123`
5. Be patient — maintainers will review when able

## Reporting Bugs

Please use GitHub Issues with:
- Clear title describing the bug
- Steps to reproduce
- Expected vs actual behavior
- Your OS and Mubble version
- Screenshots if applicable

## Requesting Features

Use GitHub Discussions or Issues with:
- Clear description of the feature
- Why it would be useful
- Any relevant context

## License

By contributing to Mubble, you agree that your contributions will be licensed under the MIT License.

---

Questions? Open a GitHub Discussion or issue! 🚀
