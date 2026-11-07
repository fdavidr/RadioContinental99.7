import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

import { firebaseApp } from './firebaseApp'

let firestoreInstance: Firestore | null = null

if (firebaseApp) {
  firestoreInstance = getFirestore(firebaseApp)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectFirestoreEmulator(firestoreInstance, '127.0.0.1', 8080)
  }
}

export const firestore = firestoreInstance
