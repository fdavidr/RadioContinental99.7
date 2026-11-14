import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

import { createMediaOperations } from '../src/media-operations.mjs'

class CallableError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

class TestTimestamp {
  constructor(value) {
    this.value = value
  }

  toMillis() {
    return this.value
  }
}

function createHarness() {
  const documents = new Map()
  const objects = new Map()
  const uploadSessions = []
  const events = []
  let transactions = Promise.resolve()
  let timestamp = 100
  let currentTime = 1_000
  let nextStorageFailure
  let nextMetadataFailure
  let nextStorageGate
  let nextRollbackFailure = false
  let failNextMediaCommit = false

  function resolveSentinels(value) {
    if (value?.serverTimestamp) return new TestTimestamp(++timestamp)
    if (Array.isArray(value)) return value.map(resolveSentinels)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, resolveSentinels(item)]),
      )
    }
    return value
  }

  function clone(value) {
    if (value instanceof TestTimestamp) return new TestTimestamp(value.value)
    if (Array.isArray(value)) return value.map(clone)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]))
    }
    return value
  }

  function reference(collectionName, id) {
    const ref = { collectionName, id, key: `${collectionName}/${id}` }
    ref.get = async () => snapshot(ref, documents.get(ref.key))
    return ref
  }

  function snapshot(ref, value) {
    return {
      exists: value !== undefined,
      size: value === undefined ? 0 : 1,
      data: () => value && clone(value),
      ref,
    }
  }

  const db = {
    collection(collectionName) {
      return {
        doc(id) {
          return reference(collectionName, id)
        },
        where(field, operator, value) {
          return {
            collectionName,
            field,
            operator,
            value,
            maxLimit: Infinity,
            limit(maxLimit) {
              this.maxLimit = maxLimit
              return this
            },
          }
        },
      }
    },
    runTransaction(callback) {
      const current = transactions.then(async () => {
        const writes = []
        const transaction = {
          async get(ref) {
            if (ref.field) {
              const rows = [...documents.entries()]
                .filter(([key, data]) => key.startsWith(`${ref.collectionName}/`) &&
                  (ref.operator !== '==' || data[ref.field] === ref.value))
                .slice(0, ref.maxLimit)
              return { size: rows.length, docs: rows.map(([key, data]) =>
                snapshot(reference(ref.collectionName, key.split('/')[1]), data)) }
            }
            return snapshot(ref, documents.get(ref.key))
          },
          create(ref, data) {
            writes.push({ type: 'create', ref, data })
          },
          set(ref, data) {
            writes.push({ type: 'set', ref, data })
          },
          update(ref, data) {
            writes.push({ type: 'update', ref, data })
          },
        }
        const result = await callback(transaction)
        const mediaWrite = writes.find((write) => write.ref.collectionName === 'media')
        const rollbackWrite = writes.find((write) =>
          write.ref.collectionName === 'mediaStateTransitions' &&
          write.data.outcome === 'rolled-back',
        )
        if (rollbackWrite && nextRollbackFailure) {
          nextRollbackFailure = false
          throw new Error('injected Firestore compensation failure')
        }
        const statusWrite = writes.find((write) =>
          write.ref.collectionName === 'media' && write.data.status !== undefined,
        )
        if (statusWrite && failNextMediaCommit) {
          failNextMediaCommit = false
          throw new Error('injected Firestore commit failure')
        }
        for (const write of writes) {
          if (write.type === 'create' && documents.has(write.ref.key)) {
            throw new Error('ALREADY_EXISTS')
          }
          const previous = documents.get(write.ref.key) ?? {}
          const data = clone(write.data)
          for (const [key, value] of Object.entries(data)) {
            if (value?.deleteField) delete previous[key]
            else previous[key] = resolveSentinels(value)
          }
          documents.set(write.ref.key, previous)
        }
        if (mediaWrite) {
          events.push(`firestore:${documents.get(mediaWrite.ref.key)?.status ?? 'transition'}`)
        }
        return result
      })
      transactions = current.catch(() => {})
      return current
    },
  }

  const bucket = {
    file(path) {
      const object = objects.get(path)
      return {
        async createResumableUpload(options) {
          uploadSessions.push({ path, options })
          return [`https://storage.googleapis.com/upload-session/${uploadSessions.length}`]
        },
        async getMetadata() {
          if (nextMetadataFailure) {
            const failure = nextMetadataFailure
            nextMetadataFailure = undefined
            throw failure
          }
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          events.push('storage:get-metadata')
          return [clone(object.metadata)]
        },
        async download() {
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          return [Buffer.from(object.bytes)]
        },
        async setMetadata(changes, options) {
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          const visibility = changes.metadata.visibility
          events.push(`storage:${visibility}:${documents.get(`media/${path.split('/').pop()}`)?.status ?? 'unknown'}`)
          if (nextStorageGate?.visibility === visibility) {
            const gate = nextStorageGate
            nextStorageGate = undefined
            gate.signalEntered()
            await gate.promise
          }
          if (options?.preconditionOpts?.ifMetagenerationMatch !== Number(object.metadata.metageneration)) {
            throw Object.assign(new Error('metageneration mismatch'), { code: 412 })
          }
          const failureMode = nextStorageFailure?.visibility === visibility
            ? nextStorageFailure
            : undefined
          if (failureMode && !failureMode.afterApply) {
            nextStorageFailure = undefined
            throw new Error('injected Storage metadata failure')
          }
          object.metadata.metadata = clone(changes.metadata)
          object.metadata.metageneration = String(Number(object.metadata.metageneration) + 1)
          if (failureMode?.afterApply) {
            nextStorageFailure = undefined
            throw new Error('injected ambiguous Storage metadata response')
          }
          return [clone(object.metadata)]
        },
      }
    },
  }

  const FieldValue = {
    serverTimestamp: () => ({ serverTimestamp: true }),
    delete: () => ({ deleteField: true }),
  }
  const operations = createMediaOperations({
    db,
    bucket,
    FieldValue,
    Timestamp: TestTimestamp,
    HttpsError: CallableError,
    now: () => currentTime,
  })

  function addUpload({
    operationId,
    uid,
    bytes,
    sha256,
    contentType = 'image/jpeg',
    originalName = 'radio.jpg',
    altText = 'Cabina de radio',
  }) {
    const data = Buffer.from(bytes)
    const digest = sha256 ?? createHash('sha256').update(data).digest('hex')
    objects.set(`media/${operationId}`, {
      bytes: data,
      metadata: {
        contentType,
        size: String(data.length),
        metageneration: '1',
        metadata: {
          uploadId: operationId,
          uploadedBy: uid,
          sha256: digest,
          visibility: 'private',
        },
      },
    })
    documents.set(`mediaUploadReservations/${operationId}`, {
      uid,
      originalName,
      contentType,
      sizeBytes: data.length,
      altText,
      sha256: digest,
    })
  }

  function addReservation({
    operationId,
    uid,
    originalName = 'radio.jpg',
    contentType = 'image/jpeg',
    sizeBytes = bytes.length,
    altText = 'Cabina de radio',
    sha256: digest = createHash('sha256').update(bytes).digest('hex'),
  }) {
    documents.set(`mediaUploadReservations/${operationId}`, {
      uid,
      originalName,
      contentType,
      sizeBytes,
      altText,
      sha256: digest,
    })
  }

  return {
    db,
    documents,
    objects,
    uploadSessions,
    events,
    operations,
    addUpload,
    addReservation,
    failStorageMetadata(error = new Error('injected Storage metadata network failure')) {
      nextMetadataFailure = error
    },
    failStorageVisibility(visibility, { afterApply = false } = {}) {
      nextStorageFailure = { visibility, afterApply }
    },
    failFirestoreMediaCommit() { failNextMediaCommit = true },
    failFirestoreCompensation() { nextRollbackFailure = true },
    advanceTime(milliseconds) { currentTime += milliseconds },
    pauseStorageVisibility(visibility) {
      let signalEntered
      let release
      const entered = new Promise((resolve) => { signalEntered = resolve })
      const promise = new Promise((resolve) => { release = resolve })
      nextStorageGate = { visibility, signalEntered, promise }
      return { entered, release }
    },
  }
}

