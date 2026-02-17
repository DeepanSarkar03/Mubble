import type { STTProvider, STTProviderConfig, STTResult, AudioFormat, StreamHandle } from '../types'

export class GladiaProvider implements STTProvider {
  readonly id = 'gladia'
  readonly name = 'Gladia'
  readonly description = 'Enterprise speech-to-text with real-time streaming'
  readonly supportedFormats: AudioFormat[] = ['pcm16', 'wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = true
  readonly requiresApiKey = true
  readonly website = 'https://gladia.io'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const mime: Record<string, string> = {
      pcm16: 'audio/l16', wav: 'audio/wav', mp3: 'audio/mpeg', webm: 'audio/webm', ogg: 'audio/ogg',
    }

    // Step 1: Upload audio
    const uploadRes = await fetch('https://api.gladia.io/v2/upload', {
      method: 'POST',
      headers: {
        'x-gladia-key': config.apiKey!,
        'Content-Type': mime[format] || 'audio/wav',
      },
      body: audio,
    })
    if (!uploadRes.ok) throw new Error(`Gladia upload error: ${uploadRes.status}`)
    const { audio_url } = await uploadRes.json() as any

    // Step 2: Create transcription
    const transcriptRes = await fetch('https://api.gladia.io/v2/transcription', {
      method: 'POST',
      headers: {
        'x-gladia-key': config.apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url,
        language: config.language || 'en',
        enable_code_switching: false,
      }),
    })
    if (!transcriptRes.ok) throw new Error(`Gladia transcription error: ${transcriptRes.status}`)
    const { id, result_url } = await transcriptRes.json() as any

    // Step 3: Poll for result
    let result: any
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const pollRes = await fetch(result_url || `https://api.gladia.io/v2/transcription/${id}`, {
        headers: { 'x-gladia-key': config.apiKey! },
      })
      result = await pollRes.json() as any
      if (result.status === 'done') break
      if (result.status === 'error') throw new Error(`Gladia error: ${result.error_message}`)
    }

    if (result?.status !== 'done') throw new Error('Gladia: transcription timed out')
    const fullText = result.result?.transcription?.full_transcript || ''
    return { text: fullText }
  }

  startStream(
    config: STTProviderConfig,
    onPartial: (t: string) => void,
    onFinal: (r: STTResult) => void,
    onError: (e: Error) => void,
  ): StreamHandle {
    const WebSocket = require('ws')

    let ws: any

    // Gladia streaming requires an initial HTTP request to get the WebSocket URL
    const init = async () => {
      try {
        const res = await fetch('https://api.gladia.io/v2/live', {
          method: 'POST',
          headers: {
            'x-gladia-key': config.apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            encoding: 'wav/pcm',
            sample_rate: 16000,
            language: config.language || 'en',
          }),
        })
        if (!res.ok) throw new Error(`Gladia live init error: ${res.status}`)
        const { url } = await res.json() as any

        ws = new WebSocket(url)
        ws.on('message', (d: string) => {
          try {
            const msg = JSON.parse(d)
            if (msg.type === 'transcript' && msg.transcription) {
              if (msg.is_final) {
                onFinal({ text: msg.transcription, confidence: msg.confidence })
              } else {
                onPartial(msg.transcription)
              }
            }
          } catch (e) {
            onError(e as Error)
          }
        })
        ws.on('error', onError)
      } catch (e) {
        onError(e as Error)
      }
    }
    init()

    return {
      write: (chunk: Buffer) => {
        if (ws?.readyState === 1) ws.send(chunk)
      },
      end: () => {
        if (ws?.readyState === 1) ws.send(JSON.stringify({ type: 'stop' }))
      },
      abort: () => ws?.close(),
    }
  }
}
