import { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAllHandlers } from './ipc/ipc-registry'
import { createTray } from './tray/tray-manager'
import { createFlowBar } from './windows/flow-bar'
import { setupAutoUpdater } from './updater/auto-updater'
import { ShortcutManager } from './shortcuts/shortcut-manager'

let mainWindow: BrowserWindow | null = null
let flowBarWindow: BrowserWindow | null = null
let tray: Tray | null = null
let shortcutManager: ShortcutManager | null = null

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 640,
    minHeight: 480,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform === 'win32'
      ? { color: '#0f0f0f', symbolColor: '#ffffff', height: 36 }
      : undefined,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
    },
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.mubble.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create windows first
  mainWindow = createMainWindow()
  flowBarWindow = createFlowBar()

  // Register IPC handlers (needs windows to be created)
  const controllers = await registerAllHandlers(mainWindow, flowBarWindow)

  // Create system tray
  tray = createTray(mainWindow, flowBarWindow)

  // Set up global shortcuts
  shortcutManager = new ShortcutManager(mainWindow, flowBarWindow)
  await shortcutManager.initialize()

  const settings = await controllers.getSettings()
  shortcutManager.updateShortcuts({
    pushToTalk: (settings.pushToTalkShortcut as string) || 'CommandOrControl+Shift+Space',
    handsFree: (settings.handsFreeShortcut as string) || 'CommandOrControl+Shift+H',
    commandMode: (settings.commandModeShortcut as string) || 'CommandOrControl+Shift+K',
    pasteLast: (settings.pasteLastShortcut as string) || 'CommandOrControl+Shift+V',
  })

  // Connect shortcuts to dictation manager
  shortcutManager.on('dictation:start', (mode) => {
    void controllers.startDictation(mode)
  })

  shortcutManager.on('dictation:stop', () => {
    void controllers.stopDictation()
  })

  shortcutManager.on('dictation:toggle', (mode, active) => {
    if (active) {
      void controllers.startDictation(mode)
    } else {
      void controllers.stopDictation()
    }
  })

  shortcutManager.on('command:activate', () => {
    void controllers.startDictation('command')
  })

  shortcutManager.on('paste:last', () => {
    void controllers.pasteLast()
  })

  // Set up auto-updater (only in production to avoid dev-mode errors)
  if (!is.dev) {
    setupAutoUpdater(mainWindow)
  }

  // Window management IPC
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.hide())
  ipcMain.on('flowBar:toggle', () => {
    if (flowBarWindow?.isVisible()) {
      flowBarWindow.hide()
    } else {
      flowBarWindow?.show()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
  shortcutManager?.destroy()
})
