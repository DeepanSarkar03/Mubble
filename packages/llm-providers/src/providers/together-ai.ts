import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class TogetherAIProvider implements LLMProvider {
  readonly id = 'together-ai'
  readonly name = 'Together AI'
  readonly description = 'Together AI — 200+ open-source models, fast serverless inference at low cost'
  readonly requiresApiKey = true
  readonly website = 'https://api.together.ai'
  readonly defaultModel = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'
  readonly models = [
    // ── Llama 4 (latest Meta) ─────────────────────────────────────────────
    'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', // Llama 4 Maverick — MoE, frontier
    'meta-llama/Llama-4-Scout-17B-16E-Instruct',          // Llama 4 Scout — efficient MoE
    // ── Llama 3.3 / 3.1 ──────────────────────────────────────────────────
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',            // Llama 3.3 70B Turbo (recommended)
    'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',        // Llama 3.1 8B — cheapest Llama
    // ── DeepSeek ──────────────────────────────────────────────────────────
    'deepseek-ai/DeepSeek-V3',                             // DeepSeek V3 — MoE, 671B
    'deepseek-ai/DeepSeek-R1',                             // DeepSeek R1 — chain-of-thought
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B',          // R1 Distill — fast reasoning
    // ── Qwen ──────────────────────────────────────────────────────────────
    'Qwen/Qwen2.5-72B-Instruct-Turbo',                    // Qwen 2.5 72B — multilingual
    'Qwen/Qwen2.5-7B-Instruct-Turbo',                     // Qwen 2.5 7B — cheap & fast
    'Qwen/QwQ-32B-Preview',                               // QwQ 32B — reasoning model
    // ── Mistral / Mixtral ─────────────────────────────────────────────────
    'mistralai/Mixtral-8x22B-Instruct-v0.1',               // Mixtral 8x22B — long context
    'mistralai/Mistral-7B-Instruct-v0.3',                  // Mistral 7B — cheapest option
    // ── Google ────────────────────────────────────────────────────────────
    'google/gemma-2-27b-it',                               // Gemma 2 27B — Google open model
    'google/gemma-2-9b-it',                                // Gemma 2 9B — efficient
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.together.xyz/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const res = await fetch('https://api.together.xyz/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`Together AI error: ${res.status} ${await res.text()}`)
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
    const res = await fetch('https://api.together.xyz/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`Together AI error: ${res.status}`)

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
