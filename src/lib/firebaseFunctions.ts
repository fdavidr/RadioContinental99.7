import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions'

import { firebaseApp } from './firebaseApp'

let functionsInstance: Functions | null = null

if (firebaseApp) {
  functionsInstance = getFunctions(firebaseApp, 'us-central1')
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001)
  }
}

export const firebaseFunctions = functionsInstance