const operationId = 'c2d30104-f7e6-40fb-a3f6-a29f31c4bfab'
const uid = 'trusted-superadmin'
const bytes = Buffer.from('fake image payload')
const sha256 = createHash('sha256').update(bytes).digest('hex')
const request = {
  auth: { uid, token: { email_verified: true, superadmin: true } },
  rawRequest: {
    get(name) {
      return name.toLowerCase() === 'origin' ? 'https://continental99.fm' : undefined
    },
  },
}
const uploadData = {
  operationId,
  storagePath: `media/${operationId}`,
  uid,
  originalName: 'radio.jpg',
  contentType: 'image/jpeg',
  sizeBytes: bytes.length,
  altText: 'Cabina de radio',
  sha256,
}

test('check returns false without a reservation or when its reserved object is absent', async () => {
  const noReservation = createHarness()
  assert.deepEqual(await noReservation.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'check' },
  }), { exists: false })

  const reserved = createHarness()
  reserved.addReservation({ operationId, uid, bytes })
  assert.deepEqual(await reserved.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'check' },
  }), { exists: false })
})

test('check verifies a completed upload and reports it as existing', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })

  assert.deepEqual(await harness.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'check' },
  }), { exists: true })
})

test('check rejects unauthenticated, unverified, and non-superadmin callers', async () => {
  const harness = createHarness()
  for (const auth of [
    null,
    { uid, token: { email_verified: false, superadmin: true } },
    { uid, token: { email_verified: true, editor: true } },
  ]) {
    await assert.rejects(
      harness.operations.finalizeMediaUpload({
        auth,
        data: { ...uploadData, phase: 'check' },
      }),
      CallableError,
    )
  }
})

