import { useState, useEffect } from 'react'
import { Check, ExternalLink, Loader2, Eye, EyeOff, Brain } from 'lucide-react'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

interface LLMProviderDef {
  id: string
  name: string
  description: string
  website: string
  models: string[]
  defaultModel: string
}

const LLM_PROVIDERS: LLMProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for text cleanup and formatting',
    website: 'https://platform.openai.com',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models with excellent text refinement',
    website: 'https://console.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-3-5-haiku-20241022',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Gemini models for text processing',
    website: 'https://ai.google.dev',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-1.5-flash',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference for LLMs',
    website: 'https://groq.com',
    models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    defaultModel: 'llama-3.1-70b-versatile',
  },
]

export default function LLMProviderSettings() {
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [validating, setValidating] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<
    Record<string, { valid: boolean; error?: string }>
  >({})

  useEffect(() => {
    window.mubble.settings.get('activeLLMProvider').then((v) => {
      if (v) setActiveProvider(v)
    })
    LLM_PROVIDERS.forEach(async (p) => {
      const key = await window.mubble.apiKeys.get(`llm:${p.id}`)
      if (key) {
        setApiKeys((prev) => ({ ...prev, [p.id]: key }))
      }
    })
  }, [])

  const handleSetApiKey = async (providerId: string, key: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: key }))
    if (key) {
      await window.mubble.apiKeys.set(`llm:${providerId}`, key)
    } else {
      await window.mubble.apiKeys.delete(`llm:${providerId}`)
    }
  }

  const handleValidate = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key) return
    setValidating(providerId)
    try {
      const result = await window.mubble.llm.validateKey(providerId, key)
      setValidationResults((prev) => ({ ...prev, [providerId]: result }))
    } catch {
      setValidationResults((prev) => ({
        ...prev,
        [providerId]: { valid: false, error: 'Validation failed' },
      }))
    } finally {
      setValidating(null)
    }
  }

  const handleSelectProvider = async (providerId: string) => {
    setActiveProvider(providerId)
    await window.mubble.settings.set('activeLLMProvider', providerId)
  }

  const handleDisableProvider = async () => {
    setActiveProvider(null)
    await window.mubble.settings.set('activeLLMProvider', null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-2xl font-semibold text-white">LLM Providers</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Configure AI providers for text cleanup
          </p>
        </div>
      </Animated>

      {/* Disable AI option */}
      <Animated animation="fade-in-up" delay={50}>
        <Card
          gradient
          padding="md"
          onClick={handleDisableProvider}
          className={`
            cursor-pointer transition-all duration-200
            ${!activeProvider ? 'border-violet-500/30' : 'hover:border-white/10'}
          `}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Disable AI Processing</h3>
              <p className="text-xs text-neutral-500">Use raw transcriptions</p>
            </div>
            {!activeProvider && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                Selected
              </span>
            )}
          </div>
        </Card>
      </Animated>

      <div className="space-y-3">
        <StaggerContainer staggerDelay={40} initialDelay={100} animation="fade-in-up">
          {LLM_PROVIDERS.map((provider) => {
            const isActive = activeProvider === provider.id
            const hasKey = !!apiKeys[provider.id]
            const validation = validationResults[provider.id]

            return (
              <Card
                key={provider.id}
                gradient
                padding="lg"
                className={`
                  transition-all duration-300
                  ${isActive 
                    ? 'border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]' 
                    : 'border-white/5 hover:border-white/10'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">{provider.name}</h3>
                      {isActive && (
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">{provider.description}</p>
                  </div>
                  <button
                    onClick={() => window.mubble.platform.openExternal(provider.website)}
                    className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                {/* API Key input */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey[provider.id] ? 'text' : 'password'}
                      value={apiKeys[provider.id] || ''}
                      onChange={(e) => handleSetApiKey(provider.id, e.target.value)}
                      placeholder="Enter API key..."
                      className="
                        w-full rounded-xl border border-white/10 bg-white/5 
                        px-3 py-2 pr-8 font-mono text-xs text-white outline-none
                        transition-all duration-200 focus:border-white/20
                      "
                    />
                    <button
                      onClick={() => setShowKey((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showKey[provider.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                  <Button
                    onClick={() => handleValidate(provider.id)}
                    disabled={!hasKey || validating === provider.id}
                    variant="outline"
                    size="sm"
                    loading={validating === provider.id}
                  >
                    Validate
                  </Button>
                </div>

                {/* Validation result */}
                {validation && (
                  <Animated animation="fade-in" duration={200}>
                    <p className={`mt-2 text-xs ${validation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                      {validation.valid ? '✓ API key is valid' : validation.error || '✗ Invalid API key'}
                    </p>
                  </Animated>
                )}

                {/* Select button */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={() => handleSelectProvider(provider.id)}
                    disabled={!hasKey}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    icon={isActive ? <Check size={12} /> : undefined}
                  >
                    {isActive ? 'Selected' : 'Use Provider'}
                  </Button>

                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                    defaultValue={provider.defaultModel}
                  >
                    {provider.models.map((model) => (
                      <option key={model} value={model} className="bg-neutral-900">
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )
          })}
        </StaggerContainer>
      </div>
    </div>
  )
}
