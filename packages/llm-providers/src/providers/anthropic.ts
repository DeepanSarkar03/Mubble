import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  readonly description = 'Claude models for intelligent text cleanup and commands'
  readonly requiresApiKey = true
  readonly website = 'https://console.anthropic.com'
  readonly defaultModel = 'claude-sonnet-4-20250514'
  readonly models = [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      // Send a minimal request to validate the key
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      })
      // 200 or 400 (bad request but valid key) are okay; 401 means invalid key
      return { valid: res.status !== 401, error: res.status === 401 ? 'Invalid API key' : undefined }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const { system, msgs } = this.splitMessages(messages, config)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        system: system || undefined,
        messages: msgs,
        max_tokens: config.maxTokens ?? 2048,
        temperature: config.temperature ?? 0.3,
      }),
    })
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const text = data.content?.map((c: any) => c.text).join('') || ''
    return {
      text,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      model: data.model,
      finishReason: data.stop_reason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const { system, msgs } = this.splitMessages(messages, config)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        system: system || undefined,
        messages: msgs,
        max_tokens: config.maxTokens ?? 2048,
        temperature: config.temperature ?? 0.3,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)

    let fullText = ''
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter((l) => l.startsWith('data: '))) {
          try {
            const parsed = JSON.parse(line.slice(6)) as any
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text
              onChunk(parsed.delta.text)
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    }

    return { text: fullText, model: config.model || this.defaultModel }
  }

  private splitMessages(messages: LLMMessage[], config: LLMProviderConfig) {
    let system = config.systemPrompt || ''
    const msgs: Array<{ role: 'user' | 'assistant'; content: string }> = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = system ? `${system}\n\n${msg.content}` : msg.content
      } else {
        msgs.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
      }
    }

    return { system, msgs }
  }
}
