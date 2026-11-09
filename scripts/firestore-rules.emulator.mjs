import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const projectId = 'demo-radio-rules'
const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
})

const postFields = (uid, status = 'published', isArchived = false) => ({
  title: 'Noticia de prueba',
  slug: `noticia-${uid}`,
  excerpt: 'Resumen de prueba',
  body: '<p>Contenido de prueba</p>',
  categoryIds: [],
  tagIds: [],
  searchTerms: ['noticia', 'prueba'],
  heroMediaId: null,
  authorUid: uid,
  status,
  isArchived,
  ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: uid,
  updatedBy: uid,
})

before(async () => {
  await testEnvironment.clearFirestore()
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'posts', 'published-post'), {
      ...postFields('seed'),
      slug: 'publicada',
    })
    await setDoc(doc(db, 'posts', 'draft-post'), {
      ...postFields('seed', 'draft'),
      slug: 'borrador',
    })
    await setDoc(doc(db, 'posts', 'archived-post'), {
      ...postFields('seed', 'archived', true),
      slug: 'archivada',
    })
    await setDoc(doc(db, 'programs', 'published-program'), {
      title: 'Programa público',
      slug: 'programa-publico',
      description: 'Descripción',
      categoryId: 'news',
      hostNames: ['Conductora'],
      searchTerms: ['programa', 'publico'],
      imageMediaId: null,
      durationMinutes: 60,
      status: 'published',
      isArchived: false,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'seed',
      updatedBy: 'seed',
    })
    await setDoc(doc(db, 'programs', 'archived-program'), {
      title: 'Programa archivado',
      slug: 'programa-archivado',
      description: 'Descripción',
      categoryId: 'news',
      hostNames: [],
      imageMediaId: null,
      durationMinutes: null,
      status: 'archived',
      isArchived: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'seed',
      updatedBy: 'seed',
    })
    await setDoc(doc(db, 'programs', 'draft-program'), {
      title: 'Programa borrador',
      slug: 'programa-borrador',
      description: 'Descripción',
      categoryId: 'news',
      hostNames: [],
      searchTerms: ['programa', 'borrador'],
      imageMediaId: null,
      durationMinutes: null,
      status: 'draft',
      isArchived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'seed',
      updatedBy: 'seed',
    })
    await setDoc(doc(db, 'users', 'other-user'), {
      uid: 'other-user',
      email: 'other@example.invalid',
      displayName: 'Other user',
      disabled: false,
    })
    await setDoc(doc(db, 'privateConfig', 'internal'), { marker: 'private' })
    await setDoc(doc(db, 'adminLogs', 'activity'), {
      actorUid: 'seed',
      action: 'publish',
      collection: 'posts',
      documentId: 'published-post',
      createdAt: serverTimestamp(),
      summary: 'publish:posts',
    })
  })
})

after(async () => {
  await testEnvironment.cleanup()
})

