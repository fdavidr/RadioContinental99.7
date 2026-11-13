import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const mediaService = await readFile(new URL('../src/services/media.ts', import.meta.url), 'utf8')
const mediaPage = await readFile(new URL('../src/pages/admin/AdminMediaPage.tsx', import.meta.url), 'utf8')

test('pending upload checks use the callable instead of direct Storage reads', () => {
  const checkFunction = mediaService.match(/async function checkExistingUpload[\s\S]*?\n}/)?.[0]
  assert.ok(checkFunction, 'checkExistingUpload must exist')
  assert.match(checkFunction, /phase: 'check'/)
  assert.match(checkFunction, /typeof result\.data\?\.exists !== 'boolean'/)
  assert.doesNotMatch(checkFunction, /getMetadata|getBlob|storageRef|ref\(/)
  assert.doesNotMatch(mediaService, /verifyExistingUpload/)

  const adminPreview = mediaService.match(/export async function readAdminMedia[\s\S]*?\n}/)?.[0]
  assert.ok(adminPreview, 'readAdminMedia must remain available')
  assert.match(adminPreview, /getBlob/)
})

test('media administration requires verified superadmin claims in the frontend', () => {
  const authorization = mediaService.match(/export async function assertMediaAdmin[\s\S]*?\n}/)?.[0]
  assert.ok(authorization, 'assertMediaAdmin must exist')
  assert.match(authorization, /token\.claims\.superadmin !== true/)
  assert.match(authorization, /token\.claims\.email_verified !== true/)
  assert.match(authorization, /Verificá el correo/)
  assert.match(mediaPage, /await assertMediaAdmin\(auth\.user\)/)
})
