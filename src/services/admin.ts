import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { firestore } from '../lib/firebaseFirestore'
import { requireFirebase } from '../lib/firebaseApp'
import type { AdminLogRecord, EditorialCollection, EditorialRecordMap, PrivateUserProfile } from '../types/content'
import { getCurrentEditorialRole } from './auth'
import { toFirebaseServiceError } from './firebaseErrors'
import { findScheduleOverlap } from '../utils/broadcastSchedule'
import type { ScheduleSlot } from '../utils/broadcastSchedule'

const PAGE_SIZE_MAX = 50
function getDatabase() {
  return requireFirebase(firestore, 'Firestore')
}

async function assertSuperadmin(user: User) {
  if (!user.emailVerified || (await getCurrentEditorialRole(user)) !== 'superadmin') {
    throw new Error('Esta operación requiere una cuenta superadministradora con correo verificado.')
  }
}

async function assertEditor(user: User) {
  if (!user.emailVerified || !(await getCurrentEditorialRole(user))) {
    throw new Error('Esta operación requiere una cuenta editorial con correo verificado.')
  }
}

export type AdminPage<T extends EditorialCollection> = {
  records: Array<EditorialRecordMap[T]>
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}

export async function listAdminRecords<T extends EditorialCollection>(
  user: User,
  collectionName: T,
  options: {
    pageSize?: number
    cursor?: QueryDocumentSnapshot<DocumentData> | null
    status?: 'draft' | 'published' | 'archived' | 'all'
  } = {},
): Promise<AdminPage<T>> {
  if (collectionName === 'media' || collectionName === 'banners') await assertSuperadmin(user)
  else await assertEditor(user)
  const pageSize = Math.min(Math.max(Math.floor(options.pageSize ?? 20), 1), PAGE_SIZE_MAX)
  const filters = options.status && options.status !== 'all'
    ? [where('status', '==', options.status)]
    : []

  try {
    const request = query(
      collection(getDatabase(), collectionName),
      ...filters,
      orderBy('updatedAt', 'desc'),
      ...(options.cursor ? [startAfter(options.cursor)] : []),
      limit(pageSize + 1),
    )
    const snapshot = await getDocs(request)
    const hasNext = snapshot.docs.length > pageSize
    const docs = snapshot.docs.slice(0, pageSize)
    return {
      records: docs.map((item) => ({ id: item.id, ...item.data() }) as EditorialRecordMap[T]),
      nextCursor: hasNext ? docs[docs.length - 1] ?? null : null,
    }
  } catch (error) {
    throw toFirebaseServiceError(error, `No se pudo cargar "${collectionName}"`)
  }
}

export type AdminDashboardStats = {
  publishedPosts: number
  draftPosts: number
  publishedPrograms: number
  activeScheduleItems: number
  categories: number
}

export async function getAdminDashboardStats(user: User): Promise<AdminDashboardStats> {
  await assertEditor(user)
  try {
    const db = getDatabase()
    const count = async (name: EditorialCollection, status?: 'draft' | 'published') => {
      const base = collection(db, name)
      const request = status
        ? query(base, where('status', '==', status), where('isArchived', '==', false))
        : query(base, where('isArchived', '==', false))
      const result = await getCountFromServer(request)
      return result.data().count
    }
    const [publishedPosts, draftPosts, publishedPrograms, activeScheduleItems, categories] =
      await Promise.all([
        count('posts', 'published'),
        count('posts', 'draft'),
        count('programs', 'published'),
        count('schedule', 'published'),
        count('categories'),
      ])
    return { publishedPosts, draftPosts, publishedPrograms, activeScheduleItems, categories }
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron cargar los indicadores')
  }
}

export async function listRecentAdminActivity(user: User, maxResults = 10): Promise<AdminLogRecord[]> {
  await assertSuperadmin(user)
  try {
    const snapshot = await getDocs(query(
      collection(getDatabase(), 'adminLogs'),
      orderBy('createdAt', 'desc'),
      limit(Math.min(Math.max(Math.floor(maxResults), 1), 50)),
    ))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminLogRecord)
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cargar la actividad administrativa')
  }
}

export async function listAdminUsers(user: User): Promise<PrivateUserProfile[]> {
  await assertSuperadmin(user)
  try {
    const snapshot = await getDocs(query(collection(getDatabase(), 'users'), orderBy('email'), limit(100)))
    return snapshot.docs.map((item) => item.data() as PrivateUserProfile)
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron consultar los perfiles de usuario')
  }

}

export async function findAdminScheduleOverlap(
  user: User,
  candidate: ScheduleSlot,
  excludeId?: string,
): Promise<ScheduleSlot | null> {
  await assertEditor(user)
  try {
    const snapshot = await getDocs(query(
      collection(getDatabase(), 'schedule'),
      where('isArchived', '==', false),
    ))
    const schedules = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as ScheduleSlot[]
    return findScheduleOverlap(candidate, schedules, excludeId)
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudieron comprobar los solapamientos de programación')
  }
}
