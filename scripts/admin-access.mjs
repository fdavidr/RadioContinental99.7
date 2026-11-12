import { appendFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createInterface } from 'node:readline/promises'

export const PRODUCTION_PROJECT_ID = 'radio997-d5380'
const OPERATIONS = ['suspend', 'reactivate']

function usage() {
  return [
    'Usage:',
    '  node scripts/admin-access.mjs show --project radio997-d5380 --uid UID',
    '  node scripts/admin-access.mjs suspend --project radio997-d5380 --uid UID --email EMAIL',
    '  node scripts/admin-access.mjs reactivate --project radio997-d5380 --uid UID --email EMAIL',
  ].join('\n')
}

export function validateProjectId(projectId, env = process.env) {
  if (projectId !== PRODUCTION_PROJECT_ID) {
    throw new Error(`Proyecto rechazado: esta herramienta solo admite ${PRODUCTION_PROJECT_ID}.`)
  }
  for (const variable of [
    'GOOGLE_CLOUD_PROJECT',
    'GCLOUD_PROJECT',
    'CLOUDSDK_CORE_PROJECT',
  ]) {
    const configuredProject = env[variable]?.trim()
    if (configuredProject && configuredProject !== PRODUCTION_PROJECT_ID) {
      throw new Error(`${variable} apunta a otro proyecto; no se realizará ninguna operación.`)
    }
  }
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('No se permite ejecutar esta herramienta con Firebase Emulator configurado.')
  }
}

export function parseArguments(argv) {
  const [command, ...args] = argv
  if (!['show', ...OPERATIONS].includes(command)) throw new Error(usage())
  const options = {}
  const allowed = new Set(['--project', '--uid', '--email'])
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index]
    if (!allowed.has(key) || options[key]) throw new Error(`Opción desconocida o duplicada: ${key}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Falta el valor para ${key}.`)
    options[key] = value
    index += 1
  }

  if (!options['--project']) throw new Error('--project es obligatorio.\n' + usage())
  if (!options['--uid']?.trim()) throw new Error('--uid es obligatorio.\n' + usage())
  if (command !== 'show' && !options['--email']?.trim()) {
    throw new Error(`${command} requiere --email para verificar la identidad del UID.`)
  }
  if (command === 'show' && options['--email']) {
    throw new Error('show solo acepta --uid.')
  }

  return {
    command,
    projectId: options['--project'],
    uid: options['--uid'].trim(),
    expectedEmail: options['--email']?.trim().toLowerCase(),
  }
}

function confirmationPhrase(command, uid) {
  return `CONFIRMAR ${command.toUpperCase()} ${uid} ${PRODUCTION_PROJECT_ID}`
}

function parseMarker(snapshot) {
  if (!snapshot.exists) return { exists: false, suspended: false }
  const data = snapshot.data()
  const keys = Object.keys(data).sort()
  if (
    keys.length !== 2
    || keys[0] !== 'suspended'
    || keys[1] !== 'updatedAt'
    || typeof data.suspended !== 'boolean'
    || data.updatedAt == null
  ) {
    throw new Error('El marcador de acceso tiene un formato inválido; no se modificó.')
  }
  return { exists: true, suspended: data.suspended }
}

