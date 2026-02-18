<p align="center">
  <img src="docs/logo.png" alt="Mubble Logo" width="120" height="120" />
</p>

<p align="center">
  <h1 align="center">Mubble</h1>
  <p align="center">Open-source voice-to-text desktop app with AI-powered editing</p>
  <p align="center">
    <a href="#features">Features</a> &bull;
    <a href="#installation">Installation</a> &bull;
    <a href="#providers">Providers</a> &bull;
    <a href="#development">Development</a> &bull;
    <a href="#architecture">Architecture</a>
  </p>
</p>

---

Mubble is an open-source desktop application that lets you dictate text into any application on your computer. It uses speech-to-text (STT) providers to transcribe your voice and large language models (LLMs) to clean up and format the output. Think of it as your personal AI-powered dictation assistant.

**You bring your own API keys** — Mubble supports 14 STT providers and 4 LLM providers, so you can choose the one that fits your budget and needs.

## Features

### Core Dictation
- **Push-to-Talk** — Hold a customizable shortcut key to record, release to transcribe and inject text
- **Hands-Free Mode** — Voice Activity Detection (VAD) automatically starts/stops recording when you speak
- **Command Mode** — Select text, speak a command ("make this formal", "translate to Spanish"), and the text is transformed in-place
- **Text Injection** — Transcribed text is automatically typed into whatever app you're using

### AI-Powered Processing
- **Smart Cleanup** — LLM fixes grammar, punctuation, filler words, and formatting
- **Per-App Styles** — Configure different vibes per app (casual for Slack, formal for email)
- **Personal Dictionary** — Custom word replacements for names, technical terms, and common corrections
- **Snippets** — Trigger phrases that expand into full text (e.g., "my email" becomes your email address)

### Interface
- **Flow Bar** — A floating, non-focusable toolbar showing recording state and waveform visualization
- **System Tray** — Quick access to start/stop dictation, open settings, and quit
- **Global Shortcuts** — Fully customizable keyboard shortcuts with key-up detection

### Data & History
- **History** — Searchable log of all past dictations with timestamps and target app
- **Analytics** — Track words dictated, time saved, top apps, and daily/weekly trends
- **Local Storage** — All data stored locally in SQLite, API keys encrypted with OS keychain

## Providers

### Speech-to-Text (14 Providers)

| Provider | Streaming | Offline | Notes |
|----------|-----------|---------|-------|
| OpenAI Whisper | No | No | Best overall accuracy |
| Deepgram | Yes | No | Excellent real-time latency |
| Groq | No | No | Ultra-fast Whisper on LPU hardware |
| Google Cloud Speech | Yes | No | Wide language support |
| Azure AI Foundry | Yes | No | Microsoft Azure Speech Services |
| Cloudflare Workers AI | No | No | Edge network inference |
| Fireworks AI | No | No | Serverless GPU inference |
| JigsawStack | No | No | AI-powered speech recognition |
| SambaNova | No | No | DataScale hardware acceleration |
| Together AI | No | No | Inference cloud |
| Lemonfox.ai | No | No | Affordable Whisper API |
| AssemblyAI | Yes | No | Best-in-class accuracy |
| Gladia | Yes | No | Enterprise-grade with streaming |
| Local Whisper | No | Yes | Runs whisper.cpp locally, no API key needed |

### LLM Providers (4 Providers)

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo |
| Anthropic | Claude Sonnet 4, Claude Opus 4, Claude 3.5 Haiku/Sonnet |
| Google Gemini | Gemini 2.0 Flash, Gemini 1.5 Flash/Pro |
| Groq | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma2 9B |

## Installation

### Download Source Code (v0.1.0)

Download the source code for the latest release from the [Releases](https://github.com/DeepanSarkar03/Mubble/releases) page:

- **Source code (zip)** or **Source code (tar.gz)**

### Build from Source

```bash
# Clone the repository
git clone https://github.com/DeepanSarkar03/Mubble.git
cd Mubble

# Install dependencies
pnpm install

# Build packages
pnpm run build

# Run in development mode
pnpm run dev

# Build installers (requires Build Tools for Visual Studio on Windows, Xcode on macOS)
cd apps/desktop
pnpm run dist:win   # Windows
pnpm run dist:mac   # macOS
```

### First Run Setup

1. **Configure STT Provider** — Go to **Settings > STT Providers**
   - Select a provider (e.g., Groq is free with fast inference)
   - Enter your API key
   - Click "Validate"

2. **(Optional) Configure LLM** — Go to **Settings > LLM Providers**
   - Select a provider for text cleanup (e.g., Groq)
   - Enter API key and validate

3. **Select Microphone** — Go to **Settings > Microphone**
   - Choose your input device

4. **Start Dictating** — Press `Ctrl+Shift+Space` (default shortcut)
   - Or customize in **Settings > Shortcuts**

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v10+
- [Git](https://git-scm.com/)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/mubble.git
cd mubble

# Install dependencies
pnpm install

# Start development mode (Electron app with hot reload)
pnpm run dev

# Build all packages
pnpm run build
```

### Project Structure

```
mubble/
├── apps/
│   └── desktop/                    # Electron app (main + preload + renderer)
│       └── src/
│           ├── main/               # Electron main process
│           ├── preload/            # Context bridge (typed IPC API)
│           └── renderer/           # React UI (pages, components, hooks, stores)
│
├── packages/
│   ├── shared/                     # Shared types, IPC channels, constants
│   ├── storage/                    # SQLite database, migrations, repositories
│   ├── stt-providers/              # 14 STT provider implementations
│   ├── llm-providers/              # 4 LLM providers + prompt templates
│   └── audio-pipeline/             # Mic → STT → LLM → text injection orchestrator
│
├── .github/workflows/              # CI + release pipelines
├── turbo.json                      # Turborepo build config
└── pnpm-workspace.yaml             # pnpm workspace config
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Electron app in dev mode with hot reload |
| `pnpm run build` | Build all packages and the Electron app |
| `pnpm run test` | Run tests across all packages |
| `pnpm run lint` | Lint all packages |
| `pnpm run clean` | Clean all build outputs |

### Adding a New STT Provider

1. Create a new file in `packages/stt-providers/src/providers/my-provider.ts`
2. Implement the `STTProvider` interface:

```typescript
import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class MyProvider implements STTProvider {
  readonly id = 'my-provider'
  readonly name = 'My Provider'
  readonly description = 'Description here'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://example.com'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    // Your implementation here
    return { text: 'transcribed text' }
  }
}
```

3. Register it in `packages/stt-providers/src/provider-registry.ts`
4. Export it from `packages/stt-providers/src/index.ts`

## Architecture

### Design Principles

- **Provider abstraction** — All STT/LLM providers implement a common interface with a registry pattern. Adding a new provider = one file + one line of registration.
- **Main process is source of truth** — All audio, STT, LLM, and storage operations run in the Electron main process. The renderer is UI-only, connected via typed IPC.
- **API keys encrypted at rest** — Uses Electron's `safeStorage` (OS keychain on macOS, DPAPI on Windows).
- **Flow Bar is non-focusable** — Never steals focus from the app you're dictating into.
- **Text injection via clipboard** — Saves to clipboard, simulates Ctrl/Cmd+V paste, then restores the original clipboard content.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 34 |
| Bundler | electron-vite (Vite 6) |
| UI | React 19 + Zustand + Tailwind CSS v4 |
| Components | Radix UI primitives + Lucide icons |
| Database | better-sqlite3 |
| Monorepo | pnpm workspaces + Turborepo |
| Build | electron-builder |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
