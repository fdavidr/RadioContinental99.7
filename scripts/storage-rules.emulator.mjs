import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteObject,
  getBytes,
  ref,
  updateMetadata,
  uploadBytes,
  uploadBytesResumable,
} from 'firebase/storage'

const projectId = 'demo-radio-rules'
const testEnvironment = await initializeTestEnvironment({
  projectId,
  storage: {
    rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
  },
})

const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

function authenticatedStorage(uid, claims = {}) {
  return testEnvironment.authenticatedContext(uid, claims).storage()
}

after(async () => {
  await testEnvironment.cleanup()
})

test('all client uploads are denied, including verified superadmins and resumable uploads', async () => {
  const uid = 'resumable-image-admin'
  const storage = authenticatedStorage(uid, {
    email_verified: true,
    superadmin: true,
  })

  await assertFails(uploadBytes(
    ref(storage, 'media/direct.jpg'),
    imageBytes,
    { contentType: 'image/jpeg' },
  ))
  await assertFails(uploadBytesResumable(
    ref(storage, 'media/resumable.jpg'),
    imageBytes,
    { contentType: 'image/jpeg' },
  ))
})

test('public files are readable, private files stay private, and clients cannot overwrite or delete', async () => {
  const uid = 'storage-owner'
  const adminStorage = authenticatedStorage(uid, {
    email_verified: true,
    superadmin: true,
  })
  const anonymousStorage = testEnvironment.unauthenticatedContext().storage()
  const privateRef = ref(adminStorage, 'media/private.jpg')
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), 'media/private.jpg'), imageBytes, {
      contentType: 'image/jpeg',
      customMetadata: { visibility: 'private', uploadedBy: uid, uploadId: 'private', sha256: 'a'.repeat(64) },
    })
    await uploadBytes(ref(context.storage(), 'media/public.jpg'), imageBytes, {
      contentType: 'image/jpeg',
      customMetadata: { visibility: 'public', uploadedBy: uid, uploadId: 'public', sha256: 'a'.repeat(64) },
    })
  })

  await assertFails(getBytes(ref(anonymousStorage, 'media/private.jpg')))
  await assertSucceeds(getBytes(ref(anonymousStorage, 'media/public.jpg')))
  await assertSucceeds(getBytes(privateRef))
  await assertFails(updateMetadata(privateRef, {
    customMetadata: { visibility: 'public', uploadedBy: uid, uploadId: 'private', sha256: 'a'.repeat(64) },
  }))
  await assertFails(deleteObject(privateRef))
  await assertFails(uploadBytes(privateRef, imageBytes, { contentType: 'image/jpeg' }))
  assert.deepEqual(new Uint8Array(await getBytes(privateRef)), imageBytes)
})
