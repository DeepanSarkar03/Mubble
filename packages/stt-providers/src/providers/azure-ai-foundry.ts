import type { STTProvider, STTProviderConfig, STTResult, AudioFormat } from '../types'

export class AzureAIFoundryProvider implements STTProvider {
  readonly id = 'azure-ai-foundry'
  readonly name = 'Azure AI Foundry'
  readonly description = 'Microsoft Azure AI Speech Services'
  readonly supportedFormats: AudioFormat[] = ['wav', 'mp3', 'ogg']
  readonly supportsStreaming = true
  readonly requiresApiKey = true
  readonly website = 'https://azure.microsoft.com/en-us/products/ai-services/ai-speech'

  async validate(config: STTProviderConfig) {
    if (!config.apiKey) return { valid: false, error: 'API key is required' }
    if (!config.additionalOptions?.region) return { valid: false, error: 'Azure region is required (set in additionalOptions.region)' }
    return { valid: true }
  }

  async transcribe(audio: Buffer, format: AudioFormat, config: STTProviderConfig): Promise<STTResult> {
    const region = (config.additionalOptions?.region as string) || 'eastus'
    const res = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${config.language || 'en-US'}`, {
      method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': config.apiKey!, 'Content-Type': format === 'wav' ? 'audio/wav' : 'audio/mpeg' }, body: audio,
    })
    if (!res.ok) throw new Error(`Azure Speech error: ${res.status}`)
    const data = await res.json() as any
    return { text: data.DisplayText || data.Text || '', confidence: data.Confidence }
  }
}