test('check rejects invalid identity, reservation ownership, and operation metadata', async () => {
  const invalidUid = createHarness()
  await assert.rejects(
    invalidUid.operations.finalizeMediaUpload({
      ...request,
      data: { ...uploadData, uid: 'another-user', phase: 'check' },
    }),
    (error) => error.code === 'invalid-argument',
  )

  const wrongOwner = createHarness()
  wrongOwner.addReservation({ operationId, uid: 'another-user' })
  await assert.rejects(
    wrongOwner.operations.finalizeMediaUpload({
      ...request,
      data: { ...uploadData, phase: 'check' },
    }),
    (error) => error.code === 'already-exists',
  )

  for (const invalidData of [
    { sha256: '0'.repeat(64) },
    { contentType: 'image/png' },
    { sizeBytes: uploadData.sizeBytes + 1 },
  ]) {
    const mismatch = createHarness()
    mismatch.addReservation({ operationId, uid })
    await assert.rejects(
      mismatch.operations.finalizeMediaUpload({
        ...request,
        data: { ...uploadData, ...invalidData, phase: 'check' },
      }),
      (error) => error.code === 'already-exists',
    )
  }
})

test('check propagates Storage network errors instead of treating them as missing objects', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  harness.failStorageMetadata()

  await assert.rejects(
    harness.operations.finalizeMediaUpload({
      ...request,
      data: { ...uploadData, phase: 'check' },
    }),
    (error) => error.code === 'unavailable',
  )
})

test('resumable upload session can be finalized after the object arrives', async () => {
  const harness = createHarness()
  const started = await harness.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'start' },
  })
  assert.match(started.uploadUrl, /^https:\/\/storage\.googleapis\.com\//)

  harness.addUpload({ operationId, uid, bytes })
  assert.deepEqual(await harness.operations.finalizeMediaUpload({
    ...request,
    data: uploadData,
  }), { mediaId: operationId })
})

test('completed upload recovery is idempotent and does not duplicate its media record', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  assert.deepEqual(await harness.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'check' },
  }), { exists: true })

  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  assert.equal(harness.documents.has(`media/${operationId}`), true)
  assert.equal([...harness.documents.keys()].filter((key) => key === `media/${operationId}`).length, 1)
})

