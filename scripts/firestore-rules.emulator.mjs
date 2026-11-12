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
  runTransaction,
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

const publicSiteConfig = () => ({
  stationName: 'Radio de prueba',
  slogan: 'Configuración de prueba',
  streamUrl: null,
  stationTimeZone: 'America/Argentina/Buenos_Aires',
  contactEmail: null,
  contactPhone: null,
  whatsappUrl: null,
  socialLinks: {},
  updatedAt: serverTimestamp(),
})

const editableCollections = ['programs', 'schedule', 'posts', 'categories', 'tags', 'media', 'banners']
const editorWritableCollections = ['programs', 'schedule', 'posts', 'categories', 'tags']
const updateFieldByCollection = {
  programs: { title: 'Programa editado' },
  schedule: { endTime: '11:00' },
  posts: { title: 'Noticia editada' },
  categories: { name: 'Categoría editada' },
  tags: { name: 'Etiqueta editada' },
  media: { altText: 'Texto alternativo actualizado' },
  banners: { label: 'Banner editado' },
}

function recordFields(collectionName, uid, status = 'draft') {
  const fields = {
    programs: {
      title: 'Programa de prueba',
      slug: 'programa-prueba',
      description: 'Descripción',
      categoryId: 'radio',
      hostNames: ['Conductora'],
      imageMediaId: null,
      durationMinutes: 60,
      socialLinks: {},
    },
    schedule: {
      programId: 'programa-prueba',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      timeZone: 'America/La_Paz',
    },
    posts: {
      title: 'Noticia de prueba',
      slug: 'noticia-prueba',
      excerpt: 'Resumen',
      body: '<p>Contenido</p>',
      categoryIds: [],
      tagIds: [],
      heroMediaId: null,
      authorUid: uid,
      searchTerms: ['noticia', 'prueba'],
    },
    categories: {
      name: 'Noticias',
      slug: 'noticias',
      description: 'Categoría de prueba',
      sortOrder: 0,
    },
    tags: { name: 'Radio', slug: 'radio' },
    media: {
      originalName: 'prueba.jpg',
      storagePath: `media/${uid}.jpg`,
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      altText: 'Imagen de prueba',
      visibility: 'private',
    },
    banners: {
      label: 'Banner de prueba',
      placement: 'home-top',
      mediaId: 'media-id',
      altText: 'Banner',
      sortOrder: 0,
      targetUrl: null,
      startsAt: null,
      endsAt: null,
    },
  }[collectionName]

  return {
    ...fields,
    status,
    isArchived: false,
    ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  }
}

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

