import { Timestamp } from 'firebase/firestore'

import type { EditorialCollection } from '../types/content'
import { isValidStreamUrl, isValidTimeZone } from '../utils/broadcastSchedule'

const requiredStringFields: Record<EditorialCollection, readonly string[]> = {
  programs: ['title', 'slug', 'description', 'categoryId'],
  schedule: ['programId', 'startTime', 'endTime', 'timeZone'],
  posts: ['title', 'slug', 'excerpt', 'body', 'authorUid'],
  categories: ['name', 'slug'],
  tags: ['name', 'slug'],
  media: ['originalName', 'storagePath', 'contentType', 'altText'],
  banners: ['label', 'placement', 'mediaId', 'altText'],
}

const requiredFields: Record<EditorialCollection, readonly string[]> = {
  programs: ['title', 'slug', 'description', 'categoryId', 'hostNames', 'imageMediaId', 'durationMinutes'],
  schedule: ['programId', 'dayOfWeek', 'startTime', 'endTime', 'timeZone'],
  posts: ['title', 'slug', 'excerpt', 'body', 'categoryIds', 'tagIds', 'heroMediaId', 'authorUid'],
  categories: ['name', 'slug', 'description', 'sortOrder'],
  tags: ['name', 'slug'],
  media: ['originalName', 'storagePath', 'contentType', 'sizeBytes', 'altText', 'visibility'],
  banners: ['label', 'placement', 'mediaId', 'altText', 'sortOrder', 'targetUrl', 'startsAt', 'endsAt'],
}

const maxStringLengths: Record<EditorialCollection, Record<string, number>> = {
  programs: { title: 180, slug: 180, description: 5000, categoryId: 128 },
  schedule: { programId: 128, startTime: 5, endTime: 5, timeZone: 80 },
  posts: { title: 180, slug: 180, excerpt: 500, body: 100000, authorUid: 128, authorName: 120, seoTitle: 180, seoDescription: 320 },
  categories: { name: 100, slug: 180, description: 500 },
  tags: { name: 60, slug: 180 },
  media: { originalName: 180, storagePath: 240, contentType: 80, altText: 500 },
  banners: { label: 120, placement: 80, mediaId: 128, altText: 500 },
}

