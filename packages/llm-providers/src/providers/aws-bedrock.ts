import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

/**
 * AWS Bedrock Provider
 * 
 * Credentials format: ACCESS_KEY_ID::SECRET_ACCESS_KEY::REGION
 * The apiKey field should contain all three values separated by '::'
 * Example: AKIAIOSFODNN7EXAMPLE::wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY::us-east-1
 * 
 * Note: This is a simplified implementation using fetch with AWS signature V4.
 * For production use, consider installing @aws-sdk/client-bedrock-runtime
 */

interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export class AWSBedrockProvider implements LLMProvider {
  readonly id = 'aws-bedrock'
  readonly name = 'AWS Bedrock'
  readonly description = 'AWS Bedrock — Access Claude, Llama, Nova, Titan, Mistral, Cohere via AWS'
  readonly requiresApiKey = true
  readonly website = 'https://aws.amazon.com/bedrock'
  readonly defaultModel = 'amazon.nova-micro-v1:0'
  readonly models = [
    'anthropic.claude-opus-4-5-20251101-v1:0',
    'anthropic.claude-sonnet-4-5-20250929-v1:0',
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-5-haiku-20241022-v1:0',
    'meta.llama3-3-70b-instruct-v1:0',
    'meta.llama3-1-8b-instruct-v1:0',
    'amazon.nova-pro-v1:0',
    'amazon.nova-lite-v1:0',
    'amazon.nova-micro-v1:0',
    'amazon.titan-text-lite-v1',
    'mistral.mistral-large-2402-v1:0',
    'cohere.command-r-plus-v1:0',
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) return { valid: false, error: 'Credentials required in format: ACCESS_KEY_ID::SECRET_ACCESS_KEY::REGION' }
    
    try {
      // Try a simple list foundation models call
      const endpoint = `https://bedrock.${creds.region}.amazonaws.com/foundation-models`
      const signedRequest = await this.signRequest('GET', endpoint, creds, '')
      const res = await fetch(signedRequest.url, { headers: signedRequest.headers })
      return { valid: res.ok, error: res.ok ? undefined : `AWS error: ${res.status}` }
    } catch (e: any) {
      return { valid: false, error: `Connection failed: ${e?.message || 'Unknown error'}` }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) throw new Error('Credentials required in format: ACCESS_KEY_ID::SECRET_ACCESS_KEY::REGION')

    const modelId = config.model || this.defaultModel
    const endpoint = `https://bedrock-runtime.${creds.region}.amazonaws.com/model/${modelId}/invoke`
    const body = this.buildRequestBody(modelId, messages, config)

    const signedRequest = await this.signRequest('POST', endpoint, creds, body)
    const res = await fetch(signedRequest.url, {
      method: 'POST',
      headers: signedRequest.headers,
      body,
    })

    if (!res.ok) throw new Error(`AWS Bedrock error: ${res.status} ${await res.text()}`)
    
    const data = await res.json() as any
    return this.parseResponse(modelId, data)
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const creds = this.parseCredentials(config.apiKey)
    if (!creds) throw new Error('Credentials required in format: ACCESS_KEY_ID::SECRET_ACCESS_KEY::REGION')

    const modelId = config.model || this.defaultModel
    const endpoint = `https://bedrock-runtime.${creds.region}.amazonaws.com/model/${modelId}/invoke-with-response-stream`
    const body = this.buildRequestBody(modelId, messages, config)

    const signedRequest = await this.signRequest('POST', endpoint, creds, body)
    const res = await fetch(signedRequest.url, {
      method: 'POST',
      headers: signedRequest.headers,
      body,
    })

    if (!res.ok) throw new Error(`AWS Bedrock error: ${res.status}`)

    let fullText = ''
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        
        // Parse event stream format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const eventData = line.slice(5).trim()
              const event = JSON.parse(eventData)
              const textChunk = this.extractStreamChunk(modelId, event)
              if (textChunk) {
                fullText += textChunk
                onChunk(textChunk)
              }
            } catch { /* skip malformed events */ }
          }
        }
      }
    }

    return { text: fullText, model: modelId }
  }

  private parseCredentials(apiKey?: string): AWSCredentials | null {
    if (!apiKey) return null
    const parts = apiKey.split('::')
    if (parts.length !== 3) return null
    return {
      accessKeyId: parts[0],
      secretAccessKey: parts[1],
      region: parts[2],
    }
  }

  private buildRequestBody(modelId: string, messages: LLMMessage[], config: LLMProviderConfig): string {
    const systemPrompt = config.systemPrompt
    const temperature = config.temperature ?? 0.3
    const maxTokens = config.maxTokens ?? 2048

    // Anthropic models on Bedrock
    if (modelId.startsWith('anthropic.')) {
      const anthropicMessages = messages.filter(m => m.role !== 'system')
      const systemMessage = messages.find(m => m.role === 'system')?.content || systemPrompt
      
      return JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        temperature,
        ...(systemMessage && { system: systemMessage }),
        messages: anthropicMessages.map(m => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }],
        })),
      })
    }

    // Meta Llama models
    if (modelId.startsWith('meta.')) {
      const prompt = this.buildLlamaPrompt(messages, systemPrompt)
      return JSON.stringify({
        prompt,
        max_gen_len: maxTokens,
        temperature,
      })
    }

    // Amazon Nova models
    if (modelId.startsWith('amazon.nova')) {
      return JSON.stringify({
        messages: this.buildMessages(messages, config),
        inferenceConfig: {
          max_new_tokens: maxTokens,
          temperature,
        },
      })
    }

    // Amazon Titan models
    if (modelId.startsWith('amazon.titan')) {
      return JSON.stringify({
        inputText: this.buildTitanPrompt(messages, systemPrompt),
        textGenerationConfig: {
          maxTokenCount: maxTokens,
          temperature,
        },
      })
    }

    // Mistral models
    if (modelId.startsWith('mistral.')) {
      return JSON.stringify({
        prompt: this.buildLlamaPrompt(messages, systemPrompt),
        max_tokens: maxTokens,
        temperature,
      })
    }

    // Cohere models
    if (modelId.startsWith('cohere.')) {
      return JSON.stringify({
        message: messages.find(m => m.role === 'user')?.content || '',
        chat_history: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'user' ? 'USER' : 'CHATBOT',
          message: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
      })
    }

    // Default to OpenAI-compatible format
    return JSON.stringify({
      messages: this.buildMessages(messages, config),
      temperature,
      max_tokens: maxTokens,
    })
  }

  private buildMessages(messages: LLMMessage[], config: LLMProviderConfig): LLMMessage[] {
    if (config.systemPrompt && !messages.some((m) => m.role === 'system')) {
      return [{ role: 'system', content: config.systemPrompt }, ...messages]
    }
    return messages
  }

  private buildLlamaPrompt(messages: LLMMessage[], systemPrompt?: string): string {
    let prompt = ''
    const system = messages.find(m => m.role === 'system')?.content || systemPrompt
    if (system) {
      prompt += `<|system|>\n${system}\n<|end|>\n`
    }
    for (const msg of messages.filter(m => m.role !== 'system')) {
      prompt += `<|${msg.role}|>\n${msg.content}\n<|end|>\n`
    }
    prompt += '<|assistant|>\n'
    return prompt
  }

  private buildTitanPrompt(messages: LLMMessage[], systemPrompt?: string): string {
    const parts: string[] = []
    const system = messages.find(m => m.role === 'system')?.content || systemPrompt
    if (system) parts.push(`System: ${system}`)
    for (const msg of messages.filter(m => m.role !== 'system')) {
      parts.push(`${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.content}`)
    }
    return parts.join('\n')
  }

  private parseResponse(modelId: string, data: any): LLMResult {
    // Anthropic format
    if (modelId.startsWith('anthropic.')) {
      const content = data.content?.[0]?.text || ''
      return {
        text: content,
        model: modelId,
      }
    }

    // Meta Llama format
    if (modelId.startsWith('meta.')) {
      return {
        text: data.generation || '',
        model: modelId,
      }
    }

    // Amazon Nova format
    if (modelId.startsWith('amazon.nova')) {
      const content = data.output?.message?.content?.[0]?.text || ''
      return {
        text: content,
        model: modelId,
      }
    }

    // Amazon Titan format
    if (modelId.startsWith('amazon.titan')) {
      return {
        text: data.results?.[0]?.outputText || '',
        model: modelId,
      }
    }

    // Mistral format
    if (modelId.startsWith('mistral.')) {
      return {
        text: data.outputs?.[0]?.text || '',
        model: modelId,
      }
    }

    // Cohere format
    if (modelId.startsWith('cohere.')) {
      return {
        text: data.text || '',
        model: modelId,
      }
    }

    return { text: '', model: modelId }
  }

  private extractStreamChunk(modelId: string, event: any): string | null {
    // Anthropic streaming
    if (modelId.startsWith('anthropic.')) {
      return event.delta?.text || null
    }

    // Meta Llama streaming
    if (modelId.startsWith('meta.')) {
      return event.generation || null
    }

    // Amazon Nova streaming
    if (modelId.startsWith('amazon.nova')) {
      return event.contentBlockDelta?.delta?.text || null
    }

    // Amazon Titan streaming
    if (modelId.startsWith('amazon.titan')) {
      return event.outputText || null
    }

    // Mistral streaming
    if (modelId.startsWith('mistral.')) {
      return event.outputs?.[0]?.text || null
    }

    return null
  }

  private async signRequest(
    method: string,
    endpoint: string,
    creds: AWSCredentials,
    body: string,
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const url = new URL(endpoint)
    const now = new Date()
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
    
    const service = 'bedrock'
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${creds.region}/${service}/aws4_request`
    
    const headers: Record<string, string> = {
      'host': url.hostname,
      'x-amz-date': amzDate,
      'content-type': 'application/json',
    }

    if (body) {
      const encoder = new TextEncoder()
      const data = encoder.encode(body)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      headers['x-amz-content-sha256'] = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      headers['x-amz-content-sha256'] = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }

    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
      .sort()
      .map(k => `${k.toLowerCase()}:${headers[k].trim()}\n`)
      .join('')
    const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')
    
    const canonicalRequest = [
      method,
      url.pathname,
      url.search.slice(1),
      canonicalHeaders,
      signedHeaders,
      headers['x-amz-content-sha256'],
    ].join('\n')

    // Create string to sign
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await this.sha256(canonicalRequest),
    ].join('\n')

    // Calculate signature
    const signingKey = await this.getSigningKey(creds.secretAccessKey, dateStamp, creds.region, service)
    const signature = await this.hmacSha256Hex(signingKey, stringToSign)

    // Add authorization header
    headers['authorization'] = `${algorithm} Credential=${creds.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    return { url: endpoint, headers }
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async getSigningKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
    const kDate = await this.hmacSha256(this.encode(`AWS4${secretKey}`), dateStamp)
    const kRegion = await this.hmacSha256(kDate, region)
    const kService = await this.hmacSha256(kRegion, service)
    const kSigning = await this.hmacSha256(kService, 'aws4_request')
    return kSigning
  }

  private encode(str: string): ArrayBuffer {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(str)
    // Convert Uint8Array to ArrayBuffer
    return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
  }

  private async hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    return crypto.subtle.sign('HMAC', cryptoKey, this.encode(message))
  }

  private async hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, this.encode(message))
    const array = Array.from(new Uint8Array(signature))
    return array.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