test('upload session requires a verified superadmin and creates only with ifGenerationMatch=0', async () => {
  const harness = createHarness()
  const result = await harness.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'start' },
  })

  assert.deepEqual(result, { uploadUrl: 'https://storage.googleapis.com/upload-session/1' })
  assert.equal(harness.uploadSessions[0].path, `media/${operationId}`)
  assert.equal(harness.uploadSessions[0].options.origin, 'https://continental99.fm')
  assert.equal(harness.uploadSessions[0].options.preconditionOpts.ifGenerationMatch, 0)
  assert.equal(harness.uploadSessions[0].options.metadata.metadata.uploadedBy, uid)
  assert.equal(harness.uploadSessions[0].options.metadata.metadata.sha256, sha256)
  assert.equal(harness.objects.size, 0)
  assert.equal(harness.documents.size, 1)
  assert.equal(harness.documents.has(`media/${operationId}`), false)
})

test('upload session accepts the current www production origin', async () => {
  const harness = createHarness()
  await harness.operations.finalizeMediaUpload({
    ...request,
    rawRequest: { get: () => 'https://www.continental997.fm' },
    data: { ...uploadData, phase: 'start' },
  })

  assert.equal(harness.uploadSessions[0].options.origin, 'https://www.continental997.fm')
})

test('upload session rejects origins outside the production allowlist before reserving', async () => {
  const harness = createHarness()
  await assert.rejects(
    harness.operations.finalizeMediaUpload({
      ...request,
      rawRequest: { get: () => 'https://untrusted.example' },
      data: { ...uploadData, phase: 'start' },
    }),
    (error) => error.code === 'permission-denied',
  )

  assert.equal(harness.uploadSessions.length, 0)
  assert.equal(harness.documents.size, 0)
})

test('one operation ID cannot reserve sessions for different payloads concurrently', async () => {
  const harness = createHarness()
  const first = { ...uploadData, phase: 'start' }
  const second = {
    ...uploadData,
    phase: 'start',
    sha256: '0'.repeat(64),
  }
  const results = await Promise.allSettled([
    harness.operations.finalizeMediaUpload({ ...request, data: first }),
    harness.operations.finalizeMediaUpload({ ...request, data: second }),
  ])

  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(results.filter(({ status }) => status === 'rejected').length, 1)
  assert.equal(harness.uploadSessions.length, 1)
})

test('finalization verifies object identity and hash, then is idempotent', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  const [result] = await Promise.all([
    harness.operations.finalizeMediaUpload({ ...request, data: uploadData }),
    harness.operations.finalizeMediaUpload({ ...request, data: uploadData }),
  ])

  assert.deepEqual(result, { mediaId: operationId })
  assert.equal(harness.documents.size, 4)
  const media = harness.documents.get(`media/${operationId}`)
  assert.equal(media.createdBy, uid)
  assert.equal(media.storagePath, `media/${operationId}`)
  assert.equal(media.status, 'draft')
  assert.equal(media.visibility, 'private')

  assert.equal(harness.documents.size, 4)
})

test('finalization rejects unauthenticated, unverified, and non-superadmin callers', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  for (const auth of [
    null,
    { uid, token: { email_verified: false, superadmin: true } },
    { uid, token: { email_verified: true, editor: true } },
  ]) {
    await assert.rejects(
      harness.operations.finalizeMediaUpload({ auth, data: uploadData }),
      CallableError,
    )
  }
  assert.equal(harness.documents.size, 1)
})

test('finalization rejects mismatched hashes, uploaders, and existing document collisions', async () => {
  const badHash = createHarness()
  badHash.addUpload({ operationId, uid, bytes, sha256: '0'.repeat(64) })
  await assert.rejects(
    badHash.operations.finalizeMediaUpload({ ...request, data: uploadData }),
    CallableError,
  )
  assert.equal(badHash.documents.has(`media/${operationId}`), false)

  const wrongOwner = createHarness()
  wrongOwner.addUpload({ operationId, uid: 'another-user', bytes })
  await assert.rejects(
    wrongOwner.operations.finalizeMediaUpload({ ...request, data: uploadData }),
    CallableError,
  )
  assert.equal(wrongOwner.documents.has(`media/${operationId}`), false)

  const collision = createHarness()
  collision.addUpload({ operationId, uid, bytes })
  collision.documents.set(`media/${operationId}`, {
    createdBy: 'another-user',
    storagePath: `media/${operationId}`,
  })
  await assert.rejects(
    collision.operations.finalizeMediaUpload({ ...request, data: uploadData }),
    (error) => error.code === 'already-exists',
  )
})