const allowedFields: Record<EditorialCollection, readonly string[]> = {
  programs: ['title', 'slug', 'searchTerms', 'description', 'categoryId', 'hostNames', 'imageMediaId', 'durationMinutes', 'socialLinks'],
  schedule: ['programId', 'dayOfWeek', 'startTime', 'endTime', 'timeZone'],
  posts: ['title', 'slug', 'searchTerms', 'excerpt', 'body', 'categoryIds', 'tagIds', 'heroMediaId', 'authorUid', 'authorName', 'seoTitle', 'seoDescription'],
  categories: ['name', 'slug', 'description', 'sortOrder'],
  tags: ['name', 'slug'],
  media: ['originalName', 'storagePath', 'contentType', 'sizeBytes', 'altText', 'visibility'],
  banners: ['label', 'placement', 'mediaId', 'altText', 'sortOrder', 'targetUrl', 'startsAt', 'endsAt'],
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function validateEditorialRecord(
  collectionName: EditorialCollection,
  value: unknown,
  options: { partial?: boolean; allowSystemFields?: boolean } = {},
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Los datos deben ser un objeto.')
  }

  const record = value as Record<string, unknown>
  const permitted = new Set([
    ...allowedFields[collectionName],
    'status',
    'publishedAt',
    ...(options.allowSystemFields ? ['isArchived', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'] : []),
  ])
  const unknownFields = Object.keys(record).filter((field) => !permitted.has(field))
  if (unknownFields.length > 0) {
    throw new Error(`Campos no permitidos: ${unknownFields.join(', ')}.`)
  }

  for (const field of requiredFields[collectionName]) {
    if (!options.partial && record[field] === undefined) {
      throw new Error(`El campo "${field}" es obligatorio.`)
    }
  }

  for (const field of requiredStringFields[collectionName]) {
    const fieldValue = record[field]
    if (options.partial && fieldValue === undefined) continue
    if (typeof fieldValue !== 'string' || fieldValue.trim().length === 0) {
      throw new Error(`El campo "${field}" es obligatorio.`)
    }
    if (fieldValue.length > maxStringLengths[collectionName][field]) {
      throw new Error(`El campo "${field}" supera el tamaño permitido.`)
    }
  }

  for (const field of ['seoTitle', 'seoDescription']) {
    if (!(field in record) || options.partial && record[field] === undefined) continue
    const value = record[field]
    if (typeof value !== 'string' || value.length > maxStringLengths.posts[field]) {
      throw new Error(`${field} debe ser texto de hasta ${maxStringLengths.posts[field]} caracteres.`)
    }
    if ('authorName' in record && record.authorName !== undefined &&
      (typeof record.authorName !== 'string' || record.authorName.length > 120)) {
      throw new Error('authorName debe ser texto de hasta 120 caracteres.')
    }
    if ('searchTerms' in record && record.searchTerms !== undefined &&
      (!Array.isArray(record.searchTerms) || record.searchTerms.length > 100 ||
        record.searchTerms.some((term) => typeof term !== 'string' || term.length > 80))) {
      throw new Error('searchTerms debe contener hasta 100 términos de búsqueda válidos.')
    }
  }

  if ('slug' in record && (typeof record.slug !== 'string' || !slugPattern.test(record.slug))) {
    throw new Error('El slug solo puede contener letras minúsculas, números y guiones.')
  }

  if ('status' in record && !['draft', 'published', 'archived'].includes(String(record.status))) {
    throw new Error('El estado editorial no es válido.')
  }
  if ('publishedAt' in record && !(record.publishedAt instanceof Timestamp)) {
    throw new Error('publishedAt debe ser un Timestamp de Firebase.')
  }

  const arrays = collectionName === 'programs'
    ? ['hostNames']
    : collectionName === 'posts'
      ? ['categoryIds', 'tagIds']
      : []
  for (const field of arrays) {
    if (field in record && (!Array.isArray(record[field]) || record[field].length > 30 ||
      record[field].some((item) => typeof item !== 'string' || item.length > 128))) {
      throw new Error(`El campo "${field}" debe ser una lista válida de identificadores/textos.`)
    }
  }

  if (
    (collectionName === 'programs' && 'imageMediaId' in record && record.imageMediaId !== null && typeof record.imageMediaId !== 'string') ||
    (collectionName === 'posts' && 'heroMediaId' in record && record.heroMediaId !== null && typeof record.heroMediaId !== 'string')
  ) {
    throw new Error('La referencia de imagen debe ser un ID de medio o null.')
  }

  if (collectionName === 'programs' && 'hostNames' in record &&
    (!Array.isArray(record.hostNames) || record.hostNames.length > 10)) {
    throw new Error('hostNames debe contener como máximo 10 conductores.')
  }
  if (collectionName === 'programs' && 'durationMinutes' in record &&
    record.durationMinutes !== null && (!Number.isInteger(record.durationMinutes) ||
      Number(record.durationMinutes) < 1 || Number(record.durationMinutes) > 1440)) {
    throw new Error('durationMinutes debe ser un entero entre 1 y 1440 o null.')
  }
  if (collectionName === 'programs' && 'socialLinks' in record) {
    const links = record.socialLinks
    if (typeof links !== 'object' || links === null || Array.isArray(links)) {
      throw new Error('socialLinks debe ser un mapa de enlaces.')
    }
    for (const [network, href] of Object.entries(links)) {
      if (!['instagram', 'facebook', 'youtube'].includes(network) ||
        typeof href !== 'string' || (href !== '' && !/^https:\/\//i.test(href))) {
        throw new Error(`El enlace de ${network} debe ser HTTPS y pertenecer a una red permitida.`)
      }
    }
  }
  if (collectionName === 'posts' && 'categoryIds' in record &&
    (!Array.isArray(record.categoryIds) || record.categoryIds.length > 20)) {
    throw new Error('categoryIds debe contener como máximo 20 categorías.')
  }

  if ('isArchived' in record && !options.allowSystemFields) {
    throw new Error('El archivado se realiza mediante la operación archiveRecord.')
  }

  if (collectionName === 'schedule' && (!options.partial || 'dayOfWeek' in record || 'startTime' in record || 'endTime' in record)) {
    if ((!options.partial || 'dayOfWeek' in record) &&
      (!Number.isInteger(record.dayOfWeek) || Number(record.dayOfWeek) < 0 || Number(record.dayOfWeek) > 6)) {
      throw new Error('dayOfWeek debe ser un número entero entre 0 y 6.')
    }
    if ((!options.partial || 'startTime' in record) && !timePattern.test(String(record.startTime))) {
      throw new Error('startTime debe utilizar el formato HH:mm.')
    }
    if ((!options.partial || 'endTime' in record) && !timePattern.test(String(record.endTime))) {
      throw new Error('Los horarios deben utilizar el formato HH:mm.')
    }
    if ((!options.partial || 'timeZone' in record) &&
      (typeof record.timeZone !== 'string' || !isValidTimeZone(record.timeZone))) {
      throw new Error('timeZone debe ser una zona horaria IANA válida.')
    }
  }

  if (collectionName === 'media' && (!options.partial || 'sizeBytes' in record || 'visibility' in record)) {
    if ((!options.partial || 'sizeBytes' in record) &&
      (!Number.isSafeInteger(record.sizeBytes) || Number(record.sizeBytes) <= 0)) {
      throw new Error('El tamaño del medio no es válido.')
    }
    if ((!options.partial || 'visibility' in record) && !['private', 'public'].includes(String(record.visibility))) {
      throw new Error('La visibilidad del medio no es válida.')
    }
  }

  if (collectionName === 'media' && 'contentType' in record &&
    !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/wav', 'video/mp4'].includes(String(record.contentType))) {
    throw new Error('El tipo MIME del medio no está permitido.')
  }
  if (collectionName === 'media' && 'storagePath' in record &&
    (typeof record.storagePath !== 'string' || !/^media\/[A-Za-z0-9._-]+$/.test(record.storagePath))) {
    throw new Error('storagePath debe ser una ruta válida dentro de media/.')
  }

  if (collectionName === 'banners' && 'targetUrl' in record && record.targetUrl !== null &&
    (typeof record.targetUrl !== 'string' || !/^https:\/\/[^ ]+$/i.test(record.targetUrl))) {
    throw new Error('targetUrl debe ser un enlace HTTPS o null.')
  }
  if (collectionName === 'banners') {
    if ('placement' in record && !['home-top', 'home-feed', 'news', 'programs', 'footer'].includes(String(record.placement))) {
      throw new Error('La ubicación del banner no es válida.')
    }
    if ('sortOrder' in record && (!Number.isInteger(record.sortOrder) || Number(record.sortOrder) < 0 || Number(record.sortOrder) > 10000)) {
      throw new Error('sortOrder debe ser un entero entre 0 y 10000.')
    }
    for (const field of ['startsAt', 'endsAt']) {
      if (field in record && record[field] !== null && !(record[field] instanceof Timestamp)) {
        throw new Error(`${field} debe ser un Timestamp de Firebase o null.`)
      }
    }
    if (record.startsAt instanceof Timestamp && record.endsAt instanceof Timestamp &&
      record.startsAt.toMillis() >= record.endsAt.toMillis()) {
      throw new Error('La fecha de inicio del banner debe ser anterior a la fecha de finalización.')
    }
  }

  if (
    collectionName === 'categories' &&
    (!options.partial || 'sortOrder' in record) &&
    (!Number.isInteger(record.sortOrder) || Number(record.sortOrder) < 0)
  ) {
    throw new Error('sortOrder debe ser un entero no negativo.')
  }
}

export function validatePublicSiteConfig(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('La configuración pública debe ser un objeto.')
  }

  const config = value as Record<string, unknown>
  if (typeof config.stationName !== 'string' || config.stationName.trim().length === 0 || config.stationName.length > 100) {
    throw new Error('stationName es obligatorio y no puede superar 100 caracteres.')
  }
  if (typeof config.slogan !== 'string' || config.slogan.length > 240) {
    throw new Error('slogan debe ser texto de hasta 240 caracteres.')
  }
  if (typeof config.socialLinks !== 'object' || config.socialLinks === null || Array.isArray(config.socialLinks)) {
    throw new Error('socialLinks debe ser un mapa de enlaces públicos.')
  }
  for (const field of ['streamUrl', 'whatsappUrl']) {
    if (field in config && config[field] !== null &&
      (typeof config[field] !== 'string' ||
        (field === 'streamUrl' ? !isValidStreamUrl(config[field]) : !config[field].startsWith('https://')))) {
      throw new Error(field === 'streamUrl'
        ? 'streamUrl debe ser una URL HTTP o HTTPS válida, sin credenciales.'
        : `${field} debe ser un enlace HTTPS o null.`)
    }
  }
  if ('stationTimeZone' in config &&
    (typeof config.stationTimeZone !== 'string' || !isValidTimeZone(config.stationTimeZone))) {
    throw new Error('stationTimeZone debe ser una zona horaria IANA válida.')
  }
  if ('contactEmail' in config && config.contactEmail !== null &&
    (typeof config.contactEmail !== 'string' || config.contactEmail.length > 254)) {
    throw new Error('contactEmail no es válido.')
  }
  if ('contactPhone' in config && config.contactPhone !== null &&
    (typeof config.contactPhone !== 'string' || config.contactPhone.length > 40)) {
    throw new Error('contactPhone no es válido.')
  }
  const socialLinks = config.socialLinks as Record<string, unknown>
  for (const [network, href] of Object.entries(socialLinks)) {
    if (!['instagram', 'facebook', 'youtube'].includes(network)) {
      throw new Error(`La red social "${network}" no está permitida.`)
    }
    if (typeof href !== 'string' || (href !== '' && !/^https:\/\//.test(href))) {
      throw new Error(`El enlace de ${network} debe ser HTTPS.`)
    }
  }
}
