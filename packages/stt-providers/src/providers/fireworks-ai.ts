import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class FireworksAIProvider implements STTProvider {
  readonly id = 'fireworks-ai'
  readonly name = 'Fireworks AI'
  readonly description = 'Fast Whisper inference on Fireworks serverless GPUs'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://fireworks.ai'
  readonly defaultModel = 'whisper-v3'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.fireworks.ai/inference/v1/models', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const blob = new Blob([new Uint8Array(audio)], { type: `audio/${format}` })
    const fd = new FormData()
    fd.append('file', blob, `audio.${format}`)
    fd.append('model', config.model || 'whisper-v3')
    if (config.language && config.language !== 'auto') fd.append('language', config.language)
    fd.append('response_format', 'verbose_json')

    const res = await fetch('https://api.fireworks.ai/inference/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: fd,
    })
    if (!res.ok) throw new Error(`Fireworks AI error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.text || '', language: data.language, duration: data.duration }
  }
}
