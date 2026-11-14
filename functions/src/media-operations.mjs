import { createHash } from 'node:crypto'
import { createMediaStateOperation } from './media-state.mjs'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const OPERATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SHA256 = /^[0-9a-f]{64}$/
const RESUMABLE_UPLOAD_ORIGINS = new Set([
  'https://continental99.fm',
  'https://www.continental99.fm',
  'https://continental997.fm',
  'https://www.continental997.fm',
])

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function isSuperadmin(request) {
  return Boolean(
    request.auth?.uid &&
    request.auth.token.email_verified === true &&
    request.auth.token.superadmin === true,
  )
}

function requireSuperadmin(request, HttpsError) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Iniciá sesión para continuar.')
  }
  if (!isSuperadmin(request)) {
    throw new HttpsError('permission-denied', 'Esta operación requiere un superadministrador con correo verificado.')
  }
}

function requireOperation(data, HttpsError) {
  if (!data || typeof data !== 'object' || !OPERATION_ID.test(data.operationId ?? '')) {
    throw new HttpsError('invalid-argument', 'El identificador de operación no es válido.')
  }
}

function sameMedia(existing, expected, uid) {
  return existing.createdBy === uid &&
    existing.originalName === expected.originalName &&
    existing.storagePath === expected.storagePath &&
    existing.contentType === expected.contentType &&
    existing.sizeBytes === expected.sizeBytes &&
    existing.altText === expected.altText
}

