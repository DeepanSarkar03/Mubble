import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class CohereProvider implements LLMProvider {
  readonly id = 'cohere'
  readonly name = 'Cohere'
  readonly description = 'Cohere — enterprise RAG & command models, strong retrieval-augmented generation'
  readonly requiresApiKey = true
  readonly website = 'https://dashboard.cohere.com'
  readonly defaultModel = 'command-r-08-2024'
  readonly models = [
    // ── Command A (latest flagship) ───────────────────────────────────────
    'command-a-03-2025',             // Command A — most capable, 111B, 256K context
    // ── Command R+ ────────────────────────────────────────────────────────
    'command-r-plus-08-2024',        // Command R+ — best for RAG & complex tasks
    'command-r-plus-04-2024',        // Command R+ (April 2024) — previous version
    // ── Command R ─────────────────────────────────────────────────────────
    'command-r-08-2024',             // Command R — balanced, great for RAG (recommended)
    'command-r-03-2024',             // Command R (March 2024) — previous version
    // ── Command (legacy, cheapest) ────────────────────────────────────────
    'command',                        // Command — general purpose, affordable
    'command-light',                  // Command Light — cheapest, fastest option
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.cohere.com/v1/models', {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const { systemPrompt, chatHistory, userMessage } = this.buildCoherePayload(messages, config)

    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        system_prompt: systemPrompt || undefined,
        messages: [...chatHistory, { role: 'user', content: userMessage }],
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
      }),
    })
    if (!res.ok) throw new Error(`Cohere error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const text = data.message?.content?.[0]?.text || ''
    return {
      text,
      usage: data.usage ? {
        promptTokens: data.usage.billed_units?.input_tokens || 0,
        completionTokens: data.usage.billed_units?.output_tokens || 0,
        totalTokens: (data.usage.billed_units?.input_tokens || 0) + (data.usage.billed_units?.output_tokens || 0),
      } : undefined,
      model: config.model || this.defaultModel,
      finishReason: data.finish_reason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const { systemPrompt, chatHistory, userMessage } = this.buildCoherePayload(messages, config)

    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model || this.defaultModel,
        system_prompt: systemPrompt || undefined,
        messages: [...chatHistory, { role: 'user', content: userMessage }],
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`Cohere error: ${res.status}`)

    let fullText = ''
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter((l) => l.trim())) {
          try {
            const parsed = JSON.parse(line) as any
            if (parsed.type === 'content-delta') {
              const text = parsed.delta?.message?.content?.text
              if (text) {
                fullText += text
                onChunk(text)
              }
            }
          } catch { /* skip malformed events */ }
        }
      }
    }

    return { text: fullText, model: config.model || this.defaultModel }
  }

  private buildCoherePayload(messages: LLMMessage[], config: LLMProviderConfig) {
    let systemPrompt = config.systemPrompt || ''
    const chatHistory: Array<{ role: string; content: string }> = []
    let userMessage = ''

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt = systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content
      } else if (msg.role === 'assistant') {
        chatHistory.push({ role: 'assistant', content: msg.content })
      } else {
        // Last user message becomes the query; prior ones go in chat history
        if (userMessage) chatHistory.push({ role: 'user', content: userMessage })
        userMessage = msg.content
      }
    }

    return { systemPrompt, chatHistory, userMessage }
  }
}
