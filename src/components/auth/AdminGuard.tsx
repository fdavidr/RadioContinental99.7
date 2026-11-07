import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../../contexts/AuthContext'
import { AccessDeniedPage, AuthUnavailablePage, VerifyEmailPage } from '../../pages/admin/AdminAuthPages'
import { LoadingState } from '../common/LoadingState'

export function AdminGuard() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return <LoadingState title="Verificando sesión administrativa" message="Un momento, por favor." />
  }
  if (auth.status === 'unavailable') return <AuthUnavailablePage />
  if (auth.status === 'error') {
    return (
      <main className="auth-page">
        <section className="auth-card" role="alert">
          <h1>No se pudo verificar la sesión</h1>
          <p>{auth.error.message}</p>
          <Link className="button button--primary" to="/admin/login">Volver a iniciar sesión</Link>
        </section>
      </main>
    )
  }
  if (auth.status === 'signed-out') {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }
  if (!auth.user.emailVerified) return <VerifyEmailPage />
  if (!auth.role) return <AccessDeniedPage />

  return <Outlet />
}

export function AdminRoleGate({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'superadmin' | 'editor'>
  children: ReactNode
}) {
  const auth = useAuth()
  if (auth.status !== 'signed-in') return <Navigate to="/admin/login" replace />
  if (!auth.role || !allowedRoles.includes(auth.role)) return <AccessDeniedPage />
  return children
}
