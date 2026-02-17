import type { MubbleAPI } from './index'

declare global {
  interface Window {
    mubble: MubbleAPI
  }
}
