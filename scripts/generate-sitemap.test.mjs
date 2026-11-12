import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
  const logs = []

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
      logger: { log(message) { logs.push(message) }, warn(message) { assert.fail(message) } },
    })

    const postPage = await readFile(join(outputDirectory, 'noticias', 'noticia-publicada', 'index.html'), 'utf8')
    const programPage = await readFile(join(outputDirectory, 'programas', 'programa-publicado', 'index.html'), 'utf8')
    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8')
    assert.match(postPage, /Noticia pública/)
    assert.match(programPage, /Programa público/)
    assert.equal(entries.has('https://radio.example/noticias/noticia-publicada'), true)
    assert.equal(entries.has('https://radio.example/programas/programa-publicado'), true)
    assert.ok(logs.includes('Firestore devolvió 2 documentos de posts; páginas prerenderizadas: 1.'))
    assert.ok(logs.includes('Firestore devolvió 1 documentos de programs; páginas prerenderizadas: 1.'))
    assert.doesNotMatch(sitemap, /noticia-borrador/)
    await assert.rejects(readFile(join(outputDirectory, 'noticias', 'noticia-borrador', 'index.html')))
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})
