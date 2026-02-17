import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

/**
 * Local Whisper provider using whisper.cpp via native Node addon.
 * Requires @kutalia/whisper-node-addon to be installed separately.
 * Models must be downloaded to the local resources directory.
 *
 * This provider runs entirely offline — no API key required.
 */
export class LocalWhisperProvider implements STTProvider {
  readonly id = 'local-whisper'
  readonly name = 'Local Whisper (Offline)'
  readonly description = 'Run Whisper locally via whisper.cpp — fully offline, no API key needed'
  readonly supportedFormats: AudioFormat[] = ['wav', 'pcm16']
  readonly supportsStreaming = false
  readonly requiresApiKey = false
  readonly website = 'https://github.com/ggerganov/whisper.cpp'
  readonly defaultModel = 'base'
  readonly models = ['tiny', 'base', 'small', 'medium', 'large-v3']

  private whisper: any = null

  async validate(config: STTProviderConfig) {
    try {
      const modelPath = this.getModelPath(config.model || 'base')
      const fs = require('fs')
      if (!fs.existsSync(modelPath)) {
        return {
          valid: false,
          error: `Model file not found at ${modelPath}. Download it from https://huggingface.co/ggerganov/whisper.cpp/tree/main`,
        }
      }
      return { valid: true }
    } catch (e: any) {
      return { valid: false, error: `Validation failed: ${e.message}` }
    }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const whisperAddon = this.getWhisperAddon()
    const modelPath = this.getModelPath(config.model || 'base')

    // Ensure audio is 16-bit PCM at 16kHz (wav files must be pre-converted)
    const samples = this.bufferToFloat32(audio, format)

    const result = await new Promise<any>((resolve, reject) => {
      try {
        whisperAddon.whisper({
          language: config.language || 'en',
          model: modelPath,
          fname_inp: '', // unused when passing PCM directly
          pcmf32: samples,
          no_timestamps: true,
          use_gpu: true,
        }, (err: Error | null, result: any) => {
          if (err) reject(err)
          else resolve(result)
        })
      } catch (e) {
        reject(e)
      }
    })

    // whisper-node-addon returns an array of segments
    const text = Array.isArray(result)
      ? result.map((s: any) => s.speech || s.text || s[2] || '').join(' ').trim()
      : typeof result === 'string'
        ? result
        : ''

    return { text }
  }

  private getWhisperAddon() {
    if (!this.whisper) {
      try {
        this.whisper = require('@kutalia/whisper-node-addon')
      } catch {
        throw new Error(
          'Local Whisper requires @kutalia/whisper-node-addon. Install it with: npm install @kutalia/whisper-node-addon',
        )
      }
    }
    return this.whisper
  }

  private getModelPath(model: string): string {
    const path = require('path')
    const { app } = require('electron')

    const modelsDir = path.join(
      app?.getPath?.('userData') || path.join(require('os').homedir(), '.mubble'),
      'models',
    )
    return path.join(modelsDir, `ggml-${model}.bin`)
  }

  private bufferToFloat32(audio: Buffer, format: AudioFormat): Float32Array {
    if (format === 'pcm16' || format === 'wav') {
      // For WAV, skip the 44-byte header
      const offset = format === 'wav' ? 44 : 0
      const pcmData = audio.subarray(offset)
      const samples = new Float32Array(pcmData.length / 2)
      for (let i = 0; i < samples.length; i++) {
        samples[i] = pcmData.readInt16LE(i * 2) / 32768
      }
      return samples
    }
    throw new Error('Local Whisper only supports PCM16 and WAV formats. Convert audio before transcribing.')
  }
}
