import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const functionsSource = await readFile(new URL('../functions/index.mjs', import.meta.url), 'utf8')
const clientSource = await readFile(new URL('../src/lib/firebaseFunctions.ts', import.meta.url), 'utf8')

test('media callable functions restrict CORS to the production site origins', () => {
  assert.match(functionsSource, /const mediaCallableCors = \[\s*'https:\/\/continental997\.fm',\s*'https:\/\/www\.continental997\.fm',?\s*\]/)
  assert.equal((functionsSource.match(/cors: mediaCallableCors/g) ?? []).length, 2)
  assert.equal((functionsSource.match(/invoker: 'public'/g) ?? []).length, 2)
  assert.equal((functionsSource.match(/region: 'us-central1'/g) ?? []).length, 2)
})

test('frontend explicitly targets the deployed Functions region', () => {
  assert.match(clientSource, /getFunctions\(firebaseApp, 'us-central1'\)/)
})
