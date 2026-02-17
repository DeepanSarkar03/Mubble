import { useState, useEffect } from 'react'
import { SUPPORTED_LANGUAGES } from '@mubble/shared'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'
import { Globe, Layout, Cpu, Check } from 'lucide-react'

export default function GeneralSettings() {
  const [language, setLanguage] = useState('auto')
  const [autoDetect, setAutoDetect] = useState(true)
  const [showFlowBar, setShowFlowBar] = useState(true)
  const [launchAtStartup, setLaunchAtStartup] = useState(false)
  const [enableAICleanup, setEnableAICleanup] = useState(true)

  useEffect(() => {
    window.mubble.settings.getAll().then((settings) => {
      if (settings.language) setLanguage(settings.language)
      if (settings.autoDetectLanguage !== undefined) setAutoDetect(settings.autoDetectLanguage)
      if (settings.showFlowBar !== undefined) setShowFlowBar(settings.showFlowBar)
      if (settings.launchAtStartup !== undefined) setLaunchAtStartup(settings.launchAtStartup)
      if (settings.enableAICleanup !== undefined) setEnableAICleanup(settings.enableAICleanup)
    })
  }, [])

  const updateSetting = <T,>(key: string, value: T, setter: (v: T) => void) => {
    setter(value)
    window.mubble.settings.set(key as any, value as any)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-2xl font-semibold text-white">General</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Core application settings
          </p>
        </div>
      </Animated>

      <StaggerContainer staggerDelay={60} initialDelay={100} animation="fade-in-up">
        {/* Language */}
        <Card gradient padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-300">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Language</h3>
              <p className="text-xs text-neutral-500">
                Configure your dictation language preferences
              </p>
            </div>
          </div>
          
          <div className="space-y-4 pl-13">
            <div>
              <label className="mb-2 block text-xs font-medium text-neutral-400">
                Dictation Language
              </label>
              <select
                value={language}
                onChange={(e) => updateSetting('language', e.target.value, setLanguage)}
                className="
                  w-full max-w-xs rounded-xl border border-white/10 bg-white/5 
                  px-3 py-2.5 text-sm text-white outline-none 
                  transition-all duration-200
                  focus:border-white/20 focus:bg-white/10
                "
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-neutral-900">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <Toggle
              label="Auto-detect language"
              description="Automatically detect the language you're speaking"
              checked={autoDetect}
              onChange={(v) => updateSetting('autoDetectLanguage', v, setAutoDetect)}
            />
          </div>
        </Card>

        {/* UI */}
        <Card gradient padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-300">
              <Layout size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Interface</h3>
              <p className="text-xs text-neutral-500">
                Customize the application appearance
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pl-13">
            <Toggle
              label="Show Flow Bar"
              description="Floating toolbar with mic status and waveform"
              checked={showFlowBar}
              onChange={(v) => {
                updateSetting('showFlowBar', v, setShowFlowBar)
                window.mubble.window.toggleFlowBar()
              }}
            />
            <Toggle
              label="Launch at startup"
              description="Start Mubble when you log in"
              checked={launchAtStartup}
              onChange={(v) => updateSetting('launchAtStartup', v, setLaunchAtStartup)}
            />
          </div>
        </Card>

        {/* AI */}
        <Card gradient padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-300">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">AI Processing</h3>
              <p className="text-xs text-neutral-500">
                Configure AI-powered text improvements
              </p>
            </div>
          </div>
          
          <div className="pl-13">
            <Toggle
              label="Enable AI cleanup"
              description="Remove filler words, fix punctuation, and format text using your LLM provider"
              checked={enableAICleanup}
              onChange={(v) => updateSetting('enableAICleanup', v, setEnableAICleanup)}
            />
          </div>
        </Card>
      </StaggerContainer>
    </div>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="group flex cursor-pointer items-center justify-between rounded-xl p-2 transition-colors hover:bg-white/5">
      <div>
        <span className="text-sm text-neutral-300">{label}</span>
        {description && (
          <p className="text-xs text-neutral-500">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full 
          transition-all duration-300
          ${checked ? 'bg-white' : 'bg-white/10'}
        `}
      >
        <span
          className={`
            inline-flex h-4 w-4 items-center justify-center rounded-full 
            transition-all duration-300
            ${checked ? 'translate-x-6 bg-black' : 'translate-x-1 bg-neutral-400'}
          `}
        >
          {checked && <Check size={10} className="text-white" />}
        </span>
      </button>
    </label>
  )
}
