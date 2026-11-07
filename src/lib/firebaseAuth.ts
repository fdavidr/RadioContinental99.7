import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'

import { firebaseApp } from './firebaseApp'

let authInstance: Auth | null = null

if (firebaseApp) {
  authInstance = getAuth(firebaseApp)
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
}

export const firebaseAuth = authInstance
