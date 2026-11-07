import {
  applyActionCode,
  browserLocalPersistence,
  checkActionCode,
  confirmPasswordReset,
  onIdTokenChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
  type User,
} from 'firebase/auth'

import { firebaseAuth } from '../lib/firebaseAuth'
import { requireFirebase } from '../lib/firebaseApp'
import { isFirebaseConfigured } from '../lib/firebaseConfig'
import { toFirebaseServiceError } from './firebaseErrors'

export type EditorialRole = 'superadmin' | 'editor'

export function isAuthAvailable(): boolean {
  return isFirebaseConfigured && firebaseAuth !== null
}

function actionCodeSettings(path: string) {
  return {
    url: new URL(path, window.location.origin).toString(),
    handleCodeInApp: false,
  }
}

function getAuth() {
  return requireFirebase(firebaseAuth, 'Authentication')
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!email.trim() || !password) {
    throw new Error('Ingresá un correo y una contraseña.')
  }

  try {
    const auth = getAuth()
    await setPersistence(auth, browserLocalPersistence)
    const result = await signInWithEmailAndPassword(auth, email.trim(), password)
    return result.user
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo iniciar sesión')
  }
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error('Ingresá una dirección de correo válida.')
  }

  const auth = getAuth()
  auth.languageCode = 'es'
  try {
    await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings('/admin/login'))
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email')
    ) {
      return
    }
    throw toFirebaseServiceError(error, 'No se pudo procesar la recuperación')
  }
}

export async function checkPasswordResetCode(code: string): Promise<string> {
  if (!code.trim()) throw new Error('El enlace de restablecimiento no contiene un código válido.')
  try {
    return await verifyPasswordResetCode(getAuth(), code)
  } catch (error) {
    throw toFirebaseServiceError(error, 'El enlace de restablecimiento venció o ya no es válido')
  }
}

export async function completePasswordReset(code: string, newPassword: string): Promise<void> {
  if (!code.trim()) throw new Error('El enlace de restablecimiento no contiene un código válido.')
  if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new Error('Usá al menos 10 caracteres, incluyendo letras y números.')
  }
  try {
    await confirmPasswordReset(getAuth(), code, newPassword)
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cambiar la contraseña')
  }
}

export async function resendVerificationEmail(user: User): Promise<void> {
  const auth = getAuth()
  auth.languageCode = 'es'
  try {
    await sendEmailVerification(user, actionCodeSettings('/admin/login'))
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo enviar el correo de verificación')
  }
}

export async function applyEmailVerificationCode(code: string): Promise<string> {
  if (!code.trim()) throw new Error('El enlace de verificación no contiene un código válido.')
  try {
    const auth = getAuth()
    const action = await checkActionCode(auth, code)
    if (action.operation !== 'VERIFY_EMAIL' || !action.data.email) {
      throw new Error('El enlace no corresponde a una verificación de correo.')
    }
    await applyActionCode(auth, code)
    if (auth.currentUser?.email?.toLowerCase() === action.data.email.toLowerCase()) {
      await reload(auth.currentUser)
      await auth.currentUser.getIdToken(true)
    }
    return action.data.email
  } catch (error) {
    throw toFirebaseServiceError(error, 'El enlace de verificación venció o ya no es válido')
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  const auth = getAuth()
  try {
    if (auth.currentUser) {
      await reload(auth.currentUser)
      await auth.currentUser.getIdToken(true)
    }
    return auth.currentUser
  } catch (error) {
    throw toFirebaseServiceError(error, 'La sesión ya no es válida. Iniciá sesión nuevamente')
  }
}

export async function signOutCurrentUser(): Promise<void> {
  try {
    await signOut(getAuth())
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo cerrar sesión')
  }
}

export function subscribeToAuthState(
  onChange: (user: User | null) => void,
  onError: (error: Error) => void,
): () => void {
  try {
    return onIdTokenChanged(
      getAuth(),
      onChange,
      (error) => onError(toFirebaseServiceError(error, 'No se pudo consultar la sesión')),
    )
  } catch (error) {
    onError(toFirebaseServiceError(error, 'No se pudo iniciar la sesión de Firebase'))
    return () => undefined
  }
}

export async function getCurrentEditorialRole(user: User): Promise<EditorialRole | null> {
  try {
    const token = await user.getIdTokenResult()
    if (token.claims.superadmin === true) return 'superadmin'
    if (token.claims.editor === true) return 'editor'
    return null
  } catch (error) {
    throw toFirebaseServiceError(error, 'No se pudo verificar el rol de la cuenta')
  }
}
