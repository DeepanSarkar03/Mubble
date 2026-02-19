/**
 * Sound Effects for Mubble
 * Provides audio feedback for dictation states
 */

import { BrowserWindow } from 'electron'

export class SoundEffects {
  private soundWindow: BrowserWindow | null = null

  constructor() {
    this.createSoundWindow()
  }

  private createSoundWindow(): void {
    this.soundWindow = new BrowserWindow({
      width: 1,
      height: 1,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    // Load sounds HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          // Generate sounds using Web Audio API
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();

          function playBeep(frequency = 800, duration = 0.1, type = 'sine') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          }

          function playStartSound() {
            // Rising beep
            playBeep(600, 0.05);
            setTimeout(() => playBeep(800, 0.05), 50);
            setTimeout(() => playBeep(1000, 0.15), 100);
          }

          function playStopSound() {
            // Falling beep
            playBeep(1000, 0.05);
            setTimeout(() => playBeep(800, 0.05), 50);
            setTimeout(() => playBeep(600, 0.15), 100);
          }

          function playSuccessSound() {
            // Happy chime
            playBeep(523.25, 0.1); // C5
            setTimeout(() => playBeep(659.25, 0.1), 100); // E5
            setTimeout(() => playBeep(783.99, 0.2), 200); // G5
          }

          function playErrorSound() {
            // Low buzz
            playBeep(200, 0.3, 'sawtooth');
          }

          // Expose to main process
          window.playStartSound = playStartSound;
          window.playStopSound = playStopSound;
          window.playSuccessSound = playSuccessSound;
          window.playErrorSound = playErrorSound;
        </script>
      </body>
      </html>
    `

    this.soundWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  }

  private async play(soundName: string): Promise<void> {
    if (!this.soundWindow) return

    try {
      await this.soundWindow.webContents.executeJavaScript(`
        if (typeof window.${soundName} === 'function') {
          window.${soundName}();
        }
      `)
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  playStart(): void {
    this.play('playStartSound')
  }

  playStop(): void {
    this.play('playStopSound')
  }

  playSuccess(): void {
    this.play('playSuccessSound')
  }

  playError(): void {
    this.play('playErrorSound')
  }

  destroy(): void {
    this.soundWindow?.destroy()
    this.soundWindow = null
  }
}
