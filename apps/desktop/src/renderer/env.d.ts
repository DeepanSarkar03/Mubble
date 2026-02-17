/// <reference types="electron-vite/client" />

interface Window {
  mubble: import('../preload/index').MubbleAPI
}
