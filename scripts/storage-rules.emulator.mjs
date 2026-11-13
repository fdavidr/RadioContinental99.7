import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { getBytes, ref, uploadBytes } from 'firebase/storage'

const testEnvironment = await initializeTestEnvironment({
  projectId: 'demo-radio-storage-rules',
  storage: {
    rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
  },
})

after(() => testEnvironment.cleanup())

test('Storage allows public reads, verified admin private reads, and denies client writes', async () => {
  const payload = new Blob(['image payload'], { type: 'image/jpeg' })
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage()
    await uploadBytes(ref(storage, 'media/public.jpg'), payload, {
      customMetadata: { visibility: 'public' },
    })
    await uploadBytes(ref(storage, 'media/private.jpg'), payload, {
      customMetadata: { visibility: 'private' },
    })
  })

  const anonymousStorage = testEnvironment.unauthenticatedContext().storage()
  const verifiedAdminStorage = testEnvironment.authenticatedContext('admin', {
    superadmin: true,
    email_verified: true,
  }).storage()
  const unverifiedAdminStorage = testEnvironment.authenticatedContext('unverified', {
    superadmin: true,
    email_verified: false,
  }).storage()

  await assertSucceeds(getBytes(ref(anonymousStorage, 'media/public.jpg')))
  await assertFails(getBytes(ref(anonymousStorage, 'media/private.jpg')))
  await assertSucceeds(getBytes(ref(verifiedAdminStorage, 'media/private.jpg')))
  await assertFails(getBytes(ref(unverifiedAdminStorage, 'media/private.jpg')))
  await assertFails(uploadBytes(ref(verifiedAdminStorage, 'media/direct.jpg'), payload))
  await assertFails(uploadBytes(ref(anonymousStorage, 'media/anonymous.jpg'), payload))
})
