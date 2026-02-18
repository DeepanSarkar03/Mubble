import { useEffect, useState } from 'react'
import { Download, RefreshCw, X } from 'lucide-react'

type UpdateState =
  | { phase: 'idle' }
  | { phase: 'available'; version: string }
  | { phase: 'downloading'; percent: number }
  | { phase: 'ready'; version: string }
  | { phase: 'error'; message: string }

/**
 * Slim banner that sits at the very top of the app (below the drag region).
 * Appears only when an update is detected.
 *
 * Phases:
 *  available   → "Downloading Mubble vX…" + progress bar
 *  ready       → "Mubble vX is ready – Restart to update" + button
 *  error       → subtle error message (dismissible)
 */
export default function UpdateBanner() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle' })

  useEffect(() => {
    const unsubs: Array<() => void> = []

    unsubs.push(
      window.mubble.updates.onUpdateAvailable(({ version }) => {
        setState({ phase: 'available', version })
      })
    )

    unsubs.push(
      window.mubble.updates.onProgress(({ percent }) => {
        setState((prev) => {
          if (prev.phase === 'available' || prev.phase === 'downloading') {
            return { phase: 'downloading', percent }
          }
          return prev
        })
      })
    )

    unsubs.push(
      window.mubble.updates.onUpdateDownloaded(({ version }) => {
        setState({ phase: 'ready', version })
      })
    )

    unsubs.push(
      window.mubble.updates.onError((message) => {
        // Only surface the error if we were in the middle of an update
        setState((prev) =>
          prev.phase !== 'idle' ? { phase: 'error', message } : prev
        )
      })
    )

    return () => unsubs.forEach((fn) => fn())
  }, [])

  if (state.phase === 'idle') return null

  return (
    <div
      className={`w-full px-4 py-1.5 flex items-center gap-3 text-xs transition-all duration-300 ${
        state.phase === 'error'
          ? 'bg-red-500/10 border-b border-red-500/20 text-red-400'
          : 'bg-violet-500/10 border-b border-violet-500/20 text-violet-300'
      }`}
    >
      {/* Icon */}
      <span className="shrink-0">
        {state.phase === 'ready' ? (
          <RefreshCw size={12} className="text-violet-400" />
        ) : (
          <Download size={12} className={state.phase === 'error' ? 'text-red-400' : 'text-violet-400 animate-bounce'} />
        )}
      </span>

      {/* Message */}
      <span className="flex-1 truncate">
        {state.phase === 'available' && `Downloading Mubble v${state.version}…`}
        {state.phase === 'downloading' && (
          <>
            Downloading update&nbsp;
            <span className="font-medium text-violet-200">{state.percent}%</span>
          </>
        )}
        {state.phase === 'ready' && (
          <>
            Mubble <span className="font-medium text-white">v{state.version}</span> is ready —
          </>
        )}
        {state.phase === 'error' && `Update error: ${state.message}`}
      </span>

      {/* Download progress bar (inline) */}
      {state.phase === 'downloading' && (
        <div className="shrink-0 w-24 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${state.percent}%` }}
          />
        </div>
      )}

      {/* Restart button (when ready) */}
      {state.phase === 'ready' && (
        <button
          onClick={() => window.mubble.updates.install()}
          className="shrink-0 rounded-md bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 px-2.5 py-0.5 text-violet-200 hover:text-white transition-all duration-150"
        >
          Restart now
        </button>
      )}

      {/* Dismiss (errors only) */}
      {state.phase === 'error' && (
        <button
          onClick={() => setState({ phase: 'idle' })}
          className="shrink-0 rounded-md p-0.5 text-red-400/60 hover:text-red-400 transition-colors"
          aria-label="Dismiss"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
