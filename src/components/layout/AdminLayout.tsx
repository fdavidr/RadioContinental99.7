import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { ADMIN_SECTIONS } from '../../lib/constants'

export function AdminLayout() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  if (auth.status !== 'signed-in') return null

  async function logout() {
    setLogoutError('')
    try {
      await auth.signOut()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.')
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin" aria-label="Inicio del panel">
          <span className="brand-mark">99.7</span>
          <div>
            <strong>Panel</strong>
            <small>{auth.role === 'superadmin' ? 'Superadministrador' : 'Editor'}</small>
          </div>
        </Link>

        <nav className="admin-nav" aria-label="Navegación administrativa">
          {ADMIN_SECTIONS.filter((section) => section.roles.some((role) => role === auth.role)).map((section) => (
            <NavLink
              key={section.href}
              to={section.href}
              end={section.href === '/admin'}
              className={({ isActive }) => (isActive ? 'admin-nav-item is-active' : 'admin-nav-item')}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-account">
          <span>{auth.user.email}</span>
          {logoutError && <p className="auth-message auth-message--error" role="alert">{logoutError}</p>}
          <button className="text-button" type="button" onClick={() => void logout()}>Cerrar sesión</button>
        </div>
        <Link className="admin-return" to="/">← Volver al sitio</Link>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <div><strong>Radio 99.7 FM</strong><small>Panel seguro</small></div>
          <div className="admin-topbar-user"><span>{auth.user.email}</span><small>{auth.role === 'superadmin' ? 'Superadministrador' : 'Editor'}</small></div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
