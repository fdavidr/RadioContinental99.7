import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { firestore } from '../lib/firebaseFirestore'
import { requireFirebase } from '../lib/firebaseApp'
import type {
  CreateRecord,
  EditorialCollection,
  EditorialRecordMap,
  PrivateUserProfile,
  PublicationStatus,
  PublicSiteConfig,
  UpdateRecord,
} from '../types/content'
import { toFirebaseServiceError } from './firebaseErrors'
import { validateEditorialRecord, validatePublicSiteConfig } from './validation'
import { sanitizeEditorialHtml } from '../utils/sanitizeHtml'
import { findScheduleOverlap } from '../utils/broadcastSchedule'
import { editorialSearchTerms, normalizeEditorialSlug } from '../utils/editorialSearch'
import type { ScheduleSlot } from '../utils/broadcastSchedule'

const MAX_QUERY_RESULTS = 50
const MAX_SCHEDULE_RESULTS = 500
const PUBLIC_SEARCH_BATCH_SIZE = 50
const PUBLIC_SEARCH_SCAN_LIMIT = 400
type PublicListingCollection = Exclude<EditorialCollection, 'media'>

function getEditorialSearchTerms(
  collectionName: 'posts' | 'programs',
  data: Record<string, unknown>,
): string[] {
  const content = collectionName === 'posts'
    ? [data.title, data.slug, data.excerpt, data.body, data.authorName]
    : [data.title, data.slug, data.description, ...(Array.isArray(data.hostNames) ? data.hostNames : [])]
  return editorialSearchTerms(content.filter((value): value is string => typeof value === 'string').join(' '))
}

function getDatabase() {
  return requireFirebase(firestore, 'Firestore')
}

async function assertContentEditor(user: User): Promise<void> {
  if (!user.emailVerified) throw new Error('Verificá el correo de la cuenta antes de editar contenido.')
  const { getCurrentEditorialRole } = await import('./auth')
  const role = await getCurrentEditorialRole(user)
  if (role !== 'superadmin' && role !== 'editor') {
    throw new Error('La cuenta no tiene un rol editorial asignado por un administrador confiable.')
  }
}

async function assertAdmin(user: User): Promise<void> {
  if (!user.emailVerified) throw new Error('Verificá el correo de la cuenta antes de continuar.')
  const { getCurrentEditorialRole } = await import('./auth')
  const role = await getCurrentEditorialRole(user)
  if (role !== 'superadmin') {
    throw new Error('Esta operación requiere el claim superadmin asignado por un entorno confiable.')
  }
}

function appendAdminLog(
  set: (reference: DocumentReference, data: DocumentData) => unknown,
  user: User,
  action: 'create' | 'update' | 'archive' | 'publish',
  collectionName: string,
  documentId: string,
): void {
  const logRef = doc(collection(getDatabase(), 'adminLogs'))
  set(logRef, {
    actorUid: user.uid,
    action,
    collection: collectionName,
    documentId,
    createdAt: serverTimestamp(),
    summary: `${action}:${collectionName}`,
  })
}

async function assertScheduleDoesNotOverlap(
  candidate: ScheduleSlot,
  excludeId?: string,
): Promise<void> {
  const snapshot = await getDocs(query(
    collection(getDatabase(), 'schedule'),
    where('isArchived', '==', false),
  ))
  const schedules = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as ScheduleSlot[]
  const overlap = findScheduleOverlap(candidate, schedules, excludeId)
  if (overlap) {
    throw new Error(`El horario se superpone con otra emisión el día ${overlap.dayOfWeek} (${overlap.startTime}–${overlap.endTime}).`)
  }
}

