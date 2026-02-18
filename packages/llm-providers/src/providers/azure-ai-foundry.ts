import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

/**
 * Azure AI Foundry / Azure OpenAI Provider
 * 
 * Credentials format: ENDPOINT_URL::API_KEY
 * The apiKey field should contain endpoint and key separated by '::'
 * Example: https://my-resource.openai.azure.com::my-api-key
 * 
 * For Azure OpenAI, the endpoint format is typically:
 * https://<resource-name>.openai.azure.com/openai/deployments/<deployment-name>
 */

interface AzureCredentials {
  endpoint: string
  apiKey: string
}

export class AzureAIFoundryProvider implements LLMProvider {
  readonly id = 'azure-ai-foundry'
  readonly name = 'Azure AI Foundry'
  readonly description = 'Azure AI Foundry — GPT-4o, Phi-4, Llama, Mistral, DeepSeek via Azure'
  readonly requiresApiKey = true
  readonly website = 'https://ai.azure.com'
  readonly defaultModel = 'gpt-4o-mini'
  readonly models = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.1',
    'gpt-4.1-mini',
    'o4-mini',
    'meta-llama-3.3-70b-instruct',
    'mistral-large',
    'mistral-small',
    'phi-4',
    'phi-4-mini',
    'cohere-command-r-plus',
    'deepseek-r1',
    'deepseek-v3',
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) return { valid: false, error: 'Credentials required in format: ENDPOINT_URL::API_KEY' }
    
    try {
      // Try to list models or make a simple request
      const res = await fetch(`${creds.endpoint}/models`, {
        headers: { 'api-key': creds.apiKey },
      })
      // 404 is fine - the models endpoint may not exist, but we got a response
      if (res.status === 401) return { valid: false, error: 'Invalid API key' }
      return { valid: true }
    } catch (e: any) {
      return { valid: false, error: `Connection failed: ${e?.message || 'Unknown error'}` }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) throw new Error('Credentials required in format: ENDPOINT_URL::API_KEY')

    const url = this.buildCompletionUrl(creds.endpoint)
    const body = this.buildRequestBody(messages, config)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': creds.apiKey,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!res.ok) throw new Error(`Azure AI error: ${res.status} ${await res.text()}`)
    
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
    if (!creds) throw new Error('Credentials required in format: ENDPOINT_URL::API_KEY')

    const url = this.buildCompletionUrl(creds.endpoint)
    const body = this.buildRequestBody(messages, config, true)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': creds.apiKey,
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!res.ok) throw new Error(`Azure AI error: ${res.status}`)

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

  private parseCredentials(apiKey?: string): AzureCredentials | null {
    if (!apiKey) return null
    const separatorIndex = apiKey.indexOf('::')
    if (separatorIndex === -1) return null
    return {
      endpoint: apiKey.slice(0, separatorIndex),
      apiKey: apiKey.slice(separatorIndex + 2),
    }
  }

  private buildCompletionUrl(endpoint: string): string {
    // If endpoint already includes chat/completions, use as-is
    if (endpoint.includes('/chat/completions')) {
      return endpoint
    }
    // If it's an Azure OpenAI endpoint with deployment, add api-version
    if (endpoint.includes('.openai.azure.com')) {
      const separator = endpoint.includes('?') ? '&' : '?'
      return `${endpoint}${separator}api-version=2025-01-01-preview`
    }
    // For Azure AI Foundry inference endpoint
    if (endpoint.includes('.inference.ai.azure.com')) {
      return `${endpoint}/v1/chat/completions`
    }
    // Default: append chat/completions
    return `${endpoint.replace(/\/$/, '')}/v1/chat/completions`
  }

  private buildRequestBody(messages: LLMMessage[], config: LLMProviderConfig, stream = false): string {
    const model = config.model || this.defaultModel
    const temperature = config.temperature ?? 0.3
    const maxTokens = config.maxTokens ?? 2048

    return JSON.stringify({
      model,
      messages: this.buildMessages(messages, config),
      temperature,
      max_tokens: maxTokens,
      ...(stream && { stream: true }),
    })
  }

  private buildMessages(messages: LLMMessage[], config: LLMProviderConfig): LLMMessage[] {
    if (config.systemPrompt && !messages.some((m) => m.role === 'system')) {
      return [{ role: 'system', content: config.systemPrompt }, ...messages]
    }
    return messages
  }
}
