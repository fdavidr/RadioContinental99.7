import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'

import config, { isFirebaseConfigured, firebaseMode } from './firebaseConfig'

let app: FirebaseApp | null = null

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(config)
}

export const firebaseApp = app
export { firebaseMode, isFirebaseConfigured }

export function requireFirebase<T>(service: T | null, serviceName: string): T {
  if (!isFirebaseConfigured || service === null) {
    throw new Error(
      `Firebase ${serviceName} is unavailable. Configure all VITE_FIREBASE_* values to enable cloud services. Current mode: local-demo; no cloud data was read or written.`,
    )
  }

  return service
}
