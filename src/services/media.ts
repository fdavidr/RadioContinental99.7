import { getBlob, getMetadata, ref } from 'firebase/storage'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'

import { firebaseStorage } from '../lib/firebaseStorage'
import { firebaseFunctions } from '../lib/firebaseFunctions'
import { firestore } from '../lib/firebaseFirestore'
import { requireFirebase } from '../lib/firebaseApp'
import type { MediaRecord } from '../types/content'
import { getCurrentEditorialRole } from './auth'
import { toFirebaseServiceError } from './firebaseErrors'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const MAX_ACTIVE_MEDIA_RECORDS = 500
const PREFLIGHT_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000
const allowedTypes: Record<string, number> = {
  'image/jpeg': MAX_IMAGE_BYTES,
  'image/png': MAX_IMAGE_BYTES,
  'image/webp': MAX_IMAGE_BYTES,
  'image/avif': MAX_IMAGE_BYTES,
  'audio/mpeg': MAX_AUDIO_BYTES,
  'audio/aac': MAX_AUDIO_BYTES,
  'audio/ogg': MAX_AUDIO_BYTES,
  'audio/wav': MAX_AUDIO_BYTES,
  'video/mp4': MAX_VIDEO_BYTES,
}

export type MediaUploadStage = 'validating' | 'checking' | 'uploading'

export type MediaUploadOptions = {
  onStage?: (stage: MediaUploadStage) => void
  onProgress?: (progress: number) => void
}

export type MediaUploadOperation = {
  operationId: string
  storagePath: string
  uid: string
  originalName: string
  contentType: string
  sizeBytes: number
  altText: string
  sha256: string
}

type FinalizeMediaUploadRequest = MediaUploadOperation & { phase?: 'finalize' }

type MediaStateAction = 'publish' | 'unpublish' | 'archive'

export class MediaUploadError extends Error {
  readonly storagePath: string
  readonly stage: MediaUploadStage
  readonly errorCode?: string

  constructor(
    message: string,
    storagePath: string,
    stage: MediaUploadStage,
    errorCode?: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'MediaUploadError'
    this.storagePath = storagePath
    this.stage = stage
    this.errorCode = errorCode
  }
}

function getStorage() {
  return requireFirebase(firebaseStorage, 'Storage')
}

function getDatabase() {
  return requireFirebase(firestore, 'Firestore')
}

async function assertAdmin(user: User): Promise<void> {
  const role = await getCurrentEditorialRole(user)
  if (role !== 'superadmin') {
    throw new Error('La gestión de archivos requiere el claim superadmin asignado por un entorno confiable.')
  }
}

function validateFile(file: File): void {
  const maxBytes = allowedTypes[file.type]
  if (maxBytes === undefined) {
    throw new Error('Tipo de archivo no permitido. Se aceptan imágenes, audio MPEG/AAC/OGG/WAV y video MP4.')
  }
  if (file.size === 0 || file.size > maxBytes) {
    throw new Error(`El archivo está vacío o supera el límite para ${file.type}.`)
  }
  if (file.name.length > 180) {
    throw new Error('El nombre del archivo supera los 180 caracteres.')
  }
}

function diagnostic(
  event: string,
  storagePath: string,
  startedAt: number,
  errorCode?: string,
): void {
  const details = {
    event,
    storagePath,
    durationMs: Date.now() - startedAt,
    ...(errorCode ? { errorCode } : {}),
  }
  if (event === 'UPLOAD_FAILED') {
    console.warn('[media-upload]', details)
  } else {
    console.info('[media-upload]', details)
  }
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('cause' in error) return errorCode(error.cause)
  return undefined
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ]).finally(() => clearTimeout(timeout))
}

