import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class OpenAIWhisperProvider implements STTProvider {
  readonly id = 'openai-whisper'
  readonly name = 'OpenAI Whisper'
  readonly description = 'High-quality speech-to-text via OpenAI API'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'webm']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://platform.openai.com'
  readonly defaultModel = 'whisper-1'
  readonly models = ['whisper-1']

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${config.apiKey}` } })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch { return { valid: false, error: 'Connection failed' } }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const blob = new Blob([new Uint8Array(audio)], { type: `audio/${format}` })
    const formData = new FormData()
    formData.append('file', blob, `audio.${format}`)
    formData.append('model', config.model || 'whisper-1')
    if (config.language && config.language !== 'auto') formData.append('language', config.language)
    formData.append('response_format', 'verbose_json')
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body: formData,
    })
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.text, language: data.language, duration: data.duration,
      segments: data.segments?.map((s: any) => ({ text: s.text, start: s.start, end: s.end })) }
  }
}