export async function listPublished<K extends PublicListingCollection>(
  collectionName: K,
  maxResults = 20,
): Promise<Array<EditorialRecordMap[K]>> {
  const safeLimit = Math.min(Math.max(Math.floor(maxResults), 1), MAX_QUERY_RESULTS)
  try {
    const request = query(
      collection(getDatabase(), collectionName),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      orderBy('publishedAt', 'desc'),
      limit(safeLimit),
    )
    const snapshot = await getDocs(request)
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap[K])
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudieron leer los documentos públicos de "${collectionName}"`)
  }
}

export async function listPublishedMedia(maxResults = 20): Promise<Array<EditorialRecordMap['media']>> {
  const safeLimit = Math.min(Math.max(Math.floor(maxResults), 1), MAX_QUERY_RESULTS)
  try {
    const request = query(
      collection(getDatabase(), 'media'),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      where('visibility', '==', 'public'),
      orderBy('publishedAt', 'desc'),
      limit(safeLimit),
    )
    const snapshot = await getDocs(request)
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap['media'])
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron leer los medios públicos')
  }
}

export async function listPublicBanners(placement: string): Promise<Array<EditorialRecordMap['banners']>> {
  const allowedPlacements = new Set(['home-top', 'home-feed', 'news', 'programs', 'footer'])
  if (!allowedPlacements.has(placement)) throw new Error('La ubicación solicitada no es válida.')
  try {
    const snapshot = await getDocs(query(
      collection(getDatabase(), 'banners'),
      where('placement', '==', placement),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      limit(MAX_QUERY_RESULTS),
    ))
    const now = Timestamp.now()
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap['banners'])
      .filter((banner) =>
        (!banner.startsAt || banner.startsAt.toMillis() <= now.toMillis()) &&
        (!banner.endsAt || banner.endsAt.toMillis() >= now.toMillis()),
      )
      .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
        left.label.localeCompare(right.label, 'es'))
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudieron consultar los banners de "${placement}"`)
  }
}

const publicMediaRequests = new Map<string, Promise<{ blob: Blob; altText: string } | null>>()

export async function getPublishedMediaBlob(mediaId: string): Promise<{ blob: Blob; altText: string } | null> {
  if (!mediaId.trim()) return null
  const existingRequest = publicMediaRequests.get(mediaId)
  if (existingRequest) return existingRequest
  const request = (async () => {
    try {
      const snapshot = await getDoc(doc(getDatabase(), 'media', mediaId))
      if (!snapshot.exists()) return null
      const media = snapshot.data()
      if (media.status !== 'published' || media.isArchived !== false ||
        media.visibility !== 'public' || typeof media.storagePath !== 'string') return null
      const storagePath = media.storagePath
      return {
        blob: await import('./publicMedia').then(({ readPublicMedia }) => readPublicMedia(storagePath)),
        altText: typeof media.altText === 'string' ? media.altText : '',
      }
    } catch (error) {
      throw toFirebaseServiceError(error, 'No se pudo cargar la imagen pública')
    }
  })()
  publicMediaRequests.set(mediaId, request)
  try {
    return await request
  } finally {
    publicMediaRequests.delete(mediaId)
  }
}

