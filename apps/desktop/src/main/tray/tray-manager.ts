import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'
import { join } from 'path'

export function createTray(
  mainWindow: BrowserWindow,
  flowBarWindow: BrowserWindow
): Tray {
  // Use a simple icon - in production this would be a proper tray icon
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  let icon: nativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    // Fallback: create a small colored icon
    icon = nativeImage.createEmpty()
  }

  const tray = new Tray(icon.isEmpty() ? createDefaultIcon() : icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Mubble',
      click: () => mainWindow.show(),
    },
    {
      label: 'Toggle Flow Bar',
      click: () => {
        if (flowBarWindow.isVisible()) {
          flowBarWindow.hide()
        } else {
          flowBarWindow.show()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show()
        mainWindow.webContents.send('navigate', '/settings')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Mubble',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setToolTip('Mubble - Voice to Text')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
  })

  return tray
}

function createDefaultIcon(): nativeImage {
  // Create a 16x16 blue circle as fallback tray icon
  const size = 16
  const canvas = Buffer.alloc(size * size * 4)
  const center = size / 2
  const radius = 6

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2)
      if (dist <= radius) {
        canvas[offset] = 99      // R
        canvas[offset + 1] = 102 // G
        canvas[offset + 2] = 241 // B (blue)
        canvas[offset + 3] = 255 // A
      }
    }
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size })
}
