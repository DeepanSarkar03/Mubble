import type { STTProvider } from './types'
import { OpenAIWhisperProvider } from './providers/openai-whisper'
import { DeepgramProvider } from './providers/deepgram'
import { GroqSTTProvider } from './providers/groq'
import { GoogleCloudSpeechProvider } from './providers/google-cloud-speech'
import { AzureAIFoundryProvider } from './providers/azure-ai-foundry'
import { CloudflareProvider } from './providers/cloudflare'
import { FireworksAIProvider } from './providers/fireworks-ai'
import { JigsawStackProvider } from './providers/jigsawstack'
import { SambaNovaProvider } from './providers/sambanova'
import { TogetherAIProvider } from './providers/together-ai'
import { LemonfoxProvider } from './providers/lemonfox'
import { AssemblyAIProvider } from './providers/assemblyai'
import { GladiaProvider } from './providers/gladia'
import { LocalWhisperProvider } from './providers/local-whisper'

export class STTProviderRegistry {
  private providers = new Map<string, STTProvider>()

  register(provider: STTProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): STTProvider | undefined {
    return this.providers.get(id)
  }

  list(): STTProvider[] {
    return Array.from(this.providers.values())
  }

  has(id: string): boolean {
    return this.providers.has(id)
  }

  ids(): string[] {
    return Array.from(this.providers.keys())
  }
}

// Create and populate the default registry with all providers
export const sttRegistry = new STTProviderRegistry()

sttRegistry.register(new OpenAIWhisperProvider())
sttRegistry.register(new DeepgramProvider())
sttRegistry.register(new GroqSTTProvider())
sttRegistry.register(new GoogleCloudSpeechProvider())
sttRegistry.register(new AzureAIFoundryProvider())
sttRegistry.register(new CloudflareProvider())
sttRegistry.register(new FireworksAIProvider())
sttRegistry.register(new JigsawStackProvider())
sttRegistry.register(new SambaNovaProvider())
sttRegistry.register(new TogetherAIProvider())
sttRegistry.register(new LemonfoxProvider())
sttRegistry.register(new AssemblyAIProvider())
sttRegistry.register(new GladiaProvider())
sttRegistry.register(new LocalWhisperProvider())
