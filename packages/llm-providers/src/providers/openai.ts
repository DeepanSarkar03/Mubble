import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  readonly description = 'GPT-4o and GPT-4o-mini for text cleanup and commands'
  readonly requiresApiKey = true
  readonly website = 'https://platform.openai.com'
  readonly defaultModel = 'gpt-4o-mini'
  readonly models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`)
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
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)

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