export async function findPublishedBySlug<K extends 'programs' | 'posts'>(
  collectionName: K,
  slug: string,
): Promise<EditorialRecordMap[K] | null> {
  const normalizedSlug = normalizeEditorialSlug(slug)
  if (!normalizedSlug) return null
  try {
    const request = query(
      collection(getDatabase(), collectionName),
      where('slug', '==', normalizedSlug),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      limit(2),
    )
    const snapshot = await getDocs(request)
    if (snapshot.docs.length > 1) {
      throw new Error(`El slug "${normalizedSlug}" está duplicado; corregí los registros antes de publicarlos.`)
    }
    const item = snapshot.docs[0]
    return item ? ({ id: item.id, ...item.data() } as EditorialRecordMap[K]) : null
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo buscar el documento "${normalizedSlug}"`)
  }
}

export type PublicContentCollection = 'posts' | 'programs'
export type PublicContentPageOptions = {
  search?: string
  categoryId?: string
  tagId?: string
  from?: Date
  to?: Date
  pageSize?: number
  cursor?: QueryDocumentSnapshot<DocumentData> | null
}

export async function listPublicContentPage<K extends PublicContentCollection>(
  collectionName: K,
  options: PublicContentPageOptions = {},
): Promise<{
  records: Array<EditorialRecordMap[K]>
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}> {
  const pageSize = Math.min(Math.max(Math.floor(options.pageSize ?? 12), 1), 30)
  if ((options.from && Number.isNaN(options.from.getTime())) ||
    (options.to && Number.isNaN(options.to.getTime()))) {
    throw new Error('Las fechas de búsqueda no son válidas.')
  }
  if (options.from && options.to && options.from > options.to) {
    throw new Error('La fecha inicial no puede ser posterior a la fecha final.')
  }
  const terms = editorialSearchTerms(options.search ?? '')
  const searchTerm = terms[0]
  const indexedFacet = !searchTerm
    ? options.categoryId
      ? collectionName === 'posts'
        ? where('categoryIds', 'array-contains', options.categoryId)
        : where('categoryId', '==', options.categoryId)
      : options.tagId && collectionName === 'posts'
        ? where('tagIds', 'array-contains', options.tagId)
        : null
    : null
  const filters = [
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    ...(searchTerm ? [where('searchTerms', 'array-contains', searchTerm)] : []),
    ...(indexedFacet ? [indexedFacet] : []),
    ...(options.from ? [where('publishedAt', '>=', Timestamp.fromDate(options.from))] : []),
    ...(options.to ? [where('publishedAt', '<=', Timestamp.fromDate(options.to))] : []),
  ]
  const records: Array<EditorialRecordMap[K]> = []
  const matches: Array<{ record: EditorialRecordMap[K]; snapshot: QueryDocumentSnapshot<DocumentData> }> = []
  let cursor = options.cursor ?? null
  let scanned = 0

  try {
    while (matches.length <= pageSize && scanned < PUBLIC_SEARCH_SCAN_LIMIT) {
      const request = query(
        collection(getDatabase(), collectionName),
        ...filters,
        orderBy('publishedAt', 'desc'),
        ...(cursor ? [startAfter(cursor)] : []),
        limit(PUBLIC_SEARCH_BATCH_SIZE),
      )
      const snapshot = await getDocs(request)
      if (snapshot.empty) break

      for (const item of snapshot.docs) {
        scanned += 1
        cursor = item
        const data = item.data()
        const searchableText = editorialSearchTerms([
          data.title, data.slug, data.excerpt, data.body, data.description, data.authorName,
          ...(Array.isArray(data.hostNames) ? data.hostNames : []),
        ].filter((value): value is string => typeof value === 'string').join(' '))
        const categoryMatches = !options.categoryId ||
          (collectionName === 'posts'
            ? Array.isArray(data.categoryIds) && data.categoryIds.includes(options.categoryId)
            : data.categoryId === options.categoryId)
        const tagMatches = !options.tagId ||
          (collectionName === 'posts' && Array.isArray(data.tagIds) && data.tagIds.includes(options.tagId))
        if (terms.every((term) => searchableText.includes(term)) && categoryMatches && tagMatches) {
          matches.push({
            record: { id: item.id, ...data } as EditorialRecordMap[K],
            snapshot: item,
          })
          if (matches.length > pageSize) break
        }
        if (scanned >= PUBLIC_SEARCH_SCAN_LIMIT) break
      }

      if (matches.length > pageSize || snapshot.docs.length < PUBLIC_SEARCH_BATCH_SIZE ||
        scanned >= PUBLIC_SEARCH_SCAN_LIMIT) break
      cursor = snapshot.docs[snapshot.docs.length - 1] ?? cursor
    }

    let nextCursor = matches.length > pageSize ? matches[pageSize - 1]?.snapshot ?? null : null
    if (!nextCursor && scanned >= PUBLIC_SEARCH_SCAN_LIMIT && cursor) {
      const probe = await getDocs(query(
        collection(getDatabase(), collectionName),
        ...filters,
        orderBy('publishedAt', 'desc'),
        startAfter(cursor),
        limit(1),
      ))
      if (!probe.empty) nextCursor = cursor
    }

    records.push(...matches.slice(0, pageSize).map((match) => match.record))
    return {
      records,
      nextCursor,
    }
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo consultar el contenido público de "${collectionName}"`)
  }
}

export async function listPublicSchedule(dayOfWeek?: number): Promise<Array<EditorialRecordMap['schedule']>> {
  if (dayOfWeek !== undefined && (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)) {
    throw new Error('dayOfWeek debe ser un número entero entre 0 y 6.')
  }

  try {
    const filters = [
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      ...(dayOfWeek === undefined ? [] : [where('dayOfWeek', '==', dayOfWeek)]),
    ]
    const request = query(
      collection(getDatabase(), 'schedule'),
      ...filters,
      orderBy('startTime', 'asc'),
      limit(MAX_SCHEDULE_RESULTS),
    )
    const snapshot = await getDocs(request)
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap['schedule'])
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo leer la programación pública')
  }
}

export async function listPublicProgramSchedule(programId: string): Promise<Array<EditorialRecordMap['schedule']>> {
  if (!programId.trim()) return []
  try {
    const snapshot = await getDocs(query(
      collection(getDatabase(), 'schedule'),
      where('programId', '==', programId),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
      orderBy('dayOfWeek', 'asc'),
      orderBy('startTime', 'asc'),
      limit(50),
    ))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap['schedule'])
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron consultar los horarios públicos del programa')
  }
}

