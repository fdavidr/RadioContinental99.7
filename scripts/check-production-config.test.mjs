import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const scriptPath = fileURLToPath(new URL('./check-production-config.mjs', import.meta.url))
const baseEnvironment = {
  ...process.env,
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'radio.example.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'radio-example',
  VITE_FIREBASE_STORAGE_BUCKET: 'radio-example.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
  VITE_USE_FIREBASE_EMULATORS: 'false',
}

function runConfigCheck(siteUrl) {
  return spawnSync(process.execPath, [scriptPath], {
    encoding: 'utf8',
    env: { ...baseEnvironment, VITE_SITE_URL: siteUrl },
  })
}

test('production config accepts the official canonical origin', () => {
  const result = runConfigCheck('https://continental997.fm')
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('production config rejects the Render hostname as canonical', () => {
  const result = runConfigCheck('https://radiocontinental99-7.onrender.com')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /https:\/\/continental997\.fm/)
})