test('the trusted counter prevents creating a 501st active media record', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  for (let index = 0; index < 500; index += 1) {
    harness.documents.set(`media/existing-${index}`, { isArchived: false })
  }
  await assert.rejects(
    harness.operations.finalizeMediaUpload({ ...request, data: uploadData }),
    (error) => error.code === 'resource-exhausted',
  )
  assert.equal(harness.documents.size, 501)
})

test('state changes verify ownership and are idempotent after success', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish' },
  })

  const media = harness.documents.get(`media/${operationId}`)
  assert.equal(media.status, 'published')
  assert.equal(media.visibility, 'public')
  assert.equal(media.stateTransition, undefined)
  assert.equal(media.lastStateTransition, undefined)
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'public')
  const countAfterPublish = harness.documents.size

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish' },
  })
  assert.equal(harness.documents.size, countAfterPublish)
  harness.events.length = 0
  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'archive' },
  })
  assert.equal(harness.documents.get(`media/${operationId}`).status, 'archived')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
  const archivePrivateWrite = harness.events.findIndex((event) => event === 'storage:private:published')
  const archiveCommit = harness.events.findIndex((event) => event === 'firestore:archived')
  assert.ok(archiveCommit > archivePrivateWrite)
  assert.equal(harness.documents.get('privateConfig/mediaCapacity').activeCount, 0)
})

test('Firestore confirms publication before Storage becomes public', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.events.length = 0

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish' },
  })

  const publicWrite = harness.events.findIndex((event) => event === 'storage:public:published')
  const publishedCommit = harness.events.findIndex((event) => event === 'firestore:published')
  assert.ok(publishedCommit >= 0)
  assert.ok(publicWrite > publishedCommit)
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'public')
})

test('a failed public metadata write compensates Firestore only after confirming Storage is private', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.failStorageVisibility('public')

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } }),
    (error) => error.code === 'unavailable' && /volvió a borrador/.test(error.message),
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
  assert.ok(harness.events.indexOf('firestore:published') < harness.events.lastIndexOf('firestore:draft'))

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish' },
  })
  assert.equal(harness.documents.get(`media/${operationId}`).status, 'published')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'public')
})

test('a failed publication transaction leaves the Storage object private', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.failFirestoreMediaCommit()

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } }),
    (error) => error.code === 'unavailable' && /Storage quedó privado/.test(error.message),
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
  assert.equal(harness.events.some((event) => event.startsWith('storage:public:')), false)
})

test('a failed Firestore compensation leaves the object private and reports an ambiguous state', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.failStorageVisibility('public')
  harness.failFirestoreCompensation()

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } }),
    (error) => error.code === 'unavailable' && /no pudo compensar/.test(error.message),
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'published')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
})

test('unpublishing makes Storage private before confirming the Firestore draft', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  await harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } })
  harness.events.length = 0

  await harness.operations.setMediaState({ ...request, data: { operationId, action: 'unpublish' } })

  const privateWrite = harness.events.findIndex((event) => event === 'storage:private:published')
  const draftCommit = harness.events.findIndex((event) => event === 'firestore:draft')
  assert.ok(privateWrite >= 0)
  assert.ok(draftCommit > privateWrite)
  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
})

test('a Firestore failure during unpublish leaves Storage private and the published record recoverable', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  await harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } })
  harness.failFirestoreMediaCommit()

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'unpublish' } }),
    (error) => error.code === 'unavailable' && /Storage quedó privado/.test(error.message),
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'published')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
})

