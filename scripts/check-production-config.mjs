import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PRODUCTION_SITE_URL } from './site-config.mjs'

const root = process.cwd()

async function loadEnvironmentFile(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]] !== undefined) continue
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  await loadEnvironmentFile(resolve(root, file))
}

const requiredVariables = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const configuredProjectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim()
const targetProjectId = process.argv[2]?.trim()
const missing = requiredVariables.filter((name) => {
  const value = process.env[name]?.trim()
  return !value || /REPLACE_WITH|YOUR_|<[^>]+>/i.test(value)
})
const siteUrl = process.env.VITE_SITE_URL?.trim()
let siteOrigin
try {
  const parsedUrl = new URL(siteUrl)
  if (
    parsedUrl.protocol === 'https:'
    && parsedUrl.origin === siteUrl
    && !/localhost|127\.0\.0\.1/i.test(parsedUrl.hostname)
    && !parsedUrl.username
    && !parsedUrl.password
  ) {
    siteOrigin = parsedUrl.origin
  }
} catch {
  siteOrigin = undefined
}

if (missing.length > 0) {
  console.error(`Configuración de producción incompleta. Definí: ${missing.join(', ')}.`)
  process.exitCode = 1
} else if (!siteOrigin) {
  console.error('VITE_SITE_URL debe ser el origen HTTPS real, sin ruta, credenciales ni barra final.')
  process.exitCode = 1
} else if (siteOrigin !== PRODUCTION_SITE_URL) {
  console.error(`VITE_SITE_URL debe ser exactamente ${PRODUCTION_SITE_URL} para producción.`)
  process.exitCode = 1
} else if (process.env.VITE_USE_FIREBASE_EMULATORS?.trim().toLowerCase() === 'true') {
  console.error('VITE_USE_FIREBASE_EMULATORS no puede estar habilitado para preparar producción.')
  process.exitCode = 1
} else if (targetProjectId && targetProjectId !== configuredProjectId) {
  console.error(`El proyecto de despliegue ${targetProjectId} no coincide con VITE_FIREBASE_PROJECT_ID.`)
  process.exitCode = 1
} else {
  console.log(`Configuración básica de producción presente para ${siteOrigin}.`)
  console.log('Verificá en Firebase Console que Auth, dominio autorizado, reglas, índices y datos públicos correspondan al mismo proyecto.')
}
