# What To Do — Continue LLM Provider Implementation

> This file was created because Claude's context limit was reached mid-task.
> Pick up exactly where it left off.

---

## Context

The project is **Mubble** — an open-source Electron + React + TypeScript desktop voice-to-text app.
Repo is at `C:\Users\astam\Mubble` (or the GitHub repo `DeepanSarkar03/Mubble`).

The task was: **Add 13 new LLM providers** to `packages/llm-providers/src/providers/`.

---

## What Has Already Been Done ✅

The following provider `.ts` files have already been **created** (they exist on disk):

| File | Provider | Status |
|------|----------|--------|
| `packages/llm-providers/src/providers/mistral.ts` | Mistral AI | ✅ Created |
| `packages/llm-providers/src/providers/cohere.ts` | Cohere | ✅ Created |
| `packages/llm-providers/src/providers/together-ai.ts` | Together AI | ✅ Created |
| `packages/llm-providers/src/providers/perplexity.ts` | Perplexity | ✅ Created |
| `packages/llm-providers/src/providers/xai.ts` | xAI (Grok) | ✅ Created |
| `packages/llm-providers/src/providers/fireworks-ai.ts` | Fireworks AI | ✅ Created |
| `packages/llm-providers/src/providers/huggingface.ts` | Hugging Face | ✅ Created |
| `packages/llm-providers/src/providers/ollama.ts` | Ollama | ✅ Created |
| `packages/llm-providers/src/providers/lm-studio.ts` | LM Studio | ✅ Created |

---

## What Still Needs To Be Done ❌

### Step 1 — Create the 4 remaining provider files

These files do **NOT exist yet** and need to be created:

#### A) `packages/llm-providers/src/providers/aws-bedrock.ts`
- Use `@aws-sdk/client-bedrock-runtime` package
- Models to include (exact model IDs):
  - `anthropic.claude-opus-4-5-20251101-v1:0`
  - `anthropic.claude-sonnet-4-5-20250929-v1:0`
  - `anthropic.claude-3-5-sonnet-20241022-v2:0`
  - `anthropic.claude-3-5-haiku-20241022-v1:0` ← cheapest Anthropic
  - `meta.llama3-3-70b-instruct-v1:0`
  - `meta.llama3-1-8b-instruct-v1:0` ← cheapest Meta
  - `amazon.nova-pro-v1:0`
  - `amazon.nova-lite-v1:0`
  - `amazon.nova-micro-v1:0` ← cheapest Amazon
  - `amazon.titan-text-lite-v1`
  - `mistral.mistral-large-2402-v1:0`
  - `cohere.command-r-plus-v1:0`
- Config: `apiKey` = AWS Access Key ID, needs `secretKey` in config (use a second field or encode as `accessKeyId::secretAccessKey::region`)
- **Simplest approach**: encode credentials as `ACCESS_KEY_ID::SECRET_ACCESS_KEY::REGION` in the apiKey field, parse with `split('::')`
- Use `BedrockRuntimeClient` + `InvokeModelWithResponseStreamCommand` for streaming
- For Anthropic models use the `anthropic` message format in body, for others use appropriate format

#### B) `packages/llm-providers/src/providers/azure-ai-foundry.ts`
- Azure AI Foundry / Azure OpenAI Service
- Uses OpenAI-compatible API with custom endpoint
- Models to include:
  - `gpt-4o`
  - `gpt-4o-mini`
  - `gpt-4.1`
  - `gpt-4.1-mini`
  - `o4-mini`
  - `meta-llama-3.3-70b-instruct`
  - `mistral-large`
  - `mistral-small`
  - `phi-4`
  - `phi-4-mini`
  - `cohere-command-r-plus`
  - `deepseek-r1`
  - `deepseek-v3`
- Config: `apiKey` = Azure API key, custom endpoint stored separately
- **Simplest approach**: encode as `ENDPOINT_URL::API_KEY` in the apiKey field, parse with `split('::')`
- Base URL format: `https://<your-resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2025-01-01-preview`
- Or use Azure AI Foundry endpoint: `https://<project>.inference.ai.azure.com/v1/chat/completions`
- Use OpenAI-compatible request format with `api-key` header

#### C) `packages/llm-providers/src/providers/google-vertex.ts`
- Google Vertex AI
- Models to include:
  - `gemini-2.5-pro-preview-05-06`
  - `gemini-2.5-flash-preview-05-20`
  - `gemini-2.0-flash`
  - `gemini-2.0-flash-lite` ← cheapest
  - `gemini-1.5-pro`
  - `gemini-1.5-flash`
  - `claude-opus-4@20250514` (Anthropic on Vertex)
  - `claude-sonnet-4@20250514`
  - `claude-3-5-haiku@20241022` ← cheapest Anthropic on Vertex
  - `llama-3.3-70b-instruct-maas` (Meta on Vertex)
  - `mistral-large@2411` (Mistral on Vertex)
