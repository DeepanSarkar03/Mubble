import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class OllamaProvider implements LLMProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama'
  readonly description = 'Ollama — run LLMs locally on your machine, 100% private, no API key needed'
  readonly requiresApiKey = false
  readonly website = 'https://ollama.com'
  readonly defaultModel = 'llama3.3'
  readonly models = [
    // ── Llama (Meta) ──────────────────────────────────────────────────────
    'llama4:maverick',               // Llama 4 Maverick — latest MoE model
    'llama4:scout',                  // Llama 4 Scout — efficient MoE
    'llama3.3',                      // Llama 3.3 70B — recommended all-rounder
    'llama3.2',                      // Llama 3.2 3B — fast, small
    'llama3.1:8b',                   // Llama 3.1 8B — lightweight
    // ── DeepSeek ──────────────────────────────────────────────────────────
    'deepseek-r1:70b',               // DeepSeek R1 70B — chain-of-thought reasoning
    'deepseek-r1:14b',               // DeepSeek R1 14B — smaller reasoning
    'deepseek-r1:8b',                // DeepSeek R1 8B — efficient reasoning
    'deepseek-v3',                   // DeepSeek V3 — large MoE model
    // ── Qwen (Alibaba) ────────────────────────────────────────────────────
    'qwen3:72b',                     // Qwen3 72B — strong multilingual
    'qwen3:32b',                     // Qwen3 32B — balanced
    'qwen3:8b',                      // Qwen3 8B — affordable local
    'qwen2.5:72b',                   // Qwen 2.5 72B — previous gen
    // ── Gemma (Google) ────────────────────────────────────────────────────
    'gemma3:27b',                    // Gemma 3 27B — Google open model
    'gemma3:12b',                    // Gemma 3 12B — efficient multimodal
    'gemma3:4b',                     // Gemma 3 4B — smallest Gemma
    // ── Mistral ───────────────────────────────────────────────────────────
    'mistral',                       // Mistral 7B — fast & efficient
    'mistral-nemo',                  // Mistral NeMo 12B — multilingual
    'mixtral:8x7b',                  // Mixtral 8x7B — long context MoE
    // ── Phi (Microsoft) ───────────────────────────────────────────────────
    'phi4',                          // Phi 4 14B — Microsoft compact model
    'phi4-mini',                     // Phi 4 Mini — tiny but capable
    // ── Coding ────────────────────────────────────────────────────────────
    'codellama:34b',                 // Code Llama 34B — coding specialist
    'qwen2.5-coder:32b',             // Qwen 2.5 Coder 32B — top coding model
  ]

  private getBaseUrl(config: LLMProviderConfig): string {
    // Allow custom Ollama host via apiKey field (used as base URL override)
    return config.apiKey || 'http://localhost:11434'
  }

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    try {
      const res = await fetch(`${this.getBaseUrl(config)}/api/tags`)
      return { valid: res.ok, error: res.ok ? undefined : 'Ollama not running — start Ollama first' }
    } catch {
      return { valid: false, error: 'Ollama not found — install Ollama and run it locally' }
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
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`)
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
    if (!res.ok) throw new Error(`Ollama error: ${res.status}`)

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
