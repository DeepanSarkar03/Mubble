import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import {
  Settings,
  Mic,
  Brain,
  BookOpen,
  MessageSquare,
  Volume2,
  Keyboard,
  Monitor,
  Palette,
  ChevronRight,
} from 'lucide-react'
import { Animated, StaggerContainer } from '../../components/ui'
import GeneralSettings from './GeneralSettings'
import STTProviderSettings from './STTProviderSettings'
import LLMProviderSettings from './LLMProviderSettings'
import DictionarySettings from './DictionarySettings'
import SnippetsSettings from './SnippetsSettings'
import SoundSettings from './SoundSettings'
import ShortcutSettings from './ShortcutSettings'
import MicrophoneSettings from './MicrophoneSettings'
import StyleSettings from './StyleSettings'

const settingsNav = [
  { to: '/settings/general', icon: Settings, label: 'General' },
  { to: '/settings/stt-providers', icon: Mic, label: 'STT Providers' },
  { to: '/settings/llm-providers', icon: Brain, label: 'LLM Providers' },
  { to: '/settings/shortcuts', icon: Keyboard, label: 'Shortcuts' },
  { to: '/settings/microphone', icon: Monitor, label: 'Microphone' },
  { to: '/settings/sounds', icon: Volume2, label: 'Sounds' },
  { to: '/settings/dictionary', icon: BookOpen, label: 'Dictionary' },
  { to: '/settings/snippets', icon: MessageSquare, label: 'Snippets' },
  { to: '/settings/styles', icon: Palette, label: 'Styles' },
]

export default function SettingsPage() {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="flex h-full">
      {/* Settings sidebar - Minimal dark */}
      <Animated animation="fade-in-left" duration={250}>
        <nav className="w-52 flex-shrink-0 border-r border-white/5 bg-[#0a0a0a] p-4">
          <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Settings
          </h2>
          <StaggerContainer staggerDelay={30} animation="fade-in-left">
            <div className="flex flex-col gap-0.5">
              {settingsNav.map(({ to, icon: Icon, label }) => {
                const isActive = currentPath === to || currentPath.startsWith(`${to}/`)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`
                      group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm 
                      transition-all duration-200
                      ${isActive
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-black' : 'text-neutral-500 group-hover:text-neutral-300'} />
                      <span>{label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-black" />}
                  </NavLink>
                )
              })}
            </div>
          </StaggerContainer>
        </nav>
      </Animated>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
        <Animated 
          animation="fade-in-up" 
          duration={250}
          key={currentPath}
        >
          <Routes>
            <Route path="general" element={<GeneralSettings />} />
            <Route path="stt-providers" element={<STTProviderSettings />} />
            <Route path="llm-providers" element={<LLMProviderSettings />} />
            <Route path="shortcuts" element={<ShortcutSettings />} />
            <Route path="microphone" element={<MicrophoneSettings />} />
            <Route path="sounds" element={<SoundSettings />} />
            <Route path="dictionary" element={<DictionarySettings />} />
            <Route path="snippets" element={<SnippetsSettings />} />
            <Route path="styles" element={<StyleSettings />} />
            <Route path="*" element={<Navigate to="general" replace />} />
          </Routes>
        </Animated>
      </div>
    </div>
  )
}
