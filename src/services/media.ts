import { getBlob, getMetadata, ref, updateMetadata, uploadBytes } from 'firebase/storage'
import { collection, getCountFromServer, getDocs, limit, query, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'

import { firebaseStorage } from '../lib/firebaseStorage'
import { firestore } from '../lib/firebaseFirestore'
import { requireFirebase } from '../lib/firebaseApp'
import type { MediaRecord } from '../types/content'
import { getCurrentEditorialRole } from './auth'
import { toFirebaseServiceError } from './firebaseErrors'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const MAX_ACTIVE_MEDIA_RECORDS = 500
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

function sanitizeFileName(name: string): string {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180)
}

export async function uploadMedia(user: User, file: File, altText: string): Promise<Pick<
  MediaRecord,
  'storagePath' | 'originalName' | 'contentType' | 'sizeBytes' | 'altText' | 'visibility'
>> {
  await assertAdmin(user)
  validateFile(file)
  if (altText.trim().length > 500) throw new Error('El texto alternativo no puede superar 500 caracteres.')
  let activeMediaCount: number
  try {
    const activeMedia = await getCountFromServer(query(
      collection(getDatabase(), 'media'),
      where('isArchived', '==', false),
    ))
    activeMediaCount = activeMedia.data().count
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo comprobar el límite de almacenamiento')
  }
  if (activeMediaCount >= MAX_ACTIVE_MEDIA_RECORDS) {
    throw new Error(`Se alcanzó el límite de ${MAX_ACTIVE_MEDIA_RECORDS} registros multimedia activos. Archivá contenido o solicitá aumentar el límite.`)
  }

  const storagePath = `media/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  try {
    await uploadBytes(ref(getStorage(), storagePath), file, {
      contentType: file.type,
      customMetadata: { visibility: 'private', uploadedBy: user.uid },
    })
    return {
      storagePath,
      originalName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      altText: altText.trim(),
      visibility: 'private',
    }
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cargar el archivo')
  }
}

export async function setMediaVisibility(
  user: User,
  storagePath: string,
  visibility: 'private' | 'public',
): Promise<void> {
  await assertAdmin(user)
  if (!storagePath.startsWith('media/') || storagePath.includes('..')) {
    throw new Error('La ruta del medio no es válida.')
  }

  try {
    if (visibility === 'public') {
      const publishedRecord = await getDocs(query(
        collection(getDatabase(), 'media'),
        where('storagePath', '==', storagePath),
        where('status', '==', 'published'),
        where('isArchived', '==', false),
        where('visibility', '==', 'public'),
        limit(1),
      ))
      if (publishedRecord.empty) {
        throw new Error('Publicá primero el registro del medio en Firestore y asignale visibilidad pública.')
      }
    }

    const storageRef = ref(getStorage(), storagePath)
    const metadata = await getMetadata(storageRef)
    const uploadedBy = metadata.customMetadata?.uploadedBy
    if (!uploadedBy) {
      throw new Error('El archivo no contiene metadata de carga válida; no se modificó su visibilidad.')
    }
    await updateMetadata(storageRef, {
      customMetadata: { ...metadata.customMetadata, visibility, uploadedBy, updatedBy: user.uid },
    })
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cambiar la visibilidad del archivo')
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
