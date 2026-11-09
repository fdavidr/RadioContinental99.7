import { appendFile, mkdir, open, unlink } from 'node:fs/promises'
import { homedir, hostname } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { isDeepStrictEqual } from 'node:util'

export const PRODUCTION_PROJECT_ID = 'radio997-d5380'
const APP_ROLES = ['superadmin', 'editor']

function usage() {
  return [
    'Usage:',
    '  node scripts/admin-roles.mjs show --project radio997-d5380 (--uid UID | --email EMAIL)',
    '  node scripts/admin-roles.mjs assign --project radio997-d5380 --uid UID --email EMAIL --role (superadmin|editor)',
    '  node scripts/admin-roles.mjs revoke --project radio997-d5380 --uid UID --role (superadmin|editor|all)',
  ].join('\n')
}

export function validateProjectId(projectId, env = process.env) {
  if (projectId !== PRODUCTION_PROJECT_ID) {
    throw new Error(`Proyecto rechazado: esta herramienta solo admite ${PRODUCTION_PROJECT_ID}.`)
  }

  for (const variable of ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'CLOUDSDK_CORE_PROJECT']) {
    const configuredProject = env[variable]?.trim()
    if (configuredProject && configuredProject !== PRODUCTION_PROJECT_ID) {
      throw new Error(`${variable} apunta a otro proyecto; no se realizará ninguna operación.`)
    }
  }

  if (env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('No se permite ejecutar esta herramienta con Firebase Auth Emulator configurado.')
  }
}

export function resolveRoleClaims(existingClaims, operation, role) {
  if (
    typeof existingClaims !== 'object'
    || existingClaims === null
    || Array.isArray(existingClaims)
  ) {
    throw new Error('Firebase devolvió custom claims con un formato inválido.')
  }

  const nextClaims = { ...existingClaims }
  if (operation === 'assign') {
    if (!APP_ROLES.includes(role)) throw new Error('El rol solicitado no es válido.')
    for (const appRole of APP_ROLES) delete nextClaims[appRole]
    nextClaims[role] = true
    return nextClaims
  }

  if (operation === 'revoke') {
    if (role === 'all') {
      for (const appRole of APP_ROLES) delete nextClaims[appRole]
      return nextClaims
    }
    if (!APP_ROLES.includes(role)) throw new Error('El rol solicitado no es válido.')
    delete nextClaims[role]
    return nextClaims
  }

  throw new Error('La operación solicitada no es válida.')
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export async function resolveUser(auth, selector) {
  if (selector.uid && selector.email) throw new Error('Usá UID o correo para consultar, no ambos.')
  if (!selector.uid && !selector.email) throw new Error('Indicá un UID o correo.')

  try {
    return selector.uid
      ? await auth.getUser(selector.uid)
      : await auth.getUserByEmail(normalizeEmail(selector.email))
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      throw new Error('No existe una cuenta con ese UID o correo.')
    }
    throw error
  }
}

function appRoles(claims) {
  return Object.fromEntries(APP_ROLES.map((role) => [role, claims[role] === true]))
}

function confirmationPhrase(operation, role, uid) {
  return `CONFIRMAR ${operation.toUpperCase()} ${role} ${uid} ${PRODUCTION_PROJECT_ID}`
}

function auditDirectory() {
  const baseDirectory = process.env.LOCALAPPDATA || join(homedir(), '.local', 'state')
  return join(baseDirectory, 'RadioContinental99.7')
}

async function writeAuditRecord(record) {
  const directory = auditDirectory()
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const auditPath = join(directory, 'admin-role-audit.jsonl')
  await appendFile(auditPath, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 })
  return auditPath
}

export async function acquireRoleOperationLock(directory = auditDirectory()) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const lockPath = join(directory, 'admin-role-operation.lock')
  let lockHandle
  try {
    lockHandle = await open(lockPath, 'wx', 0o600)
  } catch (error) {
    if (error?.code === 'EEXIST') {
      throw new Error(
        `Ya existe un bloqueo de roles en ${lockPath}. Confirma que no haya otra ejecución activa antes de resolver un bloqueo obsoleto.`,
      )
    }
    throw error
  }

  try {
    await lockHandle.writeFile(`${JSON.stringify({
      pid: process.pid,
      host: hostname(),
      startedAt: new Date().toISOString(),
    })}\n`)
  } catch (error) {
    await lockHandle.close()
    await unlink(lockPath)
    throw error
  }
  await lockHandle.close()

  let released = false
  return async () => {
    if (released) return
    released = true
    await unlink(lockPath)
  }
}

