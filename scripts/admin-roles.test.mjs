import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import {
  acquireRoleOperationLock,
  performRoleOperation,
  PRODUCTION_PROJECT_ID,
  resolveRoleClaims,
  validateProjectId,
} from './admin-roles.mjs'

function createAuth(user) {
  const calls = []
  return {
    calls,
    async getUser(uid) {
      calls.push(['getUser', uid])
      if (!user || user.uid !== uid) {
        const error = new Error('not found')
        error.code = 'auth/user-not-found'
        throw error
      }
      return user
    },
    async getUserByEmail(email) {
      calls.push(['getUserByEmail', email])
      if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
        const error = new Error('not found')
        error.code = 'auth/user-not-found'
        throw error
      }
      return user
    },
    async setCustomUserClaims(uid, claims) {
      calls.push(['setCustomUserClaims', uid, claims])
    },
  }
}

const verifiedUser = (claims = {}) => ({
  uid: 'uid-123',
  email: 'admin@example.test',
  emailVerified: true,
  disabled: false,
  customClaims: claims,
})

test('rejects project IDs other than the production allowlist', () => {
  assert.throws(() => validateProjectId('demo-radio-rules'), /solo admite radio997-d5380/)
  assert.throws(() => validateProjectId(PRODUCTION_PROJECT_ID, {
    GOOGLE_CLOUD_PROJECT: 'different-project',
  }), /apunta a otro proyecto/)
  assert.throws(() => validateProjectId(PRODUCTION_PROJECT_ID, {
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  }), /Auth Emulator/)
  assert.doesNotThrow(() => validateProjectId(PRODUCTION_PROJECT_ID, {}))
})

test('reports a user-not-found result for an unknown UID or email', async () => {
  const auth = createAuth(null)
  await assert.rejects(
    performRoleOperation({
      auth, projectId: PRODUCTION_PROJECT_ID, command: 'show',
      selector: { uid: 'missing' },
    }),
    /No existe una cuenta/,
  )
  await assert.rejects(
    performRoleOperation({
      auth, projectId: PRODUCTION_PROJECT_ID, command: 'show',
      selector: { email: 'missing@example.test' },
    }),
    /No existe una cuenta/,
  )
})

test('looks up users by email and displays current claims without mutation', async () => {
  const auth = createAuth(verifiedUser({ editor: true, department: 'news' }))
  const result = await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'show',
    selector: { email: ' ADMIN@example.test ' },
  })
  assert.equal(result.user.uid, 'uid-123')
  assert.deepEqual(result.user.customClaims, { editor: true, department: 'news' })
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('requires a verified email and matching approved email before assignment', async () => {
  const unverifiedAuth = createAuth({ ...verifiedUser(), emailVerified: false })
  await assert.rejects(
    performRoleOperation({
      auth: unverifiedAuth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'superadmin',
      confirm: async (details) => details.phrase,
    }),
    /no está verificado/,
  )

  const auth = createAuth(verifiedUser())
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'someone-else@example.test',
      role: 'superadmin',
      confirm: async (details) => details.phrase,
    }),
    /no coincide/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('rejects disabled accounts and non-matching email before assignment', async () => {
  const disabledAuth = createAuth({ ...verifiedUser(), disabled: true })
  await assert.rejects(
    performRoleOperation({
      auth: disabledAuth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async (details) => details.phrase,
    }),
    /cuenta está deshabilitada/,
  )

  const changedEmailAuth = createAuth(verifiedUser())
  const getUser = changedEmailAuth.getUser.bind(changedEmailAuth)
  let userReads = 0
  changedEmailAuth.getUser = async (uid) => {
    userReads += 1
    const user = await getUser(uid)
    return userReads === 1 ? user : { ...user, email: 'changed@example.test' }
  }
  await assert.rejects(
    performRoleOperation({
      auth: changedEmailAuth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async (details) => details.phrase,
    }),
    /correo cambió durante la confirmación/,
  )
  assert.equal(changedEmailAuth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('assigns superadmin while preserving additional claims and removing the other app role', async () => {
  const auth = createAuth(verifiedUser({
    editor: true,
    department: 'news',
    featureAccess: ['reports'],
  }))
  const auditRecords = []
  const result = await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'assign',
    selector: { uid: 'uid-123' },
    expectedEmail: 'ADMIN@example.test',
    role: 'superadmin',
    confirm: async (details) => details.phrase,
    audit: async (record) => { auditRecords.push(record) },
  })
  assert.equal(result.changed, true)
  assert.deepEqual(auth.calls.at(-1), ['setCustomUserClaims', 'uid-123', {
    department: 'news',
    featureAccess: ['reports'],
    superadmin: true,
  }])
  assert.deepEqual(auditRecords.map((record) => record.outcome), ['requested', 'succeeded'])
  assert.equal(JSON.stringify(auditRecords).includes('admin@example.test'), false)
})

test('assigns editor and preserves unrelated claims', async () => {
  const auth = createAuth(verifiedUser({ tenant: 'editorial' }))
  await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'assign',
    selector: { uid: 'uid-123' },
    expectedEmail: 'admin@example.test',
    role: 'editor',
    confirm: async (details) => details.phrase,
  })
  assert.deepEqual(auth.calls.at(-1)[2], { tenant: 'editorial', editor: true })
})

