import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertProductionSiteUrl } from './site-config.mjs'

const root = process.cwd()
const PAGE_SIZE = 1000
const MAX_DOCUMENTS = 50000

export const staticPaths = [
  '/', '/noticias', '/programas', '/deportes', '/programacion', '/en-vivo',
  '/nosotros', '/contacto', '/privacidad', '/terminos',
]

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

function assertSiteOrigin(siteUrl) {
  let parsedUrl
  try {
    parsedUrl = new URL(siteUrl)
  } catch {
    throw new Error('Definí VITE_SITE_URL con el origen HTTPS real antes de generar el sitemap.')
  }
  if (
    parsedUrl.protocol !== 'https:'
    || parsedUrl.origin !== siteUrl
    || parsedUrl.username
    || parsedUrl.password
  ) {
    throw new Error('Definí VITE_SITE_URL con el origen HTTPS real, sin ruta ni barra final.')
  }
}

export function createPublicEntries(documents, collectionId, siteUrl) {
  const entries = new Map()
  for (const document of documents) {
    const fields = document.fields ?? {}
    if (
      fields.status?.stringValue !== 'published'
      || fields.isArchived?.booleanValue !== false
    ) continue

    const slug = fields.slug?.stringValue
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue
    const path = `/${collectionId === 'posts' ? 'noticias' : 'programas'}/${slug}`
    entries.set(new URL(path, `${siteUrl}/`).toString(), document.updateTime ?? null)
  }
  return entries
}

export async function fetchPublishedDocuments({ endpoint, collectionId, fetchImpl = fetch }) {
  const documents = []
  let cursor

  while (true) {
    const structuredQuery = {
      from: [{ collectionId }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
            { fieldFilter: { field: { fieldPath: 'isArchived' }, op: 'EQUAL', value: { booleanValue: false } } },
          ],
        },
      },
      orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }],
      limit: PAGE_SIZE,
      ...(cursor ? { startAt: { values: [{ referenceValue: cursor }], before: false } } : {}),
    }

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
      signal: AbortSignal.timeout(20000),
    })
    const responseBody = await response.text()
    if (!response.ok) {
      throw new Error(`Firestore respondió HTTP ${response.status}: ${responseBody.slice(0, 500)}`)
    }

    let rows
    try {
      rows = JSON.parse(responseBody)
    } catch {
      throw new Error('Firestore devolvió una respuesta JSON inválida.')
    }
    if (!Array.isArray(rows)) throw new Error('Firestore devolvió un resultado de consulta inválido.')
    if (rows.some((row) => row.error)) {
      throw new Error(`Firestore rechazó la consulta: ${JSON.stringify(rows.find((row) => row.error).error).slice(0, 500)}`)
    }

    const pageDocuments = rows.map((row) => row.document).filter(Boolean)
    documents.push(...pageDocuments)
    if (documents.length > MAX_DOCUMENTS) {
      throw new Error(`La colección ${collectionId} supera el máximo de ${MAX_DOCUMENTS} documentos del sitemap.`)
    }
    if (pageDocuments.length < PAGE_SIZE) return documents

    cursor = pageDocuments.at(-1)?.name
    if (!cursor) throw new Error(`Firestore no devolvió cursor para continuar la colección ${collectionId}.`)
  }
}

export function createSitemapXml(entries) {
  const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
  const urls = [...entries].map(([loc, lastmod]) =>
    `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export async function generateSitemap({
  siteUrl,
  projectId,
  apiKey,
  outputDirectory = resolve(root, 'dist'),
  fetchImpl = fetch,
  logger = console,
}) {
  assertSiteOrigin(siteUrl)
  const entries = new Map(staticPaths.map((path) => [new URL(path, `${siteUrl}/`).toString(), null]))

  if (!projectId) {
    logger.warn('VITE_FIREBASE_PROJECT_ID no está configurado; se generará el sitemap con rutas estáticas.')
  } else {
    const endpointPath = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`
    const endpoint = apiKey ? `${endpointPath}?key=${encodeURIComponent(apiKey)}` : endpointPath

    for (const collectionId of ['posts', 'programs']) {
      try {
        const documents = await fetchPublishedDocuments({ endpoint, collectionId, fetchImpl })
        for (const [url, lastmod] of createPublicEntries(documents, collectionId, siteUrl)) {
          entries.set(url, lastmod)
        }
      } catch (error) {
        logger.warn(
          `No se pudieron incluir documentos públicos de ${collectionId} en el sitemap; ` +
          `se conservarán las rutas estáticas y las demás colecciones. Motivo: ${error.message}`,
        )
      }
    }
  }

  await mkdir(outputDirectory, { recursive: true })
  await writeFile(resolve(outputDirectory, 'sitemap.xml'), createSitemapXml(entries), 'utf8')

  const robotsPath = resolve(outputDirectory, 'robots.txt')
  let robots
  try {
    robots = await readFile(robotsPath, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    robots = 'User-agent: *\nAllow: /\nDisallow: /admin\n'
  }
  robots = robots.replace(/^Sitemap:.*(?:\r?\n)?/gim, '')
  await writeFile(robotsPath, `${robots.trimEnd()}\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8')
  logger.log(`Sitemap generado con ${entries.size} URLs públicas para ${siteUrl}.`)
  return entries
}

async function main() {
  for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    await loadEnvironmentFile(resolve(root, file))
  }

  const siteUrl = process.env.VITE_SITE_URL?.trim()
  assertProductionSiteUrl(siteUrl)
  await generateSitemap({
    siteUrl,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    apiKey: process.env.VITE_FIREBASE_API_KEY?.trim(),
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
