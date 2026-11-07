const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? '',
}

const requiredConfig = Object.values(config)
export const isFirebaseConfigured =
  requiredConfig.every((value) => value.length > 0) &&
  !requiredConfig.some((value) => value.includes('REPLACE_WITH'))

export const firebaseMode = isFirebaseConfigured ? 'firebase' : 'local-demo'

export default config
