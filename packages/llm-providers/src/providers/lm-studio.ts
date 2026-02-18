import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class LMStudioProvider implements LLMProvider {
  readonly id = 'lm-studio'
  readonly name = 'LM Studio'
  readonly description = 'LM Studio — run any GGUF model locally with a GUI, OpenAI-compatible server'
  readonly requiresApiKey = false
  readonly website = 'https://lmstudio.ai'
  readonly defaultModel = 'local-model'
  readonly models = [
    // ── LM Studio uses whatever model you load in the app ─────────────────
    // These are suggested model names — the actual model ID depends on
    // which model file you have loaded in LM Studio's local server.
    'local-model',                   // Default: whatever model is currently loaded
    // ── Popular GGUF models (load via LM Studio app) ──────────────────────
    'llama-3.3-70b-instruct',        // Meta Llama 3.3 70B Instruct (Q4_K_M recommended)
    'llama-3.1-8b-instruct',         // Meta Llama 3.1 8B — lightweight
    'qwen2.5-72b-instruct',          // Qwen 2.5 72B — multilingual
    'qwen2.5-32b-instruct',          // Qwen 2.5 32B — balanced
    'mistral-7b-instruct-v0.3',      // Mistral 7B — fast & efficient
    'deepseek-r1-distill-llama-8b',  // DeepSeek R1 Distill 8B — compact reasoning
    'deepseek-r1-distill-qwen-14b',  // DeepSeek R1 Distill Qwen 14B
    'phi-4',                         // Microsoft Phi 4 14B
    'phi-4-mini-instruct',           // Phi 4 Mini — tiny footprint
    'gemma-3-12b-it',               // Google Gemma 3 12B
    'gemma-3-4b-it',                // Google Gemma 3 4B — very small
    'codellama-13b-instruct',        // Code Llama 13B — coding
    'qwen2.5-coder-32b-instruct',    // Qwen 2.5 Coder 32B
  ]

  private getBaseUrl(config: LLMProviderConfig): string {
    // Allow custom LM Studio server URL via apiKey field
    return config.apiKey || 'http://localhost:1234'
  }

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    try {
      const res = await fetch(`${this.getBaseUrl(config)}/v1/models`)
      return { valid: res.ok, error: res.ok ? undefined : 'LM Studio server not running' }
    } catch {
      return {
        valid: false,
        error: 'LM Studio not found — open LM Studio, load a model, and start the local server',
      }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const baseUrl = this.getBaseUrl(config)
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
        stream: false,
      }),
    })
    if (!res.ok) throw new Error(`LM Studio error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const choice = data.choices?.[0]
    return {
      text: choice?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model || config.model || this.defaultModel,
      finishReason: choice?.finish_reason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const baseUrl = this.getBaseUrl(config)
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`LM Studio error: ${res.status}`)

    let fullText = ''
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter((l) => l.startsWith('data: '))) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data) as any
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              onChunk(delta)
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    }

    return { text: fullText, model: config.model || this.defaultModel }
  }

  private buildMessages(messages: LLMMessage[], config: LLMProviderConfig): LLMMessage[] {
    if (config.systemPrompt && !messages.some((m) => m.role === 'system')) {
      return [{ role: 'system', content: config.systemPrompt }, ...messages]
    }
    return messages
  }
}
