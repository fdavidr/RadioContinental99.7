import { lstat, mkdir, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
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

function getPublicDocumentsWithUniqueSlugs(documents, collectionId) {
  const publicDocuments = []
  const documentIdsBySlug = new Map()
  for (const document of documents) {
    const fields = document.fields ?? {}
    if (
      fields.status?.stringValue !== 'published'
      || fields.isArchived?.booleanValue !== false
    ) continue

    const slug = fields.slug?.stringValue
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue
    const documentId = document.name?.split('/').at(-1) || '(ID desconocido)'
    const documentIds = documentIdsBySlug.get(slug) ?? []
    documentIds.push(documentId)
    documentIdsBySlug.set(slug, documentIds)
    publicDocuments.push(document)
  }

  const collision = [...documentIdsBySlug].find(([, documentIds]) => documentIds.length > 1)
  if (collision) {
    const [slug, documentIds] = collision
    throw new Error(
      `Slug duplicado en la colección "${collectionId}": "${slug}" ` +
      `(documentos: ${documentIds.join(', ')}).`,
    )
  }
  return publicDocuments
}

function resolveOutputPath(outputDirectory, ...segments) {
  const rootDirectory = resolve(outputDirectory)
  const targetPath = resolve(rootDirectory, ...segments)
  const relativePath = relative(rootDirectory, targetPath)
  if (
    !relativePath
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath)
  ) {
    throw new Error(`La ruta generada debe permanecer dentro de ${rootDirectory}.`)
  }
  return targetPath
}

async function ensureOutputSubdirectories(outputDirectory, ...segments) {
  const rootDirectory = resolve(outputDirectory)
  await mkdir(rootDirectory, { recursive: true })
  let currentSegments = []
  for (const segment of segments) {
    currentSegments = [...currentSegments, segment]
    const directory = resolveOutputPath(outputDirectory, ...currentSegments)
    try {
      const stats = await lstat(directory)
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new Error(`La ruta de prerender no es un directorio seguro: ${directory}`)
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await mkdir(directory)
    }
  }
  return resolveOutputPath(outputDirectory, ...segments)
}

