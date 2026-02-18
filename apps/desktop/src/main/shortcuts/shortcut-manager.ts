/**
 * Global Shortcut Manager
 * Handles push-to-talk, hands-free, and command mode shortcuts
 * Uses Electron's built-in globalShortcut API
 */

import { EventEmitter } from 'events'
import { ipcMain, BrowserWindow, globalShortcut } from 'electron'
import { IPC } from '@mubble/shared'
import type { DictationMode } from '@mubble/shared'

interface ShortcutConfig {
  pushToTalk: string
  handsFree: string
  commandMode: string
  pasteLast: string
}

const DEFAULT_SHORTCUTS: ShortcutConfig = {
  pushToTalk: 'Control+Shift+Space',
  handsFree: 'F10',
  commandMode: 'Control+Shift+C',
  pasteLast: 'Control+Shift+V',
}

export class ShortcutManager extends EventEmitter {
  private config: ShortcutConfig = DEFAULT_SHORTCUTS
  private isPushToTalkActive = false
  private isHandsFreeActive = false
  private mainWindow: BrowserWindow | null = null
  private flowBarWindow: BrowserWindow | null = null

  constructor(mainWindow: BrowserWindow | null, flowBarWindow: BrowserWindow | null) {
    super()
    this.mainWindow = mainWindow
    this.flowBarWindow = flowBarWindow
    this.setupIPC()
  }

  async initialize(): Promise<void> {
    try {
      this.registerShortcuts()
      console.log('Global shortcuts registered:', this.config)
    } catch (error) {
      console.error('Failed to initialize global shortcuts:', error)
    }
  }

  private registerShortcuts(): void {
    // Unregister all first
    globalShortcut.unregisterAll()

    // Push-to-Talk (toggle behavior since we can't detect key hold with globalShortcut)
    globalShortcut.register(this.config.pushToTalk, () => {
      if (this.isPushToTalkActive) {
        this.isPushToTalkActive = false
        this.emit('dictation:stop')
        console.log('Push-to-talk: STOP')
      } else {
        this.isPushToTalkActive = true
        this.emit('dictation:start', 'push-to-talk')
        console.log('Push-to-talk: START')
      }
    })

    // Hands-free toggle
    globalShortcut.register(this.config.handsFree, () => {
      this.isHandsFreeActive = !this.isHandsFreeActive
      this.emit('dictation:toggle', 'hands-free', this.isHandsFreeActive)
      console.log('Hands-free:', this.isHandsFreeActive ? 'ON' : 'OFF')
    })

    // Command mode
    globalShortcut.register(this.config.commandMode, () => {
      this.emit('command:activate')
      console.log('Command mode activated')
    })

    // Paste last
    globalShortcut.register(this.config.pasteLast, () => {
      this.emit('paste:last')
      console.log('Paste last')
    })

    console.log('Registered shortcuts:', globalShortcut.isRegistered(this.config.pushToTalk))
  }

  private setupIPC(): void {
    // Allow renderer to get current shortcuts
    ipcMain.handle('shortcuts:get', () => this.config)

    // Allow renderer to update shortcuts
    ipcMain.handle('shortcuts:set', (_event, newConfig: Partial<ShortcutConfig>) => {
      this.config = { ...this.config, ...newConfig }
      this.registerShortcuts()
      return this.config
    })
  }

  updateShortcuts(config: Partial<ShortcutConfig>): void {
    this.config = { ...this.config, ...config }
    this.registerShortcuts()
  }

  getShortcuts(): ShortcutConfig {
    return this.config
  }

  destroy(): void {
    globalShortcut.unregisterAll()
  }
}