test('an expired transition lease can recover the same expected Firestore version', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  const expectedUpdatedAt = harness.documents.get(`media/${operationId}`).updatedAt.toMillis()
  harness.failFirestoreMediaCommit()

  await assert.rejects(
    harness.operations.setMediaState({
      ...request,
      data: { operationId, action: 'publish', expectedUpdatedAt },
    }),
    (error) => error.code === 'unavailable',
  )
  assert.equal(harness.documents.get(`mediaStateTransitions/${operationId}`).phase, 'claimed')
  harness.advanceTime(90_001)

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish', expectedUpdatedAt },
  })

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'published')
  assert.equal(harness.documents.get(`mediaStateTransitions/${operationId}`).outcome, 'completed')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'public')
})

test('a Storage timeout after applying public metadata is compensated to private', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.failStorageVisibility('public', { afterApply: true })

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } }),
    (error) => error.code === 'unavailable',
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
})

test('parallel publish and unpublish operations cannot make an unconfirmed state public', async () => {
  for (const competingAction of ['unpublish', 'archive']) {
    const harness = createHarness()
    harness.addUpload({ operationId, uid, bytes })
    await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
    const gate = harness.pauseStorageVisibility('private')
    const publishing = harness.operations.setMediaState({
      ...request,
      data: { operationId, action: 'publish' },
    })
    await gate.entered
    const competing = harness.operations.setMediaState({
      ...request,
      data: { operationId, action: competingAction },
    })
    await assert.rejects(competing, (error) => error.code === 'aborted')
    gate.release()
    await publishing

    for (const event of harness.events.filter((entry) => entry.startsWith('storage:public:'))) {
      assert.equal(event, 'storage:public:published')
    }
    const media = harness.documents.get(`media/${operationId}`)
    const visibility = harness.objects.get(`media/${operationId}`).metadata.metadata.visibility
    assert.equal(media.visibility, visibility)
    assert.equal(media.status === 'published', visibility === 'public')
  }
})

test('publication refuses an object whose bytes no longer match its recorded SHA-256', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  harness.objects.get(`media/${operationId}`).bytes = Buffer.from('tampered payload')

  await assert.rejects(
    harness.operations.setMediaState({ ...request, data: { operationId, action: 'publish' } }),
    (error) => error.code === 'already-exists',
  )

  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
  assert.equal(harness.events.some((event) => event.startsWith('storage:public:')), false)
})

test('a stale state change rolls Storage back to private and does not change Firestore', async () => {
  const harness = createHarness()
  harness.addUpload({ operationId, uid, bytes })
  await harness.operations.finalizeMediaUpload({ ...request, data: uploadData })
  const media = harness.documents.get(`media/${operationId}`)
  media.updatedAt = new TestTimestamp(10)

  await assert.rejects(
    harness.operations.setMediaState({
      ...request,
      data: { operationId, action: 'publish', expectedUpdatedAt: 9 },
    }),
    (error) => error.code === 'aborted',
  )
  assert.equal(media.status, 'draft')
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'private')
})

test('legacy assets can be made private but cannot be newly published without a verifiable hash', async () => {
  const harness = createHarness()
  const path = 'media/old-radio.jpg'
  harness.objects.set(path, {
    bytes,
    metadata: {
      contentType: 'image/jpeg',
      size: String(bytes.length),
      metageneration: '1',
      metadata: { uploadedBy: uid, visibility: 'public' },
    },
  })
  harness.documents.set(`media/${operationId}`, {
    createdBy: uid,
    createdAt: new TestTimestamp(1),
    updatedAt: new TestTimestamp(1),
    storagePath: path,
    contentType: 'image/jpeg',
    sizeBytes: bytes.length,
    status: 'published',
    isArchived: false,
    visibility: 'public',
  })

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'unpublish' },
  })
  assert.equal(harness.documents.get(`media/${operationId}`).status, 'draft')
  assert.equal(harness.objects.get(path).metadata.metadata.visibility, 'private')

  await assert.rejects(
    harness.operations.setMediaState({
      ...request,
      data: { operationId, action: 'publish' },
    }),
    (error) => error.code === 'failed-precondition',
  )
})
