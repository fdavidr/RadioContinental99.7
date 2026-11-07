import { useRadio } from '../../contexts/RadioContext'
import { trackAnalyticsEvent } from '../../services/analytics'

export function RadioPlayer({ compact = false }: { compact?: boolean }) {
  const radio = useRadio()
  const configured = Boolean(radio.config?.streamUrl?.trim())
  const isPlaying = radio.status === 'playing'

  return (
    <section className={`radio-player ${compact ? 'radio-player--compact' : ''}`} aria-label="Reproductor de Radio 99.7 FM">
      <div className="radio-player__identity">
        <span className={`radio-player__indicator ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true" />
        <div>
          <strong>Radio 99.7 FM</strong>
          <span role="status" aria-live="polite">
            {radio.loading ? 'Consultando señal…'
              : !configured ? 'Transmisión sin configurar'
                : radio.status === 'connecting' ? 'Conectando…'
                  : isPlaying ? 'Reproduciendo en vivo'
                    : radio.status === 'error' ? 'Error de reproducción'
                      : 'Lista para reproducir'}
          </span>
        </div>
      </div>

      <div className="radio-player__controls">
        {!configured ? (
          <button type="button" className="radio-player__button" disabled aria-label="Streaming no configurado">▶</button>
        ) : radio.status === 'error' ? (
          <button type="button" className="radio-player__button" onClick={() => {
            trackAnalyticsEvent('player_interaction', { action: 'retry' })
            void radio.retry()
          }} aria-label="Reintentar reproducción">↻</button>
        ) : isPlaying || radio.status === 'connecting' ? (
          <button type="button" className="radio-player__button" onClick={() => {
            trackAnalyticsEvent('player_interaction', { action: 'pause' })
            radio.pause()
          }} aria-label="Pausar transmisión">Ⅱ</button>
        ) : (
          <button type="button" className="radio-player__button" onClick={() => {
            trackAnalyticsEvent('live_click', { placement: compact ? 'compact_player' : 'live_player' })
            trackAnalyticsEvent('player_interaction', { action: 'play' })
            void radio.play()
          }} aria-label="Reproducir transmisión">▶</button>
        )}
        {configured && (
          <label className="radio-player__volume">
            <span>Volumen</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={radio.volume}
              onChange={(event) => radio.setVolume(Number(event.target.value))}
              aria-label="Volumen de la transmisión"
            />
          </label>
        )}
      </div>

      {radio.loadError && <p className="radio-player__message" role="status">{radio.loadError}</p>}
      {!configured && !radio.loading && (
        <p className="radio-player__message" role="status">
          No hay una URL real de streaming en la configuración pública. La radio no está simulando una transmisión.
        </p>
      )}
      {radio.playerError && <p className="radio-player__message radio-player__message--error" role="alert">{radio.playerError}</p>}
    </section>
  )
}