- Config: encode as `PROJECT_ID::LOCATION::API_KEY` in apiKey field
- API endpoint: `https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:streamGenerateContent`
- For Gemini models, use the same format as Google Gemini provider
- **Simpler alternative**: Use Vertex AI's OpenAI-compatible endpoint:
  `https://{LOCATION}-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{LOCATION}/endpoints/openapi/chat/completions`

#### D) `packages/llm-providers/src/providers/replicate.ts`
- Replicate — run open-source models via API
- Models to include (use Replicate deployment format `owner/model:version`):
  - `meta/llama-4-maverick-instruct`
  - `meta/llama-4-scout-instruct`
  - `meta/llama-3.3-70b-instruct`
  - `meta/llama-3.1-8b-instruct` ← cheapest
  - `deepseek-ai/deepseek-r1`
  - `deepseek-ai/deepseek-v3`
  - `mistralai/mistral-7b-instruct-v0.2`
  - `stability-ai/stablelm-zephyr-3b` ← very cheap
  - `ibm-granite/granite-3.3-8b-instruct`
- API endpoint: `https://api.replicate.com/v1/models/{owner}/{model}/deployments` or use OpenAI compat:
  `https://api.replicate.com/v1/deployments/{owner}/{model}/predictions`
- **Simplest**: Use Replicate's new OpenAI-compatible endpoint:
  Base URL: `https://api.replicate.com/v1`
  Endpoint: `/chat/completions` (Replicate supports this for chat models)
- Header: `Authorization: Bearer {apiKey}`

---

### Step 2 — Update `packages/llm-providers/src/provider-registry.ts`

Current file only registers 4 providers. Add ALL 13 new ones.

Replace the file content with:

```typescript
import type { LLMProvider } from './types'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GoogleGeminiProvider } from './providers/google-gemini'
import { GroqLLMProvider } from './providers/groq'
import { MistralProvider } from './providers/mistral'
import { CohereProvider } from './providers/cohere'
import { TogetherAIProvider } from './providers/together-ai'
import { ReplicateProvider } from './providers/replicate'
import { PerplexityProvider } from './providers/perplexity'
import { XAIProvider } from './providers/xai'
import { FireworksAIProvider } from './providers/fireworks-ai'
import { HuggingFaceProvider } from './providers/huggingface'
import { OllamaProvider } from './providers/ollama'
import { LMStudioProvider } from './providers/lm-studio'
import { AWSBedrockProvider } from './providers/aws-bedrock'
import { AzureAIFoundryProvider } from './providers/azure-ai-foundry'
import { GoogleVertexProvider } from './providers/google-vertex'

export class LLMProviderRegistry {
  private providers = new Map<string, LLMProvider>()

  register(provider: LLMProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): LLMProvider | undefined {
    return this.providers.get(id)
  }

  list(): LLMProvider[] {
    return Array.from(this.providers.values())
  }

  has(id: string): boolean {
    return this.providers.has(id)
  }

  ids(): string[] {
    return Array.from(this.providers.keys())
  }
}

// Create and populate the default registry with all providers
export const llmRegistry = new LLMProviderRegistry()

// Cloud API providers
llmRegistry.register(new OpenAIProvider())
llmRegistry.register(new AnthropicProvider())
llmRegistry.register(new GoogleGeminiProvider())
llmRegistry.register(new GroqLLMProvider())
llmRegistry.register(new MistralProvider())
llmRegistry.register(new CohereProvider())
llmRegistry.register(new TogetherAIProvider())
llmRegistry.register(new ReplicateProvider())
llmRegistry.register(new PerplexityProvider())
llmRegistry.register(new XAIProvider())
llmRegistry.register(new FireworksAIProvider())
llmRegistry.register(new HuggingFaceProvider())

// Local inference providers (no API key needed)
llmRegistry.register(new OllamaProvider())
llmRegistry.register(new LMStudioProvider())

// Cloud platform providers (need credentials/endpoint)
llmRegistry.register(new AWSBedrockProvider())
llmRegistry.register(new AzureAIFoundryProvider())
llmRegistry.register(new GoogleVertexProvider())
```

---

### Step 3 — Update `packages/llm-providers/src/index.ts`

Add exports for all 13 new providers after the existing 4 exports:

```typescript
// New providers
export { MistralProvider } from './providers/mistral'
export { CohereProvider } from './providers/cohere'
export { TogetherAIProvider } from './providers/together-ai'
export { ReplicateProvider } from './providers/replicate'
export { PerplexityProvider } from './providers/perplexity'
export { XAIProvider } from './providers/xai'
export { FireworksAIProvider } from './providers/fireworks-ai'
export { HuggingFaceProvider } from './providers/huggingface'
export { OllamaProvider } from './providers/ollama'
export { LMStudioProvider } from './providers/lm-studio'
export { AWSBedrockProvider } from './providers/aws-bedrock'
export { AzureAIFoundryProvider } from './providers/azure-ai-foundry'
export { GoogleVertexProvider } from './providers/google-vertex'
```

---

### Step 4 — Build to check for TypeScript errors

```bash
cd C:\Users\astam\Mubble
pnpm run build
```

Fix any TypeScript errors that come up.

