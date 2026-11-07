import { useEffect, useState } from 'react'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { listRecentAdminActivity } from '../../services/admin'
import type { AdminLogRecord } from '../../types/content'

export function AdminActivityPage() {
  const auth = useAuth()
  const [items, setItems] = useState<AdminLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    let active = true
    void listRecentAdminActivity(auth.user, 50)
      .then((logs) => { if (active) setItems(logs) })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo consultar la actividad.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : ''])

  return (
    <div className="admin-module">
      <header className="page-heading"><div><span className="eyebrow">Solo superadministrador</span><h1>Registros de actividad</h1><p className="lead">Últimas operaciones guardadas junto con sus cambios editoriales.</p></div></header>
      <div className="demo-note">Estos registros son útiles para seguimiento, pero los crea el cliente y no constituyen una auditoría inviolable. Acciones regulatorias requieren un backend confiable.</div>
      {error && <ErrorState title="No se pudo cargar la actividad" message={error} />}
      {loading ? <LoadingState title="Cargando actividad" /> :
        items.length === 0 ? <EmptyState title="Todavía no hay actividad" message="Las operaciones editoriales confirmadas aparecerán aquí." /> :
          <div className="table-card admin-table-wrap"><table><thead><tr><th>Fecha</th><th>Actor UID</th><th>Acción</th><th>Módulo</th><th>Documento</th><th>Resumen</th></tr></thead><tbody>
            {items.map((item) => <tr key={item.id}><td>{item.createdAt.toDate().toLocaleString('es-AR')}</td><td><code>{item.actorUid}</code></td><td>{item.action}</td><td>{item.collection}</td><td><code>{item.documentId}</code></td><td>{item.summary}</td></tr>)}
          </tbody></table></div>}
    </div>
  )
}
