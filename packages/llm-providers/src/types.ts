/**
 * LLM Provider interface for text cleanup and command mode.
 * All LLM providers implement this interface for pluggable use.
 */

export interface LLMProvider {
  /** Unique provider identifier */
  readonly id: string
  /** Display name */
  readonly name: string
  /** Short description */
  readonly description: string
  /** Whether an API key is required */
  readonly requiresApiKey: boolean
  /** Provider website */
  readonly website: string
  /** Default model identifier */
  readonly defaultModel?: string
  /** Available models */
  readonly models?: string[]

  /** Validate the provider configuration (API key, etc.) */
  validate(config: LLMProviderConfig): Promise<LLMValidationResult>

  /** Complete a prompt (non-streaming) */
  complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult>

  /** Stream a completion, yielding chunks */
  stream?(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult>
}

export interface LLMProviderConfig {
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  additionalOptions?: Record<string, unknown>
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResult {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  finishReason?: string
}

export interface LLMValidationResult {
  valid: boolean
  error?: string
}
