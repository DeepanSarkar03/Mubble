/**
 * Text Injector - Types text into the active window
 * Uses native OS APIs to simulate keyboard input
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Inject text into the currently focused application
 * On Windows: uses PowerShell SendKeys or native Windows API
 */
export async function injectText(text: string): Promise<void> {
  if (!text) return

  const platform = process.platform

  try {
    if (platform === 'win32') {
      await injectWindows(text)
    } else if (platform === 'darwin') {
      await injectMacOS(text)
    } else if (platform === 'linux') {
      await injectLinux(text)
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }
  } catch (error) {
    console.error('Failed to inject text:', error)
    throw error
  }
}

async function injectWindows(text: string): Promise<void> {
  // Escape special characters for SendKeys
  const escaped = text
    .replace(/[{}\[\]^~]/g, '{$&}')  // Escape special keys
    .replace(/\n/g, '{ENTER}')        // Convert newlines to Enter key
    .replace(/\t/g, '{TAB}')          // Convert tabs to Tab key
    .replace(/"/g, '""""')           // Escape quotes

  // Use PowerShell SendKeys to type the text
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("${escaped}")
  `

  // Alternative: Use native Windows API via node-gyp addon
  // For production, this should use a native module like @nut-tree/nut.js

  try {
    await execAsync(`powershell.exe -Command "${psScript}"`, {
      timeout: 10000
    })
  } catch (error) {
    console.warn('PowerShell SendKeys failed, trying alternative method:', error)
    
    // Fallback: use clipboard paste method
    await injectViaClipboard(text)
  }
}

async function injectViaClipboard(text: string): Promise<void> {
  // Copy text to clipboard, then paste
  const { clipboard } = require('electron')
  
  const originalClipboard = clipboard.readText()
  clipboard.writeText(text)

  try {
    // Simulate Ctrl+V paste
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("^v")
    `
    await execAsync(`powershell.exe -Command "${psScript}"`, {
      timeout: 5000
    })

    // Small delay to ensure paste completes
    await new Promise(resolve => setTimeout(resolve, 100))
  } finally {
    // Restore original clipboard content
    clipboard.writeText(originalClipboard)
  }
}

async function injectMacOS(text: string): Promise<void> {
  // Use AppleScript or osascript to type text
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "'\"'\"'")

  const script = `osascript -e 'tell application "System Events" to keystroke "${escaped}"'`
  
  await execAsync(script, { timeout: 10000 })
}

async function injectLinux(text: string): Promise<void> {
  // Use xdotool or ydotool for Wayland
  const escaped = text
    .replace(/'/g, "'\"'\"'")
    .replace(/\n/g, '\\n')

  try {
    // Try xdotool first (X11)
    await execAsync(`xdotool type --delay 0 '${escaped}'`, { timeout: 10000 })
  } catch {
    try {
      // Fallback to ydotool (Wayland)
      await execAsync(`ydotool type --delay 0 '${escaped}'`, { timeout: 10000 })
    } catch {
      // Last resort: use wl-copy + wl-paste for Wayland
      await execAsync(`echo '${escaped}' | wl-copy`, { timeout: 5000 })
      await execAsync('ydotool key ctrl+v', { timeout: 5000 })
    }
  }
}

/**
 * Simulate a keyboard shortcut
 */
export async function simulateShortcut(keys: string[]): Promise<void> {
  const platform = process.platform

  if (platform === 'win32') {
    const keyString = keys.map(k => {
      const lower = k.toLowerCase()
      if (lower === 'ctrl') return '^'
      if (lower === 'alt') return '%'
      if (lower === 'shift') return '+'
      if (lower === 'win') return '#'
      return k
    }).join('')

    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("${keyString}")
    `
    await execAsync(`powershell.exe -Command "${psScript}"`, { timeout: 5000 })
  }
  // Add macOS and Linux implementations as needed
}
