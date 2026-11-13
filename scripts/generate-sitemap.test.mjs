import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createPrerenderedHtml,
  createPublicEntries,
  createSitemapXml,
  fetchPublishedDocuments,
  generateSitemap,
  staticPaths,
} from './generate-sitemap.mjs'

const siteUrl = 'https://radio.example'

function document(slug, status = 'published', isArchived = false) {
  return {
    name: `projects/radio/databases/(default)/documents/posts/${slug}`,
    updateTime: '2026-11-07T12:00:00.000Z',
    fields: {
      slug: { stringValue: slug },
      status: { stringValue: status },
      isArchived: { booleanValue: isArchived },
    },
  }
}

test('only published, non-archived documents with canonical slugs become sitemap entries', () => {
  const entries = createPublicEntries([
    document('noticia-publicada'),
    document('borrador', 'draft'),
    document('archivada', 'archived', true),
    document('Slug-Invalido'),
    { ...document('sin-estado'), fields: { slug: { stringValue: 'sin-estado' } } },
  ], 'posts', siteUrl)

  assert.deepEqual([...entries.keys()], ['https://radio.example/noticias/noticia-publicada'])
})

test('Firestore request constrains query to the fields used by public-read rules', async () => {
  let request
  const documents = await fetchPublishedDocuments({
    endpoint: 'https://firestore.googleapis.com/example',
    collectionId: 'posts',
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body)
      return new Response(JSON.stringify([{ document: document('publicada') }]), { status: 200 })
    },
  })

  const filters = request.structuredQuery.where.compositeFilter.filters
  assert.deepEqual(filters.map((filter) => [
    filter.fieldFilter.field.fieldPath,
    filter.fieldFilter.op,
    filter.fieldFilter.value,
  ]), [
    ['status', 'EQUAL', { stringValue: 'published' }],
    ['isArchived', 'EQUAL', { booleanValue: false }],
  ])
  assert.equal(documents.length, 1)
})

test('permission failure still writes valid static sitemap and robots entry', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-sitemap-'))
  const warnings = []
  try {
    const entries = await generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      fetchImpl: async () => new Response('Missing or insufficient permissions', { status: 403 }),
      logger: { log() {}, warn(message) { warnings.push(message) } },
    })
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    const robots = await readFile(join(outputDirectory, 'robots.txt'), 'utf8')

    assert.equal(entries.size, staticPaths.length)
    assert.match(sitemap, /<urlset/)
    assert.match(sitemap, /https:\/\/radio\.example\/noticias/)
    assert.doesNotMatch(sitemap, /\/noticias\/borrador/)
    assert.match(robots, /Sitemap: https:\/\/radio\.example\/sitemap\.xml/)
    assert.equal(warnings.length, 2)
    assert.ok(warnings.every((warning) => warning.includes('HTTP 403')))
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('successful Firestore results include only published news in generated XML', () => {
  const entries = new Map(staticPaths.map((path) => [new URL(path, `${siteUrl}/`).toString(), null]))
  for (const [url, lastmod] of createPublicEntries([
    document('publicada'),
    document('borrador', 'draft'),
    document('archivada', 'archived', true),
  ], 'posts', siteUrl)) entries.set(url, lastmod)

  const sitemap = createSitemapXml(entries)
  assert.match(sitemap, /https:\/\/radio\.example\/noticias\/publicada/)
  assert.doesNotMatch(sitemap, /borrador|archivada/)
})

