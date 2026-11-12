import { createHash } from 'node:crypto'

const TRANSITION_LEASE_MS = 90_000

function isExpectedState(data, next, visibility) {
  return data.status === next.status &&
    data.isArchived === next.isArchived &&
    data.visibility === visibility
}

export function createMediaStateOperation({
  db,
  FieldValue,
  Timestamp,
  HttpsError,
  getOwnedObject,
  requireSuperadmin,
  bucket,
  now = Date.now,
  transitionLeaseMs = TRANSITION_LEASE_MS,
}) {
  return async function setMediaState(request) {
    requireSuperadmin(request, HttpsError)
    if (!request.data || typeof request.data !== 'object') {
      throw new HttpsError('invalid-argument', 'La operación multimedia no es válida.')
    }

    const { operationId, action, expectedUpdatedAt } = request.data
    if (typeof operationId !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(operationId)) {
      throw new HttpsError('invalid-argument', 'El identificador del medio no es válido.')
    }
    if (!['publish', 'unpublish', 'archive'].includes(action)) {
      throw new HttpsError('invalid-argument', 'La acción multimedia no es válida.')
    }
    if (expectedUpdatedAt !== undefined &&
      (!Number.isSafeInteger(expectedUpdatedAt) || expectedUpdatedAt < 0)) {
      throw new HttpsError('invalid-argument', 'La versión del registro no es válida.')
    }

    const uid = request.auth.uid
    const mediaRef = db.collection('media').doc(operationId)
    const countRef = db.collection('privateConfig').doc('mediaCapacity')
    const transitionRef = db.collection('mediaStateTransitions').doc(operationId)
    const [initialSnapshot, initialTransitionSnapshot] = await Promise.all([
      mediaRef.get(),
      transitionRef.get(),
    ])
    if (!initialSnapshot.exists) {
      throw new HttpsError('not-found', 'No se encontró el registro multimedia.')
    }
    const initial = initialSnapshot.data()
    const initialTransition = initialTransitionSnapshot.exists
      ? initialTransitionSnapshot.data()
      : null
    const storagePath = initial.storagePath
    if (
      typeof storagePath !== 'string' ||
      !/^media\/[A-Za-z0-9._-]+$/.test(storagePath) ||
      typeof initial.createdBy !== 'string'
    ) {
      throw new HttpsError('permission-denied', 'El archivo no corresponde al registro multimedia.')
    }

    const next = action === 'archive'
      ? { status: 'archived', isArchived: true, visibility: 'private' }
      : {
        status: action === 'publish' ? 'published' : 'draft',
        isArchived: false,
        visibility: action === 'publish' ? 'public' : 'private',
      }

    let object
    if (storagePath === `media/${operationId}`) {
      object = await getOwnedObject(operationId, initial.createdBy, {
        contentType: initial.contentType,
        sizeBytes: initial.sizeBytes,
      })
    } else {
      if (action === 'publish') {
        throw new HttpsError(
          'failed-precondition',
          'Este archivo anterior no tiene hash verificable. No se puede publicar con seguridad; sí se puede despublicar o archivar.',
        )
      }
      try {
        const legacyFile = bucket.file(storagePath)
        const [metadata] = await legacyFile.getMetadata()
        const custom = metadata.metadata ?? {}
        if (
          metadata.contentType !== initial.contentType ||
          Number(metadata.size) !== initial.sizeBytes ||
          (custom.uploadedBy !== undefined && custom.uploadedBy !== initial.createdBy)
        ) {
          throw new HttpsError('permission-denied', 'El archivo anterior no coincide con el registro multimedia.')
        }
        object = { file: legacyFile, metadata }
      } catch (error) {
        if (error instanceof HttpsError) throw error
        if (error.code === 404 || error.code === 'storage/object-not-found') {
          throw new HttpsError('failed-precondition', 'No se encontró el archivo en Storage.')
        }
        throw new HttpsError('unavailable', 'No se pudo verificar el archivo en Storage.')
      }
    }
    const storageFile = object?.file
    if (!storageFile) {
      throw new HttpsError('internal', 'No se pudo determinar el objeto de Storage.')
    }

    const custom = object.metadata.metadata ?? {}
    if (
      isExpectedState(initial, next, next.visibility) &&
      custom.visibility === next.visibility &&
      (!initialTransition || initialTransition.outcome === 'completed')
    ) {
      return { mediaId: operationId, status: next.status, visibility: next.visibility }
    }

    const initialVersion = initial.updatedAt instanceof Timestamp
      ? initial.updatedAt.toMillis()
      : 'current'
    const retryingTransition = initialTransition?.outcome !== 'rolled-back' &&
      initialTransition?.uid === uid &&
      initialTransition?.action === action &&
      (expectedUpdatedAt === undefined || initialTransition.expectedUpdatedAt === expectedUpdatedAt)
    const version = expectedUpdatedAt ?? initialVersion
    const proposedId = createHash('sha256')
      .update(`${uid}\0${operationId}\0${action}\0${version}`)
      .digest('hex')
    const transitionId = retryingTransition ? initialTransition.id : proposedId
    const logRef = db.collection('adminLogs').doc(`media-state-${transitionId}`)
    let alreadyComplete = false
    let staleVersion = false

    try {
      await db.runTransaction(async (transaction) => {
        const [snapshot, transitionSnapshot] = await Promise.all([
          transaction.get(mediaRef),
          transaction.get(transitionRef),
        ])
        if (!snapshot.exists) throw new HttpsError('not-found', 'No se encontró el registro multimedia.')
        const data = snapshot.data()
        const transition = transitionSnapshot.exists ? transitionSnapshot.data() : null
        const sameTransition = transition?.id === transitionId &&
          transition?.uid === uid &&
          transition?.action === action
        const committedRetry = sameTransition && transition.phase === 'firestore-committed'
        if (
          expectedUpdatedAt !== undefined &&
          (!(data.updatedAt instanceof Timestamp) ||
            data.updatedAt.toMillis() !== expectedUpdatedAt) &&
          !committedRetry
        ) {
          staleVersion = true
          return
        }
        if (data.createdBy !== initial.createdBy || data.storagePath !== storagePath) {
          throw new HttpsError('permission-denied', 'El registro ya no corresponde a esta operación.')
        }
        if (
          transition?.id === transitionId &&
          transition.outcome === 'completed' &&
          isExpectedState(data, next, next.visibility)
        ) {
          alreadyComplete = true
          return
        }
        if (
          transition &&
          transition.phase !== 'completed' &&
          transition.leaseExpiresAtMs > now()
        ) {
          throw new HttpsError('aborted', 'Ya hay una transición multimedia en curso. Reintentá cuando finalice.')
        }

        const actualVersion = data.updatedAt instanceof Timestamp
          ? data.updatedAt.toMillis()
          : null
        if (!sameTransition && expectedUpdatedAt !== undefined && actualVersion !== expectedUpdatedAt) {
          staleVersion = true
          return
        }
        transaction.set(transitionRef, {
          id: transitionId,
          uid,
          action,
          expectedUpdatedAt: sameTransition
            ? transition.expectedUpdatedAt
            : expectedUpdatedAt ?? actualVersion,
          leaseExpiresAtMs: now() + transitionLeaseMs,
          phase: sameTransition ? transition.phase : 'claimed',
          targetStatus: next.status,
          targetVisibility: next.visibility,
        })
      })
    } catch (error) {
      if (error instanceof HttpsError) throw error
      console.error('Media state transition reservation failed.', {
        operationId,
        errorCode: error?.code,
        message: error?.message,
      })
      throw new HttpsError('unavailable', 'No se pudo reservar la transición multimedia en Firestore.')
    }
    if (staleVersion) {
      throw new HttpsError('aborted', 'El registro cambió. Actualizá la lista e intentá nuevamente.')
    }
    if (alreadyComplete) {
      return { mediaId: operationId, status: next.status, visibility: next.visibility }
    }

    async function setVisibility(metadata, visibility) {
      const metageneration = Number(metadata.metageneration)
      if (!Number.isSafeInteger(metageneration) || metageneration < 1) {
        throw new HttpsError('failed-precondition', 'Storage no devolvió una metageneración válida para proteger el cambio.')
      }
      const [updated] = await storageFile.setMetadata(
        { metadata: { ...(metadata.metadata ?? {}), visibility } },
        { preconditionOpts: { ifMetagenerationMatch: metageneration } },
      )
      return updated
    }

    async function fencePrivate(metadata) {
      try {
        return await setVisibility(metadata, 'private')
      } catch {
        let latest
        try {
          ;[latest] = await storageFile.getMetadata()
          return await setVisibility(latest, 'private')
        } catch {
          throw new HttpsError(
            'unavailable',
            'No se pudo confirmar el estado privado del objeto. La transición quedó reservada para recuperación.',
          )
        }
      }
    }

    let privateMetadata
    try {
      privateMetadata = await fencePrivate(object.metadata)
    } catch (error) {
      if (error instanceof HttpsError) throw error
      throw new HttpsError('unavailable', 'No se pudo proteger el objeto en Storage; la transición quedó reservada.')
    }

    const claimedTransition = (await transitionRef.get()).data()
    if (claimedTransition?.id !== transitionId || claimedTransition.uid !== uid) {
      throw new HttpsError('aborted', 'La transición multimedia fue reemplazada antes de actualizar Firestore.')
    }

    if (claimedTransition.phase !== 'firestore-committed') {
      try {
        await db.runTransaction(async (transaction) => {
          const [snapshot, transitionSnapshot, countSnapshot] = await Promise.all([
            transaction.get(mediaRef),
            transaction.get(transitionRef),
            action === 'archive' ? transaction.get(countRef) : Promise.resolve(null),
          ])
          if (!snapshot.exists) throw new HttpsError('not-found', 'No se encontró el registro multimedia.')
          const data = snapshot.data()
          const transition = transitionSnapshot.exists ? transitionSnapshot.data() : null
          if (transition?.id !== transitionId || transition.uid !== uid) {
            throw new HttpsError('aborted', 'La transición multimedia fue reemplazada.')
          }
          if (transition.phase === 'firestore-committed') return
          if (data.createdBy !== initial.createdBy || data.storagePath !== storagePath) {
            throw new HttpsError('permission-denied', 'El registro ya no corresponde a esta operación.')
          }
          const actualVersion = data.updatedAt instanceof Timestamp
            ? data.updatedAt.toMillis()
            : null
          if (transition.expectedUpdatedAt !== null &&
            actualVersion !== transition.expectedUpdatedAt) {
            throw new HttpsError('aborted', 'El registro cambió durante la transición.')
          }

          let activeCount
          if (action === 'archive') {
            if (countSnapshot?.exists) {
              activeCount = countSnapshot.data()?.activeCount
              if (!Number.isInteger(activeCount) || activeCount < 1) {
                throw new HttpsError('failed-precondition', 'El contador multimedia requiere revisión administrativa.')
              }
            } else {
              const activeMedia = await transaction.get(
                db.collection('media').where('isArchived', '==', false).limit(501),
              )
              activeCount = activeMedia.size
              if (activeCount < 1) {
                throw new HttpsError('failed-precondition', 'No se pudo validar el contador de medios activos.')
              }
            }
          }

          transaction.update(mediaRef, {
            ...next,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: uid,
            ...(action === 'publish' ? { publishedAt: FieldValue.serverTimestamp() } : {}),
          })
          transaction.set(transitionRef, {
            ...transition,
            phase: 'firestore-committed',
            leaseExpiresAtMs: now() + transitionLeaseMs,
          })
          if (action === 'archive') {
            const nextActiveCount = activeCount - 1
            if (countSnapshot?.exists) {
              transaction.update(countRef, {
                activeCount: nextActiveCount,
                updatedAt: FieldValue.serverTimestamp(),
              })
            } else {
              transaction.create(countRef, {
                activeCount: nextActiveCount,
                updatedAt: FieldValue.serverTimestamp(),
              })
            }
          }
        })
      } catch (error) {
        if (error instanceof HttpsError) throw error
        throw new HttpsError(
          'unavailable',
          'Storage quedó privado, pero Firestore no confirmó el cambio. Reintentá la misma acción para recuperarla.',
        )
      }
    }

    if (action === 'publish') {
      const transition = (await transitionRef.get()).data()
      if (transition?.id !== transitionId || transition.phase !== 'firestore-committed') {
        throw new HttpsError('aborted', 'Firestore no confirmó la publicación; el objeto permanece privado.')
      }
      try {
        await setVisibility(privateMetadata, 'public')
      } catch {
        let objectIsPrivate = false
        try {
          const [latest] = await storageFile.getMetadata()
          await fencePrivate(latest)
          const [confirmed] = await storageFile.getMetadata()
          objectIsPrivate = confirmed.metadata?.visibility === 'private'
        } catch {
          objectIsPrivate = false
        }
        if (!objectIsPrivate) {
          throw new HttpsError(
            'unavailable',
            'Firestore confirmó la publicación, pero no se pudo confirmar que Storage esté privado. Revisá el estado antes de reintentar.',
          )
        }

        try {
          await db.runTransaction(async (transaction) => {
            const [snapshot, transitionSnapshot] = await Promise.all([
              transaction.get(mediaRef),
              transaction.get(transitionRef),
            ])
            if (!snapshot.exists) throw new HttpsError('not-found', 'No se encontró el registro multimedia.')
            const data = snapshot.data()
            const active = transitionSnapshot.exists ? transitionSnapshot.data() : null
            if (active?.id !== transitionId || active.phase !== 'firestore-committed' ||
              data.status !== 'published' || data.visibility !== 'public') {
              throw new HttpsError('aborted', 'No se pudo revertir una publicación reemplazada por otra operación.')
            }
            transaction.update(mediaRef, {
              status: 'draft',
              isArchived: false,
              visibility: 'private',
              updatedAt: FieldValue.serverTimestamp(),
              updatedBy: uid,
              publishedAt: FieldValue.delete(),
            })
            transaction.set(transitionRef, {
              ...active,
              phase: 'completed',
              outcome: 'rolled-back',
              finishedAt: FieldValue.serverTimestamp(),
            })
            transaction.set(logRef, {
              actorUid: uid,
              action: 'publish-failed',
              collection: 'media',
              documentId: operationId,
              createdAt: FieldValue.serverTimestamp(),
              summary: 'publish-failed:media',
            })
          })
        } catch {
          throw new HttpsError(
            'unavailable',
            'El objeto se confirmó privado, pero Firestore no pudo compensar la publicación. Reintentá o reconcilia el registro.',
          )
        }
        throw new HttpsError(
          'unavailable',
          'Storage no confirmó la publicación; Firestore volvió a borrador y el objeto permanece privado.',
        )
      }
    }

    const logAction = action === 'publish' ? 'publish' : action === 'archive' ? 'archive' : 'update'
    try {
      await db.runTransaction(async (transaction) => {
        const [snapshot, transitionSnapshot] = await Promise.all([
          transaction.get(mediaRef),
          transaction.get(transitionRef),
        ])
        if (!snapshot.exists) throw new HttpsError('not-found', 'No se encontró el registro multimedia.')
        const transition = transitionSnapshot.exists ? transitionSnapshot.data() : null
        if (transition?.id !== transitionId || transition.phase !== 'firestore-committed') {
          if (
            transition?.id === transitionId &&
            transition.outcome === 'completed'
          ) return
          throw new HttpsError('aborted', 'La transición multimedia fue reemplazada antes de finalizar.')
        }
        transaction.set(logRef, {
          actorUid: uid,
          action: logAction,
          collection: 'media',
          documentId: operationId,
          createdAt: FieldValue.serverTimestamp(),
          summary: `${logAction}:media`,
        })
        transaction.update(transitionRef, {
          phase: 'completed',
          outcome: 'completed',
          finishedAt: FieldValue.serverTimestamp(),
        })
      })
    } catch (error) {
      if (error instanceof HttpsError) throw error
      throw new HttpsError(
        'unavailable',
        'Storage y Firestore aplicaron el estado, pero no se pudo cerrar el registro de transición. Reintentá la misma acción.',
      )
    }

    return { mediaId: operationId, status: next.status, visibility: next.visibility }
  }
}
