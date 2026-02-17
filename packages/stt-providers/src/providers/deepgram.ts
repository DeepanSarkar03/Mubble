import type { STTProvider, STTProviderConfig, STTResult, AudioFormat, StreamHandle } from '../types'

export class DeepgramProvider implements STTProvider {
  readonly id = 'deepgram'
  readonly name = 'Deepgram'
  readonly description = 'Fast real-time streaming STT with excellent latency'
  readonly supportedFormats: AudioFormat[] = ['pcm16', 'wav', 'mp3', 'webm', 'ogg']
  readonly supportsStreaming = true
  readonly requiresApiKey = true
  readonly website = 'https://deepgram.com'
  readonly defaultModel = 'nova-2'
  readonly models = ['nova-2', 'nova', 'enhanced', 'base']

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    try {
      const res = await fetch('https://api.deepgram.com/v1/projects', { headers: { Authorization: `Token ${config.apiKey}` } })
      return { valid: res.ok, error: res.ok ? undefined : 'Invalid API key' }
    } catch { return { valid: false, error: 'Connection failed' } }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const mime: Record<string, string> = { pcm16: 'audio/l16;rate=16000', wav: 'audio/wav', mp3: 'audio/mpeg', webm: 'audio/webm', ogg: 'audio/ogg' }
    const res = await fetch(`https://api.deepgram.com/v1/listen?model=${config.model || 'nova-2'}&language=${config.language || 'en'}&smart_format=true`, {
      method: 'POST', headers: { Authorization: `Token ${config.apiKey}`, 'Content-Type': mime[format] || 'audio/wav' }, body: audio,
    })
    if (!res.ok) throw new Error(`Deepgram error: ${res.status}`)
    const data = await res.json() as any
    const alt = data.results?.channels?.[0]?.alternatives?.[0]
    return { text: alt?.transcript || '', confidence: alt?.confidence }
  }

  startStream(config: STTProviderConfig, onPartial: (t: string) => void, onFinal: (r: STTResult) => void, onError: (e: Error) => void): StreamHandle {
    const WebSocket = require('ws')
    const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?model=${config.model || 'nova-2'}&language=${config.language || 'en'}&interim_results=true`, {
      headers: { Authorization: `Token ${config.apiKey}` },
    })
    ws.on('message', (d: string) => { try { const m = JSON.parse(d); const a = m.channel?.alternatives?.[0]; if (!a) return; m.is_final ? onFinal({ text: a.transcript, confidence: a.confidence }) : onPartial(a.transcript) } catch (e) { onError(e as Error) } })
    ws.on('error', onError)
    return { write: (c: Buffer) => { if (ws.readyState === 1) ws.send(c) }, end: () => ws.send(JSON.stringify({ type: 'CloseStream' })), abort: () => ws.close() }
  }
}