test('prerendered pages include safe metadata and public content only', () => {
  const template = '<html><head><title>Radio</title><link rel="canonical" href="https://radio.example/" /><meta name="description" content="default" /><meta name="robots" content="index, follow" /><meta property="og:url" content="https://radio.example/" /></head><body><div id="root"></div></body></html>'
  const post = document('noticia-publicada')
  post.fields.title = { stringValue: '<img src=x onerror=alert(1)> Noticia' }
  post.fields.excerpt = { stringValue: 'Resumen &amp; texto' }
  post.fields.body = { stringValue: '<p>Contenido</p><script>alert(1)</script><p>&lt;script&gt;no ejecutable&lt;/script&gt;</p>' }
  post.fields.authorName = { stringValue: 'Autora' }

  const html = createPrerenderedHtml(template, post, 'posts', siteUrl)
  assert.match(html, /canonical" href="https:\/\/radio\.example\/noticias\/noticia-publicada"/)
  assert.match(html, /<h1>&lt;img src=x onerror=alert\(1\)&gt; Noticia<\/h1>/)
  assert.match(html, /Contenido/)
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/)
  assert.match(html, /&lt;script&gt;no ejecutable&lt;\/script&gt;/)
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/)

  post.fields.status = { stringValue: 'draft' }
  assert.equal(createPrerenderedHtml(template, post, 'posts', siteUrl), null)
})

