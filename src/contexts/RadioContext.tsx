import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

import type { ProgramRecord, PublicSiteConfig, ScheduleRecord } from '../types/content'
import { DEFAULT_BROADCAST_TIME_ZONE, isValidStreamUrl } from '../utils/broadcastSchedule'

export type RadioStatus = 'idle' | 'connecting' | 'playing' | 'paused' | 'error'

type RadioContextValue = {
  config: PublicSiteConfig | null
  schedule: ScheduleRecord[]
  programs: ProgramRecord[]
  loading: boolean
  loadError: string
  status: RadioStatus
  playerError: string
  volume: number
  setVolume: (volume: number) => void
  play: () => Promise<void>
  pause: () => void
  retry: () => Promise<void>
  audioRef: RefObject<HTMLAudioElement | null>
  timeZone: string
}

const RadioContext = createContext<RadioContextValue | null>(null)

function describeAudioError(audio: HTMLAudioElement): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' &&
    audio.currentSrc.startsWith('http:')) {
    return 'El navegador bloqueó la señal HTTP porque esta página se sirve por HTTPS (contenido mixto). Configurá una URL HTTPS.'
  }
  switch (audio.error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'La reproducción fue interrumpida antes de iniciar.'
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Se perdió la conexión con el proveedor. Puede ser un problema de red, CORS o disponibilidad de la señal.'
    case MediaError.MEDIA_ERR_DECODE:
      return 'El navegador recibió audio, pero no pudo decodificarlo. Revisá que el formato o códec sea compatible.'
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'El navegador no admite este formato o URL. Verificá el códec del proveedor y que la dirección apunte a un flujo de audio compatible.'
    default:
      return 'No se pudo iniciar el audio. Revisá la URL, el formato y las restricciones del proveedor.'
  }
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [config, setConfig] = useState<PublicSiteConfig | null>(null)
  const [schedule, setSchedule] = useState<ScheduleRecord[]>([])
  const [programs, setPrograms] = useState<ProgramRecord[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [broadcastLoaded, setBroadcastLoaded] = useState(false)
  const [configError, setConfigError] = useState('')
  const [broadcastError, setBroadcastError] = useState('')
  const broadcastRequested = useRef(false)
  const requiresBroadcastData = ['/', '/en-vivo', '/programacion'].includes(pathname)
  const loading = configLoading || (requiresBroadcastData && !broadcastLoaded)
  const loadError = configError || broadcastError
  const [status, setStatus] = useState<RadioStatus>('idle')
  const [playerError, setPlayerError] = useState('')
  const [volume, setVolumeState] = useState(0.8)
  const timeZone = config?.stationTimeZone ?? DEFAULT_BROADCAST_TIME_ZONE

  useEffect(() => {
    let active = true
    void import('../services/content')
      .then(({ getPublicSiteConfig }) => getPublicSiteConfig())
      .then((data) => { if (active) setConfig(data) })
      .catch((cause: unknown) => {
        if (active) setConfigError(cause instanceof Error ? cause.message : 'No se pudo consultar la configuración de la emisora.')
      })
      .finally(() => { if (active) setConfigLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!requiresBroadcastData || broadcastRequested.current) return
    broadcastRequested.current = true
    void import('../services/content')
      .then(({ listPublished, listPublicSchedule }) =>
        Promise.allSettled([listPublicSchedule(), listPublished('programs', 50)]),
      )
      .then(([scheduleResult, programsResult]) => {
        if (scheduleResult.status === 'fulfilled') setSchedule(scheduleResult.value)
        if (programsResult.status === 'fulfilled') setPrograms(programsResult.value)
        const rejectedResult = scheduleResult.status === 'rejected' ? scheduleResult : programsResult
        if (rejectedResult.status === 'rejected') {
          setBroadcastError(rejectedResult.reason instanceof Error
            ? rejectedResult.reason.message
            : 'No se pudo consultar la señal y programación.')
        }
      })
      .catch((cause: unknown) => {
        setBroadcastError(cause instanceof Error ? cause.message : 'No se pudo consultar la señal y programación.')
      })
      .finally(() => setBroadcastLoaded(true))
  }, [requiresBroadcastData])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    setStatus('idle')
    setPlayerError('')
  }, [config?.streamUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = useCallback(async () => {
    const audio = audioRef.current
    const url = config?.streamUrl?.trim()
    if (!audio || !url) {
      setStatus('error')
      setPlayerError('La URL de streaming todavía no está configurada por la emisora.')
      return
    }
    if (!isValidStreamUrl(url)) {
      setStatus('error')
      setPlayerError('La URL configurada no es válida. Debe comenzar con http:// o https:// y no incluir credenciales.')
      return
    }
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http:')) {
      setStatus('error')
      setPlayerError('El navegador bloqueará la señal HTTP en esta página HTTPS. La emisora debe proporcionar una URL HTTPS.')
      return
    }
    setPlayerError('')
    setStatus('connecting')
    if (audio.src !== url) {
      audio.src = url
      audio.load()
    }
    try {
      await audio.play()
    } catch (cause) {
      setStatus('error')
      setPlayerError(cause instanceof Error && cause.name === 'NotAllowedError'
        ? 'El navegador no autorizó la reproducción. Volvé a presionar Reproducir.'
        : describeAudioError(audio))
    }
  }, [config?.streamUrl])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setStatus('paused')
  }, [])

  const retry = useCallback(async () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.load()
    }
    await play()
  }, [play])

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.min(1, Math.max(0, value)))
  }, [])

  const value = useMemo<RadioContextValue>(() => ({
    config,
    schedule,
    programs,
    loading,
    loadError,
    status,
    playerError,
    volume,
    setVolume,
    play,
    pause,
    retry,
    audioRef,
    timeZone,
  }), [config, schedule, programs, loading, loadError, status, playerError, volume, setVolume, play, pause, retry, timeZone])

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        preload="none"
        onPlaying={() => { setStatus('playing'); setPlayerError('') }}
        onPause={() => setStatus((current) => current === 'error' ? current : 'paused')}
        onWaiting={() => setStatus('connecting')}
        onError={(event) => {
          setStatus('error')
          setPlayerError(describeAudioError(event.currentTarget))
        }}
      />
    </RadioContext.Provider>
  )
}

export function useRadio(): RadioContextValue {
  const context = useContext(RadioContext)
  if (!context) throw new Error('useRadio debe usarse dentro de RadioProvider.')
  return context
}
