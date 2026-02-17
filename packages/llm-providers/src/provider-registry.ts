import type { LLMProvider } from './types'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GoogleGeminiProvider } from './providers/google-gemini'
import { GroqLLMProvider } from './providers/groq'

export class LLMProviderRegistry {
  private providers = new Map<string, LLMProvider>()

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): LLMProvider | undefined {
    return this.providers.get(id)
  }

  list(): LLMProvider[] {
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
export const llmRegistry = new LLMProviderRegistry()

llmRegistry.register(new OpenAIProvider())
llmRegistry.register(new AnthropicProvider())
llmRegistry.register(new GoogleGeminiProvider())
llmRegistry.register(new GroqLLMProvider())
