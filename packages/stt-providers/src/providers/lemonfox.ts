import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class LemonfoxProvider implements STTProvider {
  readonly id = 'lemonfox'
  readonly name = 'Lemonfox.ai'
  readonly description = 'Affordable Whisper API with competitive pricing'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://lemonfox.ai'
  readonly defaultModel = 'whisper-large'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const blob = new Blob([new Uint8Array(audio)], { type: `audio/${format}` })
    const fd = new FormData()
    fd.append('file', blob, `audio.${format}`)
    fd.append('model', config.model || 'whisper-large')
    if (config.language && config.language !== 'auto') fd.append('language', config.language)
    fd.append('response_format', 'verbose_json')

    const res = await fetch('https://api.lemonfox.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: fd,
    })
    if (!res.ok) throw new Error(`Lemonfox error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.text || '', language: data.language, duration: data.duration }
  }
}
