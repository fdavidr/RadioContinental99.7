import type { ScheduleRecord } from '../types/content'

export const DEFAULT_BROADCAST_TIME_ZONE = 'America/La_Paz'
export const WEEK_MINUTES = 7 * 24 * 60

export type ScheduleSlot = Pick<ScheduleRecord, 'id' | 'programId' | 'dayOfWeek' | 'startTime' | 'endTime' | 'timeZone' | 'status'>

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function parseTime(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!match) throw new Error('La hora debe usar el formato HH:mm.')
  return Number(match[1]) * 60 + Number(match[2])
}

export function scheduleDuration(slot: Pick<ScheduleSlot, 'startTime' | 'endTime'>): number {
  const start = parseTime(slot.startTime)
  const end = parseTime(slot.endTime)
  const duration = (end - start + 24 * 60) % (24 * 60)
  if (duration === 0) throw new Error('La hora de inicio y finalización no pueden ser iguales.')
  return duration
}

function interval(slot: ScheduleSlot): { start: number; end: number } {
  const start = slot.dayOfWeek * 1440 + parseTime(slot.startTime)
  return { start, end: start + scheduleDuration(slot) }
}

export function findScheduleOverlap(
  candidate: ScheduleSlot,
  schedules: readonly ScheduleSlot[],
  excludeId?: string,
): ScheduleSlot | null {
  if (!Number.isInteger(candidate.dayOfWeek) || candidate.dayOfWeek < 0 || candidate.dayOfWeek > 6) {
    throw new Error('El día debe ser un valor entre domingo (0) y sábado (6).')
  }
  const wanted = interval(candidate)
  const wantedSegments = [
    { start: wanted.start, end: Math.min(wanted.end, WEEK_MINUTES) },
    ...(wanted.end > WEEK_MINUTES ? [{ start: 0, end: wanted.end - WEEK_MINUTES }] : []),
  ]

  for (const existing of schedules) {
    if (existing.id === excludeId || existing.status !== 'published') continue
    const current = interval(existing)
    const currentSegments = [
      { start: current.start, end: Math.min(current.end, WEEK_MINUTES) },
      ...(current.end > WEEK_MINUTES ? [{ start: 0, end: current.end - WEEK_MINUTES }] : []),
    ]
    if (wantedSegments.some((left) => currentSegments.some((right) =>
      left.start < right.end && right.start < left.end,
    ))) return existing
  }
  return null
}

function getLocalWeekMinute(now: Date, timeZone: string): number {
  if (!isValidTimeZone(timeZone)) throw new Error('La zona horaria configurada no es válida.')
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const day = parts.find((part) => part.type === 'weekday')?.value
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  const dayNumber = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day ?? '')
  if (dayNumber < 0 || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('No se pudo determinar la hora local de la emisora.')
  }
  return dayNumber * 1440 + hour * 60 + minute
}

export type BroadcastNow = {
  current: ScheduleSlot | null
  next: ScheduleSlot | null
  nextStartsInMinutes: number | null
}

export function getBroadcastNow(
  schedules: readonly ScheduleSlot[],
  now: Date,
  timeZone: string,
): BroadcastNow {
  const localMinute = getLocalWeekMinute(now, timeZone)
  const activeSlots = schedules.filter((slot) => {
    if (slot.status !== 'published') return false
    const span = interval(slot)
    const elapsed = (localMinute - span.start + WEEK_MINUTES) % WEEK_MINUTES
    return elapsed < span.end - span.start
  })
  const current = activeSlots.length === 1 ? activeSlots[0] : null

  let next: ScheduleSlot | null = null
  let nextStartsInMinutes: number | null = null
  let ambiguousNext = false
  for (const slot of schedules) {
    if (slot.status !== 'published') continue
    const start = interval(slot).start
    const delta = (start - localMinute + WEEK_MINUTES) % WEEK_MINUTES
    if (delta > 0 && nextStartsInMinutes !== null && delta === nextStartsInMinutes) {
      ambiguousNext = true
    } else if (delta > 0 && (nextStartsInMinutes === null || delta < nextStartsInMinutes)) {
      next = slot
      nextStartsInMinutes = delta
      ambiguousNext = false
    }
  }
  if (next && findScheduleOverlap(next, schedules, next.id)) ambiguousNext = true
  return {
    current,
    next: ambiguousNext ? null : next,
    nextStartsInMinutes: ambiguousNext ? null : nextStartsInMinutes,
  }
}

export function isValidStreamUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) &&
      !url.username && !url.password
  } catch {
    return false
  }
}
