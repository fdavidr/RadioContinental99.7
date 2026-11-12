import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'

import { initializeApp as initializeAdminApp } from 'firebase-admin/app'
import { getAuth as getAdminAuth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'
import { getStorage as getAdminStorage } from 'firebase-admin/storage'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { connectFirestoreEmulator, doc, getDoc, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import {
  connectStorageEmulator,
  getBytes,
  getMetadata,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

const projectId = process.env.GCLOUD_PROJECT
assert.ok(projectId?.startsWith('demo-'), 'Integration tests require a demo-* project ID.')
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:9099')
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8080')
assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1:9199')

const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
  storage: {
    rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
  },
})
const adminApp = initializeAdminApp({
  projectId,
  storageBucket: `${projectId}.appspot.com`,
}, 'media-emulator-admin')
const adminAuth = getAdminAuth(adminApp)
const adminDb = getAdminFirestore(adminApp)
const adminBucket = getAdminStorage(adminApp).bucket()
const apps = []

before(async () => {
  await testEnvironment.clearFirestore()
})

after(async () => {
  await Promise.all(apps.map(deleteApp))
  await testEnvironment.cleanup()
  await adminApp.delete()
})

async function createUser({ superadmin = false, verified = true } = {}) {
  const suffix = randomUUID()
  const userRecord = await adminAuth.createUser({
    email: `${suffix}@example.invalid`,
    password: `Test-${suffix}-Aa1!`,
    emailVerified: verified,
  })
  if (superadmin) {
    await adminAuth.setCustomUserClaims(userRecord.uid, { superadmin: true })
  }

  const app = initializeApp({
    apiKey: 'demo-api-key',
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  }, `media-client-${suffix}`)
  apps.push(app)
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  await signInWithEmailAndPassword(auth, userRecord.email, `Test-${suffix}-Aa1!`)

  const storage = getStorage(app)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  const firestore = getFirestore(app)
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  const functions = getFunctions(app, 'us-central1')
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)

  return {
    uid: userRecord.uid,
    auth,
    db: firestore,
    storage,
    finalize: httpsCallable(functions, 'finalizeMediaUpload', { timeout: 15_000 }),
    finalizeWithTimeout: (timeout) => httpsCallable(functions, 'finalizeMediaUpload', { timeout }),
    changeState: httpsCallable(functions, 'setMediaState', { timeout: 15_000 }),
  }
}

function createAnonymousStorage() {
  const suffix = randomUUID()
  const app = initializeApp({
    apiKey: 'demo-api-key',
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
  }, `media-anonymous-${suffix}`)
  apps.push(app)
  const storage = getStorage(app)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  return storage
}

function mediaUpload(operationId, bytes, overrides = {}) {
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  return {
    operationId,
    originalName: 'emulator-test.jpg',
    contentType: 'image/jpeg',
    sizeBytes: bytes.length,
    altText: 'Prueba de integración',
    sha256,
    ...overrides,
  }
}

async function upload(user, operation, bytes, { sha256 = operation.sha256, path = operation.operationId } = {}) {
  await uploadBytes(ref(user.storage, `media/${path}`), bytes, {
    contentType: operation.contentType,
    customMetadata: {
      visibility: 'private',
      uploadedBy: user.uid,
      uploadId: path,
      sha256,
    },
  })
}

function errorCode(error) {
  return error?.code ?? ''
}

