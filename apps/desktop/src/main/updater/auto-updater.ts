import { ipcMain, BrowserWindow } from 'electron'
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { IPC } from '@mubble/shared'

/**
 * Configures and initialises the auto-updater.
 *
 * Call once from the main process after the main window has been created.
 * The updater talks to GitHub Releases via the `publish` config in
 * electron-builder.yml (provider: github, owner, repo).
 *
 * Events forwarded to the renderer:
 *   update:available       – a new version is available
 *   update:downloading     – download has started
 *   update:progress        – download progress (percent, speed, etc.)
 *   update:downloaded      – update is ready to install
 *   update:not-available   – already on the latest version
 *   update:error           – something went wrong
 *
 * IPC commands accepted from the renderer:
 *   update:check           – manually trigger an update check
 *   update:install         – quit and install the downloaded update
 */
export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Disable auto-download; we control when to download via progress events
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Allow pre-release channels if the running version is a pre-release
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false

  // ── Helper to safely send to the renderer ──────────────────────────────
  function send(channel: string, ...args: unknown[]): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args)
    }
  }

  // ── Auto-updater event listeners ───────────────────────────────────────

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    send(IPC.UPDATE_AVAILABLE, {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseName: info.releaseName ?? info.version,
    })
    // Start downloading automatically once the renderer is notified
    autoUpdater.downloadUpdate().catch((err) => {
      send(IPC.UPDATE_ERROR, String(err))
    })
  })

  autoUpdater.on('update-not-available', () => {
    send(IPC.UPDATE_NOT_AVAILABLE)
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    send(IPC.UPDATE_PROGRESS, {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    send(IPC.UPDATE_DOWNLOADED, {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseName: info.releaseName ?? info.version,
    })
  })

  autoUpdater.on('error', (err: Error) => {
    send(IPC.UPDATE_ERROR, err.message)
  })

  // ── IPC commands from the renderer ────────────────────────────────────

  ipcMain.handle(IPC.UPDATE_CHECK, async () => {
    try {
      return await autoUpdater.checkForUpdates()
    } catch (err) {
      send(IPC.UPDATE_ERROR, String(err))
      return null
    }
  })

  ipcMain.on(IPC.UPDATE_INSTALL, () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // ── Initial check (delay slightly so the window can fully render) ──────
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // Silently ignore errors on startup check (e.g. no network)
    })
  }, 5_000)
}