export async function listPublicBroadcastData(): Promise<{
  config: PublicSiteConfig | null
  schedule: Array<EditorialRecordMap['schedule']>
  programs: Array<EditorialRecordMap['programs']>
  scheduleError: string
}> {
  const [configResult, scheduleResult, programsResult] = await Promise.allSettled([
    getPublicSiteConfig(),
    listPublicSchedule(),
    listPublished('programs', 50),
  ])
  if (configResult.status === 'rejected') throw configResult.reason
  const scheduleError = scheduleResult.status === 'rejected'
    ? scheduleResult.reason instanceof Error ? scheduleResult.reason.message : 'No se pudo consultar la grilla pública.'
    : programsResult.status === 'rejected'
      ? programsResult.reason instanceof Error ? programsResult.reason.message : 'No se pudieron consultar los programas públicos.'
      : ''
  return {
    config: configResult.value,
    schedule: scheduleResult.status === 'fulfilled' ? scheduleResult.value : [],
    programs: programsResult.status === 'fulfilled' ? programsResult.value : [],
    scheduleError,
  }
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig | null> {
  try {
    const snapshot = await getDoc(doc(getDatabase(), 'publicConfig', 'site'))
    return snapshot.exists() ? (snapshot.data() as PublicSiteConfig) : null
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo leer la configuración pública')
  }
}

export async function getOwnUserProfile(user: User): Promise<PrivateUserProfile | null> {
  try {
    const snapshot = await getDoc(doc(getDatabase(), 'users', user.uid))
    return snapshot.exists() ? (snapshot.data() as PrivateUserProfile) : null
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo leer el perfil privado')
  }
}

export async function createRecord<K extends EditorialCollection>(
  user: User,
  collectionName: K,
  input: CreateRecord<EditorialRecordMap[K]>,
): Promise<string> {
  await assertContentEditor(user)
  if (collectionName === 'media' || collectionName === 'banners') await assertAdmin(user)
  const inputData: Record<string, unknown> = { ...input }
  if (collectionName === 'posts' && typeof inputData.body === 'string') {
    inputData.body = sanitizeEditorialHtml(inputData.body)
  }
  validateEditorialRecord(collectionName, inputData)
  if (inputData.status === 'archived') {
    throw new Error('Creá el documento y archívalo con archiveRecord para conservar el registro de auditoría.')
  }

  try {
    const db = getDatabase()
    const recordRef = doc(collection(db, collectionName))
    const status = inputData.status ?? 'draft'
    const payload: DocumentData = {
      ...inputData,
      ...(collectionName === 'posts' || collectionName === 'programs'
        ? { searchTerms: getEditorialSearchTerms(collectionName, inputData) }
        : {}),
      status,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      updatedBy: user.uid,
      ...(status === 'published' ? { publishedAt: inputData.publishedAt ?? serverTimestamp() } : {}),
    }
    if ((collectionName === 'posts' || collectionName === 'programs') &&
      typeof inputData.slug === 'string') {
      const duplicate = await getDocs(query(
        collection(db, collectionName),
        where('slug', '==', inputData.slug),
        limit(1),
      ))
      if (!duplicate.empty) throw new Error(`Ya existe un documento con el slug "${inputData.slug}".`)
    }
    if (collectionName === 'schedule') {
      await assertScheduleDoesNotOverlap({
        id: recordRef.id,
        programId: String(inputData.programId),
        dayOfWeek: Number(inputData.dayOfWeek),
        startTime: String(inputData.startTime),
        endTime: String(inputData.endTime),
        timeZone: String(inputData.timeZone),
        status: String(status) as PublicationStatus,
      })
    }
    await runTransaction(db, async (transaction) => {
      transaction.set(recordRef, payload)
      appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', collectionName, recordRef.id)
    })
    return recordRef.id
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo crear el documento en "${collectionName}"`)
  }
}

export type WeeklyScheduleInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
  timeZone: string
}

export async function listProgramSchedule(user: User, programId: string): Promise<Array<EditorialRecordMap['schedule']>> {
  await assertContentEditor(user)
  try {
    const snapshot = await getDocs(query(
      collection(getDatabase(), 'schedule'),
      where('programId', '==', programId),
      where('isArchived', '==', false),
      limit(50),
    ))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap['schedule'])
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron cargar las emisiones del programa')
  }
}

export async function createProgramWithSchedule(
  user: User,
  input: CreateRecord<EditorialRecordMap['programs']>,
  weeklySchedule: WeeklyScheduleInput[],
): Promise<string> {
  await assertContentEditor(user)
  validateEditorialRecord('programs', input)
  if (input.status === 'archived') throw new Error('Un programa nuevo no puede crearse archivado.')
  if (weeklySchedule.length === 0 || weeklySchedule.length > 7) {
    throw new Error('Seleccioná entre uno y siete días de emisión.')
  }
  const days = new Set<number>()
  for (const slot of weeklySchedule) {
    if (days.has(slot.dayOfWeek)) throw new Error('No se puede repetir un día de emisión para el mismo programa.')
    days.add(slot.dayOfWeek)
    validateEditorialRecord('schedule', {
      programId: 'pending-program',
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeZone: slot.timeZone,
    })
  }

  const db = getDatabase()
  const programRef = doc(collection(db, 'programs'))
  try {
    const duplicate = await getDocs(query(
      collection(db, 'programs'),
      where('slug', '==', input.slug),
      limit(1),
    ))
    if (!duplicate.empty) throw new Error(`Ya existe un programa con el slug "${input.slug}".`)
    const programStatus = input.status ?? 'draft'
    const programData: DocumentData = {
      ...input,
      searchTerms: getEditorialSearchTerms('programs', input as Record<string, unknown>),
      status: programStatus,
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
      updatedBy: user.uid,
      ...(programStatus === 'published' ? { publishedAt: input.publishedAt ?? serverTimestamp() } : {}),
    }

    const existingSnapshot = await getDocs(query(
      collection(db, 'schedule'),
      where('isArchived', '==', false),
    ))
    const proposedSchedule = existingSnapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ScheduleSlot[]
    const proposedEntries: ScheduleSlot[] = []
    for (const slot of weeklySchedule) {
      const candidate: ScheduleSlot = {
        id: `pending-${programRef.id}-${slot.dayOfWeek}`,
        programId: programRef.id,
        ...slot,
        status: programStatus,
      }
      const overlap = findScheduleOverlap(candidate, [...proposedSchedule, ...proposedEntries])
      if (overlap) {
        throw new Error(`El horario se superpone con otra emisión el día ${overlap.dayOfWeek} (${overlap.startTime}–${overlap.endTime}).`)
      }
      proposedEntries.push({ ...candidate, status: 'published' })
    }

    await runTransaction(db, async (transaction) => {
      transaction.set(programRef, programData)
      appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', 'programs', programRef.id)
      for (const slot of weeklySchedule) {
        const scheduleRef = doc(collection(db, 'schedule'))
        transaction.set(scheduleRef, {
          ...slot,
          programId: programRef.id,
          status: programStatus,
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          updatedBy: user.uid,
          ...(programStatus === 'published' ? { publishedAt: serverTimestamp() } : {}),
        })
        appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', 'schedule', scheduleRef.id)
      }
    })
    return programRef.id
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo crear el programa y sus emisiones')
  }
}

export async function updateProgramWithSchedule(
  user: User,
  programId: string,
  changes: UpdateRecord<EditorialRecordMap['programs']>,
  weeklySchedule: WeeklyScheduleInput[],
  expectedUpdatedAt: Timestamp,
): Promise<void> {
  await assertContentEditor(user)
  validateEditorialRecord('programs', changes, { partial: true })
  if (changes.status === 'archived') throw new Error('Usá archiveRecord para archivar un programa.')
  if (weeklySchedule.length === 0 || weeklySchedule.length > 7) {
    throw new Error('Seleccioná entre uno y siete días de emisión.')
  }
  const selectedDays = new Set<number>()
  for (const slot of weeklySchedule) {
    if (selectedDays.has(slot.dayOfWeek)) throw new Error('No se puede repetir un día de emisión para el mismo programa.')
    selectedDays.add(slot.dayOfWeek)
    validateEditorialRecord('schedule', {
      programId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeZone: slot.timeZone,
    })
  }

  const db = getDatabase()
  const programRef = doc(db, 'programs', programId)
  try {
    const existingSchedules = await listProgramSchedule(user, programId)
    const scheduleByDay = new Map<number, EditorialRecordMap['schedule']>()
    for (const schedule of existingSchedules) {
      if (scheduleByDay.has(schedule.dayOfWeek)) {
        throw new Error('Hay más de una emisión en el mismo día. Corregí esos registros desde Programación antes de editar el programa.')
      }
      scheduleByDay.set(schedule.dayOfWeek, schedule)
    }

    const externalSchedulesSnapshot = await getDocs(query(
      collection(db, 'schedule'),
      where('isArchived', '==', false),
    ))
    let proposedSchedule: ScheduleSlot[] = externalSchedulesSnapshot.docs
      .filter((item) => item.data().programId !== programId)
      .map((item) => ({ id: item.id, ...item.data() })) as ScheduleSlot[]
    const nextStatus = changes.status ?? 'published'
    for (const slot of weeklySchedule) {
      const candidate: ScheduleSlot = {
        id: `pending-${programId}-${slot.dayOfWeek}`,
        programId,
        ...slot,
        status: nextStatus,
      }
      const overlap = findScheduleOverlap(candidate, proposedSchedule)
      if (overlap) {
        throw new Error(`El horario se superpone con otra emisión el día ${overlap.dayOfWeek} (${overlap.startTime}–${overlap.endTime}).`)
      }
      proposedSchedule = [...proposedSchedule, { ...candidate, status: 'published' }]
    }

    await runTransaction(db, async (transaction) => {
      const currentProgram = await transaction.get(programRef)
      if (!currentProgram.exists()) throw new Error(`No existe el programa "${programId}".`)
      const currentData = currentProgram.data()
      if (!(currentData.updatedAt instanceof Timestamp) ||
        !currentData.updatedAt.isEqual(expectedUpdatedAt)) {
        throw new Error('El programa fue modificado desde otra sesión. Recargá antes de guardar.')
      }
      const scheduleRefs = [...existingSchedules.map((schedule) => doc(db, 'schedule', schedule.id))]
      const currentScheduleSnapshots = await Promise.all(scheduleRefs.map((reference) => transaction.get(reference)))
      for (let index = 0; index < currentScheduleSnapshots.length; index += 1) {
        const latest = currentScheduleSnapshots[index]
        const original = existingSchedules[index]
        if (!latest?.exists() || !(latest.data().updatedAt instanceof Timestamp) ||
          !latest.data().updatedAt.isEqual(original.updatedAt)) {
          throw new Error('Una emisión fue modificada desde otra sesión. Recargá antes de guardar.')
        }
      }

      const nextData = { ...currentData, ...changes }
      validateEditorialRecord('programs', nextData, { allowSystemFields: true })
      const searchTerms = getEditorialSearchTerms('programs', nextData)
      const effectiveStatus = (changes.status ?? currentData.status) as PublicationStatus
      transaction.update(programRef, {
        ...changes,
        searchTerms,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        ...(changes.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
      })
      appendAdminLog((ref, data) => transaction.set(ref, data), user,
        changes.status === 'published' ? 'publish' : 'update', 'programs', programId)

      for (const slot of weeklySchedule) {
        const prior = scheduleByDay.get(slot.dayOfWeek)
        const status = effectiveStatus
        if (prior) {
          transaction.update(doc(db, 'schedule', prior.id), {
            ...slot,
            status,
            ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          })
          appendAdminLog((ref, data) => transaction.set(ref, data), user, 'update', 'schedule', prior.id)
        } else {
          const scheduleRef = doc(collection(db, 'schedule'))
          transaction.set(scheduleRef, {
            ...slot,
            programId,
            status,
            isArchived: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            updatedBy: user.uid,
            ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
          })
          appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', 'schedule', scheduleRef.id)
        }
      }

      for (const prior of existingSchedules) {
        if (!selectedDays.has(prior.dayOfWeek)) {
          transaction.update(doc(db, 'schedule', prior.id), {
            status: 'archived',
            isArchived: true,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          })
          appendAdminLog((ref, data) => transaction.set(ref, data), user, 'archive', 'schedule', prior.id)
        }
      }
    })
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo actualizar el programa y sus emisiones')
  }
}

export async function duplicateProgramWithSchedule(
  user: User,
  programId: string,
  expectedUpdatedAt: Timestamp,
  newSlug: string,
): Promise<string> {
  await assertContentEditor(user)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)) throw new Error('El nuevo slug no es válido.')
  const db = getDatabase()
  const programRef = doc(db, 'programs', programId)
  const copyRef = doc(collection(db, 'programs'))

  try {
    const [collision, scheduleSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'programs'), where('slug', '==', newSlug), limit(1))),
      getDocs(query(
        collection(db, 'schedule'),
        where('programId', '==', programId),
        where('isArchived', '==', false),
        limit(50),
      )),
    ])
    if (!collision.empty) throw new Error(`Ya existe un programa con el slug "${newSlug}".`)
    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(programRef)
      if (!current.exists()) throw new Error('El programa original ya no existe.')
      const currentData = current.data()
      if (!(currentData.updatedAt instanceof Timestamp) ||
        !currentData.updatedAt.isEqual(expectedUpdatedAt)) {
        throw new Error('El programa fue modificado por otra persona. Recargá e intentá de nuevo.')
      }

      const status = 'draft' as const
      const programPayload = {
        title: `${currentData.title} (copia)`,
        slug: newSlug,
        description: currentData.description,
        categoryId: currentData.categoryId,
        hostNames: currentData.hostNames,
        imageMediaId: currentData.imageMediaId ?? null,
        durationMinutes: currentData.durationMinutes ?? null,
        ...(currentData.socialLinks ? { socialLinks: currentData.socialLinks } : {}),
        searchTerms: getEditorialSearchTerms('programs', {
          ...currentData,
          title: `${currentData.title} (copia)`,
          slug: newSlug,
        }),
        status,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
        updatedBy: user.uid,
      }
      validateEditorialRecord('programs', programPayload, { allowSystemFields: true })
      transaction.set(copyRef, programPayload)
      appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', 'programs', copyRef.id)

      for (const source of scheduleSnapshot.docs) {
        const scheduleRef = doc(collection(db, 'schedule'))
        const schedulePayload = {
          programId: copyRef.id,
          dayOfWeek: source.data().dayOfWeek,
          startTime: source.data().startTime,
          endTime: source.data().endTime,
          timeZone: source.data().timeZone,
          status,
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid,
          updatedBy: user.uid,
        }
        validateEditorialRecord('schedule', schedulePayload, { allowSystemFields: true })
        transaction.set(scheduleRef, schedulePayload)
        appendAdminLog((ref, data) => transaction.set(ref, data), user, 'create', 'schedule', scheduleRef.id)
      }
    })
    return copyRef.id
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo duplicar el programa y sus horarios')
  }
}

export async function updateRecord<K extends EditorialCollection>(
  user: User,
  collectionName: K,
  recordId: string,
  changes: UpdateRecord<EditorialRecordMap[K]>,
  expectedUpdatedAt?: Timestamp,
): Promise<void> {
  if (!recordId.trim()) throw new Error('El identificador del documento es obligatorio.')
  await assertContentEditor(user)
  const cleanChanges: Record<string, unknown> = { ...changes }
  if (collectionName === 'posts' && typeof cleanChanges.body === 'string') {
    cleanChanges.body = sanitizeEditorialHtml(cleanChanges.body)
  }
  validateEditorialRecord(collectionName, cleanChanges, { partial: true })
  if (changes.status === 'archived') {
    throw new Error('Usá archiveRecord para archivar un documento.')
  }
  if (collectionName === 'media' || collectionName === 'banners') await assertAdmin(user)

  try {
    const db = getDatabase()
    const recordRef = doc(db, collectionName, recordId)
    const existing = await getDoc(recordRef)
    if (!existing.exists()) {
      throw new Error(`No existe el documento "${recordId}" en "${collectionName}".`)
    }
    const currentData = existing.data()
    if (typeof cleanChanges.slug === 'string' && cleanChanges.slug !== currentData.slug) {
      const duplicates = await getDocs(query(
        collection(db, collectionName),
        where('slug', '==', cleanChanges.slug),
        limit(2),
      ))
      if (duplicates.docs.some((item) => item.id !== recordId)) {
        throw new Error(`Ya existe otro documento con el slug "${cleanChanges.slug}".`)
      }
    }
    validateEditorialRecord(collectionName, { ...currentData, ...cleanChanges }, { allowSystemFields: true })
    const targetData = { ...currentData, ...cleanChanges }
    const targetMediaIsPublic = collectionName === 'media'
      && targetData.status === 'published'
      && targetData.isArchived === false
      && targetData.visibility === 'public'
    const currentMediaIsPublic = collectionName === 'media'
      && currentData.status === 'published'
      && currentData.isArchived === false
      && currentData.visibility === 'public'
    const storagePath = collectionName === 'media' ? currentData.storagePath : null
    if (collectionName === 'schedule') {
      const nextRecord = { ...currentData, ...cleanChanges }
      await assertScheduleDoesNotOverlap({
        id: recordId,
        programId: String(nextRecord.programId),
        dayOfWeek: Number(nextRecord.dayOfWeek),
        startTime: String(nextRecord.startTime),
        endTime: String(nextRecord.endTime),
        timeZone: String(nextRecord.timeZone),
        status: String(nextRecord.status) as PublicationStatus,
      }, recordId)
    }
    if (collectionName === 'media' && typeof storagePath !== 'string') {
      throw new Error('El documento de medio no contiene una ruta de Storage válida.')
    }

    if (currentMediaIsPublic && !targetMediaIsPublic) {
      await import('./media').then(({ setMediaVisibility }) => setMediaVisibility(user, storagePath as string, 'private'))
    }

    await runTransaction(db, async (transaction) => {
      const latest = await transaction.get(recordRef)
      if (!latest.exists()) throw new Error(`No existe el documento "${recordId}" en "${collectionName}".`)
      const latestData = latest.data()
      if (expectedUpdatedAt && (!(latestData.updatedAt instanceof Timestamp) ||
        !latestData.updatedAt.isEqual(expectedUpdatedAt))) {
        throw new Error('Este registro fue modificado por otra persona. Recargá la lista y aplicá tus cambios nuevamente.')
      }
      validateEditorialRecord(collectionName, { ...latestData, ...cleanChanges }, { allowSystemFields: true })
      transaction.update(recordRef, {
        ...cleanChanges,
        ...(collectionName === 'posts' || collectionName === 'programs'
          ? { searchTerms: getEditorialSearchTerms(collectionName, targetData) }
          : {}),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        ...(cleanChanges.status === 'published'
          ? { publishedAt: cleanChanges.publishedAt ?? serverTimestamp() }
          : {}),
      })
      appendAdminLog(
        (ref, data) => transaction.set(ref, data),
        user,
        cleanChanges.status === 'published' ? 'publish' : 'update',
        collectionName,
        recordId,
      )
    })

    if (targetMediaIsPublic && !currentMediaIsPublic) {
      try {
        await import('./media').then(({ setMediaVisibility }) => setMediaVisibility(user, storagePath as string, 'public'))
      } catch (error) {
        throw new Error(
          `El registro de medio quedó publicado en Firestore, pero Storage sigue privado. Revisá y reintentá la publicación del archivo.`,
          { cause: error },
        )
      }
    }
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo actualizar "${recordId}"`)
  }
}

