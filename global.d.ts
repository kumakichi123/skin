// global.d.ts
export {}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
  }

  interface Window {
    gtag?: (...args: any[]) => void
  }
}
