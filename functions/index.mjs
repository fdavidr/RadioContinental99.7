import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { createMediaOperations } from './src/media-operations.mjs'

initializeApp()

const mediaOperations = createMediaOperations({
  db: getFirestore(),
  bucket: getStorage().bucket(),
  FieldValue,
  Timestamp,
  HttpsError,
})

export const finalizeMediaUpload = onCall(
  { concurrency: 10, maxInstances: 5, memory: '512MiB', timeoutSeconds: 120 },
  mediaOperations.finalizeMediaUpload,
)

export const setMediaState = onCall(
  { concurrency: 10, maxInstances: 5, memory: '512MiB', timeoutSeconds: 60 },
  mediaOperations.setMediaState,
)