test('production prerender requirement fails after retaining the static sitemap fallback', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-sitemap-required-'))
  const warnings = []
  try {
    await assert.rejects(generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      requireEditorialPrerender: true,
      fetchImpl: async () => new Response('Missing or insufficient permissions', { status: 403 }),
      logger: { log() {}, warn(message) { warnings.push(message) } },
    }), /No se puede publicar sin completar el prerender editorial/)
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    assert.match(sitemap, /<urlset/)
    assert.match(sitemap, /https:\/\/radio\.example\/noticias/)
    assert.equal(warnings.length, 2)
    assert.ok(warnings.every((warning) => warning.includes('HTTP 403')))
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('successful build prerenders only public posts and programs into their slug paths', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-prerender-'))
  const template = '<html><head><title>Radio</title><link rel="canonical" href="https://radio.example/" /><meta name="description" content="default" /><meta name="robots" content="index, follow" /><meta property="og:url" content="https://radio.example/" /></head><body><div id="root"></div></body></html>'
  const post = document('noticia-publicada')
  post.fields.title = { stringValue: 'Noticia pública' }
  post.fields.excerpt = { stringValue: 'Resumen público' }
  post.fields.body = { stringValue: '<p>Texto de la noticia</p>' }
  const draft = document('noticia-borrador', 'draft')
  const program = document('programa-publicado')
  program.fields.title = { stringValue: 'Programa público' }
  program.fields.description = { stringValue: 'Descripción pública' }
  program.fields.hostNames = { arrayValue: { values: [{ stringValue: 'Conductora' }] } }

  try {
    await writeFile(join(outputDirectory, 'index.html'), template, 'utf8')
    const entries = await generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      fetchImpl: async (_url, options) => {
        const collectionId = JSON.parse(options.body).structuredQuery.from[0].collectionId
        const documents = collectionId === 'posts' ? [post, draft] : [program]
        return new Response(JSON.stringify(documents.map((item) => ({ document: item }))), { status: 200 })
      },
      logger: { log() {}, warn(message) { assert.fail(message) } },
    })

    const postPage = await readFile(join(outputDirectory, 'noticias', 'noticia-publicada', 'index.html'), 'utf8')
    const programPage = await readFile(join(outputDirectory, 'programas', 'programa-publicado', 'index.html'), 'utf8')
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    assert.match(postPage, /Noticia pública/)
    assert.match(programPage, /Programa público/)
    assert.equal(entries.has('https://radio.example/noticias/noticia-publicada'), true)
    assert.equal(entries.has('https://radio.example/programas/programa-publicado'), true)
    assert.doesNotMatch(sitemap, /noticia-borrador/)
    await assert.rejects(readFile(join(outputDirectory, 'noticias', 'noticia-borrador', 'index.html')))
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('duplicate public slugs fail without overwriting the existing prerendered page', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-prerender-duplicate-'))
  const template = '<html><head><title>Radio</title></head><body><div id="root"></div></body></html>'
  const first = document('slug-duplicado')
  first.name = 'projects/radio/databases/(default)/documents/posts/documento-uno'
  const second = document('slug-duplicado')
  second.name = 'projects/radio/databases/(default)/documents/posts/documento-dos'
  const existingPage = join(outputDirectory, 'noticias', 'slug-duplicado', 'index.html')

  try {
    await mkdir(join(outputDirectory, 'noticias', 'slug-duplicado'), { recursive: true })
    await writeFile(join(outputDirectory, 'index.html'), template, 'utf8')
    await writeFile(existingPage, 'contenido anterior', 'utf8')

    await assert.rejects(generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      requireEditorialPrerender: true,
      fetchImpl: async (_url, options) => {
        const collectionId = JSON.parse(options.body).structuredQuery.from[0].collectionId
        const documents = collectionId === 'posts' ? [first, second] : []
        return new Response(JSON.stringify(documents.map((item) => ({ document: item }))), { status: 200 })
      },
      logger: { log() {}, warn() {} },
    }), /posts.*slug-duplicado.*documento-uno, documento-dos/)

    assert.equal(await readFile(existingPage, 'utf8'), 'contenido anterior')
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    assert.doesNotMatch(sitemap, /noticias\/slug-duplicado/)
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('successful collection refresh removes obsolete pages but preserves unrelated files', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-prerender-reconcile-'))
  const template = '<html><head><title>Radio</title><link rel="canonical" href="https://radio.example/" /></head><body><div id="root"></div></body></html>'
  const currentPage = document('slug-actual')
  const routeIndex = join(outputDirectory, 'noticias', 'index.html')
  const obsoletePage = join(outputDirectory, 'noticias', 'slug-obsoleto', 'index.html')
  const preservedFile = join(outputDirectory, 'noticias', 'slug-obsoleto', 'imagen.txt')
  const assetFile = join(outputDirectory, 'noticias', 'assets', 'keep.txt')

  try {
    await mkdir(join(outputDirectory, 'noticias', 'slug-obsoleto'), { recursive: true })
    await mkdir(join(outputDirectory, 'noticias', 'assets'), { recursive: true })
    await writeFile(join(outputDirectory, 'index.html'), template, 'utf8')
    await writeFile(routeIndex, 'índice de ruta', 'utf8')
    await writeFile(obsoletePage, 'página obsoleta', 'utf8')
    await writeFile(preservedFile, 'archivo ajeno', 'utf8')
    await writeFile(assetFile, 'asset', 'utf8')

    await generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      fetchImpl: async (_url, options) => {
        const collectionId = JSON.parse(options.body).structuredQuery.from[0].collectionId
        const documents = collectionId === 'posts' ? [currentPage] : []
        return new Response(JSON.stringify(documents.map((item) => ({ document: item }))), { status: 200 })
      },
      logger: { log() {}, warn(message) { assert.fail(message) } },
    })

    await assert.rejects(readFile(obsoletePage))
    assert.equal(await readFile(routeIndex, 'utf8'), 'índice de ruta')
    assert.equal(await readFile(preservedFile, 'utf8'), 'archivo ajeno')
    assert.equal(await readFile(assetFile, 'utf8'), 'asset')
    assert.match(
      await readFile(join(outputDirectory, 'noticias', 'slug-actual', 'index.html'), 'utf8'),
      /canonical href="https:\/\/radio\.example\/noticias\/slug-actual"/,
    )
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})

test('failed collection query preserves existing prerendered pages', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'radio-prerender-query-failure-'))
  const template = '<html><head><title>Radio</title></head><body><div id="root"></div></body></html>'
  const existingPage = join(outputDirectory, 'noticias', 'slug-publicado', 'index.html')

  try {
    await mkdir(join(outputDirectory, 'noticias', 'slug-publicado'), { recursive: true })
    await writeFile(join(outputDirectory, 'index.html'), template, 'utf8')
    await writeFile(existingPage, 'página existente', 'utf8')

    await generateSitemap({
      siteUrl,
      projectId: 'radio-project',
      outputDirectory,
      fetchImpl: async (_url, options) => {
        const collectionId = JSON.parse(options.body).structuredQuery.from[0].collectionId
        if (collectionId === 'posts') return new Response('Firestore unavailable', { status: 503 })
        return new Response('[]', { status: 200 })
      },
      logger: { log() {}, warn() {} },
    })

    assert.equal(await readFile(existingPage, 'utf8'), 'página existente')
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})
