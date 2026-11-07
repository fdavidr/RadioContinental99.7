import { useEffect, useState, type FormEvent } from 'react'

import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { getPublicSiteConfig } from '../../services/content'
import { updatePublicSiteConfig } from '../../services/content'
import { checkStreamAvailability, type StreamCheckResult } from '../../services/streamCheck'
import type { PublicSiteConfig } from '../../types/content'
import { DEFAULT_BROADCAST_TIME_ZONE } from '../../utils/broadcastSchedule'

type SettingsForm = Omit<PublicSiteConfig, 'updatedAt'>
const emptySettings: SettingsForm = {
  stationName: 'Radio Continental 99.7 FM',
  slogan: '',
  streamUrl: null,
  stationTimeZone: DEFAULT_BROADCAST_TIME_ZONE,
  contactEmail: null,
  contactPhone: null,
  whatsappUrl: null,
  socialLinks: { instagram: '', facebook: '', youtube: '' },
}

export function AdminSettingsPage() {
  const auth = useAuth()
  const [values, setValues] = useState<SettingsForm>(emptySettings)
  const [updatedAt, setUpdatedAt] = useState<PublicSiteConfig['updatedAt'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [streamCheck, setStreamCheck] = useState<StreamCheckResult | null>(null)
  const [checkingStream, setCheckingStream] = useState(false)

  useEffect(() => {
    let active = true
    void getPublicSiteConfig()
      .then((config) => {
        if (!active) return
        if (config) {
          setValues({
            stationName: config.stationName,
            slogan: config.slogan,
            streamUrl: config.streamUrl,
            stationTimeZone: config.stationTimeZone ?? DEFAULT_BROADCAST_TIME_ZONE,
            contactEmail: config.contactEmail,
            contactPhone: config.contactPhone,
            whatsappUrl: config.whatsappUrl,
            socialLinks: { instagram: '', facebook: '', youtube: '', ...config.socialLinks },
          })
          setUpdatedAt(config.updatedAt)
        } else {
          setUpdatedAt(null)
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la configuración.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function setField<K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (auth.status !== 'signed-in') return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updatePublicSiteConfig(auth.user, {
        ...values,
        streamUrl: values.streamUrl?.trim() || null,
        contactEmail: values.contactEmail?.trim() || null,
        contactPhone: values.contactPhone?.trim() || null,
        whatsappUrl: values.whatsappUrl?.trim() || null,
      }, updatedAt)
      const saved = await getPublicSiteConfig()
      setUpdatedAt(saved?.updatedAt ?? null)
      setMessage('La configuración fue guardada en Firestore.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  async function checkStream() {
    setCheckingStream(true)
    setStreamCheck(null)
    try {
      setStreamCheck(await checkStreamAvailability(values.streamUrl?.trim() ?? ''))
    } finally {
      setCheckingStream(false)
    }
  }

  if (loading) return <LoadingState title="Cargando configuración" message="Leyendo publicConfig/site en Firestore." />

  return (
    <div className="admin-module">
      <header className="page-heading"><div><span className="eyebrow">Solo superadministrador</span><h1>Configuración de emisora</h1><p className="lead">Datos públicos, streaming y zona horaria usados por la experiencia de la radio.</p></div></header>
      {error && <ErrorState title="No se pudo completar la operación" message={error} />}
      {message && <p className="form-feedback" role="status">{message}</p>}
      <form className="form-card admin-edit-form" onSubmit={(event) => void submit(event)}>
        <div className="form-grid">
          <label>Nombre de la emisora<input value={values.stationName} onChange={(event) => setField('stationName', event.target.value)} maxLength={100} required /></label>
          <label>Eslogan<input value={values.slogan} onChange={(event) => setField('slogan', event.target.value)} maxLength={240} /></label>
          <label>URL de streaming HTTP/HTTPS<input type="url" value={values.streamUrl ?? ''} onChange={(event) => { setField('streamUrl', event.target.value); setStreamCheck(null) }} placeholder="https://servidor/radio.mp3" /></label>
          <div className="stream-check">
            <Button type="button" variant="secondary" disabled={checkingStream || !values.streamUrl?.trim()} onClick={() => void checkStream()}>
              {checkingStream ? 'Comprobando…' : 'Comprobar disponibilidad técnica'}
            </Button>
            <p role={streamCheck?.kind === 'unavailable' ? 'alert' : 'status'} className={streamCheck ? `stream-check__result stream-check__result--${streamCheck.kind}` : ''}>
              {streamCheck?.detail ?? 'La comprobación no valida que el audio sea audible ni sustituye una prueba de reproducción.'}
            </p>
          </div>
          <label>Zona horaria IANA de la emisora<input value={values.stationTimeZone ?? DEFAULT_BROADCAST_TIME_ZONE} onChange={(event) => setField('stationTimeZone', event.target.value)} placeholder={DEFAULT_BROADCAST_TIME_ZONE} required /></label>
          <label>Email de contacto<input type="email" value={values.contactEmail ?? ''} onChange={(event) => setField('contactEmail', event.target.value)} maxLength={254} /></label>
          <label>Teléfono de contacto<input type="tel" value={values.contactPhone ?? ''} onChange={(event) => setField('contactPhone', event.target.value)} maxLength={40} /></label>
          <label>WhatsApp HTTPS<input type="url" value={values.whatsappUrl ?? ''} onChange={(event) => setField('whatsappUrl', event.target.value)} placeholder="https://wa.me/…" /></label>
          {(['instagram', 'facebook', 'youtube'] as const).map((network) => <label key={network}>{network}<input type="url" value={values.socialLinks[network] ?? ''} onChange={(event) => setValues((current) => ({ ...current, socialLinks: { ...current.socialLinks, [network]: event.target.value } }))} placeholder="https://…" /></label>)}
        </div>
        <div className="form-actions"><Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar configuración'}</Button></div>
      </form>
    </div>
  )
}
