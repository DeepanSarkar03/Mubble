import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class FireworksAIProvider implements LLMProvider {
  readonly id = 'fireworks-ai'
  readonly name = 'Fireworks AI'
  readonly description = 'Fireworks AI — ultra-fast serverless inference for 300+ open-source models'
  readonly requiresApiKey = true
  readonly website = 'https://fireworks.ai'
  readonly defaultModel = 'accounts/fireworks/models/llama-v3p3-70b-instruct'
  readonly models = [
    // ── Llama 4 (latest Meta) ─────────────────────────────────────────────
    'accounts/fireworks/models/llama4-maverick-instruct-basic',  // Llama 4 Maverick
    'accounts/fireworks/models/llama4-scout-instruct-basic',     // Llama 4 Scout
    // ── Llama 3.3 / 3.1 ──────────────────────────────────────────────────
    'accounts/fireworks/models/llama-v3p3-70b-instruct',         // Llama 3.3 70B (recommended)
    'accounts/fireworks/models/llama-v3p1-8b-instruct',          // Llama 3.1 8B — cheapest
    // ── DeepSeek ──────────────────────────────────────────────────────────
    'accounts/fireworks/models/deepseek-v3-0324',                // DeepSeek V3 — MoE flagship
    'accounts/fireworks/models/deepseek-r1-0528',                // DeepSeek R1 — reasoning
    'accounts/fireworks/models/deepseek-r1-distill-llama-70b',   // R1 Distill 70B
    // ── Qwen ─────────────────────────────────────────────────────────────
    'accounts/fireworks/models/qwen3-235b-a22b',                 // Qwen3 235B — MoE, strongest
    'accounts/fireworks/models/qwen3-30b-a3b',                   // Qwen3 30B MoE — efficient
    'accounts/fireworks/models/qwen2p5-72b-instruct',            // Qwen 2.5 72B
    // ── Mixtral ───────────────────────────────────────────────────────────
    'accounts/fireworks/models/mixtral-8x22b-instruct',          // Mixtral 8x22B — long context
    'accounts/fireworks/models/mixtral-8x7b-instruct',           // Mixtral 8x7B — affordable MoE
    // ── Gemma ─────────────────────────────────────────────────────────────
    'accounts/fireworks/models/gemma2-9b-it',                    // Gemma 2 9B — Google efficient
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.fireworks.ai/inference/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
      }),
    })
    if (!res.ok) throw new Error(`Fireworks AI error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const choice = data.choices?.[0]
    return {
      text: choice?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model: data.model,
      finishReason: choice?.finish_reason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`Fireworks AI error: ${res.status}`)

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