test('Auth, Storage, Callable Functions, Firestore, retries, transitions, and compensation work end-to-end', async () => {
  const admin = await createUser({ superadmin: true })
  const bytes = Buffer.from('real emulator media bytes')
  const operation = mediaUpload(randomUUID(), bytes)
  await upload(admin, operation, bytes)

  await assert.rejects(
    admin.finalizeWithTimeout(500)(operation),
    (error) => errorCode(error).endsWith('/deadline-exceeded'),
  )
  let committedAfterClientTimeout = false
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((await adminDb.collection('media').doc(operation.operationId).get()).exists) {
      committedAfterClientTimeout = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  assert.equal(committedAfterClientTimeout, true)

  const [first, concurrentRetry] = await Promise.all([
    admin.finalize(operation),
    admin.finalize(operation),
  ])
  assert.deepEqual(first.data, { mediaId: operation.operationId })
  assert.deepEqual(concurrentRetry.data, { mediaId: operation.operationId })

  const mediaRef = doc(admin.db, 'media', operation.operationId)
  const media = await getDoc(mediaRef)
  assert.equal(media.data().createdBy, admin.uid)
  assert.equal(media.data().status, 'draft')
  assert.equal((await adminDb.collection('adminLogs').doc(`media-${operation.operationId}`).get()).exists, true)
  assert.equal((await adminDb.collection('privateConfig').doc('mediaCapacity').get()).data().activeCount, 1)

  await assert.rejects(
    admin.changeState({ operationId: operation.operationId, action: 'publish', expectedUpdatedAt: 0 }),
    (error) => errorCode(error).endsWith('/aborted'),
  )
  assert.equal((await getMetadata(ref(admin.storage, `media/${operation.operationId}`))).customMetadata.visibility, 'private')
  assert.equal((await getDoc(mediaRef)).data().status, 'draft')

  await admin.changeState({ operationId: operation.operationId, action: 'publish' })
  assert.equal((await getDoc(mediaRef)).data().status, 'published')
  const anonymousStorage = createAnonymousStorage()
  assert.deepEqual(
    new Uint8Array(await getBytes(ref(anonymousStorage, `media/${operation.operationId}`))),
    new Uint8Array(bytes),
  )

  await admin.changeState({ operationId: operation.operationId, action: 'unpublish' })
  assert.equal((await getMetadata(ref(admin.storage, `media/${operation.operationId}`))).customMetadata.visibility, 'private')
  await assert.rejects(
    getBytes(ref(anonymousStorage, `media/${operation.operationId}`)),
    (error) => errorCode(error).endsWith('/unauthorized'),
  )
  assert.equal((await getDoc(mediaRef)).data().status, 'draft')
  await admin.changeState({ operationId: operation.operationId, action: 'archive' })
  assert.equal((await getDoc(mediaRef)).data().isArchived, true)
  assert.equal((await adminDb.collection('privateConfig').doc('mediaCapacity').get()).data().activeCount, 0)
})

test('Functions reject unverified, unprivileged, wrong-owner, bad-hash, missing-path, and colliding operations', async () => {
  const editor = await createUser()
  const unverifiedAdmin = await createUser({ superadmin: true, verified: false })
  const admin = await createUser({ superadmin: true })
  const bytes = Buffer.from('validation bytes')

  for (const user of [editor, unverifiedAdmin]) {
    const operation = mediaUpload(randomUUID(), bytes)
    await assert.rejects(user.finalize(operation), (error) => errorCode(error).endsWith('/permission-denied'))
    assert.equal((await adminDb.collection('media').doc(operation.operationId).get()).exists, false)
  }

  const owned = mediaUpload(randomUUID(), bytes)
  await upload(admin, owned, bytes)
  await assert.rejects(editor.finalize(owned), (error) => errorCode(error).endsWith('/permission-denied'))
  const otherAdmin = await createUser({ superadmin: true })
  await assert.rejects(
    otherAdmin.finalize(owned),
    (error) => errorCode(error).endsWith('/already-exists'),
  )

  const badHash = mediaUpload(randomUUID(), bytes)
  await upload(admin, badHash, bytes, { sha256: '0'.repeat(64) })
  await assert.rejects(admin.finalize(badHash), (error) => errorCode(error).endsWith('/already-exists'))
  assert.equal((await adminDb.collection('media').doc(badHash.operationId).get()).exists, false)

  const missing = mediaUpload(randomUUID(), bytes)
  await assert.rejects(admin.finalize(missing), (error) => errorCode(error).endsWith('/failed-precondition'))

  const collision = mediaUpload(randomUUID(), bytes)
  await upload(admin, collision, bytes)
  const collisionRef = adminDb.collection('media').doc(collision.operationId)
  await collisionRef.set({
    createdBy: 'different-owner',
    originalName: 'existing.jpg',
    storagePath: `media/${collision.operationId}`,
    contentType: collision.contentType,
    sizeBytes: collision.sizeBytes,
    altText: collision.altText,
  })
  await assert.rejects(admin.finalize(collision), (error) => errorCode(error).endsWith('/already-exists'))
  assert.equal((await collisionRef.get()).data().createdBy, 'different-owner')
})

test('concurrent uploads with one ID cannot replace bytes; ambiguous finalization retries remain idempotent', async () => {
  const admin = await createUser({ superadmin: true })
  const operationId = randomUUID()
  const firstBytes = Buffer.from('first object contents')
  const secondBytes = Buffer.from('second object contents')
  const firstOperation = mediaUpload(operationId, firstBytes)
  const secondOperation = mediaUpload(operationId, secondBytes)
  const outcomes = await Promise.allSettled([
    upload(admin, firstOperation, firstBytes),
    upload(admin, secondOperation, secondBytes),
  ])
  assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(outcomes.filter(({ status }) => status === 'rejected').length, 1)

  const objectBytes = Buffer.from(await getBytes(ref(admin.storage, `media/${operationId}`)))
  const operation = objectBytes.equals(firstBytes) ? firstOperation : secondOperation
  await admin.finalize(operation)
  await admin.finalize(operation)
  assert.equal((await adminDb.collection('media').doc(operationId).get()).exists, true)
  assert.equal((await adminDb.collection('adminLogs').doc(`media-${operationId}`).get()).exists, true)
  assert.equal((await getMetadata(ref(admin.storage, `media/${operationId}`))).size, String(objectBytes.length))
})

test('Firestore validation failure leaves the completed Storage object private and unregistered', async () => {
  const admin = await createUser({ superadmin: true })
  const bytes = Buffer.from('failed registration bytes')
  const operation = mediaUpload(randomUUID(), bytes)
  await upload(admin, operation, bytes)
  await adminDb.collection('privateConfig').doc('mediaCapacity').set({ activeCount: 'invalid' })

  await assert.rejects(admin.finalize(operation), (error) =>
    errorCode(error).endsWith('/failed-precondition'))
  assert.equal((await adminDb.collection('media').doc(operation.operationId).get()).exists, false)
  assert.equal((await adminDb.collection('adminLogs').doc(`media-${operation.operationId}`).get()).exists, false)
  assert.equal((await getMetadata(ref(admin.storage, `media/${operation.operationId}`))).customMetadata.visibility, 'private')

  await adminDb.collection('privateConfig').doc('mediaCapacity').delete()
})

test('legacy objects without a verifiable hash cannot be published', async () => {
  const admin = await createUser({ superadmin: true })
  const operationId = randomUUID()
  const bytes = Buffer.from('legacy bytes')
  const path = `media/legacy-${operationId}`
  await adminBucket.file(path).save(bytes, {
    metadata: {
      contentType: 'image/jpeg',
      metadata: { uploadedBy: admin.uid, visibility: 'private' },
    },
  })
  await adminDb.collection('media').doc(operationId).set({
    createdBy: admin.uid,
    storagePath: path,
    contentType: 'image/jpeg',
    sizeBytes: bytes.length,
    status: 'draft',
    isArchived: false,
  })

  await assert.rejects(admin.changeState({ operationId, action: 'publish' }),
    (error) => errorCode(error).endsWith('/failed-precondition'))
  assert.equal((await getMetadata(ref(admin.storage, path))).customMetadata.visibility, 'private')
})

test('a missing Storage object prevents state changes in Firestore', async () => {
  const admin = await createUser({ superadmin: true })
  const operation = mediaUpload(randomUUID(), Buffer.from('removed object'))
  await upload(admin, operation, Buffer.from('removed object'))
  await admin.finalize(operation)
  await adminBucket.file(`media/${operation.operationId}`).delete()

  await assert.rejects(
    admin.changeState({ operationId: operation.operationId, action: 'publish' }),
    (error) => errorCode(error).endsWith('/failed-precondition'),
  )
  assert.equal((await adminDb.collection('media').doc(operation.operationId).get()).data().status, 'draft')
})