**Note**: For AWS Bedrock you may need to install `@aws-sdk/client-bedrock-runtime`:
```bash
cd packages/llm-providers
pnpm add @aws-sdk/client-bedrock-runtime
```

If AWS SDK is too heavy, simplify AWS Bedrock to use `fetch` directly against the Bedrock REST API with request signing (SigV4). Or just stub it with a clear comment that the SDK needs to be installed.

---

### Step 5 — Update the README

File: `README.md` in the repo root.

Find the LLM providers table and update it to list all 17 providers:

| Provider | Models | Cheapest Model | API Key |
|----------|--------|----------------|---------|
| OpenAI | gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, o4-mini, o3-mini, gpt-4o, gpt-4o-mini, gpt-3.5-turbo | gpt-3.5-turbo | Yes |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5, claude-3-5-sonnet, claude-3-5-haiku, claude-3-haiku | claude-3-haiku-20240307 | Yes |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-1.5-pro/flash | gemini-2.0-flash-lite | Yes |
| Groq | llama-4-maverick, llama-4-scout, llama-3.3-70b, deepseek-r1-distill, qwen-qwq-32b | llama-3.1-8b-instant | Yes |
| Mistral AI | magistral-medium/small, mistral-large/medium/small, codestral, open-mistral-nemo, pixtral | open-mistral-nemo | Yes |
| Cohere | command-a-03-2025, command-r-plus, command-r, command-light | command-light | Yes |
| Together AI | llama-4-maverick/scout, llama-3.3-70b, deepseek-v3/r1, qwen-2.5-72b, mistral-7b | mistral-7b-instruct | Yes |
| Replicate | llama-4, llama-3.3-70b, deepseek-r1, mistral-7b | mistral-7b-instruct | Yes |
| Perplexity | sonar-deep-research, sonar-reasoning-pro, sonar-pro, sonar, r1-1776 | sonar | Yes |
| xAI (Grok) | grok-4, grok-3-beta, grok-3-mini-beta, grok-2-vision | grok-3-mini-fast-beta | Yes |
| Fireworks AI | llama-4, deepseek-v3/r1, qwen3-235b, mixtral-8x22b | mixtral-8x7b | Yes |
| Hugging Face | llama-4, qwen3-235b, deepseek-r1/v3, gemma-3-27b, mistral-7b | phi-3.5-mini | Yes |
| Ollama | llama4, deepseek-r1, qwen3, gemma3, mistral, phi4, codellama | Any local model | No |
| LM Studio | Any GGUF model loaded locally | Any local model | No |
| AWS Bedrock | Claude, Llama, Nova, Titan, Mistral, Cohere (via AWS) | amazon.nova-micro | AWS Creds |
| Azure AI Foundry | GPT-4o, Phi-4, Llama, Mistral, DeepSeek (via Azure) | phi-4-mini | Yes |
| Google Vertex AI | Gemini 2.5/2.0, Claude on Vertex, Llama on Vertex | gemini-2.0-flash-lite | GCP Creds |

---

### Step 6 — Commit and push

```bash
cd C:\Users\astam\Mubble
git add packages/llm-providers/src/providers/
git add packages/llm-providers/src/provider-registry.ts
git add packages/llm-providers/src/index.ts
git add README.md
git commit -m "feat: Add 13 new LLM providers with latest models"
git push origin main
```

---

## Important Notes

- All existing 9 provider files follow the same pattern: implement `LLMProvider` interface from `../types`
- Look at any existing file (e.g. `packages/llm-providers/src/providers/mistral.ts`) as a template
- The interface requires: `id`, `name`, `description`, `requiresApiKey`, `website`, `defaultModel`, `models[]`, `validate()`, `complete()`, `stream()`
- All cloud providers use `fetch()` with OpenAI-compatible `/v1/chat/completions` format
- The `stream()` method reads SSE lines, each starting with `data: `, ending with `data: [DONE]`
- For local providers (Ollama, LM Studio), `requiresApiKey = false` and they use `apiKey` field as optional base URL override
- For complex providers (AWS Bedrock, Vertex AI), encode credentials in the `apiKey` field using `::` delimiter

---

## File Structure Reference

```
packages/llm-providers/
  src/
    types.ts                    ← LLMProvider interface definition
    provider-registry.ts        ← Registry (needs updating - Step 2)
    index.ts                    ← Exports (needs updating - Step 3)
    providers/
      openai.ts                 ✅ existing
      anthropic.ts              ✅ existing
      google-gemini.ts          ✅ existing
      groq.ts                   ✅ existing
      mistral.ts                ✅ created this session
      cohere.ts                 ✅ created this session
      together-ai.ts            ✅ created this session
      perplexity.ts             ✅ created this session
      xai.ts                    ✅ created this session
      fireworks-ai.ts           ✅ created this session
      huggingface.ts            ✅ created this session
      ollama.ts                 ✅ created this session
      lm-studio.ts              ✅ created this session
      replicate.ts              ❌ NOT YET CREATED
      aws-bedrock.ts            ❌ NOT YET CREATED
      azure-ai-foundry.ts       ❌ NOT YET CREATED
      google-vertex.ts          ❌ NOT YET CREATED
```
