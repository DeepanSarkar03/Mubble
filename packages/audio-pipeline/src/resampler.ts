/**
 * Audio resampler for converting between sample rates.
 * Most microphones capture at 44.1kHz or 48kHz, but most STT models
 * expect 16kHz mono PCM audio. This module handles the conversion.
 */

export class AudioResampler {
  private readonly inputRate: number
  private readonly outputRate: number
  private readonly channels: number

  /**
   * Create a resampler.
   * @param inputRate Input sample rate (e.g., 48000)
   * @param outputRate Output sample rate (e.g., 16000)
   * @param channels Number of input channels (default: 1)
   */
  constructor(inputRate: number = 48000, outputRate: number = 16000, channels: number = 1) {
    this.inputRate = inputRate
    this.outputRate = outputRate
    this.channels = channels
  }

  /**
   * Resample 16-bit PCM audio buffer.
   * Uses linear interpolation for reasonable quality at low CPU cost.
   */
  resample(input: Buffer): Buffer {
    if (this.inputRate === this.outputRate && this.channels === 1) {
      return input // No conversion needed
    }

    // First, convert to mono if needed
    let monoInput = this.channels > 1 ? this.toMono(input) : input

    // If rates match after mono conversion, we're done
    if (this.inputRate === this.outputRate) {
      return monoInput
    }

    const ratio = this.inputRate / this.outputRate
    const inputSamples = monoInput.length / 2
    const outputSamples = Math.floor(inputSamples / ratio)
    const output = Buffer.alloc(outputSamples * 2)

    for (let i = 0; i < outputSamples; i++) {
      const srcIndex = i * ratio
      const srcIndexFloor = Math.floor(srcIndex)
      const fraction = srcIndex - srcIndexFloor

      // Linear interpolation between adjacent samples
      const s0 = srcIndexFloor < inputSamples ? monoInput.readInt16LE(srcIndexFloor * 2) : 0
      const s1 = srcIndexFloor + 1 < inputSamples ? monoInput.readInt16LE((srcIndexFloor + 1) * 2) : s0

      const interpolated = Math.round(s0 + (s1 - s0) * fraction)
      const clamped = Math.max(-32768, Math.min(32767, interpolated))
      output.writeInt16LE(clamped, i * 2)
    }

    return output
  }

  /**
   * Convert Float32Array (Web Audio API format) to 16-bit PCM Buffer.
   * Web Audio API provides audio data as Float32Array with values in [-1, 1].
   */
  float32ToInt16(float32Data: Float32Array): Buffer {
    const buffer = Buffer.alloc(float32Data.length * 2)
    for (let i = 0; i < float32Data.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Data[i]))
      const val = s < 0 ? s * 32768 : s * 32767
      buffer.writeInt16LE(Math.round(val), i * 2)
    }
    return buffer
  }

  /**
   * Convert 16-bit PCM Buffer to Float32Array.
   */
  int16ToFloat32(int16Data: Buffer): Float32Array {
    const samples = int16Data.length / 2
    const float32 = new Float32Array(samples)
    for (let i = 0; i < samples; i++) {
      float32[i] = int16Data.readInt16LE(i * 2) / 32768
    }
    return float32
  }

  /**
   * Convert multi-channel audio to mono by averaging channels.
   */
  private toMono(input: Buffer): Buffer {
    const bytesPerFrame = this.channels * 2 // 16-bit = 2 bytes per sample
    const frameCount = Math.floor(input.length / bytesPerFrame)
    const output = Buffer.alloc(frameCount * 2)

    for (let i = 0; i < frameCount; i++) {
      let sum = 0
      for (let ch = 0; ch < this.channels; ch++) {
        sum += input.readInt16LE(i * bytesPerFrame + ch * 2)
      }
      const avg = Math.round(sum / this.channels)
      output.writeInt16LE(Math.max(-32768, Math.min(32767, avg)), i * 2)
    }

    return output
  }

  /**
   * Create a WAV header for the given PCM data.
   * Useful for providers that expect WAV format instead of raw PCM.
   */
  static createWavHeader(pcmData: Buffer, sampleRate: number = 16000, bitsPerSample: number = 16, channels: number = 1): Buffer {
    const dataSize = pcmData.length
    const header = Buffer.alloc(44)

    // RIFF header
    header.write('RIFF', 0)
    header.writeUInt32LE(36 + dataSize, 4)
    header.write('WAVE', 8)

    // fmt sub-chunk
    header.write('fmt ', 12)
    header.writeUInt32LE(16, 16) // sub-chunk size
    header.writeUInt16LE(1, 20) // PCM format
    header.writeUInt16LE(channels, 22)
    header.writeUInt32LE(sampleRate, 24)
    header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28) // byte rate
    header.writeUInt16LE(channels * bitsPerSample / 8, 32) // block align
    header.writeUInt16LE(bitsPerSample, 34)

    // data sub-chunk
    header.write('data', 36)
    header.writeUInt32LE(dataSize, 40)

    return Buffer.concat([header, pcmData])
  }
}
