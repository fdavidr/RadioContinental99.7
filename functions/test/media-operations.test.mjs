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
  let transactions = Promise.resolve()

  function reference(collectionName, id) {
    const ref = { collectionName, id, key: `${collectionName}/${id}` }
    ref.get = async () => snapshot(ref, documents.get(ref.key))
    return ref
  }

  function snapshot(ref, value) {
    return {
      exists: value !== undefined,
      size: value === undefined ? 0 : 1,
      data: () => value && structuredClone(value),
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
        for (const write of writes) {
          if (write.type === 'create' && documents.has(write.ref.key)) {
            throw new Error('ALREADY_EXISTS')
          }
          const previous = documents.get(write.ref.key) ?? {}
          documents.set(write.ref.key, {
            ...previous,
            ...structuredClone(write.data),
          })
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
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          return [structuredClone(object.metadata)]
        },
        async download() {
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          return [Buffer.from(object.bytes)]
        },
        async setMetadata(changes) {
          if (!object) throw Object.assign(new Error('missing'), { code: 404 })
          object.metadata.metadata = structuredClone(changes.metadata)
        },
      }
    },
  }

  const FieldValue = { serverTimestamp: () => ({ serverTimestamp: true }) }
  const operations = createMediaOperations({
    db,
    bucket,
    FieldValue,
    Timestamp: TestTimestamp,
    HttpsError: CallableError,
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

  return { db, documents, objects, uploadSessions, operations, addUpload }
}

const operationId = 'c2d30104-f7e6-40fb-a3f6-a29f31c4bfab'
const uid = 'trusted-superadmin'
const bytes = Buffer.from('fake image payload')
const sha256 = createHash('sha256').update(bytes).digest('hex')
const request = {
  auth: { uid, token: { email_verified: true, superadmin: true } },
}
const uploadData = {
  operationId,
  originalName: 'radio.jpg',
  contentType: 'image/jpeg',
  sizeBytes: bytes.length,
  altText: 'Cabina de radio',
  sha256,
}

test('upload session requires a verified superadmin and creates only with ifGenerationMatch=0', async () => {
  const harness = createHarness()
  const result = await harness.operations.finalizeMediaUpload({
    ...request,
    data: { ...uploadData, phase: 'start' },
  })

  assert.deepEqual(result, { uploadUrl: 'https://storage.googleapis.com/upload-session/1' })
  assert.equal(harness.uploadSessions[0].path, `media/${operationId}`)
  assert.equal(harness.uploadSessions[0].options.preconditionOpts.ifGenerationMatch, 0)
  assert.equal(harness.uploadSessions[0].options.metadata.metadata.uploadedBy, uid)
  assert.equal(harness.uploadSessions[0].options.metadata.metadata.sha256, sha256)
  assert.equal(harness.objects.size, 0)
  assert.equal(harness.documents.size, 1)
  assert.equal(harness.documents.has(`media/${operationId}`), false)
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
  assert.equal(harness.objects.get(`media/${operationId}`).metadata.metadata.visibility, 'public')
  const countAfterPublish = harness.documents.size

  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'publish' },
  })
  assert.equal(harness.documents.size, countAfterPublish)
  await harness.operations.setMediaState({
    ...request,
    data: { operationId, action: 'archive' },
  })
  assert.equal(harness.documents.get('privateConfig/mediaCapacity').activeCount, 0)
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
