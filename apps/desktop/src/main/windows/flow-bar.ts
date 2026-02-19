import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export function createFlowBar(): BrowserWindow {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize

  const flowBar = new BrowserWindow({
    width: 340,
    height: 60,
    x: Math.round(screenWidth / 2 - 170),
    y: 60,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
    },
  })

  if (process.platform === 'darwin') {
    flowBar.setAlwaysOnTop(true, 'floating')
  }

  flowBar.setIgnoreMouseEvents(false, { forward: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    flowBar.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/flow-bar`)
  } else {
    flowBar.loadFile(join(__dirname, '../../renderer/index.html'), {
      hash: '/flow-bar',
    })
  }

  // Show flow bar by default on startup
  flowBar.show()

  return flowBar
}
