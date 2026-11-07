import { useEffect, useState } from 'react'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { listAdminUsers } from '../../services/admin'
import type { PrivateUserProfile } from '../../types/content'

export function AdminUsersPage() {
  const auth = useAuth()
  const [users, setUsers] = useState<PrivateUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    let active = true
    void listAdminUsers(auth.user)
      .then((items) => { if (active) setUsers(items) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : ''])

  return (
    <div className="admin-module">
      <header className="page-heading"><div><span className="eyebrow">Solo superadministrador</span><h1>Usuarios y permisos</h1><p className="lead">Perfiles de Firestore en modo de solo lectura.</p></div></header>
      <div className="demo-note"><strong>Los roles no se asignan desde el cliente.</strong> Los permisos efectivos provienen de custom claims de Firebase Authentication. Para crear o cambiar roles, usá el procedimiento seguro de Admin SDK documentado en README; este módulo no cambia claims ni puede otorgarse privilegios.</div>
      {error && <ErrorState title="No se pudieron leer los usuarios" message={error} />}
      {loading ? <LoadingState title="Consultando perfiles" /> :
        users.length === 0 ? <EmptyState title="Sin perfiles registrados" message="La colección users no contiene perfiles. Los usuarios de Authentication no se enumeran desde el cliente por seguridad." /> :
          <div className="table-card admin-table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>UID</th><th>Estado de perfil</th></tr></thead><tbody>
            {users.map((item) => <tr key={item.uid}><td>{item.displayName || 'Sin nombre'}</td><td>{item.email}</td><td><code>{item.uid}</code></td><td>{item.disabled ? 'Deshabilitado' : 'Perfil activo'}</td></tr>)}
          </tbody></table></div>}
      <p className="form-hint">Los perfiles visibles son únicamente los documentos existentes en Firestore, no una lista completa de Firebase Authentication.</p>
    </div>
  )
}
