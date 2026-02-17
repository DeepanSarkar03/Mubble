import { useState, useEffect } from 'react'
import { Check, ExternalLink, Loader2, Eye, EyeOff, Mic } from 'lucide-react'
import { Animated, StaggerContainer, Card, Button } from '../../components/ui'

interface STTProviderDef {
  id: string
  name: string
  description: string
  requiresApiKey: boolean
  website: string
  defaultModel?: string
  models?: string[]
}

const STT_PROVIDERS: STTProviderDef[] = [
  {
    id: 'openai-whisper',
    name: 'OpenAI Whisper',
    description: 'High-quality speech-to-text via OpenAI API',
    requiresApiKey: true,
    website: 'https://platform.openai.com',
    defaultModel: 'whisper-1',
    models: ['whisper-1'],
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    description: 'Fast real-time streaming STT with excellent latency',
    requiresApiKey: true,
    website: 'https://deepgram.com',
    defaultModel: 'nova-2',
    models: ['nova-2', 'nova', 'enhanced', 'base'],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast Whisper inference on Groq LPU hardware',
    requiresApiKey: true,
    website: 'https://groq.com',
    defaultModel: 'whisper-large-v3-turbo',
    models: ['whisper-large-v3', 'whisper-large-v3-turbo'],
  },
  {
    id: 'google-cloud-speech',
    name: 'Google Cloud Speech',
    description: 'Google Cloud Speech-to-Text with wide language support',
    requiresApiKey: true,
    website: 'https://cloud.google.com/speech-to-text',
  },
  {
    id: 'azure-ai-foundry',
    name: 'Azure AI Foundry',
    description: 'Microsoft Azure AI Speech Services',
    requiresApiKey: true,
    website: 'https://azure.microsoft.com/en-us/products/ai-services/ai-speech',
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    description: 'AI-powered speech recognition with real-time streaming',
    requiresApiKey: true,
    website: 'https://www.assemblyai.com',
    defaultModel: 'best',
    models: ['best', 'nano'],
  },
  {
    id: 'gladia',
    name: 'Gladia',
    description: 'Enterprise speech-to-text with streaming support',
    requiresApiKey: true,
    website: 'https://www.gladia.io',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    description: 'Whisper models running on Cloudflare edge network',
    requiresApiKey: true,
    website: 'https://developers.cloudflare.com/workers-ai',
    defaultModel: '@cf/openai/whisper',
  },
  {
    id: 'fireworks-ai',
    name: 'Fireworks AI',
    description: 'Fast Whisper inference via Fireworks platform',
    requiresApiKey: true,
    website: 'https://fireworks.ai',
    defaultModel: 'whisper-v3',
  },
  {
    id: 'jigsawstack',
    name: 'JigsawStack',
    description: 'AI speech-to-text API with multi-language support',
    requiresApiKey: true,
    website: 'https://jigsawstack.com',
  },
  {
    id: 'sambanova',
    name: 'SambaNova',
    description: 'High-performance AI inference for speech recognition',
    requiresApiKey: true,
    website: 'https://sambanova.ai',
  },
  {
    id: 'together-ai',
    name: 'Together AI',
    description: 'Run Whisper models on Together AI infrastructure',
    requiresApiKey: true,
    website: 'https://www.together.ai',
    defaultModel: 'whisper-large-v3',
  },
  {
    id: 'lemonfox',
    name: 'Lemonfox.ai',
    description: 'Affordable speech-to-text API service',
    requiresApiKey: true,
    website: 'https://lemonfox.ai',
  },
  {
    id: 'local-whisper',
    name: 'Local Whisper (Offline)',
    description: 'Run Whisper locally using whisper.cpp — no API key needed',
    requiresApiKey: false,
    website: 'https://github.com/ggerganov/whisper.cpp',
    defaultModel: 'base',
    models: ['tiny', 'base', 'small', 'medium', 'large'],
  },
]

export default function STTProviderSettings() {
  const [activeProvider, setActiveProvider] = useState('openai-whisper')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [validating, setValidating] = useState<string | null>(null)
  const [validationResults, setValidationResults] = useState<
    Record<string, { valid: boolean; error?: string }>
  >({})

  useEffect(() => {
    window.mubble.settings.get('activeSTTProvider').then((v) => {
      if (v) setActiveProvider(v)
    })
    STT_PROVIDERS.forEach(async (p) => {
      if (p.requiresApiKey) {
        const key = await window.mubble.apiKeys.get(`stt:${p.id}`)
        if (key) {
          setApiKeys((prev) => ({ ...prev, [p.id]: key }))
        }
      }
    })
  }, [])

  const handleSetApiKey = async (providerId: string, key: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: key }))
    if (key) {
      await window.mubble.apiKeys.set(`stt:${providerId}`, key)
    } else {
      await window.mubble.apiKeys.delete(`stt:${providerId}`)
    }
  }

  const handleValidate = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key) return
    setValidating(providerId)
    try {
      const result = await window.mubble.stt.validateKey(providerId, key)
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
    await window.mubble.settings.set('activeSTTProvider', providerId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Animated animation="fade-in-down" duration={200}>
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Speech-to-Text Providers
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Configure your preferred STT provider
          </p>
        </div>
      </Animated>

      <div className="space-y-3">
        <StaggerContainer staggerDelay={40} initialDelay={100} animation="fade-in-up">
          {STT_PROVIDERS.map((provider) => {
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
                      <h3 className="text-sm font-medium text-white">
                        {provider.name}
                      </h3>
                      {isActive && (
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                          Active
                        </span>
                      )}
                      {!provider.requiresApiKey && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          Free
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {provider.description}
                    </p>
                  </div>
                  <button
                    onClick={() => window.mubble.platform.openExternal(provider.website)}
                    className="
                      rounded-lg p-1.5 text-neutral-500 
                      transition-all duration-200 
                      hover:bg-white/5 hover:text-neutral-300
                    "
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                {/* API Key input */}
                {provider.requiresApiKey && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id] || ''}
                        onChange={(e) =>
                          handleSetApiKey(provider.id, e.target.value)
                        }
                        placeholder="Enter API key..."
                        className="
                          w-full rounded-xl border border-white/10 bg-white/5 
                          px-3 py-2 pr-8 font-mono text-xs text-white outline-none
                          transition-all duration-200
                          focus:border-white/20 focus:bg-white/10
                        "
                      />
                      <button
                        onClick={() =>
                          setShowKey((prev) => ({
                            ...prev,
                            [provider.id]: !prev[provider.id],
                          }))
                        }
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
                )}

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
                    disabled={provider.requiresApiKey && !hasKey}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    icon={isActive ? <Check size={12} /> : undefined}
                  >
                    {isActive ? 'Selected' : 'Use Provider'}
                  </Button>

                  {provider.models && provider.models.length > 1 && (
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
                  )}
                </div>
              </Card>
            )
          })}
        </StaggerContainer>
      </div>
    </div>
  )
}
