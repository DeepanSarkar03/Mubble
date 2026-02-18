import type { LLMProvider } from './types'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GoogleGeminiProvider } from './providers/google-gemini'
import { GroqLLMProvider } from './providers/groq'
import { MistralProvider } from './providers/mistral'
import { CohereProvider } from './providers/cohere'
import { TogetherAIProvider } from './providers/together-ai'
import { ReplicateProvider } from './providers/replicate'
import { PerplexityProvider } from './providers/perplexity'
import { XAIProvider } from './providers/xai'
import { FireworksAIProvider } from './providers/fireworks-ai'
import { HuggingFaceProvider } from './providers/huggingface'
import { OllamaProvider } from './providers/ollama'
import { LMStudioProvider } from './providers/lm-studio'
import { AWSBedrockProvider } from './providers/aws-bedrock'
import { AzureAIFoundryProvider } from './providers/azure-ai-foundry'
import { GoogleVertexProvider } from './providers/google-vertex'

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

// Cloud API providers
llmRegistry.register(new OpenAIProvider())
llmRegistry.register(new AnthropicProvider())
llmRegistry.register(new GoogleGeminiProvider())
llmRegistry.register(new GroqLLMProvider())
llmRegistry.register(new MistralProvider())
llmRegistry.register(new CohereProvider())
llmRegistry.register(new TogetherAIProvider())
llmRegistry.register(new ReplicateProvider())
llmRegistry.register(new PerplexityProvider())
llmRegistry.register(new XAIProvider())
llmRegistry.register(new FireworksAIProvider())
llmRegistry.register(new HuggingFaceProvider())

// Local inference providers (no API key needed)
llmRegistry.register(new OllamaProvider())
llmRegistry.register(new LMStudioProvider())

// Cloud platform providers (need credentials/endpoint)
llmRegistry.register(new AWSBedrockProvider())
llmRegistry.register(new AzureAIFoundryProvider())
llmRegistry.register(new GoogleVertexProvider())
