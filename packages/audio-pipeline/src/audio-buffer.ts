/**
 * Ring buffer for audio data.
 * Efficiently stores and retrieves audio chunks with a fixed maximum size.
 * Used to accumulate microphone input before sending to STT.
 */

export class AudioRingBuffer {
  private buffer: Buffer
  private writePos = 0
  private readPos = 0
  private _length = 0
  private readonly capacity: number

  /**
   * Create a new ring buffer.
   * @param capacityBytes Maximum buffer size in bytes (default: 5MB ≈ ~80 seconds of 16kHz 16-bit PCM)
   */
  constructor(capacityBytes: number = 5 * 1024 * 1024) {
    this.capacity = capacityBytes
    this.buffer = Buffer.alloc(capacityBytes)
  }

  /** Current amount of data stored (bytes) */
  get length(): number {
    return this._length
  }

  /** Whether the buffer has any data */
  get isEmpty(): boolean {
    return this._length === 0
  }

  /** Whether the buffer is full */
  get isFull(): boolean {
    return this._length === this.capacity
  }

  /** Write audio data into the buffer */
  write(data: Buffer): void {
    const len = data.length
    if (len > this.capacity) {
      // If data is larger than buffer, keep only the tail
      data.copy(this.buffer, 0, len - this.capacity)
      this.writePos = 0
      this.readPos = 0
      this._length = this.capacity
      return
    }

    // Check if writing wraps around
    const remaining = this.capacity - this.writePos
    if (len <= remaining) {
      data.copy(this.buffer, this.writePos)
    } else {
      data.copy(this.buffer, this.writePos, 0, remaining)
      data.copy(this.buffer, 0, remaining)
    }

    this.writePos = (this.writePos + len) % this.capacity
    this._length = Math.min(this._length + len, this.capacity)

    // Advance read position if buffer was full
    if (this._length === this.capacity) {
      this.readPos = this.writePos
    }
  }

  /** Read all available data from the buffer */
  read(): Buffer {
    if (this._length === 0) return Buffer.alloc(0)

    const result = Buffer.alloc(this._length)

    if (this.readPos + this._length <= this.capacity) {
      this.buffer.copy(result, 0, this.readPos, this.readPos + this._length)
    } else {
      const firstPart = this.capacity - this.readPos
      this.buffer.copy(result, 0, this.readPos, this.capacity)
      this.buffer.copy(result, firstPart, 0, this._length - firstPart)
    }

    return result
  }

  /** Read all data and clear the buffer */
  drain(): Buffer {
    const data = this.read()
    this.clear()
    return data
  }

  /** Clear all data */
  clear(): void {
    this.writePos = 0
    this.readPos = 0
    this._length = 0
  }

  /** Get duration of stored audio in seconds (assumes 16kHz 16-bit mono PCM) */
  getDurationSeconds(sampleRate = 16000, bytesPerSample = 2, channels = 1): number {
    return this._length / (sampleRate * bytesPerSample * channels)
  }
}

/**
 * Simple accumulating buffer that grows dynamically.
 * Used when you need to collect all audio without a size limit.
 */
export class AudioAccumulator {
  private chunks: Buffer[] = []
  private _totalBytes = 0

  get length(): number {
    return this._totalBytes
  }

  get isEmpty(): boolean {
    return this._totalBytes === 0
  }

  write(data: Buffer): void {
    this.chunks.push(Buffer.from(data))
    this._totalBytes += data.length
  }

  /** Concatenate all chunks into a single buffer */
  toBuffer(): Buffer {
    return Buffer.concat(this.chunks, this._totalBytes)
  }

  /** Get all data and clear */
  drain(): Buffer {
    const buf = this.toBuffer()
    this.clear()
    return buf
  }

  clear(): void {
    this.chunks = []
    this._totalBytes = 0
  }

  getDurationSeconds(sampleRate = 16000, bytesPerSample = 2, channels = 1): number {
    return this._totalBytes / (sampleRate * bytesPerSample * channels)
  }
}