test('publicConfig/site can be read publicly but written only by a superadmin', async () => {
  const anonymousDb = testEnvironment.unauthenticatedContext().firestore()
  const siteRef = doc(anonymousDb, 'publicConfig', 'site')

  const missingConfig = await assertSucceeds(getDoc(siteRef))
  assert.equal(missingConfig.exists(), false)
  await assertFails(setDoc(siteRef, publicSiteConfig()))
  await assertFails(updateDoc(siteRef, {
    slogan: 'Cambio anónimo',
    updatedAt: serverTimestamp(),
  }))

  const editorDb = testEnvironment.authenticatedContext('config-editor', {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertSucceeds(getDoc(doc(editorDb, 'publicConfig', 'site')))
  await assertFails(setDoc(doc(editorDb, 'publicConfig', 'site'), publicSiteConfig()))
  await assertFails(updateDoc(doc(editorDb, 'publicConfig', 'site'), {
    slogan: 'Cambio de editor',
    updatedAt: serverTimestamp(),
  }))

  const superadminDb = testEnvironment.authenticatedContext('config-superadmin', {
    email_verified: true,
    superadmin: true,
  }).firestore()
  await assertSucceeds(setDoc(doc(superadminDb, 'publicConfig', 'site'), publicSiteConfig()))
  await assertSucceeds(getDoc(doc(superadminDb, 'publicConfig', 'site')))
  await assertSucceeds(updateDoc(doc(superadminDb, 'publicConfig', 'site'), {
    slogan: 'Configuración administrada',
    updatedAt: serverTimestamp(),
  }))
  await assertSucceeds(getDoc(siteRef))
})

test('public reads are limited to published records across editorial collections', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    for (const collectionName of editableCollections) {
      await setDoc(
        doc(db, collectionName, `public-${collectionName}`),
        recordFields(collectionName, `author-${collectionName}`, 'published'),
      )
      await setDoc(
        doc(db, collectionName, `draft-${collectionName}`),
        recordFields(collectionName, `author-${collectionName}`, 'draft'),
      )
      await setDoc(
        doc(db, collectionName, `archived-${collectionName}`),
        { ...recordFields(collectionName, `author-${collectionName}`, 'archived'), isArchived: true },
      )
    }
    await updateDoc(doc(db, 'media', 'public-media'), { visibility: 'public' })
  })

  const anonymousDb = testEnvironment.unauthenticatedContext().firestore()
  for (const collectionName of ['programs', 'schedule', 'posts', 'categories', 'tags', 'banners']) {
    await assertSucceeds(getDoc(doc(anonymousDb, collectionName, `public-${collectionName}`)))
    await assertFails(getDoc(doc(anonymousDb, collectionName, `draft-${collectionName}`)))
    await assertFails(getDoc(doc(anonymousDb, collectionName, `archived-${collectionName}`)))
    const publicQuery = await assertSucceeds(getDocs(query(
      collection(anonymousDb, collectionName),
      where('status', '==', 'published'),
      where('isArchived', '==', false),
    )))
    assert.ok(publicQuery.docs.some((item) => item.id === `public-${collectionName}`))
    assert.ok(publicQuery.docs.every((item) => item.data().status === 'published' && item.data().isArchived === false))
  }
  await assertSucceeds(getDoc(doc(anonymousDb, 'media', 'public-media')))
  await assertFails(getDoc(doc(anonymousDb, 'media', 'draft-media')))
  await assertFails(getDoc(doc(anonymousDb, 'media', 'archived-media')))
  const publicMediaQuery = await assertSucceeds(getDocs(query(
    collection(anonymousDb, 'media'),
    where('status', '==', 'published'),
    where('isArchived', '==', false),
    where('visibility', '==', 'public'),
  )))
  assert.ok(publicMediaQuery.docs.some((item) => item.id === 'public-media'))
  assert.ok(publicMediaQuery.docs.every((item) => item.data().visibility === 'public'))

  for (const collectionName of ['users', 'privateConfig', 'adminLogs']) {
    await assertFails(getDocs(collection(anonymousDb, collectionName)))
  }
})

test('editor and superadmin write permissions match each editorial collection', async () => {
  const editorUid = 'matrix-editor'
  const editorDb = testEnvironment.authenticatedContext(editorUid, {
    email_verified: true,
    editor: true,
  }).firestore()
  const superadminUid = 'matrix-superadmin'
  const superadminDb = testEnvironment.authenticatedContext(superadminUid, {
    email_verified: true,
    superadmin: true,
  }).firestore()

  for (const collectionName of editableCollections) {
    const editorRef = doc(editorDb, collectionName, `editor-${collectionName}`)
    const dataForEditor = recordFields(collectionName, editorUid)
    if (editorWritableCollections.includes(collectionName)) {
      await assertSucceeds(setDoc(editorRef, dataForEditor))
      await assertSucceeds(updateDoc(editorRef, {
        ...updateFieldByCollection[collectionName],
        updatedAt: serverTimestamp(),
        updatedBy: editorUid,
      }))
    } else {
      await assertFails(setDoc(editorRef, dataForEditor))
      await assertFails(updateDoc(editorRef, {
        ...updateFieldByCollection[collectionName],
        updatedAt: serverTimestamp(),
        updatedBy: editorUid,
      }))
    }

    const adminRef = doc(superadminDb, collectionName, `superadmin-${collectionName}`)
    if (collectionName === 'media') {
      await assertFails(setDoc(adminRef, recordFields(collectionName, superadminUid)))
      await assertFails(updateDoc(adminRef, {
        ...updateFieldByCollection[collectionName],
        updatedAt: serverTimestamp(),
        updatedBy: superadminUid,
      }))
    } else {
      await assertSucceeds(setDoc(adminRef, recordFields(collectionName, superadminUid)))
      await assertSucceeds(updateDoc(adminRef, {
        ...updateFieldByCollection[collectionName],
        updatedAt: serverTimestamp(),
        updatedBy: superadminUid,
      }))
    }
  }
})

