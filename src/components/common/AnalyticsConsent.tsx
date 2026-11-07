import { useEffect, useState } from 'react'

import { getAnalyticsConsent, isAnalyticsConfigured, setAnalyticsConsent } from '../../services/analytics'
import { Button } from '../ui/Button'

export function AnalyticsConsent() {
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setVisible(isAnalyticsConfigured() && getAnalyticsConsent() === null)
    const handleError = (event: Event) => {
      const message = (event as CustomEvent<string>).detail
      setError(message || 'La analítica no está disponible.')
      setVisible(true)
    }
    window.addEventListener('analytics:error', handleError)
    return () => window.removeEventListener('analytics:error', handleError)
  }, [])

  async function choose(consent: 'accepted' | 'rejected') {
    setError('')
    try {
      await setAnalyticsConsent(consent)
      setVisible(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la preferencia.')
    }
  }

  if (!isAnalyticsConfigured()) return null
  if (!visible) {
    return (
      <button type="button" className="analytics-consent__settings" onClick={() => setVisible(true)}>
        Preferencias de privacidad
      </button>
    )
  }
  return (
    <aside className="analytics-consent" aria-label="Preferencias de analítica">
      <div>
        <strong>Medición de audiencia opcional</strong>
        <p>Si aceptás, usamos Google Analytics para medir visitas e interacciones. No se carga antes de tu consentimiento. No mide oyentes reales.</p>
        {error && <p role="alert">{error}</p>}
      </div>
      <div className="analytics-consent__actions">
        <Button variant="ghost" onClick={() => void choose('rejected')}>Rechazar</Button>
        <Button onClick={() => void choose('accepted')}>Aceptar analítica</Button>
      </div>
    </aside>
  )
}
