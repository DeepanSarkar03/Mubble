import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class GoogleGeminiProvider implements LLMProvider {
  readonly id = 'google-gemini'
  readonly name = 'Google Gemini'
  readonly description = 'Google Gemini — multimodal models from ultra-fast Flash to powerful Pro'
  readonly requiresApiKey = true
  readonly website = 'https://ai.google.dev'
  readonly defaultModel = 'gemini-2.0-flash'
  readonly models = [
    // ── Gemini 2.5 (latest) ───────────────────────────────────────────────
    'gemini-2.5-pro-preview-05-06',  // Gemini 2.5 Pro — most intelligent, deep thinking
    'gemini-2.5-flash-preview-05-20', // Gemini 2.5 Flash — best price/performance
    // ── Gemini 2.0 ────────────────────────────────────────────────────────
    'gemini-2.0-flash',              // Gemini 2.0 Flash — fast & affordable (recommended)
    'gemini-2.0-flash-lite',         // Gemini 2.0 Flash-Lite — cheapest, lowest latency
    // ── Gemini 1.5 ────────────────────────────────────────────────────────
    'gemini-1.5-pro',                // Gemini 1.5 Pro — long context (2M tokens)
    'gemini-1.5-flash',              // Gemini 1.5 Flash — fast and versatile
    'gemini-1.5-flash-8b',           // Gemini 1.5 Flash-8B — smallest & cheapest
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`,
      )
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const model = config.model || this.defaultModel
    const { systemInstruction, contents } = this.buildGeminiPayload(messages, config)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          contents,
          generationConfig: {
            temperature: config.temperature ?? 0.3,
            maxOutputTokens: config.maxTokens ?? 2048,
          },
        }),
      },
    )
    if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const candidate = data.candidates?.[0]
    const text = candidate?.content?.parts?.map((p: any) => p.text).join('') || ''
    return {
      text,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      } : undefined,
      model,
      finishReason: candidate?.finishReason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const model = config.model || this.defaultModel
    const { systemInstruction, contents } = this.buildGeminiPayload(messages, config)

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          contents,
          generationConfig: {
            temperature: config.temperature ?? 0.3,
            maxOutputTokens: config.maxTokens ?? 2048,
          },
        }),
      },
    )
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`)

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
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              fullText += text
              onChunk(text)
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    }

    return { text: fullText, model }
  }

  private buildGeminiPayload(messages: LLMMessage[], config: LLMProviderConfig) {
    let systemInstruction = config.systemPrompt || ''
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = systemInstruction
          ? `${systemInstruction}\n\n${msg.content}`
          : msg.content
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })
      }
    }

    return { systemInstruction, contents }
  }
}