function getStringField(fields, fieldName) {
  const value = fields[fieldName]?.stringValue
  return typeof value === 'string' ? value.trim() : ''
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function editorialBodyAsText(value) {
  const text = value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>|<\/(?:p|h[1-6]|li|blockquote|div)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim()

  return text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
}

function setMetaTag(html, attribute, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const attributeMatcher = new RegExp(`\\b${attribute}=["']${escapedKey}["']`, 'i')
  let updated = false
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`
  const withUpdatedTag = html.replace(/<meta\b[^>]*>/gi, (existingTag) => {
    if (!attributeMatcher.test(existingTag)) return existingTag
    updated = true
    return tag
  })
  return updated ? withUpdatedTag : withUpdatedTag.replace('</head>', `  ${tag}\n  </head>`)
}

export function createPrerenderedHtml(template, document, collectionId, siteUrl, socialImageUrl = '') {
  const fields = document.fields ?? {}
  if (
    fields.status?.stringValue !== 'published'
    || fields.isArchived?.booleanValue !== false
  ) return null

  const slug = getStringField(fields, 'slug')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null

  const isPost = collectionId === 'posts'
  const route = isPost ? 'noticias' : 'programas'
  const path = `/${route}/${slug}`
  const canonicalUrl = new URL(path, `${siteUrl}/`).toString()
  const title = getStringField(fields, isPost ? 'seoTitle' : 'title')
    || getStringField(fields, 'title')
    || (isPost ? 'Noticia' : 'Programa')
  const description = getStringField(fields, isPost ? 'seoDescription' : 'description')
    || getStringField(fields, isPost ? 'excerpt' : 'description')
  const bodyLines = isPost ? editorialBodyAsText(getStringField(fields, 'body')) : []
  const author = getStringField(fields, 'authorName') || 'Radio 99.7 FM'
  const publishedAt = fields.publishedAt?.timestampValue ?? ''
  const visibleContent = isPost
    ? `<p>${escapeHtml(getStringField(fields, 'excerpt'))}</p>${bodyLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}`
    : `<p>${escapeHtml(getStringField(fields, 'description'))}</p><p>Conduce: ${escapeHtml((fields.hostNames?.arrayValue?.values ?? []).map((value) => value.stringValue ?? '').filter(Boolean).join(', ') || 'Radio 99.7 FM')}</p>`

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(`${title} | Radio 99.7 FM`)}</title>`)
  html = html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`)
  html = setMetaTag(html, 'name', 'description', description)
  html = setMetaTag(html, 'name', 'robots', 'index, follow')
  html = setMetaTag(html, 'property', 'og:type', isPost ? 'article' : 'website')
  html = setMetaTag(html, 'property', 'og:title', title)
  html = setMetaTag(html, 'property', 'og:description', description)
  html = setMetaTag(html, 'property', 'og:url', canonicalUrl)
  html = setMetaTag(html, 'name', 'twitter:title', title)
  html = setMetaTag(html, 'name', 'twitter:description', description)
  if (socialImageUrl) {
    html = setMetaTag(html, 'property', 'og:image', socialImageUrl)
    html = setMetaTag(html, 'name', 'twitter:image', socialImageUrl)
    html = setMetaTag(html, 'name', 'twitter:card', 'summary_large_image')
  }
  if (isPost) {
    html = setMetaTag(html, 'property', 'article:author', author)
    if (publishedAt) html = setMetaTag(html, 'property', 'article:published_time', publishedAt)
  }

  const content = `<main class="page-shell"><article class="container article-container"><h1>${escapeHtml(getStringField(fields, 'title') || title)}</h1>${visibleContent}</article></main>`
  const rootPattern = /<div id="root">\s*<\/div>/i
  if (!rootPattern.test(html)) throw new Error('No se encontró el contenedor React para generar una página prerenderizada.')
  return html.replace(rootPattern, `<div id="root">${content}</div>`)
}

async function writePrerenderedPages({ documents, collectionId, siteUrl, outputDirectory, socialImageUrl }) {
  const template = await readFile(resolveOutputPath(outputDirectory, 'index.html'), 'utf8')
  const route = collectionId === 'posts' ? 'noticias' : 'programas'
  let generated = 0
  for (const document of documents) {
    const html = createPrerenderedHtml(template, document, collectionId, siteUrl, socialImageUrl)
    if (!html) continue
    const slug = getStringField(document.fields ?? {}, 'slug')
    await ensureOutputSubdirectories(outputDirectory, route, slug)
    const pagePath = resolveOutputPath(outputDirectory, route, slug, 'index.html')
    try {
      const stats = await lstat(pagePath)
      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new Error(`La ruta de prerender no es un archivo seguro: ${pagePath}`)
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    await writeFile(pagePath, html, 'utf8')
    generated += 1
  }
  return generated
}

async function removeObsoletePrerenderedPages({ collectionId, publishedSlugs, outputDirectory }) {
  const route = collectionId === 'posts' ? 'noticias' : 'programas'
  const routeDirectory = resolveOutputPath(outputDirectory, route)
  let routeStats
  try {
    routeStats = await lstat(routeDirectory)
  } catch (error) {
    if (error.code === 'ENOENT') return
    throw error
  }
  if (!routeStats.isDirectory() || routeStats.isSymbolicLink()) {
    throw new Error(`La ruta de prerender no es un directorio seguro: ${routeDirectory}`)
  }

  for (const entry of await readdir(routeDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) continue
    if (publishedSlugs.has(entry.name)) continue

    const pageDirectory = resolveOutputPath(outputDirectory, route, entry.name)
    const pagePath = resolveOutputPath(outputDirectory, route, entry.name, 'index.html')
    let pageStats
    try {
      pageStats = await lstat(pagePath)
    } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    if (!pageStats.isFile() || pageStats.isSymbolicLink()) continue

    await unlink(pagePath)
    if ((await readdir(pageDirectory)).length === 0) await rmdir(pageDirectory)
  }
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
  requireEditorialPrerender = false,
  socialImageUrl = '',
}) {
  assertSiteOrigin(siteUrl)
  const entries = new Map(staticPaths.map((path) => [new URL(path, `${siteUrl}/`).toString(), null]))
  const failures = []

  if (!projectId) {
    const message = 'VITE_FIREBASE_PROJECT_ID no está configurado; se generará el sitemap con rutas estáticas.'
    logger.warn(message)
    if (requireEditorialPrerender) failures.push(message)
  } else {
    const endpointPath = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`
    const endpoint = apiKey ? `${endpointPath}?key=${encodeURIComponent(apiKey)}` : endpointPath

    for (const collectionId of ['posts', 'programs']) {
      try {
        const documents = await fetchPublishedDocuments({ endpoint, collectionId, fetchImpl })
        const publicDocuments = getPublicDocumentsWithUniqueSlugs(documents, collectionId)
        const generated = await writePrerenderedPages({
          documents: publicDocuments,
          collectionId,
          siteUrl,
          outputDirectory,
          socialImageUrl,
        })
        await removeObsoletePrerenderedPages({
          collectionId,
          publishedSlugs: new Set(publicDocuments.map((document) => document.fields.slug.stringValue)),
          outputDirectory,
        })
        for (const [url, lastmod] of createPublicEntries(publicDocuments, collectionId, siteUrl)) {
          entries.set(url, lastmod)
        }
        logger.log(`Páginas prerenderizadas para ${collectionId}: ${generated}.`)
      } catch (error) {
        failures.push(`${collectionId}: ${error.message}`)
        logger.warn(
          `No se pudieron prerenderizar documentos públicos de ${collectionId}; ` +
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
  if (requireEditorialPrerender && failures.length) {
    throw new Error(`No se puede publicar sin completar el prerender editorial: ${failures.join('; ')}`)
  }
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
    socialImageUrl: process.env.VITE_SOCIAL_PREVIEW_IMAGE_URL?.trim(),
    requireEditorialPrerender: process.argv.includes('--require-editorial-prerender'),
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
