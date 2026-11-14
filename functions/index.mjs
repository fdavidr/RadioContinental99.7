import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { createMediaOperations } from './src/media-operations.mjs'

const projectId = process.env.GCLOUD_PROJECT
if (!projectId) {
  throw new Error('GCLOUD_PROJECT is required to initialize multimedia Functions.')
}

const mediaRuntimeServiceAccount = 'radio-media-runtime@radio997-d5380.iam.gserviceaccount.com'
const mediaCallableCors = [
  'https://continental99.fm',
  'https://www.continental99.fm',
  'https://continental997.fm',
  'https://www.continental997.fm',
]

initializeApp({
  storageBucket: process.env.MEDIA_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`,
})

const mediaOperations = createMediaOperations({
  db: getFirestore(),
  bucket: getStorage().bucket(),
  FieldValue,
  Timestamp,
  HttpsError,
})

export const finalizeMediaUpload = onCall(
  {
    region: 'us-central1',
    cors: mediaCallableCors,
    invoker: 'public',
    serviceAccount: mediaRuntimeServiceAccount,
    concurrency: 10,
    maxInstances: 5,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  mediaOperations.finalizeMediaUpload,
)

export const setMediaState = onCall(
  {
    region: 'us-central1',
    cors: mediaCallableCors,
    invoker: 'public',
    serviceAccount: mediaRuntimeServiceAccount,
    concurrency: 10,
    maxInstances: 5,
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  mediaOperations.setMediaState,
)
