import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class GroqLLMProvider implements LLMProvider {
  readonly id = 'groq'
  readonly name = 'Groq'
  readonly description = 'Groq LPU — world\'s fastest inference, great free tier for voice cleanup'
  readonly requiresApiKey = true
  readonly website = 'https://console.groq.com'
  readonly defaultModel = 'llama-3.3-70b-versatile'
  readonly models = [
    // ── Llama 4 (latest Meta) ─────────────────────────────────────────────
    'meta-llama/llama-4-maverick-17b-128e-instruct', // Llama 4 Maverick — MoE, best on Groq
    'meta-llama/llama-4-scout-17b-16e-instruct',     // Llama 4 Scout — fast & efficient
    // ── Llama 3.3 / 3.1 ──────────────────────────────────────────────────
    'llama-3.3-70b-versatile',    // Llama 3.3 70B — recommended all-rounder (free tier)
    'llama-3.1-70b-versatile',    // Llama 3.1 70B — reliable 70B model
    'llama-3.1-8b-instant',       // Llama 3.1 8B — fastest, cheapest (great for cleanup)
    // ── Qwen ─────────────────────────────────────────────────────────────
    'qwen-qwq-32b',               // Qwen QwQ 32B — strong reasoning model
    'qwen-2.5-72b-instruct',      // Qwen 2.5 72B — multilingual, very capable
    'qwen-2.5-coder-32b-instruct',// Qwen 2.5 Coder — for coding-related dictation
    // ── Deepseek ─────────────────────────────────────────────────────────
    'deepseek-r1-distill-llama-70b', // DeepSeek R1 70B — chain-of-thought reasoning
    // ── Gemma / Mistral ───────────────────────────────────────────────────
    'gemma2-9b-it',               // Gemma2 9B — Google's efficient small model
    'mixtral-8x7b-32768',         // Mixtral 8x7B — long context (32k tokens)
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`Groq error: ${res.status} ${await res.text()}`)
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
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`Groq error: ${res.status}`)

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
