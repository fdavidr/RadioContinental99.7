import type { Timestamp } from 'firebase/firestore'

export type PublicationStatus = 'draft' | 'published' | 'archived'

export type FirestoreRecord = {
  id: string
  status: PublicationStatus
  isArchived: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  updatedBy: string
  publishedAt?: Timestamp
}

export type ProgramRecord = FirestoreRecord & {
  title: string
  slug: string
  searchTerms?: string[]
  description: string
  categoryId: string
  hostNames: string[]
  imageMediaId: string | null
  durationMinutes: number | null
  socialLinks?: Record<string, string>
}

export type ScheduleRecord = FirestoreRecord & {
  programId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  timeZone: string
}

export type PostRecord = FirestoreRecord & {
  title: string
  slug: string
  searchTerms?: string[]
  excerpt: string
  body: string
  categoryIds: string[]
  tagIds: string[]
  heroMediaId: string | null
  authorUid: string
  authorName?: string
  seoTitle?: string
  seoDescription?: string
}

export type CategoryRecord = FirestoreRecord & {
  name: string
  slug: string
  description: string
  sortOrder: number
}

export type TagRecord = FirestoreRecord & {
  name: string
  slug: string
}

export type MediaRecord = FirestoreRecord & {
  originalName: string
  storagePath: string
  contentType: string
  sizeBytes: number
  altText: string
  visibility: 'private' | 'public'
}

export type BannerRecord = FirestoreRecord & {
  label: string
  placement: string
  mediaId: string
  altText: string
  sortOrder: number
  targetUrl: string | null
  startsAt: Timestamp | null
  endsAt: Timestamp | null
}

export type PublicSiteConfig = {
  stationName: string
  slogan: string
  streamUrl: string | null
  stationTimeZone?: string
  contactEmail: string | null
  contactPhone: string | null
  whatsappUrl: string | null
  socialLinks: Record<string, string>
  updatedAt: Timestamp
}

export type PrivateUserProfile = {
  uid: string
  email: string
  displayName: string
  disabled: boolean
  createdAt: Timestamp
}

export type AdminLogRecord = {
  id: string
  actorUid: string
  action: 'create' | 'update' | 'archive' | 'publish' | 'visibility-change'
  collection: string
  documentId: string
  createdAt: Timestamp
  summary: string
}

export type EditorialCollection =
  | 'programs'
  | 'schedule'
  | 'posts'
  | 'categories'
  | 'tags'
  | 'media'
  | 'banners'

export type EditorialRecordMap = {
  programs: ProgramRecord
  schedule: ScheduleRecord
  posts: PostRecord
  categories: CategoryRecord
  tags: TagRecord
  media: MediaRecord
  banners: BannerRecord
}

export type CreateRecord<T extends FirestoreRecord> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isArchived'
> & {
  status?: PublicationStatus
  isArchived?: never
  publishedAt?: Timestamp
}

export type UpdateRecord<T extends FirestoreRecord> = Partial<
  Omit<T, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'isArchived'>
> & {
  isArchived?: never
}
