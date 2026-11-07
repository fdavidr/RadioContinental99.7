import { useEffect, useState } from 'react'

import { RadioPlayer } from '../../components/radio/RadioPlayer'
import { useRadio } from '../../contexts/RadioContext'
import { getBroadcastNow } from '../../utils/broadcastSchedule'

export function LivePage() {
  const radio = useRadio()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  let broadcast = null
  try {
    broadcast = getBroadcastNow(radio.schedule, now, radio.timeZone)
  } catch {
    broadcast = null
  }
  const currentProgram = broadcast?.current
    ? radio.programs.find((program) => program.id === broadcast.current?.programId)
    : null
  const nextProgram = broadcast?.next
    ? radio.programs.find((program) => program.id === broadcast.next?.programId)
    : null

  return (
    <div className="page-shell">
      <div className="container narrow">
        <span className="eyebrow">En vivo</span>
        <h1>Escucha la señal de Radio 99.7 FM</h1>
        <p className="lead">
          La señal se carga desde la configuración pública de la emisora. No hay reproducción automática.
        </p>
      </div>

      <div className="container">
        <div className="live-panel">
          <RadioPlayer />
          <div className="live-program-grid">
            <article>
              <span className="eyebrow">Al aire ahora</span>
              <h2>{currentProgram?.title ?? 'Sin programación confirmada'}</h2>
              {currentProgram && <p>{currentProgram.hostNames.join(', ') || currentProgram.description}</p>}
              {!currentProgram && <p>La grilla publicada no permite determinar un programa al aire en este momento.</p>}
            </article>
            <article>
              <span className="eyebrow">Próximo programa</span>
              <h2>{nextProgram?.title ?? 'Sin próximo programa disponible'}</h2>
              {nextProgram && broadcast?.nextStartsInMinutes !== null && (
                <p>Comienza en aproximadamente {broadcast?.nextStartsInMinutes} min.</p>
              )}
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}
