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

function uploadOptions(uid, uploadId, contentType = 'image/jpeg') {
  return {
    contentType,
    customMetadata: {
      visibility: 'private',
      uploadedBy: uid,
      uploadId,
      sha256: 'a'.repeat(64),
    },
  }
}

after(async () => {
  await testEnvironment.cleanup()
})

test('only verified superadmins can upload supported file types within limits', async () => {
  const editorStorage = authenticatedStorage('storage-editor', {
    email_verified: true,
    editor: true,
  })
  const unverifiedStorage = authenticatedStorage('storage-unverified', {
    email_verified: false,
    superadmin: true,
  })
  const adminStorage = authenticatedStorage('storage-superadmin', {
    email_verified: true,
    superadmin: true,
  })

  await assertFails(uploadBytes(
    ref(editorStorage, 'media/editor.jpg'),
    imageBytes,
    uploadOptions('storage-editor', 'editor.jpg'),
  ))
  await assertFails(uploadBytes(
    ref(unverifiedStorage, 'media/unverified.jpg'),
    imageBytes,
    uploadOptions('storage-unverified', 'unverified.jpg'),
  ))
  await assertFails(uploadBytes(
    ref(adminStorage, 'media/script.js'),
    imageBytes,
    uploadOptions('storage-superadmin', 'script.js', 'application/javascript'),
  ))
  await assertFails(uploadBytes(
    ref(adminStorage, 'media/oversized.jpg'),
    new Uint8Array(10 * 1024 * 1024 + 1),
    uploadOptions('storage-superadmin', 'oversized.jpg'),
  ))
  await assertFails(uploadBytes(
    ref(adminStorage, 'media/nested/file.jpg'),
    imageBytes,
    uploadOptions('storage-superadmin', 'nested/file.jpg'),
  ))
  await assertSucceeds(uploadBytes(
    ref(adminStorage, 'media/private.jpg'),
    imageBytes,
    uploadOptions('storage-superadmin', 'private.jpg'),
  ))
})

test('resumable image uploads complete for JPEG, PNG, and WebP under the existing rules', async () => {
  const uid = 'resumable-image-admin'
  const storage = authenticatedStorage(uid, {
    email_verified: true,
    superadmin: true,
  })

  for (const [extension, contentType] of [
    ['jpg', 'image/jpeg'],
    ['png', 'image/png'],
    ['webp', 'image/webp'],
  ]) {
    const result = await assertSucceeds(uploadBytesResumable(
      ref(storage, `media/resumable-${extension}`),
      imageBytes,
      uploadOptions(uid, `resumable-${extension}`, contentType),
    ))
    assert.equal(result.metadata.contentType, contentType)
  }
})

test('uploads are create-only; clients cannot overwrite, publish, or delete files', async () => {
  const uid = 'storage-owner'
  const adminStorage = authenticatedStorage(uid, {
    email_verified: true,
    superadmin: true,
  })
  const anonymousStorage = testEnvironment.unauthenticatedContext().storage()
  const fileName = `${uid}.jpg`
  const privateRef = ref(adminStorage, `media/${fileName}`)

  await uploadBytes(privateRef, imageBytes, uploadOptions(uid, fileName))
  await assertFails(getBytes(ref(anonymousStorage, `media/${fileName}`)))
  await assertFails(updateMetadata(privateRef, {
    customMetadata: { visibility: 'private', uploadedBy: 'another-user' },
  }))
  await assertFails(deleteObject(privateRef))
  await assertFails(uploadBytes(privateRef, imageBytes, uploadOptions(uid, fileName)))
  assert.deepEqual(new Uint8Array(await getBytes(privateRef)), imageBytes)
  await assertFails(getBytes(ref(anonymousStorage, `media/${fileName}`)))
})
