import type { LLMProvider, LLMProviderConfig, LLMMessage, LLMResult, LLMValidationResult } from '../types'

export class HuggingFaceProvider implements LLMProvider {
  readonly id = 'huggingface'
  readonly name = 'Hugging Face'
  readonly description = 'Hugging Face Inference API — run any open-source model on the Hub with your token'
  readonly requiresApiKey = true
  readonly website = 'https://huggingface.co/settings/tokens'
  readonly defaultModel = 'meta-llama/Llama-3.3-70B-Instruct'
  readonly models = [
    // ── Llama (Meta) ──────────────────────────────────────────────────────
    'meta-llama/Llama-4-Maverick-17B-128E-Instruct',  // Llama 4 Maverick — latest MoE
    'meta-llama/Llama-4-Scout-17B-16E-Instruct',       // Llama 4 Scout — efficient
    'meta-llama/Llama-3.3-70B-Instruct',               // Llama 3.3 70B — recommended
    'meta-llama/Llama-3.1-8B-Instruct',                // Llama 3.1 8B — cheapest
    // ── Qwen (Alibaba) ────────────────────────────────────────────────────
    'Qwen/Qwen3-235B-A22B',                            // Qwen3 235B — MoE flagship
    'Qwen/Qwen2.5-72B-Instruct',                       // Qwen 2.5 72B — multilingual
    'Qwen/Qwen2.5-7B-Instruct',                        // Qwen 2.5 7B — affordable
    // ── DeepSeek ──────────────────────────────────────────────────────────
    'deepseek-ai/DeepSeek-R1',                         // DeepSeek R1 — open reasoning model
    'deepseek-ai/DeepSeek-V3',                         // DeepSeek V3 — MoE language model
    // ── Gemma (Google) ────────────────────────────────────────────────────
    'google/gemma-3-27b-it',                           // Gemma 3 27B — Google open model
    'google/gemma-3-12b-it',                           // Gemma 3 12B — efficient
    // ── Mistral ───────────────────────────────────────────────────────────
    'mistralai/Mistral-7B-Instruct-v0.3',              // Mistral 7B — compact & fast
    'mistralai/Mixtral-8x7B-Instruct-v0.1',            // Mixtral 8x7B — long context
    // ── Microsoft Phi ─────────────────────────────────────────────────────
    'microsoft/Phi-4-mini-instruct',                   // Phi 4 Mini — small but capable
    'microsoft/Phi-3.5-mini-instruct',                 // Phi 3.5 Mini — tiny, fast
  ]

  async validate(config: LLMProviderConfig): Promise<LLMValidationResult> {
    if (!config.apiKey) return { valid: false, error: 'API token is required' }
    try {
      const res = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API token' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async complete(messages: LLMMessage[], config: LLMProviderConfig): Promise<LLMResult> {
    const model = config.model || this.defaultModel
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
      }),
    })
    if (!res.ok) throw new Error(`Hugging Face error: ${res.status} ${await res.text()}`)
    const data = await res.json() as any
    const choice = data.choices?.[0]
    return {
      text: choice?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      model,
      finishReason: choice?.finish_reason,
    }
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (chunk: string) => void,
  ): Promise<LLMResult> {
    const model = config.model || this.defaultModel
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: this.buildMessages(messages, config),
        temperature: config.temperature ?? 0.3,
        max_tokens: config.maxTokens ?? 2048,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`Hugging Face error: ${res.status}`)

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

    return { text: fullText, model }
  }

  private buildMessages(messages: LLMMessage[], config: LLMProviderConfig): LLMMessage[] {
    if (config.systemPrompt && !messages.some((m) => m.role === 'system')) {
      return [{ role: 'system', content: config.systemPrompt }, ...messages]
    }
    return messages
  }
}