test('unverified editors and superadmins cannot write any editorial collection', async () => {
  for (const [uid, claims] of [
    ['unverified-editor-matrix', { email_verified: false, editor: true }],
    ['unverified-admin-matrix', { email_verified: false, superadmin: true }],
  ]) {
    const db = testEnvironment.authenticatedContext(uid, claims).firestore()
    for (const collectionName of editableCollections) {
      await assertFails(setDoc(
        doc(db, collectionName, `${uid}-${collectionName}`),
        recordFields(collectionName, uid),
      ))
    }
  }
})

test('audit fields, role injection, and deletes cannot be forged by clients', async () => {
  const uid = 'field-tamper-editor'
  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    editor: true,
  }).firestore()
  const postRef = doc(db, 'posts', 'tampered-post')
  const forgedPost = { ...recordFields('posts', uid), superadmin: true }
  await assertFails(setDoc(postRef, forgedPost))

  const validPostRef = doc(db, 'posts', 'valid-audit-post')
  await assertSucceeds(setDoc(validPostRef, recordFields('posts', uid)))
  await assertFails(updateDoc(validPostRef, {
    createdBy: 'another-user',
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }))
  await assertFails(updateDoc(validPostRef, {
    updatedAt: new Date(),
    updatedBy: uid,
  }))
  await assertFails(setDoc(doc(db, 'adminLogs', 'forged-actor'), {
    actorUid: 'victim-user',
    action: 'publish',
    collection: 'posts',
    documentId: 'unrelated-post',
    createdAt: serverTimestamp(),
    summary: 'publish:posts',
  }))

  const adminDb = testEnvironment.authenticatedContext('delete-check-superadmin', {
    email_verified: true,
    superadmin: true,
  }).firestore()
  for (const collectionName of editableCollections) {
    await assertFails(deleteDoc(doc(adminDb, collectionName, `superadmin-${collectionName}`)))
  }
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
  await assertSucceeds(getDoc(doc(db, 'media', 'public-media')))
  await assertSucceeds(getDoc(doc(db, 'banners', 'public-banners')))
  await assertFails(getDoc(doc(db, 'media', 'draft-media')))
  await assertFails(getDoc(doc(db, 'banners', 'draft-banners')))
  await assertFails(getDoc(doc(db, 'adminLogs', 'activity')))
  await assertSucceeds(updateDoc(doc(db, 'posts', 'published-post'), {
    title: 'Noticia editada',
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  }))
  await assertSucceeds(runTransaction(db, async (transaction) => {
    const loggedPostRef = doc(db, 'posts', 'editor-logged-post')
    transaction.set(loggedPostRef, postFields(uid, 'draft'))
    transaction.set(doc(db, 'adminLogs', 'editor-activity'), {
      actorUid: uid,
      action: 'create',
      collection: 'posts',
      documentId: 'editor-logged-post',
      createdAt: serverTimestamp(),
      summary: 'create:posts',
    })
  }))
  await assertFails(setDoc(doc(db, 'adminLogs', 'forged-event'), {
    actorUid: uid,
    action: 'publish',
    collection: 'posts',
    documentId: 'nonexistent-post',
    createdAt: serverTimestamp(),
    summary: 'publish:posts',
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

test('admin activity actions must correspond to the target record change', async () => {
  const uid = 'editor-log-integrity'
  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    editor: true,
  }).firestore()

  await assertFails(runTransaction(db, async (transaction) => {
    transaction.update(doc(db, 'posts', 'published-post'), {
      title: 'Actualización editorial',
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })
    transaction.set(doc(db, 'adminLogs', 'mismatched-visibility-action'), {
      actorUid: uid,
      action: 'visibility-change',
      collection: 'posts',
      documentId: 'published-post',
      createdAt: serverTimestamp(),
      summary: 'visibility-change:posts',
    })
  }))

  await assertSucceeds(runTransaction(db, async (transaction) => {
    transaction.update(doc(db, 'posts', 'published-post'), {
      title: 'Actualización editorial válida',
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })
    transaction.set(doc(db, 'adminLogs', 'matching-update-action'), {
      actorUid: uid,
      action: 'update',
      collection: 'posts',
      documentId: 'published-post',
      createdAt: serverTimestamp(),
      summary: 'update:posts',
    })
  }))
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

test('missing access markers preserve existing superadmin access during migration', async () => {
  const db = testEnvironment.authenticatedContext('legacy-superadmin', {
    email_verified: true,
    superadmin: true,
  }).firestore()

  await assertSucceeds(getDoc(doc(db, 'privateConfig', 'internal')))
  await assertSucceeds(getDoc(doc(db, 'adminLogs', 'activity')))
})

test('suspended editors and superadmins cannot use protected Firestore operations', async () => {
  const suspendedEditorUid = 'suspended-editor'
  const suspendedSuperadminUid = 'suspended-superadmin'
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'adminAccess', suspendedEditorUid), {
      suspended: true,
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'adminAccess', suspendedSuperadminUid), {
      suspended: true,
      updatedAt: serverTimestamp(),
    })
  })

  const editorDb = testEnvironment.authenticatedContext(suspendedEditorUid, {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertSucceeds(getDoc(doc(editorDb, 'posts', 'published-post')))
  await assertFails(getDoc(doc(editorDb, 'posts', 'draft-post')))
  await assertFails(updateDoc(doc(editorDb, 'posts', 'published-post'), {
    title: 'Edición suspendida',
    updatedAt: serverTimestamp(),
    updatedBy: suspendedEditorUid,
  }))

  const superadminDb = testEnvironment.authenticatedContext(suspendedSuperadminUid, {
    email_verified: true,
    superadmin: true,
  }).firestore()
  await assertFails(getDoc(doc(superadminDb, 'privateConfig', 'internal')))
  await assertFails(getDoc(doc(superadminDb, 'adminLogs', 'activity')))
  await assertFails(setDoc(doc(superadminDb, 'publicConfig', 'site'), publicSiteConfig()))
})

test('reactivating the protected access marker restores role-based access', async () => {
  const uid = 'reactivated-editor'
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'adminAccess', uid), {
      suspended: true,
      updatedAt: serverTimestamp(),
    })
  })

  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertFails(getDoc(doc(db, 'posts', 'draft-post')))

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'adminAccess', uid), {
      suspended: false,
      updatedAt: serverTimestamp(),
    })
  })

  await assertSucceeds(getDoc(doc(db, 'posts', 'draft-post')))
})

