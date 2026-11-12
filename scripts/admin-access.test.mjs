import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  parseArguments,
  performAccessOperation,
  PRODUCTION_PROJECT_ID,
  validateProjectId,
} from './admin-access.mjs'

function createAuth(user) {
  const calls = []
  return {
    calls,
    async getUser(uid) {
      calls.push(['getUser', uid])
      if (uid !== user.uid) throw new Error('not found')
      return user
    },
  }
}

function createFirestore(initialMarker = null) {
  const markers = new Map(initialMarker ? [[initialMarker.uid, initialMarker.data]] : [])
  const writes = []
  const markerRef = (uid) => ({
    uid,
    async get() {
      const value = markers.get(uid)
      return { exists: value !== undefined, data: () => value }
    },
  })

  return {
    markers,
    writes,
    collection(name) {
      assert.equal(name, 'adminAccess')
      return { doc: (uid) => markerRef(uid) }
    },
    async runTransaction(callback) {
      return callback({
        async get(reference) {
          const value = markers.get(reference.uid)
          return { exists: value !== undefined, data: () => value }
        },
        set(reference, value) {
          writes.push([reference.uid, value])
          markers.set(reference.uid, value)
        },
      })
    },
  }
}

const user = {
  uid: 'uid-123',
  email: 'admin@example.test',
}
const timestamp = () => ({ toDate: () => new Date() })

test('access-marker CLI is restricted to the production project and parses explicit target identity', () => {
  assert.throws(() => validateProjectId('demo-radio-rules'), /solo admite radio997-d5380/)
  assert.throws(() => validateProjectId(PRODUCTION_PROJECT_ID, {
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  }), /Firebase Emulator/)
  assert.deepEqual(parseArguments([
    'suspend',
    '--project', PRODUCTION_PROJECT_ID,
    '--uid', user.uid,
    '--email', user.email,
  ]), {
    command: 'suspend',
    projectId: PRODUCTION_PROJECT_ID,
    uid: user.uid,
    expectedEmail: user.email,
  })
  assert.throws(() => parseArguments([
    'suspend', '--project', PRODUCTION_PROJECT_ID, '--uid', user.uid,
  ]), /requiere --email/)
})

test('suspending writes only the protected access marker after exact identity and confirmation', async () => {
  const auth = createAuth(user)
  const firestore = createFirestore()
  const audit = []
  const result = await performAccessOperation({
    auth,
    firestore,
    projectId: PRODUCTION_PROJECT_ID,
    env: {},
    command: 'suspend',
    uid: user.uid,
    expectedEmail: user.email,
    confirm: async (details) => details.phrase,
    audit: async (record) => audit.push(record),
    serverTimestamp: timestamp,
  })

  assert.equal(result.status, 'suspended')
  assert.equal(firestore.markers.get(user.uid).suspended, true)
  assert.equal(firestore.writes.length, 1)
  assert.deepEqual(firestore.writes[0][1].suspended, true)
  assert.equal(auth.calls.length, 1)
  assert.deepEqual(audit.map((record) => record.outcome), ['requested', 'succeeded'])
})

test('reactivating changes a suspended marker without modifying Auth claims or user records', async () => {
  const auth = createAuth(user)
  const firestore = createFirestore({
    uid: user.uid,
    data: { suspended: true, updatedAt: timestamp() },
  })

  const result = await performAccessOperation({
    auth,
    firestore,
    projectId: PRODUCTION_PROJECT_ID,
    env: {},
    command: 'reactivate',
    uid: user.uid,
    expectedEmail: user.email,
    confirm: async (details) => details.phrase,
    serverTimestamp: timestamp,
  })

  assert.equal(result.status, 'active')
  assert.equal(firestore.markers.get(user.uid).suspended, false)
  assert.equal(auth.calls.length, 1)
})

test('email mismatch, failed confirmation, and malformed markers cannot mutate access state', async () => {
  const auth = createAuth(user)
  const firestore = createFirestore({
    uid: user.uid,
    data: { suspended: false, updatedAt: timestamp() },
  })

  await assert.rejects(performAccessOperation({
    auth,
    firestore,
    projectId: PRODUCTION_PROJECT_ID,
    env: {},
    command: 'suspend',
    uid: user.uid,
    expectedEmail: 'other@example.test',
    confirm: async (details) => details.phrase,
    serverTimestamp: timestamp,
  }), /no coincide/)

  await assert.rejects(performAccessOperation({
    auth,
    firestore,
    projectId: PRODUCTION_PROJECT_ID,
    env: {},
    command: 'reactivate',
    uid: user.uid,
    expectedEmail: user.email,
    confirm: async () => 'no',
    serverTimestamp: timestamp,
  }), /no coincidió/)

  firestore.markers.set(user.uid, { updatedAt: timestamp() })
  await assert.rejects(performAccessOperation({
    auth,
    firestore,
    projectId: PRODUCTION_PROJECT_ID,
    env: {},
    command: 'suspend',
    uid: user.uid,
    expectedEmail: user.email,
    confirm: async (details) => details.phrase,
    serverTimestamp: timestamp,
  }), /formato inválido/)

  assert.equal(firestore.writes.length, 0)
})