export async function archiveRecord<K extends EditorialCollection>(
  user: User,
  collectionName: K,
  recordId: string,
  expectedUpdatedAt?: Timestamp,
): Promise<void> {
  if (!recordId.trim()) throw new Error('El identificador del documento es obligatorio.')
  await assertContentEditor(user)
  if (collectionName === 'media' || collectionName === 'banners') await assertAdmin(user)

  try {
    const db = getDatabase()
    const recordRef = doc(db, collectionName, recordId)

    if (collectionName === 'media') {
      const existing = await getDoc(recordRef)
      const storagePath = existing.data()?.storagePath
      if (typeof storagePath !== 'string') {
        throw new Error(`El documento de medio "${recordId}" no contiene una ruta de Storage válida.`)
      }
      await import('./media').then(({ setMediaVisibility }) => setMediaVisibility(user, storagePath, 'private'))
    }

    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(recordRef)
      if (!existing.exists()) throw new Error(`No existe el documento "${recordId}" en "${collectionName}".`)
      const currentUpdatedAt = existing.data().updatedAt
      if (expectedUpdatedAt && (!(currentUpdatedAt instanceof Timestamp) ||
        !currentUpdatedAt.isEqual(expectedUpdatedAt))) {
        throw new Error('Este registro fue modificado por otra persona. Recargá la lista y reintentá.')
      }
      transaction.update(recordRef, {
        status: 'archived',
        isArchived: true,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      })
      appendAdminLog((ref, data) => transaction.set(ref, data), user, 'archive', collectionName, recordId)
    })
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo archivar "${recordId}"`)
  }
}

export async function updatePublicSiteConfig(
  user: User,
  config: Omit<PublicSiteConfig, 'updatedAt'>,
  expectedUpdatedAt?: Timestamp | null,
): Promise<void> {
  await assertAdmin(user)
  validatePublicSiteConfig(config)

  try {
    const db = getDatabase()
    const configRef = doc(db, 'publicConfig', 'site')
    await runTransaction(db, async (transaction) => {
      const current = await transaction.get(configRef)
      const currentUpdatedAt = current.data()?.updatedAt
      if (expectedUpdatedAt === null && current.exists()) {
        throw new Error('La configuración se creó desde otra sesión. Recargá antes de guardar.')
      }
      if (expectedUpdatedAt && (!(currentUpdatedAt instanceof Timestamp) ||
        !currentUpdatedAt.isEqual(expectedUpdatedAt))) {
        throw new Error('La configuración fue modificada desde otra sesión. Recargá antes de guardar.')
      }
      transaction.set(configRef, { ...config, updatedAt: serverTimestamp() })
      appendAdminLog((ref, data) => transaction.set(ref, data), user, 'update', 'publicConfig', 'site')
    })
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo actualizar la configuración pública')
  }
}
