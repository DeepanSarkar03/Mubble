import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class JigsawStackProvider implements STTProvider {
  readonly id = 'jigsawstack'
  readonly name = 'JigsawStack'
  readonly description = 'AI-powered speech recognition via JigsawStack API'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = false
  readonly requiresApiKey = true
  readonly website = 'https://jigsawstack.com'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const mime: Record<string, string> = {
      wav: 'audio/wav', mp3: 'audio/mpeg', webm: 'audio/webm', ogg: 'audio/ogg',
    }

    const res = await fetch('https://api.jigsawstack.com/v1/ai/transcribe', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey!,
        'Content-Type': mime[format] || 'audio/wav',
      },
      body: audio,
    })
    if (!res.ok) throw new Error(`JigsawStack error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.text || data.transcription || '' }
  }
}