test('revokes a role or all app roles without dropping unrelated claims', async () => {
  const auth = createAuth(verifiedUser({
    superadmin: true,
    editor: true,
    region: 'ar',
  }))
  await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'revoke',
    selector: { uid: 'uid-123' },
    role: 'superadmin',
    confirm: async (details) => details.phrase,
  })
  assert.deepEqual(auth.calls.at(-1)[2], { editor: true, region: 'ar' })

  auth.calls.length = 0
  const allRolesAuth = createAuth(verifiedUser({
    superadmin: true,
    editor: true,
    region: 'ar',
  }))
  await performRoleOperation({
    auth: allRolesAuth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'revoke',
    selector: { uid: 'uid-123' },
    role: 'all',
    confirm: async (details) => details.phrase,
  })
  assert.deepEqual(allRolesAuth.calls.at(-1)[2], { region: 'ar' })
})

test('revoking editor preserves superadmin and unknown claims', async () => {
  const auth = createAuth(verifiedUser({
    superadmin: true,
    editor: true,
    customPermission: { reports: true },
  }))
  await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'revoke',
    selector: { uid: 'uid-123' },
    role: 'editor',
    confirm: async (details) => details.phrase,
  })
  assert.deepEqual(auth.calls.at(-1)[2], {
    superadmin: true,
    customPermission: { reports: true },
  })
})

test('requires the exact explicit confirmation phrase before changing claims', async () => {
  const auth = createAuth(verifiedUser())
  const auditRecords = []
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async () => 'yes',
      audit: async (record) => { auditRecords.push(record) },
    }),
    /confirmación no coincidió/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
  assert.equal(auditRecords.length, 0)
})

test('rejects stale claims if another operator changes them during confirmation', async () => {
  const auth = createAuth(verifiedUser({ department: 'news' }))
  const getUser = auth.getUser.bind(auth)
  let userReads = 0
  auth.getUser = async (uid) => {
    userReads += 1
    const user = await getUser(uid)
    return userReads === 1
      ? user
      : { ...user, customClaims: { department: 'updated-by-another-operator' } }
  }

  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async (details) => details.phrase,
    }),
    /claims cambiaron durante la confirmación/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('rejects stale claims changed while the audit intent is written', async () => {
  const user = verifiedUser({ department: 'news' })
  const auth = createAuth(user)
  const auditRecords = []
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async (details) => details.phrase,
      audit: async (record) => {
        auditRecords.push(record)
        if (record.outcome === 'requested') user.customClaims = { ...user.customClaims, editor: true }
      },
    }),
    /cambiaron antes de guardar/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
  assert.deepEqual(auditRecords.map((record) => record.outcome), ['requested', 'cancelled_stale'])
})

test('serializes role mutations from concurrent CLI processes on the same host', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'radio-role-lock-'))
  try {
    const releaseFirst = await acquireRoleOperationLock(directory)
    await assert.rejects(acquireRoleOperationLock(directory), /Ya existe un bloqueo de roles/)
    await releaseFirst()
    const releaseNext = await acquireRoleOperationLock(directory)
    await releaseNext()
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('surfaces Firebase Admin lookup errors without attempting a mutation', async () => {
  const auth = createAuth(verifiedUser())
  auth.getUser = async () => {
    throw new Error('Firebase Auth unavailable')
  }
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'revoke',
      selector: { uid: 'uid-123' },
      role: 'editor',
      confirm: async (details) => details.phrase,
    }),
    /Firebase Auth unavailable/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('surfaces Firebase Admin claim-write errors and records the failed attempt', async () => {
  const auth = createAuth(verifiedUser({ existingPermission: 'preserve' }))
  auth.setCustomUserClaims = async () => {
    throw new Error('Firebase claim update rejected')
  }
  const auditRecords = []
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'assign',
      selector: { uid: 'uid-123' },
      expectedEmail: 'admin@example.test',
      role: 'editor',
      confirm: async (details) => details.phrase,
      audit: async (record) => { auditRecords.push(record) },
    }),
    /Firebase claim update rejected/,
  )
  assert.deepEqual(auditRecords.map((record) => record.outcome), ['requested', 'failed'])
})

test('refuses to mutate when no interactive confirmation callback exists', async () => {
  const auth = createAuth(verifiedUser())
  await assert.rejects(
    performRoleOperation({
      auth,
      projectId: PRODUCTION_PROJECT_ID,
      command: 'revoke',
      selector: { uid: 'uid-123' },
      role: 'all',
    }),
    /confirmación interactiva/,
  )
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('does not make a claims request when the requested role state already matches', async () => {
  const auth = createAuth(verifiedUser({ editor: true, department: 'news' }))
  const result = await performRoleOperation({
    auth,
    projectId: PRODUCTION_PROJECT_ID,
    command: 'assign',
    selector: { uid: 'uid-123' },
    expectedEmail: 'admin@example.test',
    role: 'editor',
    confirm: async (details) => details.phrase,
  })
  assert.equal(result.changed, false)
  assert.equal(auth.calls.some(([name]) => name === 'setCustomUserClaims'), false)
})

test('role claim transformation validates roles and preserves unrelated claims', () => {
  assert.deepEqual(
    resolveRoleClaims({ editor: true, team: 'news' }, 'assign', 'superadmin'),
    { team: 'news', superadmin: true },
  )
  assert.throws(() => resolveRoleClaims({}, 'assign', 'owner'), /no es válido/)
})