test('clients cannot read or alter suspension markers, including their own', async () => {
  const uid = 'marker-escalation-editor'
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'adminAccess', uid), {
      suspended: false,
      updatedAt: serverTimestamp(),
    })
  })

  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertFails(getDoc(doc(db, 'adminAccess', uid)))
  await assertFails(updateDoc(doc(db, 'adminAccess', uid), { suspended: true }))
  await assertFails(setDoc(doc(db, 'adminAccess', 'another-user'), {
    suspended: false,
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(doc(db, 'users', uid), { disabled: true }))
})

test('malformed access markers fail closed without blocking users whose marker is absent', async () => {
  const malformedUid = 'malformed-marker-editor'
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'adminAccess', malformedUid), {
      updatedAt: serverTimestamp(),
    })
  })

  const malformedDb = testEnvironment.authenticatedContext(malformedUid, {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertFails(getDoc(doc(malformedDb, 'posts', 'draft-post')))

  const migratingDb = testEnvironment.authenticatedContext('missing-marker-editor', {
    email_verified: true,
    editor: true,
  }).firestore()
  await assertSucceeds(getDoc(doc(migratingDb, 'posts', 'draft-post')))
})

test('superadmins retain administrative reads but media writes must use the trusted backend', async () => {
  const uid = 'superadmin-user'
  const db = testEnvironment.authenticatedContext(uid, {
    email_verified: true,
    superadmin: true,
  }).firestore()

  await assertSucceeds(getDoc(doc(db, 'users', 'other-user')))
  await assertSucceeds(getDoc(doc(db, 'privateConfig', 'internal')))
  await assertSucceeds(getDoc(doc(db, 'adminLogs', 'activity')))
  await assertFails(setDoc(doc(db, 'media', 'admin-media'), {
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
