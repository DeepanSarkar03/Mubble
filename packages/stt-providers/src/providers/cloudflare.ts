import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class CloudflareProvider implements STTProvider {
  readonly id = 'cloudflare'
  readonly name = 'Cloudflare Workers AI'
  readonly description = 'Whisper models running on Cloudflare edge network'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'webm']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://developers.cloudflare.com/workers-ai'
  readonly defaultModel = '@cf/openai/whisper'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    if (!config.additionalOptions?.accountId) return { valid: false, error: 'Cloudflare Account ID is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, _format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const accountId = config.additionalOptions?.accountId as string
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${config.model || '@cf/openai/whisper'}`, {
      method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body: audio,
    })
    if (!res.ok) throw new Error(`Cloudflare AI error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.result?.text || '' }
  }
}
