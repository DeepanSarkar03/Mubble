import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

/**
 * Google Vertex AI Provider
 * 
 * Credentials format: PROJECT_ID::LOCATION::API_KEY
 * The apiKey field should contain project, location, and key separated by '::'
 * Example: my-project-123::us-central1::my-api-key
 * 
 * Uses Vertex AI's OpenAI-compatible endpoint for simplicity:
 * https://{LOCATION}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/openapi/chat/completions
 */

interface VertexCredentials {
  projectId: string
  location: string
  apiKey: string
}

export class GoogleVertexProvider implements LLMProvider {
  readonly id = 'google-vertex'
  readonly name = 'Google Vertex AI'
  readonly description = 'Google Vertex AI — Gemini 2.5/2.0, Claude on Vertex, Llama on Vertex, Mistral on Vertex'
  readonly requiresApiKey = true
  readonly website = 'https://cloud.google.com/vertex-ai'
  readonly defaultModel = 'gemini-2.0-flash-lite'
  readonly models = [
    'gemini-2.5-pro-preview-05-06',
    'gemini-2.5-flash-preview-05-20',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'claude-opus-4@20250514',
    'claude-sonnet-4@20250514',
    'claude-3-5-haiku@20241022',
    'llama-3.3-70b-instruct-maas',
    'mistral-large@2411',
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) return { valid: false, error: 'Credentials required in format: PROJECT_ID::LOCATION::API_KEY' }
    
    try {
      // Make a simple request to validate credentials
      const url = this.buildEndpoint(creds)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${creds.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      })
      
      if (res.status === 401) return { valid: false, error: 'Invalid API key' }
      if (res.status === 403) return { valid: false, error: 'Permission denied - check Vertex AI API is enabled' }
      if (res.status === 404) return { valid: false, error: 'Project or location not found' }
      if (res.status === 400) {
        // 400 might mean model not found but credentials are valid
        const data = await res.json().catch(() => ({})) as any
        if (data.error?.message?.includes('model')) return { valid: true }
      }
      if (res.ok) return { valid: true }
      return { valid: false, error: `Vertex AI error: ${res.status}` }
    } catch (e: any) {
      return { valid: false, error: `Connection failed: ${e?.message || 'Unknown error'}` }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) throw new Error('Credentials required in format: PROJECT_ID::LOCATION::API_KEY')

    const url = this.buildEndpoint(creds)
    const body = this.buildRequestBody(messages, config)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!res.ok) throw new Error(`Vertex AI error: ${res.status} ${await res.text()}`)
    
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
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) throw new Error('Credentials required in format: PROJECT_ID::LOCATION::API_KEY')

    const url = this.buildEndpoint(creds)
    const body = this.buildRequestBody(messages, config, true)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!res.ok) throw new Error(`Vertex AI error: ${res.status}`)

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

  private parseCredentials(apiKey?: string): VertexCredentials | null {
    if (!apiKey) return null
    const parts = apiKey.split('::')
    if (parts.length !== 3) return null
    return {
      projectId: parts[0],
      location: parts[1],
      apiKey: parts[2],
    }
  }

  private buildEndpoint(creds: VertexCredentials): string {
    // Use Vertex AI's OpenAI-compatible endpoint
    return `https://${creds.location}-aiplatform.googleapis.com/v1beta1/projects/${creds.projectId}/locations/${creds.location}/endpoints/openapi/chat/completions`
  }

  private buildRequestBody(messages: LLMMessage[], config: LLMProviderConfig, stream = false): string {
    const model = config.model || this.defaultModel
    const temperature = config.temperature ?? 0.3
    const maxTokens = config.maxTokens ?? 2048

    // Map model names to Vertex AI format if needed
    const mappedModel = this.mapModelName(model)

    return JSON.stringify({
      model: mappedModel,
      messages: this.buildMessages(messages, config),
      temperature,
      max_tokens: maxTokens,
      ...(stream && { stream: true }),
    })
  }

  private mapModelName(model: string): string {
    // Vertex AI uses publisher/model format for some models
    // Gemini models
    if (model.startsWith('gemini-')) {
      return `google/${model}`
    }
    // Claude models on Vertex
    if (model.startsWith('claude-')) {
      return `anthropic/${model}`
    }
    // Llama models on Vertex
    if (model.includes('llama')) {
      return `meta/${model}`
    }
    // Mistral models on Vertex
    if (model.includes('mistral')) {
      return `mistral/${model}`
    }
    return model
  }

  private buildMessages(messages: LLMMessage[], config: LLMProviderConfig): LLMMessage[] {
    if (config.systemPrompt && !messages.some((m) => m.role === 'system')) {
      return [{ role: 'system', content: config.systemPrompt }, ...messages]
    }
    return messages
  }
}
