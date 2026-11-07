import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { AdminGuard, AdminRoleGate } from '../components/auth/AdminGuard'
import { LoadingState } from '../components/common/LoadingState'
import { AdminLayout } from '../components/layout/AdminLayout'
import { AuthProvider } from '../contexts/AuthContext'
import {
  AccessDeniedPage,
  AdminLoginPage,
  PasswordRecoveryPage,
  PasswordResetPage,
  VerifyEmailPage,
} from '../pages/admin/AdminAuthPages'
import { NotFoundPage } from '../pages/public/NotFoundPage'
import { SeoHead } from '../components/seo/SeoHead'

const AdminActivityPage = lazy(() => import('../pages/admin/AdminActivityPage').then((module) => ({ default: module.AdminActivityPage })))
const AdminCatalogPage = lazy(() => import('../pages/admin/AdminCatalogPage').then((module) => ({ default: module.AdminCatalogPage })))
const AdminContentPage = lazy(() => import('../pages/admin/AdminContentPage').then((module) => ({ default: module.AdminContentPage })))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })))
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage').then((module) => ({ default: module.AdminMediaPage })))
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })))

export default function AdminRoutes() {
  return (
    <AuthProvider>
      <AdminSeoHead />
      <Suspense fallback={<LoadingState title="Cargando módulo administrativo" />}>
        <Routes>
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="recuperar" element={<PasswordRecoveryPage />} />
          <Route path="restablecer" element={<PasswordResetPage />} />
          <Route path="verificar-correo" element={<VerifyEmailPage />} />
          <Route path="sin-permiso" element={<AccessDeniedPage />} />
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="programas" element={<AdminContentPage />} />
              <Route path="noticias" element={<AdminContentPage />} />
              <Route path="programacion" element={<AdminCatalogPage />} />
              <Route path="categorias" element={<AdminCatalogPage />} />
              <Route path="etiquetas" element={<AdminCatalogPage />} />
              <Route path="multimedia" element={<AdminRoleGate allowedRoles={['superadmin']}><AdminMediaPage /></AdminRoleGate>} />
              <Route path="banners" element={<AdminRoleGate allowedRoles={['superadmin']}><AdminCatalogPage /></AdminRoleGate>} />
              <Route path="configuracion" element={<AdminRoleGate allowedRoles={['superadmin']}><AdminSettingsPage /></AdminRoleGate>} />
              <Route path="usuarios" element={<AdminRoleGate allowedRoles={['superadmin']}><AdminUsersPage /></AdminRoleGate>} />
              <Route path="actividad" element={<AdminRoleGate allowedRoles={['superadmin']}><AdminActivityPage /></AdminRoleGate>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

function AdminSeoHead() {
  const { pathname } = useLocation()
  return (
    <SeoHead
      title="Panel administrativo | Radio 99.7 FM"
      description="Acceso al panel administrativo de Radio 99.7 FM."
      path={pathname}
      noIndex
    />
  )
}