export async function performAccessOperation({
  auth,
  firestore,
  projectId,
  env = {},
  command,
  uid,
  expectedEmail,
  confirm,
  audit = async () => undefined,
  serverTimestamp,
}) {
  validateProjectId(projectId, env)
  if (!['show', ...OPERATIONS].includes(command)) throw new Error('Operación inválida.\n' + usage())
  if (!uid?.trim()) throw new Error('Se requiere un UID.')
  const user = await auth.getUser(uid.trim())
  if (
    command !== 'show'
    && (!expectedEmail || user.email?.trim().toLowerCase() !== expectedEmail.trim().toLowerCase())
  ) {
    throw new Error('El correo no coincide con el UID; no se realizará ninguna modificación.')
  }

  const markerRef = firestore.collection('adminAccess').doc(user.uid)
  const beforeSnapshot = await markerRef.get()
  const before = parseMarker(beforeSnapshot)

  if (command === 'show') {
    return {
      operation: 'show',
      uid: user.uid,
      email: user.email ?? null,
      status: before.suspended ? 'suspended' : 'active',
      markerExists: before.exists,
    }
  }

  if (typeof confirm !== 'function') throw new Error('Se requiere confirmación interactiva.')
  const suspended = command === 'suspend'
  const phrase = confirmationPhrase(command, user.uid)
  if (await confirm({
    operation: command,
    uid: user.uid,
    email: user.email ?? null,
    projectId: PRODUCTION_PROJECT_ID,
    previousStatus: before.suspended ? 'suspended' : 'active',
    resultingStatus: suspended ? 'suspended' : 'active',
    phrase,
  }) !== phrase) {
    throw new Error('La confirmación no coincidió; no se modificó el marcador.')
  }

  if (before.suspended === suspended) {
    return {
      operation: command,
      changed: false,
      uid: user.uid,
      status: suspended ? 'suspended' : 'active',
    }
  }

  const auditRecord = {
    timestamp: new Date().toISOString(),
    projectId: PRODUCTION_PROJECT_ID,
    operation: command,
    targetUid: user.uid,
    targetEmail: user.email ?? null,
    previousStatus: before.suspended ? 'suspended' : 'active',
    resultingStatus: suspended ? 'suspended' : 'active',
    outcome: 'requested',
  }
  await audit(auditRecord)

  try {
    await firestore.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(markerRef)
      const current = parseMarker(currentSnapshot)
      if (current.suspended !== before.suspended || current.exists !== before.exists) {
        throw new Error('El marcador cambió durante la confirmación; revisá su estado antes de reintentar.')
      }
      transaction.set(markerRef, {
        suspended,
        updatedAt: serverTimestamp(),
      })
    })
  } catch (error) {
    await audit({ ...auditRecord, timestamp: new Date().toISOString(), outcome: 'failed' })
    throw error
  }

  await audit({ ...auditRecord, timestamp: new Date().toISOString(), outcome: 'succeeded' })
  return {
    operation: command,
    changed: true,
    uid: user.uid,
    status: suspended ? 'suspended' : 'active',
  }
}

function auditPath() {
  const baseDirectory = process.env.LOCALAPPDATA || join(homedir(), '.local', 'state')
  return join(baseDirectory, 'RadioContinental99.7', 'admin-access-audit.jsonl')
}

async function writeAuditRecord(record) {
  const path = auditPath()
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await appendFile(path, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 })
  return path
}

async function promptForConfirmation(details) {
  console.log(`Proyecto: ${details.projectId}`)
  console.log(`Cuenta: ${details.email ?? '(sin correo)'} (${details.uid})`)
  console.log(`Estado actual: ${details.previousStatus}; estado solicitado: ${details.resultingStatus}`)
  console.log(`Para continuar, escribe exactamente: ${details.phrase}`)
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    return await readline.question('Confirmación: ')
  } finally {
    readline.close()
  }
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  validateProjectId(options.projectId)
  const [
    { applicationDefault, initializeApp },
    { getAuth },
    { FieldValue, getFirestore },
  ] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/auth'),
    import('firebase-admin/firestore'),
  ])
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: PRODUCTION_PROJECT_ID,
  }, 'radio997-access-admin')
  const result = await performAccessOperation({
    ...options,
    auth: getAuth(app),
    firestore: getFirestore(app),
    env: process.env,
    confirm: options.command === 'show' ? undefined : promptForConfirmation,
    audit: writeAuditRecord,
    serverTimestamp: FieldValue.serverTimestamp,
  })

  console.log(JSON.stringify(result, null, 2))
  if (result.changed) {
    console.log('El marcador protegido se guardó en Firestore; no se modificaron usuarios ni claims.')
    console.log('La suspensión bloquea operaciones Firestore en Rules. Storage conserva la vigencia del ID token.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falló la operación de acceso.')
    process.exitCode = 1
  })
}
