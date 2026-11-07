type AnalyticsConsent = 'accepted' | 'rejected'
type AnalyticsEventName =
  | 'news_view'
  | 'program_view'
  | 'live_click'
  | 'player_interaction'
  | 'whatsapp_click'
  | 'advertisement_click'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const consentKey = 'radio-continental-analytics-consent'
const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() ?? ''
let currentPath = '/'
let scriptLoading: Promise<void> | null = null
let analyticsReady = false

export function getAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(consentKey)
    return value === 'accepted' || value === 'rejected' ? value : null
  } catch {
    return null
  }
}

export function isAnalyticsConfigured(): boolean {
  return /^G-[A-Z0-9]+$/i.test(measurementId)
}

export async function setAnalyticsConsent(consent: AnalyticsConsent): Promise<void> {
  try {
    window.localStorage.setItem(consentKey, consent)
  } catch (error) {
    throw new Error('No se pudo guardar la preferencia de privacidad en este navegador.', { cause: error })
  }

  if (consent === 'accepted') {
    await enableAnalytics()
    sendPageView(currentPath)
  } else {
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  }
}

export function trackPageView(path: string): void {
  currentPath = new URL(path, window.location.origin).pathname
  if (getAnalyticsConsent() !== 'accepted' || !isAnalyticsConfigured()) return
  void enableAnalytics().then(() => {
    sendPageView(path)
  }).catch(reportAnalyticsFailure)
}

export function trackAnalyticsEvent(name: AnalyticsEventName, parameters: Record<string, string> = {}): void {
  if (getAnalyticsConsent() !== 'accepted' || !isAnalyticsConfigured()) return
  void enableAnalytics().then(() => window.gtag?.('event', name, parameters)).catch(reportAnalyticsFailure)
}

async function enableAnalytics(): Promise<void> {
  if (!isAnalyticsConfigured()) return
  if (!scriptLoading) {
    scriptLoading = new Promise((resolve, reject) => {
      window.dataLayer = window.dataLayer ?? []
      window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
        window.dataLayer?.push(args)
      }
      window.gtag('js', new Date())
      window.gtag('consent', 'default', { analytics_storage: 'denied' })
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
      script.onload = () => resolve()
      script.onerror = () => {
        scriptLoading = null
        reject(new Error('No se pudo cargar Google Analytics.'))
      }
      document.head.append(script)
    })
  }
  await scriptLoading
  window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
  if (!analyticsReady) {
    analyticsReady = true
    window.gtag?.('config', measurementId, { send_page_view: false })
  }
}

function sendPageView(path: string): void {
  if (!analyticsReady) return
  const pageUrl = new URL(path, window.location.origin)
  window.gtag?.('event', 'page_view', {
    page_location: pageUrl.toString(),
    page_path: pageUrl.pathname,
    page_title: document.title,
  })
}

function reportAnalyticsFailure(error: unknown): void {
  const message = error instanceof Error ? error.message : 'La analítica no está disponible.'
  window.dispatchEvent(new CustomEvent('analytics:error', { detail: message }))
}
