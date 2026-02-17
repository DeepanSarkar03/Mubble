import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { DictationState } from '@mubble/shared'
import { Animated, Waveform, FloatingElement } from '../../components/ui'

export default function FlowBarView() {
  const [state, setState] = useState<DictationState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const unsubState = window.mubble.dictation.onStateChanged(setState)
    const unsubLevel = window.mubble.audio.onLevel(setAudioLevel)
    const unsubTranscript = window.mubble.dictation.onTranscript(
      (text, isFinal) => {
        if (isFinal) {
          setTranscript('')
        } else {
          setTranscript(text)
        }
      }
    )
    return () => {
      unsubState()
      unsubLevel()
      unsubTranscript()
    }
  }, [])

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const isInjecting = state === 'injecting'

  const getStatusText = () => {
    if (isInjecting) return 'Injecting...'
    if (isProcessing) return 'Processing...'
    if (isRecording) return 'Recording'
    return 'Ready'
  }

  return (
    <div className="flex h-full select-none items-center justify-center px-4">
      <Animated animation="scale-in" duration={300}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            relative flex items-center gap-3 rounded-full border px-4 py-2.5
            backdrop-blur-xl transition-all duration-300
            ${isRecording
              ? 'border-violet-500/50 bg-black/80 shadow-[0_0_40px_rgba(139,92,246,0.4)]'
              : 'border-white/10 bg-black/60 hover:border-white/20 hover:bg-black/70'
            }
            ${isHovered && !isRecording ? 'scale-105' : 'scale-100'}
          `}
        >
          {/* Recording glow effect */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-pulse-glow" />
              <div className="absolute -inset-2 rounded-full bg-violet-500/10 blur-xl animate-pulse-glow" />
            </>
          )}

          {/* Mic button */}
          <button
            onClick={() => {
              if (isRecording) {
                window.mubble.dictation.stop()
              } else {
                window.mubble.dictation.start('hands-free')
              }
            }}
            className={`
              relative flex h-8 w-8 items-center justify-center rounded-full 
              transition-all duration-200
              ${isRecording
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/50'
                : isProcessing || isInjecting
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-110'
              }
            `}
          >
            {/* Recording pulse rings */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full animate-ping bg-violet-400/40" />
                <span className="absolute inset-[-4px] rounded-full animate-ping bg-violet-400/20 delay-100" />
              </>
            )}
            
            {isProcessing || isInjecting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isRecording ? (
              <Mic size={14} />
            ) : (
              <MicOff size={14} />
            )}
          </button>

          {/* Waveform / Status */}
          <div className="flex items-center gap-2 relative z-10">
            {isRecording ? (
              <Waveform
                bars={8}
                isActive={isRecording}
                color="#8b5cf6"
                height={16}
                barWidth={2}
              />
            ) : (
              <span className={`
                text-xs font-medium transition-colors
                ${isProcessing || isInjecting ? 'text-amber-400' : 'text-neutral-500'}
              `}>
                {getStatusText()}
              </span>
            )}
          </div>

          {/* Transcript preview with fade */}
          {transcript && (
            <Animated animation="fade-in" duration={200}>
              <span className="max-w-[120px] truncate text-xs text-neutral-500 animate-pulse-soft">
                {transcript}
              </span>
            </Animated>
          )}

          {/* Status indicator dot */}
          {!isRecording && !isProcessing && !isInjecting && (
            <FloatingElement variant="pulse" duration={2}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </FloatingElement>
          )}
        </div>
      </Animated>
    </div>
  )
}
