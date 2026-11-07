import { useEffect, useMemo, useState } from 'react'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { useRadio } from '../../contexts/RadioContext'
import { getBroadcastNow } from '../../utils/broadcastSchedule'

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function getWeekday(date: Date, timeZone: string): number | null {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
    const index = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
    return index < 0 ? null : index
  } catch {
    return null
  }
}

export function SchedulePage() {
  const radio = useRadio()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const currentDay = getWeekday(now, radio.timeZone)
    if (currentDay !== null) setSelectedDay((selected) => selected ?? currentDay)
  }, [now, radio.timeZone])

  const selectedSchedule = useMemo(() => radio.schedule
    .filter((entry) => entry.dayOfWeek === selectedDay && entry.status === 'published')
    .map((entry) => ({
      entry,
      program: radio.programs.find((program) => program.id === entry.programId),
    }))
    .filter((item) => item.program)
    .sort((left, right) => left.entry.startTime.localeCompare(right.entry.startTime)),
  [radio.schedule, radio.programs, selectedDay])

  const currentProgram = (() => {
    try {
      const current = getBroadcastNow(radio.schedule, now, radio.timeZone).current
      return current ? radio.programs.find((program) => program.id === current.programId) ?? null : null
    } catch {
      return null
    }
  })()

  if (radio.loading) return <LoadingState title="Cargando programación" message="Consultando la grilla pública de la emisora." />

  return (
    <div className="page-shell">
      <div className="container narrow">
        <span className="eyebrow">Programación</span>
        <h1>Grilla semanal</h1>
        <p className="lead">Consultá los horarios publicados en la zona horaria {radio.timeZone}.</p>
      </div>
      {radio.loadError && (
        <div className="container">
          <ErrorState title="No se pudo consultar la grilla" message={radio.loadError} />
        </div>
      )}
      {!radio.loadError && radio.schedule.length === 0 && (
        <div className="container">
          <EmptyState title="Programación pendiente" message="La emisora todavía no publicó emisiones semanales." />
        </div>
      )}
      {!radio.loadError && radio.schedule.length > 0 && (
        <div className="container">
          <div className="schedule-day-picker" aria-label="Elegir día de programación">
            {weekdays.map((day, index) => (
              <button
                type="button"
                key={day}
                aria-pressed={selectedDay === index}
                onClick={() => setSelectedDay(index)}
              >
                {day}
              </button>
            ))}
          </div>
          <section className="schedule-day">
            <h2>{selectedDay === null ? 'Programación semanal' : weekdays[selectedDay]}</h2>
            {selectedSchedule.length > 0 ? selectedSchedule.map(({ entry, program }) => (
              <article className="schedule-entry" key={entry.id}>
                <span>
                  {entry.startTime}–{entry.endTime}
                  {entry.endTime <= entry.startTime ? ' (+1 día)' : ''}
                </span>
                <strong>{program?.title}</strong>
                <small>{program?.hostNames.join(', ') || 'Conductor por confirmar'}</small>
              </article>
            )) : <p className="muted-copy">No hay programas publicados para este día.</p>}
            <p className="schedule-time-zone">Todos los horarios se muestran en {radio.timeZone}.</p>
          </section>
          <p className="schedule-current" role="status">
            {currentProgram
              ? `Al aire ahora: ${currentProgram.title}`
              : 'No hay un programa publicado para confirmar como al aire ahora.'}
          </p>
        </div>
      )}
    </div>
  )
}
