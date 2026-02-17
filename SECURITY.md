# Security Policy

## Reporting Security Vulnerabilities

**Please do not publicly disclose security vulnerabilities in GitHub Issues.** Instead, email security concerns to the maintainers privately.

## Security Considerations

### API Keys

- **Encrypted Storage** — API keys are encrypted at rest using Electron's `safeStorage` (OS keychain on macOS, DPAPI on Windows)
- **Never Log Keys** — API keys are never logged, printed, or sent to external services except to their respective providers
- **User Control** — Users manage their own API keys; Mubble never stores them on our servers

### Audio Data

- **Local Processing** — All audio is processed locally on your machine by default
- **Streaming Providers** — If using streaming STT providers (Deepgram, AssemblyAI, Gladia), audio is sent directly to their servers
- **No Recording** — Mubble does not record, store, or transmit audio beyond what you explicitly configure

### Network Security

- **HTTPS Only** — All API calls use HTTPS/TLS encryption
- **No Tracking** — Mubble does not track usage, collect analytics, or phone home
- **No Updates** — Updates must be manually downloaded and installed

### Code Security

- **TypeScript Strict Mode** — Full type safety to catch bugs early
- **Dependency Management** — All dependencies are explicitly listed in `pnpm-lock.yaml`
- **No Telemetry** — Open-source, no hidden behavior

## Security Best Practices for Users

1. **Keep your API keys secret** — Treat them like passwords
2. **Rotate keys regularly** — Especially if you suspect compromise
3. **Use unique passwords** — For your API key providers (OpenAI, Anthropic, etc.)
4. **Run from trusted sources** — Only download releases from this GitHub repository
5. **Review the code** — It's open-source; anyone can audit it

## Dependency Security

We use `pnpm` for deterministic builds. To check for vulnerabilities:

```bash
pnpm audit
```

To update dependencies safely:

```bash
pnpm update
```

## Vulnerability Disclosure

If you discover a security vulnerability, please report it to the maintainers privately. Include:
- Description of the vulnerability
- Steps to reproduce (if possible)
- Potential impact
- Suggested fix (if you have one)

## Security Patches

Security patches will be released as soon as possible. Users are responsible for updating to the latest version.

---

Thank you for helping keep Mubble secure! 🔒
