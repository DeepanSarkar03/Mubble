import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class GoogleCloudSpeechProvider implements STTProvider {
  readonly id = 'google-cloud-speech'
  readonly name = 'Google Cloud Speech'
  readonly description = 'Google Cloud Speech-to-Text with wide language support'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'ogg']
  readonly supportsStreaming = true
  readonly requiresApiKey = true
  readonly website = 'https://cloud.google.com/speech-to-text'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const encoding = format === 'wav' ? 'LINEAR16' : format === 'mp3' ? 'MP3' : 'OGG_OPUS'
    const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${config.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { encoding, sampleRateHertz: 16000, languageCode: config.language || 'en-US', enableAutomaticPunctuation: true }, audio: { content: audio.toString('base64') } }),
    })
    if (!res.ok) throw new Error(`Google Cloud Speech error: ${res.status}`)
    const data = await res.json() as any
    const r = data.results?.[0]?.alternatives?.[0]
    return { text: r?.transcript || '', confidence: r?.confidence }
  }
}
