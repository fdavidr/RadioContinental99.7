import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
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
