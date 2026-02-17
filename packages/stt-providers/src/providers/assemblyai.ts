import type { STTProvider, STTProviderConfig, STTResult, AudioFormat, StreamHandle } from '../types'

export class AssemblyAIProvider implements STTProvider {
  readonly id = 'assemblyai'
  readonly name = 'AssemblyAI'
  readonly description = 'Best-in-class accuracy with real-time streaming support'
  readonly supportedFormats: AudioFormat[] = ['pcm16', 'wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = true
  readonly requiresApiKey = true
  readonly website = 'https://assemblyai.com'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', {
        headers: { authorization: config.apiKey },
      })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch {
      return { valid: false, error: 'Connection failed' }
    }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    // Step 1: Upload audio
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: config.apiKey!, 'Content-Type': 'application/octet-stream' },
      body: audio,
    })
    if (!uploadRes.ok) throw new Error(`AssemblyAI upload error: ${uploadRes.status}`)
    const { upload_url } = await uploadRes.json() as any

    // Step 2: Create transcription
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: config.apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: config.language || 'en',
        punctuate: true,
        format_text: true,
      }),
    })
    if (!transcriptRes.ok) throw new Error(`AssemblyAI transcription error: ${transcriptRes.status}`)
    const { id } = await transcriptRes.json() as any

    // Step 3: Poll for completion
    let result: any
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { authorization: config.apiKey! },
      })
      result = await pollRes.json() as any
      if (result.status === 'completed') break
      if (result.status === 'error') throw new Error(`AssemblyAI error: ${result.error}`)
    }

    if (result?.status !== 'completed') throw new Error('AssemblyAI: transcription timed out')
    return { text: result.text || '', confidence: result.confidence, duration: result.audio_duration }
  }

  startStream(
    config: STTProviderConfig,
    onPartial: (t: string) => void,
    onFinal: (r: STTResult) => void,
    onError: (e: Error) => void,
  ): StreamHandle {
    const WebSocket = require('ws')
    const ws = new WebSocket(
      `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&encoding=pcm_s16le`,
      { headers: { authorization: config.apiKey! } },
    )

    ws.on('message', (d: string) => {
      try {
        const msg = JSON.parse(d)
        if (msg.message_type === 'PartialTranscript' && msg.text) {
          onPartial(msg.text)
        } else if (msg.message_type === 'FinalTranscript' && msg.text) {
          onFinal({ text: msg.text, confidence: msg.confidence })
        }
      } catch (e) {
        onError(e as Error)
      }
    })
    ws.on('error', onError)

    return {
      write: (chunk: Buffer) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ audio_data: chunk.toString('base64') }))
        }
      },
      end: () => ws.send(JSON.stringify({ terminate_session: true })),
      abort: () => ws.close(),
    }
  }
}