function uploadToResumableSession(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    const url = new URL(uploadUrl)
    const usingEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    const allowedHost = usingEmulator
      ? url.protocol === 'http:' &&
        ['127.0.0.1', 'localhost'].includes(url.hostname) &&
        url.port === '9199'
      : url.protocol === 'https:' && url.hostname === 'storage.googleapis.com'
    if (
      !allowedHost ||
      url.username !== '' ||
      url.password !== ''
    ) {
      reject(new Error('Storage devolvió una URL de carga no confiable.'))
      return
    }
    const xhr = new XMLHttpRequest()

    function finish(error?: Error): void {
      if (settled) return
      settled = true
      xhr.onload = null
      xhr.onerror = null
      xhr.onabort = null
      xhr.ontimeout = null
      xhr.upload.onprogress = null
      if (error) reject(error)
      else resolve()
    }

    xhr.open('PUT', url.toString())
    xhr.timeout = UPLOAD_TIMEOUT_MS
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('Content-Range', `bytes 0-${file.size - 1}/${file.size}`)
    xhr.upload.onprogress = (event) => {
      onProgress?.(event.lengthComputable
        ? Math.round((event.loaded / event.total) * 100)
        : 0)
    }
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        onProgress?.(100)
        finish()
        return
      }
      const message = xhr.status === 412
        ? 'El objeto ya existe y Storage rechazó la escritura condicional.'
        : xhr.status === 401
          ? 'La sesión protegida de carga expiró o no es válida. Comprobá el archivo antes de reintentar.'
          : xhr.status === 403
            ? 'Storage denegó la carga. Verificá la identidad administrativa y la configuración del bucket.'
            : xhr.status === 404
              ? 'Storage no encontró el bucket o la sesión de carga. Verificá la configuración del bucket.'
              : `Storage no confirmó la carga (HTTP ${xhr.status}).`
      const error = new Error(message)
      Object.assign(error, {
        code: xhr.status === 412 ? 'storage/object-already-exists' : 'storage/unknown',
      })
      finish(error)
    }
    xhr.onerror = () => {
      const error = new Error('Falló la conexión durante la carga. Comprobá el resultado antes de reintentar.')
      Object.assign(error, { code: 'storage/retry-limit-exceeded' })
      finish(error)
    }
    xhr.onabort = () => {
      const error = new Error('La carga se canceló. Comprobá el resultado antes de reintentar.')
      Object.assign(error, { code: 'storage/canceled' })
      finish(error)
    }
    xhr.ontimeout = () => {
      const error = new Error(`La carga se canceló al superar el límite de ${UPLOAD_TIMEOUT_MS / 1000} segundos.`)
      Object.assign(error, { code: 'storage/retry-limit-exceeded' })
      finish(error)
      xhr.abort()
    }
    xhr.send(file)
  })
}

function createUploadSession(operation: MediaUploadOperation): Promise<string> {
  const functions = requireFirebase(firebaseFunctions, 'Functions')
  const start = httpsCallable<
    MediaUploadOperation & { phase: 'start' },
    { uploadUrl: string }
  >(functions, 'finalizeMediaUpload', { timeout: 30_000 })
  return start({ ...operation, phase: 'start' }).then(({ data }) => data.uploadUrl)
}

async function hashBlob(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashFile(file: File): Promise<string> {
  return hashBlob(file)
}

function assertUploadOperation(user: User, operation: MediaUploadOperation): void {
  if (
    operation.uid !== user.uid ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operation.operationId) ||
    operation.storagePath !== `media/${operation.operationId}` ||
    !/^[a-f0-9]{64}$/.test(operation.sha256)
  ) {
    throw new Error('La operación multimedia no coincide con la sesión actual o no es válida.')
  }
}

async function verifyExistingUpload(operation: MediaUploadOperation): Promise<boolean> {
  const storageRef = ref(getStorage(), operation.storagePath)
  let metadata
  try {
    metadata = await getMetadata(storageRef)
  } catch (error) {
    if (errorCode(error) === 'storage/object-not-found') return false
    throw toFirebaseServiceError(error, 'No se pudo comprobar si la carga anterior se completó')
  }
  const custom = metadata.customMetadata ?? {}
  if (
    custom.uploadId !== operation.operationId ||
    custom.uploadedBy !== operation.uid ||
    custom.sha256 !== operation.sha256 ||
    metadata.contentType !== operation.contentType ||
    Number(metadata.size) !== operation.sizeBytes
  ) {
    throw new MediaUploadError(
      'Ya existe un archivo en la ruta reservada, pero no coincide con esta operación. No se sobrescribió.',
      operation.storagePath,
      'checking',
      'storage/object-already-exists',
    )
  }
  const blob = await getBlob(storageRef)
  if (await hashBlob(blob) !== operation.sha256) {
    throw new MediaUploadError(
      'El contenido del archivo existente no coincide con su SHA-256. No se sobrescribió.',
      operation.storagePath,
      'checking',
      'storage/integrity-check-failed',
    )
  }
  return true
}

export async function prepareMediaUpload(
  user: User,
  file: File,
  altText: string,
): Promise<MediaUploadOperation> {
  validateFile(file)
  if (!altText.trim() || altText.trim().length > 500) {
    throw new Error('Ingresá un texto alternativo de hasta 500 caracteres.')
  }
  await withTimeout(
    assertAdmin(user),
    PREFLIGHT_TIMEOUT_MS,
    'La verificación del rol tardó demasiado. Volvé a intentarlo.',
  )
  const operationId = crypto.randomUUID()
  return {
    operationId,
    storagePath: `media/${operationId}`,
    uid: user.uid,
    originalName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    altText: altText.trim(),
    sha256: await hashFile(file),
  }
}

