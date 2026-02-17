import { useState, useEffect } from 'react'
import { Mic, Monitor, Volume2, Activity } from 'lucide-react'
import type { AudioDevice } from '@mubble/shared'
import { Animated, StaggerContainer, Card, Waveform } from '../../components/ui'

export default function MicrophoneSettings() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    loadDevices()
    const interval = setInterval(() => {
      window.mubble.audio.onLevel(setAudioLevel)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const loadDevices = async () => {
    const devs = await window.mubble.audio.getDevices()
    setDevices(devs)
    if (devs.length > 0 && !selectedDevice) {
      setSelectedDevice(devs[0].deviceId)
    }
  }

  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId)
    await window.mubble.audio.setDevice(deviceId)
  }

  return (
    <div className="space-y-6">
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-lg font-semibold text-mubble-text">Microphone</h2>
          <p className="mt-1 text-sm text-mubble-text-muted">
            Select and test your audio input device
          </p>
        </div>
      </Animated>

      {/* Audio level indicator */}
      <Animated animation="fade-in-up" delay={50}>
        <Card 
          padding="lg" 
          className={`
            transition-all duration-300
            ${isTesting ? 'border-mubble-primary/50 bg-mubble-primary/5' : ''}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mubble-primary/10 text-mubble-primary">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-mubble-text">Input Level</h3>
                <p className="text-xs text-mubble-text-muted">
                  Test your microphone
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTesting(!isTesting)}
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium
                transition-all duration-200
                ${isTesting
                  ? 'bg-mubble-primary text-white shadow-lg shadow-mubble-primary/30'
                  : 'bg-mubble-surface text-mubble-text-secondary hover:bg-mubble-surface-hover'
                }
              `}
            >
              {isTesting ? 'Stop Test' : 'Start Test'}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <Waveform
              bars={20}
              isActive={isTesting}
              color="#6366f1"
              height={40}
              className="flex-1"
            />
            <div className="w-12 text-right">
              <span className="text-xs text-mubble-text-muted tabular-nums">
                {Math.round(audioLevel * 100)}%
              </span>
            </div>
          </div>
        </Card>
      </Animated>

      {/* Device selection */}
      <Animated animation="fade-in-up" delay={100}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-mubble-text">Input Device</h3>
              <p className="text-xs text-mubble-text-muted">
                Choose your microphone
              </p>
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
                  className={`
                    w-full flex items-center justify-between rounded-lg border px-3 py-2.5
                    transition-all duration-200
                    ${selectedDevice === device.deviceId
                      ? 'border-mubble-primary bg-mubble-primary/10 text-mubble-text'
                      : 'border-mubble-border bg-mubble-bg text-mubble-text-secondary hover:border-mubble-primary/30 hover:bg-mubble-surface'
                    }
                  `}
                >
                  <span className="text-sm">{device.label}</span>
                  {device.isDefault && (
                    <span className="text-[10px] text-mubble-text-muted">Default</span>
                  )}
                </button>
              ))
            )}
          </div>
        </Card>
      </Animated>

      {/* Audio quality */}
      <Animated animation="fade-in-up" delay={150}>
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-mubble-text">Audio Quality</h3>
              <p className="text-xs text-mubble-text-muted">
                Configure recording settings
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-mubble-text-muted">Sample Rate</label>
              <select
                className="
                  w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                  text-sm text-mubble-text outline-none transition-all
                  focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                "
                defaultValue="48000"
              >
                <option value="44100">44.1 kHz (CD Quality)</option>
                <option value="48000">48 kHz (Standard)</option>
                <option value="96000">96 kHz (High Quality)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-mubble-text-muted">Format</label>
              <select
                className="
                  w-full rounded-lg border border-mubble-border bg-mubble-bg px-3 py-2 
                  text-sm text-mubble-text outline-none transition-all
                  focus:border-mubble-primary focus:ring-2 focus:ring-mubble-primary/20
                "
                defaultValue="pcm16"
              >
                <option value="pcm16">PCM 16-bit</option>
                <option value="pcm24">PCM 24-bit</option>
                <option value="float32">Float 32-bit</option>
              </select>
            </div>
          </div>

          <p className="mt-3 text-[10px] text-mubble-text-muted">
            Note: Audio quality settings are not yet implemented.
          </p>
        </Card>
      </Animated>
    </div>
  )
}
