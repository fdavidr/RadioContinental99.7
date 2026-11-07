import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

import { firebaseApp } from './firebaseApp'

let storageInstance: FirebaseStorage | null = null

if (firebaseApp) {
  storageInstance = getStorage(firebaseApp)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectStorageEmulator(storageInstance, '127.0.0.1', 9199)
  }
}

export const firebaseStorage = storageInstance
