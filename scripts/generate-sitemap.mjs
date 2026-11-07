import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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

const siteUrl = process.env.VITE_SITE_URL?.trim().replace(/\/+$/, '')
const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim()
const apiKey = process.env.VITE_FIREBASE_API_KEY?.trim()
if (!siteUrl || !/^https:\/\/[^/]+$/i.test(siteUrl)) {
  throw new Error('Definí VITE_SITE_URL con el dominio HTTPS real antes de generar el sitemap.')
}
if (!projectId) {
  throw new Error('Definí VITE_FIREBASE_PROJECT_ID para enumerar únicamente contenido público.')
}

const endpointPath = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`
const endpoint = apiKey ? `${endpointPath}?key=${encodeURIComponent(apiKey)}` : endpointPath
const staticPaths = [
  '/', '/noticias', '/programas', '/deportes', '/programacion', '/en-vivo',
  '/nosotros', '/contacto', '/privacidad', '/terminos',
]
const entries = new Map(staticPaths.map((path) => [new URL(path, `${siteUrl}/`).toString(), null]))

for (const collectionId of ['posts', 'programs']) {
  let cursor
  let count = 0
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
      limit: 1001,
      ...(cursor ? { startAt: { values: [{ referenceValue: cursor }], before: false } } : {}),
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    })
    if (!response.ok) {
      throw new Error(`Firestore rechazó la consulta pública para ${collectionId} (${response.status}): ${await response.text()}`)
    }
    const rows = await response.json()
    const documents = rows.map((row) => row.document).filter(Boolean)
    if (documents.length > 1000) {
      throw new Error(`Hay más de 1000 documentos ${collectionId} en una página; revisá la paginación del sitemap.`)
    }
    for (const document of documents) {
      const slug = document.fields?.slug?.stringValue
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue
      const path = `/${collectionId === 'posts' ? 'noticias' : 'programas'}/${slug}`
      entries.set(new URL(path, `${siteUrl}/`).toString(), document.updateTime ?? null)
    }
    count += documents.length
    if (count > 50000) throw new Error(`La colección ${collectionId} supera el máximo de 50000 URLs permitido por sitemap.`)
    if (documents.length < 1000) break
    cursor = documents.at(-1)?.name
    if (!cursor) throw new Error(`Firestore no devolvió cursor para continuar la colección ${collectionId}.`)
  }
}

const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
const urls = [...entries].map(([loc, lastmod]) =>
  `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`,
).join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
const outputDirectory = resolve(root, 'dist')
await mkdir(outputDirectory, { recursive: true })
await writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap, 'utf8')

const robotsPath = resolve(outputDirectory, 'robots.txt')
let robots = await readFile(robotsPath, 'utf8')
robots = robots.replace(/^Sitemap:.*(?:\r?\n)?/gim, '')
robots = `${robots.trimEnd()}\nSitemap: ${siteUrl}/sitemap.xml\n`
await writeFile(robotsPath, robots, 'utf8')
console.log(`Sitemap generado con ${entries.size} URLs públicas para ${siteUrl}.`)
