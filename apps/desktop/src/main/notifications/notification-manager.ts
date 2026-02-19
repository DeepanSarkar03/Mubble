/**
 * Notification Manager
 * Shows toast notifications to the user
 */

import { BrowserWindow, Notification, nativeImage } from 'electron'

export class NotificationManager {
  private mainWindow: BrowserWindow | null = null
  private flowBarWindow: BrowserWindow | null = null

  constructor(mainWindow: BrowserWindow | null, flowBarWindow: BrowserWindow | null) {
    this.mainWindow = mainWindow
    this.flowBarWindow = flowBarWindow
  }

  show(title: string, body: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    // Send to renderer windows
    const notification = { title, body, type, timestamp: Date.now() }
    
    this.mainWindow?.webContents.send('notification:show', notification)
    this.flowBarWindow?.webContents.send('notification:show', notification)

    // Show native notification
    if (Notification.isSupported()) {
      try {
        new Notification({
          title,
          body,
          silent: type === 'info',
        }).show()
      } catch (error) {
        console.error('Failed to show native notification:', error)
      }
    }
  }

  showError(message: string, detail?: string): void {
    const body = detail ? `${message}\n${detail}` : message
    this.show('Mubble Error', body, 'error')
    console.error('[Error]', message, detail)
  }

  showSuccess(message: string): void {
    this.show('Mubble', message, 'success')
  }

  showWarning(message: string): void {
    this.show('Mubble Warning', message, 'warning')
  }

  showInfo(message: string): void {
    this.show('Mubble', message, 'info')
  }

  // Dictation-specific notifications
  dictationStarted(): void {
    this.showInfo('Recording... Speak now')
  }

  dictationStopped(): void {
    this.showInfo('Processing...')
  }

  dictationSuccess(wordCount: number): void {
    this.showSuccess(`Inserted ${wordCount} words`)
  }

  dictationError(error: string): void {
    this.showError('Dictation failed', error)
  }

  noProviderConfigured(): void {
    this.showError(
      'No STT provider configured',
      'Please go to Settings > STT Providers and set up a provider first.'
    )
  }

  noMicrophoneAccess(): void {
    this.showError(
      'Microphone access denied',
      'Please allow microphone access in your system settings.'
    )
  }

  providerValidated(providerName: string): void {
    this.showSuccess(`${providerName} API key is valid`)
  }

  providerValidationFailed(providerName: string, error: string): void {
    this.showError(`${providerName} validation failed`, error)
  }
}