function createAuditRecord(operation, role, user, previousClaims, nextClaims, outcome) {
  return {
    timestamp: new Date().toISOString(),
    projectId: PRODUCTION_PROJECT_ID,
    operatorAccount: process.env.USERNAME || process.env.USER || 'unknown',
    operatorHost: hostname(),
    operation,
    role,
    targetUid: user.uid,
    previousRoles: appRoles(previousClaims),
    resultingRoles: appRoles(nextClaims),
    outcome,
  }
}

export async function performRoleOperation({
  auth,
  projectId,
  env = {},
  command,
  selector,
  role,
  expectedEmail,
  confirm,
  audit = async () => undefined,
}) {
  validateProjectId(projectId, env)

  if (command === 'show') {
    const user = await resolveUser(auth, selector)
    return {
      operation: 'show',
      user: {
        uid: user.uid,
        email: user.email ?? null,
        emailVerified: user.emailVerified === true,
        disabled: user.disabled === true,
        customClaims: user.customClaims ?? {},
      },
    }
  }

  if (!['assign', 'revoke'].includes(command)) throw new Error('Comando inválido.\n' + usage())
  if (!selector?.uid) throw new Error('Las modificaciones requieren --uid.')
  if (command === 'assign' && !normalizeEmail(expectedEmail)) {
    throw new Error('La asignación requiere --email para verificar la identidad del UID.')
  }
  if (typeof confirm !== 'function') throw new Error('Se requiere confirmación interactiva para modificar roles.')

  const user = await resolveUser(auth, { uid: selector.uid })
  if (expectedEmail && normalizeEmail(user.email) !== normalizeEmail(expectedEmail)) {
    throw new Error('El correo no coincide con el UID; no se realizará ninguna modificación.')
  }
  if (command === 'assign') {
    if (user.disabled) throw new Error('La cuenta está deshabilitada; no se pueden asignar roles.')
    if (user.emailVerified !== true) throw new Error('El correo no está verificado; no se pueden asignar roles.')
  }

  const previousClaims = user.customClaims ?? {}
  const nextClaims = resolveRoleClaims(previousClaims, command, role)
  const phrase = confirmationPhrase(command, role, user.uid)
  if (await confirm({
    operation: command,
    role,
    uid: user.uid,
    email: user.email ?? null,
    projectId: PRODUCTION_PROJECT_ID,
    previousRoles: appRoles(previousClaims),
    resultingRoles: appRoles(nextClaims),
    phrase,
  }) !== phrase) {
    throw new Error('La confirmación no coincidió; no se modificaron los claims.')
  }

  const latestUser = await auth.getUser(user.uid)
  const latestClaims = latestUser.customClaims ?? {}
  if (!isDeepStrictEqual(previousClaims, latestClaims)) {
    throw new Error('Los claims cambiaron durante la confirmación; volvé a consultar y revisar antes de reintentar.')
  }
  if (
    expectedEmail
    && normalizeEmail(latestUser.email) !== normalizeEmail(expectedEmail)
  ) {
    throw new Error('El correo cambió durante la confirmación; no se modificarán los claims.')
  }
  if (command === 'assign' && (latestUser.disabled || latestUser.emailVerified !== true)) {
    throw new Error('La cuenta cambió de estado durante la confirmación; no se modificarán los claims.')
  }

  if (isDeepStrictEqual(previousClaims, nextClaims)) {
    return { operation: command, changed: false, uid: user.uid }
  }

  const requestedAudit = createAuditRecord(command, role, latestUser, previousClaims, nextClaims, 'requested')
  await audit(requestedAudit)

  const userAtWrite = await auth.getUser(latestUser.uid)
  const claimsAtWrite = userAtWrite.customClaims ?? {}
  const accountChanged =
    (expectedEmail && normalizeEmail(userAtWrite.email) !== normalizeEmail(expectedEmail))
    || (command === 'assign' && (userAtWrite.disabled || userAtWrite.emailVerified !== true))
  if (!isDeepStrictEqual(previousClaims, claimsAtWrite) || accountChanged) {
    await audit({ ...requestedAudit, timestamp: new Date().toISOString(), outcome: 'cancelled_stale' })
    throw new Error('La cuenta o sus claims cambiaron antes de guardar; no se modificaron los claims.')
  }

  try {
    await auth.setCustomUserClaims(userAtWrite.uid, nextClaims)
  } catch (error) {
    await audit({ ...requestedAudit, timestamp: new Date().toISOString(), outcome: 'failed' })
    throw error
  }

  const successAudit = createAuditRecord(command, role, latestUser, previousClaims, nextClaims, 'succeeded')
  let auditPath
  try {
    auditPath = await audit(successAudit)
  } catch (error) {
    throw new Error(
      'Firebase confirmó el cambio de claims, pero no se pudo completar el registro local de auditoría. Revisá la cuenta y el archivo de auditoría inmediatamente.',
      { cause: error },
    )
  }
  return { operation: command, changed: true, uid: user.uid, auditPath }
}

