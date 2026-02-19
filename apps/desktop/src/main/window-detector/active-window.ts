/**
 * Active Window Detector
 * Detects which app is currently in focus for per-app styles
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { EventEmitter } from 'events'

const execAsync = promisify(exec)

export interface WindowInfo {
  title: string
  processName: string
  executablePath: string
}

export class ActiveWindowDetector extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null
  private lastWindow: string = ''
  private isRunning = false

  async getActiveWindow(): Promise<WindowInfo | null> {
    const platform = process.platform

    try {
      if (platform === 'win32') {
        return await this.getWindowsWindow()
      } else if (platform === 'darwin') {
        return await this.getMacWindow()
      } else if (platform === 'linux') {
        return await this.getLinuxWindow()
      }
    } catch (error) {
      console.error('Failed to get active window:', error)
    }

    return null
  }

  private async getWindowsWindow(): Promise<WindowInfo | null> {
    // Use PowerShell to get active window info
    const psScript = `
      Add-Type @"
      using System;
      using System.Runtime.InteropServices;
      public class User32 {
        [DllImport("user32.dll")]
        public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")]
        public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
        [DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
      }
"@
      
      $hwnd = [User32]::GetForegroundWindow()
      $title = New-Object System.Text.StringBuilder 256
      [User32]::GetWindowText($hwnd, $title, 256) | Out-Null
      
      $processId = 0
      [User32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null
      
      $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
      
      @{
        title = $title.ToString()
        processName = $process.ProcessName
        executablePath = $process.Path
      } | ConvertTo-Json
    `

    try {
      const { stdout } = await execAsync(`powershell.exe -Command "${psScript}"`, { timeout: 5000 })
      const result = JSON.parse(stdout)
      return {
        title: result.title,
        processName: result.processName,
        executablePath: result.executablePath
      }
    } catch {
      return null
    }
  }

  private async getMacWindow(): Promise<WindowInfo | null> {
    try {
      const { stdout } = await execAsync(
        `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
        { timeout: 5000 }
      )
      const processName = stdout.trim()
      
      return {
        title: processName,
        processName,
        executablePath: ''
      }
    } catch {
      return null
    }
  }

  private async getLinuxWindow(): Promise<WindowInfo | null> {
    try {
      // Try xdotool first
      const { stdout: windowId } = await execAsync('xdotool getactivewindow', { timeout: 5000 })
      const { stdout: windowName } = await execAsync(`xdotool getwindowname ${windowId}`, { timeout: 5000 })
      const { stdout: pid } = await execAsync(`xdotool getwindowpid ${windowId}`, { timeout: 5000 })
      const { stdout: processName } = await execAsync(`ps -p ${pid} -o comm=`, { timeout: 5000 })

      return {
        title: windowName.trim(),
        processName: processName.trim(),
        executablePath: ''
      }
    } catch {
      return null
    }
  }

  startMonitoring(intervalMs = 1000): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.intervalId = setInterval(async () => {
      const window = await this.getActiveWindow()
      if (window) {
        const windowKey = `${window.processName}:${window.title}`
        if (windowKey !== this.lastWindow) {
          this.lastWindow = windowKey
          this.emit('windowChanged', window)
        }
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
  }

  getLastWindow(): string {
    return this.lastWindow
  }

  // Map process names to style profiles
  getStyleForApp(processName: string): 'casual' | 'neutral' | 'formal' | 'code' {
    const casualApps = ['slack', 'discord', 'whatsapp', 'telegram', 'messages', 'chat']
    const formalApps = ['outlook', 'mail', 'word', 'excel', 'powerpoint', 'pdf']
    const codeApps = ['code', 'cursor', 'vim', 'sublime', 'jetbrains', 'xcode', 'visualstudio']

    const lowerProcess = processName.toLowerCase()

    if (casualApps.some(app => lowerProcess.includes(app))) {
      return 'casual'
    }
    if (formalApps.some(app => lowerProcess.includes(app))) {
      return 'formal'
    }
    if (codeApps.some(app => lowerProcess.includes(app))) {
      return 'code'
    }

    return 'neutral'
  }
}