export function createMediaOperations({
  db,
  bucket,
  FieldValue,
  Timestamp,
  HttpsError,
  now = Date.now,
}) {
  function validateUploadData(data) {
    if (
      typeof data.originalName !== 'string' || data.originalName.length < 1 || data.originalName.length > 180 ||
      typeof data.contentType !== 'string' || !IMAGE_TYPES.has(data.contentType) ||
      !Number.isInteger(data.sizeBytes) || data.sizeBytes < 1 || data.sizeBytes > MAX_IMAGE_BYTES ||
      typeof data.altText !== 'string' || data.altText.trim().length < 1 || data.altText.trim().length > 500 ||
      !SHA256.test(data.sha256 ?? '')
    ) {
      throw new HttpsError('invalid-argument', 'Los datos del archivo no son válidos.')
    }
  }

  function reservationMatches(reservation, data, uid) {
    return reservation.uid === uid &&
      reservation.originalName === data.originalName &&
      reservation.contentType === data.contentType &&
      reservation.sizeBytes === data.sizeBytes &&
      reservation.altText === data.altText.trim() &&
      reservation.sha256 === data.sha256
  }

  async function reserveUpload(data, uid) {
    const reservationRef = db.collection('mediaUploadReservations').doc(data.operationId)
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reservationRef)
      if (snapshot.exists) {
        if (!reservationMatches(snapshot.data(), data, uid)) {
          throw new HttpsError('already-exists', 'El identificador ya está reservado para otra carga; no se inició una segunda transferencia.')
        }
        return
      }
      transaction.create(reservationRef, {
        uid,
        originalName: data.originalName,
        contentType: data.contentType,
        sizeBytes: data.sizeBytes,
        altText: data.altText.trim(),
        sha256: data.sha256,
        createdAt: FieldValue.serverTimestamp(),
      })
    })
  }

  async function createUploadSession(request, data) {
    const origin = request.rawRequest?.get('origin')
    if (!RESUMABLE_UPLOAD_ORIGINS.has(origin)) {
      throw new HttpsError('permission-denied', 'El origen no está autorizado para iniciar una carga multimedia.')
    }
    const { operationId } = data
    const { uid } = request.auth
    await reserveUpload(data, uid)
    const file = bucket.file(`media/${operationId}`)
    try {
      const [uploadUrl] = await file.createResumableUpload({
        origin,
        preconditionOpts: { ifGenerationMatch: 0 },
        metadata: {
          contentType: data.contentType,
          metadata: {
            visibility: 'private',
            uploadedBy: uid,
            uploadId: operationId,
            sha256: data.sha256,
          },
        },
      })
      return { uploadUrl }
    } catch (error) {
      if (error.code === 409 || error.code === 412) {
        throw new HttpsError(
          'already-exists',
          'Ya existe un archivo para este identificador. Verificá la carga anterior antes de reintentar.',
        )
      }
      throw new HttpsError('unavailable', 'No se pudo iniciar una carga protegida en Storage.')
    }
  }

  async function getOwnedObject(operationId, uid, expected = {}, { returnMissing = false } = {}) {
    const file = bucket.file(`media/${operationId}`)
    let metadata
    try {
      ;[metadata] = await file.getMetadata()
    } catch (error) {
      if (error.code === 404 || error.code === 'storage/object-not-found') {
        if (returnMissing) return null
        throw new HttpsError('failed-precondition', 'No se encontró el archivo pendiente en Storage.')
      }
      throw new HttpsError('unavailable', 'No se pudo verificar el archivo en Storage. Reintentá más tarde.')
    }

    const custom = metadata.metadata ?? {}
    if (
      custom.uploadId !== operationId ||
      custom.uploadedBy !== uid ||
      !SHA256.test(custom.sha256 ?? '') ||
      metadata.contentType !== expected.contentType && expected.contentType !== undefined ||
      Number(metadata.size) !== expected.sizeBytes && expected.sizeBytes !== undefined
    ) {
      throw new HttpsError('already-exists', 'El archivo existente no coincide con esta operación; no se modificó.')
    }

    let bytes
    try {
      ;[bytes] = await file.download()
    } catch {
      throw new HttpsError('unavailable', 'No se pudo comprobar la integridad del archivo. La recuperación queda pendiente.')
    }
    const digest = sha256(bytes)
    if (digest !== custom.sha256 || expected.sha256 !== undefined && digest !== expected.sha256) {
      throw new HttpsError('already-exists', 'El hash del archivo no coincide con la operación; no se modificó.')
    }

    return { file, metadata, digest }
  }

  async function checkExistingUpload(request, data) {
    const { operationId } = data
    const { uid } = request.auth
    const reservationSnapshot = await db.collection('mediaUploadReservations').doc(operationId).get()
    if (!reservationSnapshot.exists) return { exists: false }
    if (!reservationMatches(reservationSnapshot.data(), data, uid)) {
      throw new HttpsError('already-exists', 'El identificador está reservado para otra operación multimedia.')
    }

    const existing = await getOwnedObject(operationId, uid, data, { returnMissing: true })
    return { exists: existing !== null }
  }

  async function finalizeMediaUpload(request) {
    requireSuperadmin(request, HttpsError)
    const data = request.data
    requireOperation(data, HttpsError)
    if (
      data.uid !== request.auth.uid ||
      data.storagePath !== `media/${data.operationId}`
    ) {
      throw new HttpsError('invalid-argument', 'La identidad o ruta de la operación no es válida.')
    }
    validateUploadData(data)
    if (data.phase !== undefined && !['check', 'start', 'finalize'].includes(data.phase)) {
      throw new HttpsError('invalid-argument', 'La fase de carga no es válida.')
    }
    if (data.phase === 'check') return checkExistingUpload(request, data)
    if (data.phase === 'start') return createUploadSession(request, data)

    const { operationId } = data
    const { uid } = request.auth
    const reservationRef = db.collection('mediaUploadReservations').doc(operationId)
    const reservationSnapshot = await reservationRef.get()
    if (!reservationSnapshot.exists) {
      throw new HttpsError('failed-precondition', 'No existe una reserva de carga coincidente. Iniciá la carga nuevamente con el mismo identificador.')
    }
    if (!reservationMatches(reservationSnapshot.data(), data, uid)) {
      throw new HttpsError('already-exists', 'El identificador está reservado para otra operación multimedia.')
    }
    await getOwnedObject(operationId, uid, data)
    const mediaRef = db.collection('media').doc(operationId)
    const logRef = db.collection('adminLogs').doc(`media-${operationId}`)
    const countRef = db.collection('privateConfig').doc('mediaCapacity')
    const expected = {
      originalName: data.originalName,
      storagePath: `media/${operationId}`,
      contentType: data.contentType,
      sizeBytes: data.sizeBytes,
      altText: data.altText.trim(),
      visibility: 'private',
      status: 'draft',
      isArchived: false,
    }

    try {
      await db.runTransaction(async (transaction) => {
        const [mediaSnapshot, logSnapshot, countSnapshot] = await Promise.all([
          transaction.get(mediaRef),
          transaction.get(logRef),
          transaction.get(countRef),
        ])
        if (mediaSnapshot.exists) {
          if (!sameMedia(mediaSnapshot.data(), expected, uid)) {
            throw new HttpsError('already-exists', 'El identificador ya corresponde a otro registro multimedia.')
          }
          if (!logSnapshot.exists) {
            transaction.set(logRef, {
              actorUid: uid,
              action: 'create',
              collection: 'media',
              documentId: operationId,
              createdAt: FieldValue.serverTimestamp(),
              summary: 'create:media',
            })
          }
          return
        }
        let activeCount
        if (countSnapshot.exists) {
          activeCount = countSnapshot.data()?.activeCount
          if (!Number.isInteger(activeCount) || activeCount < 0) {
            throw new HttpsError('failed-precondition', 'El contador multimedia requiere revisión administrativa.')
          }
        } else {
          const activeMedia = await transaction.get(
            db.collection('media').where('isArchived', '==', false).limit(501),
          )
          activeCount = activeMedia.size
        }
        if (activeCount >= 500) {
          throw new HttpsError('resource-exhausted', 'Se alcanzó el límite de 500 registros multimedia activos.')
        }
        if (logSnapshot.exists) {
          throw new HttpsError('already-exists', 'El registro de actividad ya existe sin su documento multimedia.')
        }
        transaction.create(mediaRef, {
          ...expected,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: uid,
          updatedBy: uid,
        })
        transaction.create(logRef, {
          actorUid: uid,
          action: 'create',
          collection: 'media',
          documentId: operationId,
          createdAt: FieldValue.serverTimestamp(),
          summary: 'create:media',
        })
        if (countSnapshot.exists) {
          transaction.update(countRef, {
            activeCount: activeCount + 1,
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else {
          transaction.create(countRef, {
            activeCount: activeCount + 1,
            updatedAt: FieldValue.serverTimestamp(),
          })
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) throw error
      throw new HttpsError('internal', 'No se pudo registrar el archivo multimedia en Firestore.')
    }
    return { mediaId: operationId }
  }

  const setMediaState = createMediaStateOperation({
    db,
    bucket,
    FieldValue,
    Timestamp,
    HttpsError,
    getOwnedObject,
    requireSuperadmin,
    now,
  })

  return { finalizeMediaUpload, setMediaState, getOwnedObject }
}
