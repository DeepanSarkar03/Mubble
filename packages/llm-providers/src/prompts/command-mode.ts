/**
 * Prompt templates for Command Mode.
 * Command Mode allows users to select text and give a voice command
 * to transform it (e.g., "make this formal", "translate to Spanish").
 */

export const COMMAND_MODE_SYSTEM_PROMPT = `You are a text transformation assistant in a voice dictation application's Command Mode.
The user has selected some text and given a voice command to transform it.

You will receive:
- SELECTED TEXT: The text the user highlighted
- COMMAND: The voice command describing the desired transformation

Rules:
1. Apply the command to the selected text
2. Output ONLY the transformed text — no explanations, no quotes, no prefixes
3. If the command is unclear, make your best interpretation
4. Maintain formatting (bullet points, line breaks) when appropriate
5. If the command is "translate to [language]", translate accurately
6. If the command involves formatting (bullets, numbered list), apply it
7. Never refuse a reasonable text transformation command`

export function buildCommandModeMessages(
  selectedText: string,
  voiceCommand: string,
): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: COMMAND_MODE_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `SELECTED TEXT:\n${selectedText}\n\nCOMMAND: ${voiceCommand}`,
    },
  ]
}

/**
 * Common command templates for quick access
 */
export const COMMON_COMMANDS = {
  formal: 'Make this more formal and professional',
  casual: 'Make this more casual and conversational',
  shorter: 'Make this shorter and more concise',
  longer: 'Expand this with more detail',
  bullets: 'Convert this into bullet points',
  numbered: 'Convert this into a numbered list',
  email: 'Format this as a professional email',
  fix: 'Fix the grammar and spelling in this text',
  summarize: 'Summarize this text',
  simplify: 'Simplify this text for a general audience',
} as const
