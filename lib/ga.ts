// lib/ga.ts
export function ga(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.gtag === 'function') {
    w.gtag('event', event, params || {})
  } else if (process.env.NODE_ENV !== 'production') {
    console.debug('[ga]', event, params)
  }
}