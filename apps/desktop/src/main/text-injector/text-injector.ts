/**
 * Text Injector - Types text into the active window
 * Uses multiple methods with fallbacks for maximum reliability
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { clipboard } from 'electron'

const execAsync = promisify(exec)

export async function injectText(text: string): Promise<void> {
  if (!text || text.trim().length === 0) return

  console.log('Injecting text:', text.substring(0, 50) + '...')

  const platform = process.platform

  try {
    if (platform === 'win32') {
      await injectWindows(text)
    } else if (platform === 'darwin') {
      await injectMacOS(text)
    } else if (platform === 'linux') {
      await injectLinux(text)
    }
    console.log('Text injected successfully')
  } catch (error) {
    console.error('Failed to inject text:', error)
    throw error
  }
}

async function injectWindows(text: string): Promise<void> {
  const errors: Error[] = []

  // Method 1: PowerShell SendKeys (most compatible)
  try {
    await injectSendKeys(text)
    return
  } catch (e: any) {
    errors.push(e)
    console.log('SendKeys failed, trying clipboard...')
  }

  // Method 2: Clipboard paste
  try {
    await injectClipboard(text)
    return
  } catch (e: any) {
    errors.push(e)
    console.log('Clipboard paste failed')
  }

  // All methods failed
  throw new Error(`All injection methods failed: ${errors.map(e => e.message).join(', ')}`)
}

async function injectSendKeys(text: string): Promise<void> {
  // Escape special characters for SendKeys
  const escaped = text
    .replace(/[{}\[\]^~+=%]/g, '{$&}')  // Escape special keys
    .replace(/\n/g, '{ENTER}')          // Newlines to Enter
    .replace(/\t/g, '{TAB}')            // Tabs to Tab
    .replace(/"/g, '""""')              // Escape quotes for PowerShell

  // Split long text into chunks to avoid PowerShell limits
  const maxChunkLength = 500
  const chunks: string[] = []
  
  if (escaped.length > maxChunkLength) {
    // Split by sentences or spaces
    let currentChunk = ''
    const sentences = escaped.split(/(?<=[.!?])\s+/)
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkLength) {
        if (currentChunk) chunks.push(currentChunk)
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      }
    }
    if (currentChunk) chunks.push(currentChunk)
  } else {
    chunks.push(escaped)
  }

  // Send each chunk
  for (const chunk of chunks) {
    const psScript = `[System.Windows.Forms.SendKeys]::SendWait("${chunk}")`
    
    await execAsync(
      `powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; ${psScript}"`,
      { timeout: 10000 }
    )
    
    // Small delay between chunks
    if (chunks.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
}

async function injectClipboard(text: string): Promise<void> {
  // Save original clipboard
  const originalText = clipboard.readText()
  
  try {
    // Copy text to clipboard
    clipboard.writeText(text)
    
    // Wait a bit for clipboard to update
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Paste with Ctrl+V
    await execAsync(
      `powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`,
      { timeout: 5000 }
    )
    
    // Wait for paste to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
  } finally {
    // Restore original clipboard after a delay
    setTimeout(() => {
      clipboard.writeText(originalText)
    }, 500)
  }
}

async function injectMacOS(text: string): Promise<void> {
  // Escape for AppleScript
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "'\"'\"'")

  const script = `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`
  await execAsync(script, { timeout: 10000 })
}

async function injectLinux(text: string): Promise<void> {
  const escaped = text.replace(/'/g, "'\"'\"'")
  
  try {
    // Try xdotool
    await execAsync(`xdotool type --delay 0 '${escaped}'`, { timeout: 10000 })
  } catch {
    try {
      // Fallback to ydotool
      await execAsync(`ydotool type --delay 0 '${escaped}'`, { timeout: 10000 })
    } catch {
      throw new Error('Neither xdotool nor ydotool available')
    }
  }
}

export async function simulateKeyCombo(keys: string[]): Promise<void> {
  const platform = process.platform

  if (platform === 'win32') {
    // Convert keys to SendKeys format
    const keyString = keys.map(k => {
      const lower = k.toLowerCase()
      if (lower === 'ctrl' || lower === 'control') return '^'
      if (lower === 'alt') return '%'
      if (lower === 'shift') return '+'
      if (lower === 'win' || lower === 'command') return '#'
      return k
    }).join('')

    const psScript = `[System.Windows.Forms.SendKeys]::SendWait("${keyString}")`
    await execAsync(
      `powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; ${psScript}"`,
      { timeout: 5000 }
    )
  }
}