export async function uploadMedia(
  user: User,
  file: File,
  operation: MediaUploadOperation,
  options: MediaUploadOptions,
): Promise<Pick<
  MediaRecord,
  'storagePath' | 'originalName' | 'contentType' | 'sizeBytes' | 'altText' | 'visibility'
>> {
  const { onStage, onProgress } = options
  const { storagePath } = operation
  const startedAt = Date.now()
  let stage: MediaUploadStage = 'validating'
  diagnostic('UPLOAD_STARTED', storagePath, startedAt)
  try {
    assertUploadOperation(user, operation)
    onStage?.(stage)
    validateFile(file)
    if (
      file.name !== operation.originalName ||
      file.type !== operation.contentType ||
      file.size !== operation.sizeBytes ||
      await hashFile(file) !== operation.sha256
    ) {
      throw new Error('El archivo seleccionado no coincide con la carga pendiente.')
    }
    await assertAdmin(user)

    stage = 'checking'
    onStage?.(stage)
    const activeMedia = await withTimeout(
      getCountFromServer(query(
        collection(getDatabase(), 'media'),
        where('isArchived', '==', false),
      )),
      PREFLIGHT_TIMEOUT_MS,
      'La verificación de la biblioteca tardó demasiado. Volvé a intentarlo.',
    )
    if (activeMedia.data().count >= MAX_ACTIVE_MEDIA_RECORDS) {
      throw new Error(`Se alcanzó el límite de ${MAX_ACTIVE_MEDIA_RECORDS} registros multimedia activos. Archivá contenido o solicitá aumentar el límite.`)
    }
    if (await withTimeout(
      verifyExistingUpload(operation),
      PREFLIGHT_TIMEOUT_MS,
      'La comprobación del archivo existente tardó demasiado. La recuperación puede reintentarse con el mismo ID.',
    )) {
      return {
        storagePath,
        originalName: operation.originalName,
        contentType: operation.contentType,
        sizeBytes: operation.sizeBytes,
        altText: operation.altText,
        visibility: 'private',
      }
    }

    stage = 'uploading'
    onStage?.(stage)
    try {
      const uploadUrl = await createUploadSession(operation)
      await uploadToResumableSession(uploadUrl, file, onProgress)
    } catch (uploadError) {
      const recovered = await withTimeout(
        verifyExistingUpload(operation),
        PREFLIGHT_TIMEOUT_MS,
        'La comprobación del resultado de Storage tardó demasiado. La recuperación puede reintentarse con el mismo ID.',
      )
      if (!recovered) throw uploadError
    }
    diagnostic('STORAGE_UPLOAD_COMPLETED', storagePath, startedAt)
    return {
      storagePath,
      originalName: operation.originalName,
      contentType: operation.contentType,
      sizeBytes: operation.sizeBytes,
      altText: operation.altText,
      visibility: 'private',
    }
  } catch (error) {
    const errorCodeValue = errorCode(error)
    const friendlyError = toFirebaseServiceError(error, 'No se pudo completar la carga multimedia')
    const message = friendlyError.message
    diagnostic('UPLOAD_FAILED', storagePath, startedAt, errorCodeValue)
    throw new MediaUploadError(
      message,
      storagePath,
      stage,
      errorCodeValue,
      { cause: friendlyError },
    )
  }
}

export async function finalizeMediaUpload(
  user: User,
  operation: MediaUploadOperation,
): Promise<string> {
  await assertAdmin(user)
  assertUploadOperation(user, operation)
  try {
    const functions = requireFirebase(firebaseFunctions, 'Functions')
    const finalize = httpsCallable<FinalizeMediaUploadRequest, { mediaId: string }>(
      functions,
      'finalizeMediaUpload',
      { timeout: 30_000 },
    )
    const result = await finalize({ ...operation, phase: 'finalize' })
    return result.data.mediaId
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo verificar y registrar el archivo multimedia')
  }
}

export async function changeMediaState(
  user: User,
  operationId: string,
  action: MediaStateAction,
  expectedUpdatedAt?: number,
): Promise<void> {
  await assertAdmin(user)
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(operationId)) {
    throw new Error('El identificador del medio no es válido.')
  }
  try {
    const functions = requireFirebase(firebaseFunctions, 'Functions')
    const changeState = httpsCallable(functions, 'setMediaState', { timeout: 60_000 })
    await changeState({ operationId, action, expectedUpdatedAt })
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cambiar el estado del medio')
  }
}

export async function readAdminMedia(user: User, storagePath: string): Promise<Blob> {
  await assertAdmin(user)
  if (!storagePath.startsWith('media/') || storagePath.includes('..')) {
    throw new Error('La ruta del medio no es válida.')
  }
  try {
    return await getBlob(ref(getStorage(), storagePath))
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo leer el medio privado')
  }
}
