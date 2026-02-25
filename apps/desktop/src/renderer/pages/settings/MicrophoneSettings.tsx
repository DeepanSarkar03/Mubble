import { useState, useEffect } from 'react'
import { Mic, Volume2, Activity } from 'lucide-react'
import type { AudioDevice } from '@mubble/shared'
import { Animated, Card, Waveform } from '../../components/ui'

export default function MicrophoneSettings() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isTesting, setIsTesting] = useState(false)
  const [sampleRate, setSampleRate] = useState(48000)
  const [format, setFormat] = useState<'pcm16' | 'pcm24' | 'float32'>('pcm16')

  useEffect(() => {
    const load = async () => {
      const [devs, savedDevice, savedSampleRate, savedFormat] = await Promise.all([
        window.mubble.audio.getDevices(),
        window.mubble.settings.get('microphoneDeviceId'),
        window.mubble.settings.get('audioSampleRate'),
        window.mubble.settings.get('audioFormat'),
      ])

      setDevices(devs)
      setSelectedDevice((savedDevice as string) || devs[0]?.deviceId || '')
      setSampleRate((savedSampleRate as number) || 48000)
      setFormat(((savedFormat as 'pcm16' | 'pcm24' | 'float32') || 'pcm16'))
    }

    void load()
  }, [])

  useEffect(() => {
    if (!isTesting) return
    const unsubscribe = window.mubble.audio.onLevel(setAudioLevel)
    return unsubscribe
  }, [isTesting])

  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    await Promise.all([
      window.mubble.audio.setDevice(deviceId),
      window.mubble.settings.set('microphoneDeviceId', deviceId),
    ])
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Microphone</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">Select and test your audio input device</p>
        </div>
      </Animated>

      <Animated animation="fade-in-up" delay={50}>
        <Card padding="lg" className={`${isTesting ? 'border-mubble-primary/50 bg-mubble-primary/5' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mubble-primary/10 text-mubble-primary">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-mubble-text">Input Level</h3>
                <p className="text-xs text-mubble-text-muted">Run a live mic-level monitor while dictating.</p>
              </div>
            </div>
            <button
              onClick={() => setIsTesting(!isTesting)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                isTesting
                  ? 'bg-mubble-primary text-white shadow-lg shadow-mubble-primary/30'
                  : 'bg-mubble-surface text-mubble-text-secondary hover:bg-mubble-surface-hover'
              }`}
            >
              {isTesting ? 'Stop Test' : 'Start Test'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Waveform bars={20} isActive={isTesting} color="#6366f1" height={40} className="flex-1" />
            <div className="w-12 text-right">
              <span className="tabular-nums text-xs text-mubble-text-muted">{Math.round(audioLevel * 100)}%</span>
            </div>
          </div>
        </Card>
      </Animated>

      <Animated animation="fade-in-up" delay={100}>
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-mubble-text">Input Device</h3>
              <p className="text-xs text-mubble-text-muted">Choose your microphone</p>
            </div>
          </div>

          <div className="space-y-2">
            {devices.length === 0 ? (
              <div className="rounded-lg border border-mubble-border bg-mubble-bg p-4 text-center">
                <p className="text-sm text-mubble-text-muted">No microphones detected</p>
              </div>
            ) : (
              devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => handleSelectDevice(device.deviceId)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all duration-200 ${
                    selectedDevice === device.deviceId
                      ? 'border-mubble-primary bg-mubble-primary/10 text-mubble-text'
                      : 'border-mubble-border bg-mubble-bg text-mubble-text-secondary hover:border-mubble-primary/30 hover:bg-mubble-surface'
                  }`}
                >
                  <span className="text-sm">{device.label}</span>
                  {device.isDefault && <span className="text-[10px] text-mubble-text-muted">Default</span>}
                </button>
              ))
            )}
          </div>
        </Card>
      </Animated>

      <Animated animation="fade-in-up" delay={150}>
        <Card padding="lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-mubble-text">Audio Quality</h3>
              <p className="text-xs text-mubble-text-muted">Persisted and used for new recordings.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-mubble-text-muted">Sample Rate</label>
              <select
                className="w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 text-sm text-mubble-text outline-none transition-all focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20"
                value={sampleRate}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setSampleRate(next)
                  window.mubble.settings.set('audioSampleRate', next)
                }}
              >
                <option value={16000}>16 kHz (Speech optimized)</option>
                <option value={44100}>44.1 kHz (CD quality)</option>
                <option value={48000}>48 kHz (Standard)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-mubble-text-muted">Format</label>
              <select
                className="w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 text-sm text-mubble-text outline-none transition-all focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20"
                value={format}
                onChange={(e) => {
                  const next = e.target.value as 'pcm16' | 'pcm24' | 'float32'
                  setFormat(next)
                  window.mubble.settings.set('audioFormat', next)
                }}
              >
                <option value="pcm16">PCM 16-bit</option>
                <option value="pcm24">PCM 24-bit</option>
                <option value="float32">Float 32-bit</option>
              </select>
            </div>
          </div>
        </Card>
      </Animated>
    </div>
  )
}