test('anonymous visitors can query only published, non-archived posts and programs', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  await assertFails(getDocs(collection(db, 'posts')))
  await assertFails(getDocs(collection(db, 'programs')))
  const posts = await assertSucceeds(getDocs(query(
    collection(db, 'posts'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('__name__', 'asc'),
    limit(1000),
  )))
  const programs = await assertSucceeds(getDocs(query(
    collection(db, 'programs'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('__name__', 'asc'),
    limit(1000),
  )))
  const publicListing = await assertSucceeds(getDocs(query(
    collection(db, 'posts'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(20),
  )))
  const programListing = await assertSucceeds(getDocs(query(
    collection(db, 'programs'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(20),
  )))
  const detail = await assertSucceeds(getDocs(query(
    collection(db, 'posts'),
    where('slug', '==', 'publicada'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    limit(2),
  )))
  const programDetail = await assertSucceeds(getDocs(query(
    collection(db, 'programs'),
    where('slug', '==', 'programa-publico'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    limit(2),
  )))
  const postSearch = await assertSucceeds(getDocs(query(
    collection(db, 'posts'),
    where('searchTerms', 'array-contains', 'noticia'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(50),
  )))
  const programSearch = await assertSucceeds(getDocs(query(
    collection(db, 'programs'),
    where('searchTerms', 'array-contains', 'programa'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    orderBy('publishedAt', 'desc'),
    limit(50),
  )))

  assert.deepEqual(posts.docs.map((item) => item.id), ['published-post'])
  assert.deepEqual(programs.docs.map((item) => item.id), ['published-program'])
  assert.deepEqual(publicListing.docs.map((item) => item.id), ['published-post'])
  assert.deepEqual(programListing.docs.map((item) => item.id), ['published-program'])
  assert.deepEqual(detail.docs.map((item) => item.id), ['published-post'])
  assert.deepEqual(programDetail.docs.map((item) => item.id), ['published-program'])
  assert.deepEqual(postSearch.docs.map((item) => item.id), ['published-post'])
  assert.deepEqual(programSearch.docs.map((item) => item.id), ['published-program'])
})

test('anonymous visitors cannot read drafts or archived editorial documents', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(db, 'posts', 'draft-post')))
  await assertFails(getDoc(doc(db, 'posts', 'archived-post')))
  await assertFails(getDoc(doc(db, 'programs', 'draft-program')))
  await assertFails(getDoc(doc(db, 'programs', 'archived-program')))
})

test('anonymous visitors cannot create, modify, or delete editorial content', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  await assertFails(setDoc(doc(db, 'posts', 'anonymous-post'), postFields('anonymous')))
  await assertFails(updateDoc(doc(db, 'posts', 'published-post'), {
    title: 'Alterada',
    updatedAt: serverTimestamp(),
    updatedBy: 'anonymous',
  }))
  await assertFails(deleteDoc(doc(db, 'posts', 'published-post')))
})

test('verified editors can manage editorial records but not superadmin-only collections', async () => {
  const uid = 'editor-user'
  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    editor: true,
  }).firestore()

  await assertSucceeds(setDoc(doc(db, 'posts', 'editor-post'), postFields(uid, 'draft')))
  await assertSucceeds(getDoc(doc(db, 'posts', 'draft-post')))
  await assertSucceeds(updateDoc(doc(db, 'posts', 'published-post'), {
    title: 'Noticia editada',
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }))
  await assertSucceeds(setDoc(doc(db, 'adminLogs', 'editor-activity'), {
    actorUid: uid,
    action: 'create',
    collection: 'posts',
    documentId: 'editor-post',
    createdAt: serverTimestamp(),
    summary: 'create:posts',
  }))
  await assertFails(setDoc(doc(db, 'media', 'editor-media'), {
    originalName: 'imagen.jpg',
    storagePath: 'media/editor.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 1000,
    altText: 'Imagen',
    visibility: 'private',
    status: 'draft',
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  }))
  await assertFails(deleteDoc(doc(db, 'posts', 'published-post')))
  await assertFails(getDoc(doc(db, 'privateConfig', 'internal')))
  await assertFails(setDoc(doc(db, 'users', uid), { role: 'superadmin' }))
})

test('unverified or unprivileged signed-in users cannot administer content or other users', async () => {
  const unverifiedDb = testEnvironment.authenticatedContext('unverified-user', {
    email_verified: false,
    editor: true,
  }).firestore()
  const ordinaryDb = testEnvironment.authenticatedContext('ordinary-user', {
    email_verified: true,
  }).firestore()

  await assertFails(setDoc(doc(unverifiedDb, 'posts', 'unverified-post'), postFields('unverified-user')))
  await assertFails(updateDoc(doc(ordinaryDb, 'posts', 'published-post'), {
    title: 'No autorizado',
    updatedAt: serverTimestamp(),
    updatedBy: 'ordinary-user',
  }))
  await assertFails(getDoc(doc(ordinaryDb, 'users', 'other-user')))
  await assertFails(updateDoc(doc(ordinaryDb, 'users', 'other-user'), { role: 'superadmin' }))
  await assertFails(setDoc(doc(ordinaryDb, 'privateConfig', 'injected'), { secret: true }))
})

test('superadmins retain administrative reads and can manage superadmin-only editorial records', async () => {
  const uid = 'superadmin-user'
  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    superadmin: true,
  }).firestore()

  await assertSucceeds(getDoc(doc(db, 'users', 'other-user')))
  await assertSucceeds(getDoc(doc(db, 'privateConfig', 'internal')))
  await assertSucceeds(getDoc(doc(db, 'adminLogs', 'activity')))
  await assertSucceeds(setDoc(doc(db, 'media', 'admin-media'), {
    originalName: 'imagen.jpg',
    storagePath: 'media/admin.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 1000,
    altText: 'Imagen',
    visibility: 'private',
    status: 'draft',
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  }))
  await assertFails(deleteDoc(doc(db, 'posts', 'published-post')))
})
