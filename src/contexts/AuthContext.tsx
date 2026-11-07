import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { browserLocalPersistence, setPersistence, type User } from 'firebase/auth'

import { firebaseAuth } from '../lib/firebaseAuth'
import {
  getCurrentEditorialRole,
  isAuthAvailable,
  refreshCurrentUser,
  signIn as signInWithCredentials,
  signOutCurrentUser,
  subscribeToAuthState,
  type EditorialRole,
} from '../services/auth'
import { toFirebaseServiceError } from '../services/firebaseErrors'

type AuthState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; error: Error }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: User; role: EditorialRole | null }

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const applyUser = useCallback(async (user: User | null) => {
    if (!user) {
      setState({ status: 'signed-out' })
      return
    }

    try {
      const role = await getCurrentEditorialRole(user)
      setState({ status: 'signed-in', user, role })
    } catch (error) {
      setState({ status: 'error', error: toFirebaseServiceError(error, 'No se pudo verificar el acceso') })
    }
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    if (!isAuthAvailable() || !firebaseAuth) {
      setState({ status: 'unavailable' })
      return
    }

    void setPersistence(firebaseAuth, browserLocalPersistence)
      .then(() => {
        if (!active) return
        unsubscribe = subscribeToAuthState(
          (user) => {
            if (active) void applyUser(user)
          },
          (error) => {
            if (active) setState({ status: 'error', error })
          },
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            error: toFirebaseServiceError(error, 'No se pudo restaurar la sesión'),
          })
        }
      })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [applyUser])

  const signIn = useCallback(async (email: string, password: string) => {
    setState({ status: 'loading' })
    try {
      const user = await signInWithCredentials(email, password)
      await applyUser(user)
    } catch (error) {
      if (firebaseAuth?.currentUser) {
        await applyUser(firebaseAuth.currentUser)
      } else {
        setState({ status: 'signed-out' })
      }
      throw error
    }
  }, [applyUser])

  const signOut = useCallback(async () => {
    await signOutCurrentUser()
    setState({ status: 'signed-out' })
  }, [])

  const refresh = useCallback(async () => {
    const user = await refreshCurrentUser()
    await applyUser(user)
  }, [applyUser])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signIn,
    signOut,
    refresh,
  }), [refresh, signIn, signOut, state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return context
}