function parseArguments(argv) {
  const [command, ...args] = argv
  const options = {}
  const allowed = new Set(['--project', '--uid', '--email', '--role'])
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index]
    if (!allowed.has(key) || options[key]) throw new Error(`Opción desconocida o duplicada: ${key}`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Falta el valor para ${key}.`)
    options[key] = value
    index += 1
  }
  if (!['show', 'assign', 'revoke'].includes(command)) throw new Error(usage())
  if (!options['--project']) throw new Error('--project es obligatorio.\n' + usage())

  if (command === 'show') {
    if (options['--role']) throw new Error('show no acepta --role.')
    const selectorCount = Number(Boolean(options['--uid'])) + Number(Boolean(options['--email']))
    if (selectorCount !== 1) throw new Error('show requiere exactamente uno: --uid o --email.')
  } else {
    if (!options['--uid']) throw new Error(`${command} requiere --uid.`)
    if (command === 'assign' && !options['--email']) throw new Error('assign requiere --email aprobado.')
    const role = options['--role']
    if (command === 'assign' && !APP_ROLES.includes(role)) throw new Error('assign requiere --role superadmin|editor.')
    if (command === 'revoke' && ![...APP_ROLES, 'all'].includes(role)) {
      throw new Error('revoke requiere --role superadmin|editor|all.')
    }
    if (options['--email'] && command === 'revoke') {
      options['--email'] = normalizeEmail(options['--email'])
    }
  }
  return {
    command,
    projectId: options['--project'],
    selector: { uid: options['--uid'], email: options['--email'] },
    role: options['--role'],
    expectedEmail: command === 'assign' || command === 'revoke' ? options['--email'] : undefined,
  }
}

async function promptForConfirmation(details) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Las modificaciones requieren una terminal interactiva; ejecución no interactiva rechazada.')
  }
  console.log(`Proyecto: ${details.projectId}`)
  console.log(`Cuenta: ${details.email ?? '(sin correo)'} · UID: ${details.uid}`)
  console.log(`Claims de rol actuales: ${JSON.stringify(details.previousRoles)}`)
  console.log(`Claims de rol resultantes: ${JSON.stringify(details.resultingRoles)}`)
  console.log(`Escribí exactamente: ${details.phrase}`)
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

  const [{ applicationDefault, initializeApp }, { getAuth }] = await Promise.all([
    import('firebase-admin/app'),
    import('firebase-admin/auth'),
  ])
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: PRODUCTION_PROJECT_ID,
  }, 'radio997-role-admin')
  const auth = getAuth(app)

  if (options.command !== 'show') {
    console.log('ATENCIÓN: esta herramienta modificará custom claims en Firebase Authentication.')
  }

  const releaseLock = options.command === 'show' ? undefined : await acquireRoleOperationLock()
  let result
  let operationError
  try {
    result = await performRoleOperation({
      ...options,
      auth,
      env: process.env,
      confirm: options.command === 'show' ? undefined : promptForConfirmation,
      audit: writeAuditRecord,
    })
  } catch (error) {
    operationError = error
  }
  if (releaseLock) {
    try {
      await releaseLock()
    } catch (error) {
      if (operationError) {
        throw new AggregateError(
          [operationError, error],
          'La operación falló y tampoco se pudo liberar el bloqueo local de roles.',
        )
      }
      throw new Error(
        'La operación pudo completarse, pero no se pudo liberar el bloqueo local. Verifica el resultado antes de continuar.',
        { cause: error },
      )
    }
  }
  if (operationError) throw operationError

  if (result.operation === 'show') {
    console.log(JSON.stringify(result.user, null, 2))
  } else if (result.changed) {
    console.log(`Claims actualizados para UID ${result.uid}. Registro local: ${result.auditPath}`)
    console.log('El usuario debe renovar el token o volver a iniciar sesión para recibir los claims.')
  } else {
    console.log(`No hubo cambios: el estado de roles para UID ${result.uid} ya coincide con lo solicitado.`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Falló la operación de administración de roles.')
    process.exitCode = 1
  })
}
