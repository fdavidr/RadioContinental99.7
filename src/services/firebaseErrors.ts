import { FirebaseError } from 'firebase/app'

const firebaseMessages: Record<string, string> = {
  'auth/invalid-credential': 'El correo o la contraseña no son válidos.',
  'auth/invalid-login-credentials': 'El correo o la contraseña no son válidos.',
  'auth/user-not-found': 'El correo o la contraseña no son válidos.',
  'auth/wrong-password': 'El correo o la contraseña no son válidos.',
  'auth/invalid-email': 'El correo o la contraseña no son válidos.',
  'auth/user-disabled': 'El correo o la contraseña no son válidos.',
  'auth/too-many-requests': 'Se limitaron temporalmente los intentos. Esperá y volvé a probar.',
  'permission-denied': 'Firebase denegó la operación por falta de permisos.',
  'unauthenticated': 'Iniciá sesión para continuar.',
  'storage/unauthorized': 'Firebase Storage denegó el acceso a este archivo.',
  'storage/canceled': 'La carga del archivo fue cancelada.',
}

export function toFirebaseServiceError(error: unknown, operation: string): Error {
  if (error instanceof FirebaseError) {
    const message = firebaseMessages[error.code] ?? error.message
    const isCredentialFailure = error.code.startsWith('auth/') &&
      ['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found',
        'auth/wrong-password', 'auth/invalid-email', 'auth/user-disabled'].includes(error.code)
    return new Error(
      `${operation}: ${message}${isCredentialFailure ? '' : ` (código: ${error.code})`}`,
      { cause: error },
    )
  }

  if (error instanceof Error) {
    return new Error(`${operation}: ${error.message}`, { cause: error })
  }

  return new Error(`${operation}: ocurrió un error desconocido.`, { cause: error })
}
