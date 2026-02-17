/**
 * Prompt templates for per-app style formatting.
 * Users can configure different "vibes" for different apps
 * (e.g., casual for Slack, formal for Outlook).
 */

export const STYLE_SYSTEM_PROMPT = `You are a text style adapter in a voice dictation application.
Your job is to adapt dictated text to match a specific communication style.

The user will provide:
- RAW TEXT: The dictated and cleaned-up text
- TARGET STYLE: The communication style to apply
- APP CONTEXT: The application where this text will be used

Rules:
1. Adapt the tone and formality to match the target style
2. Keep the original meaning and information intact
3. Output ONLY the adapted text — no explanations
4. Match the conventions of the target application`

export interface StyleProfile {
  name: string
  formality: 'very_casual' | 'casual' | 'neutral' | 'formal' | 'very_formal'
  instructions: string
}

export const DEFAULT_STYLES: Record<string, StyleProfile> = {
  slack: {
    name: 'Slack / Chat',
    formality: 'casual',
    instructions: 'Casual, concise, use common abbreviations. Emoji welcome. Short sentences.',
  },
  email: {
    name: 'Email',
    formality: 'formal',
    instructions: 'Professional but friendly. Complete sentences. Proper greeting and sign-off if appropriate.',
  },
  docs: {
    name: 'Documents',
    formality: 'formal',
    instructions: 'Clear, well-structured, professional. Use proper grammar and complete sentences.',
  },
  code_comments: {
    name: 'Code Comments',
    formality: 'neutral',
    instructions: 'Technical, concise, clear. Use standard programming terminology. No unnecessary words.',
  },
  social: {
    name: 'Social Media',
    formality: 'very_casual',
    instructions: 'Very casual, engaging, relatable. Emoji and informal language welcome.',
  },
}

export function buildStylePrompt(
  rawText: string,
  style: StyleProfile,
  appName?: string,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: STYLE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        `RAW TEXT:\n${rawText}`,
        `\nTARGET STYLE: ${style.name} (${style.formality})`,
        `STYLE INSTRUCTIONS: ${style.instructions}`,
        appName ? `APP CONTEXT: ${appName}` : '',
      ].filter(Boolean).join('\n'),
    },
  ]
}
