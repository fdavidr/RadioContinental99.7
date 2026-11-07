import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { getAdminDashboardStats, listRecentAdminActivity } from '../../services/admin'
import type { AdminDashboardStats } from '../../services/admin'
import type { AdminLogRecord } from '../../types/content'

const emptyStats: AdminDashboardStats = {
  publishedPosts: 0,
  draftPosts: 0,
  publishedPrograms: 0,
  activeScheduleItems: 0,
  categories: 0,
}

export function AdminDashboardPage() {
  const auth = useAuth()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [activity, setActivity] = useState<AdminLogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (auth.status !== 'signed-in') return
    let active = true
    const tasks: Promise<unknown>[] = [
      getAdminDashboardStats(auth.user).then((result) => { if (active) setStats(result) }),
    ]
    if (auth.role === 'superadmin') {
      tasks.push(listRecentAdminActivity(auth.user, 5).then((result) => { if (active) setActivity(result) }))
    }
    void Promise.all(tasks)
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los indicadores.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [auth.status, auth.status === 'signed-in' ? auth.user.uid : '', auth.status === 'signed-in' ? auth.role : ''])

  const values = stats ?? emptyStats
  const cards = [
    { title: 'Noticias publicadas', count: values.publishedPosts, href: '/admin/noticias' },
    { title: 'Borradores', count: values.draftPosts, href: '/admin/noticias?status=draft' },
    { title: 'Programas activos', count: values.publishedPrograms, href: '/admin/programas' },
    { title: 'Emisiones publicadas', count: values.activeScheduleItems, href: '/admin/programacion' },
    { title: 'Categorías activas', count: values.categories, href: '/admin/categorias' },
  ]

  return (
    <div className="admin-module">
      <header className="page-heading"><div><span className="eyebrow">Radio 99.7 FM · Administración</span><h1>Dashboard</h1><p className="lead">Indicadores calculados desde Firestore, actualizados al cargar la página.</p></div></header>
      {error && <ErrorState title="No se pudieron cargar todos los datos" message={error} />}
      {loading ? <LoadingState title="Consultando indicadores" message="Firebase está calculando los totales actuales." /> :
        <div className="admin-stats">{cards.map((card) => <Link className="admin-stat-card" to={card.href} key={card.title}><span>{card.title}</span><strong>{card.count}</strong></Link>)}</div>}
      <div className="admin-dashboard-grid">
        <section className="form-card">
          <div className="section-header"><div><span className="eyebrow">Acceso rápido</span><h2>Administrar</h2></div></div>
          <div className="admin-quick-links">
            <Link to="/admin/noticias">Noticias y publicaciones</Link>
            <Link to="/admin/programas">Programas</Link>
            <Link to="/admin/programacion">Programación semanal</Link>
            <Link to="/admin/categorias">Categorías</Link>
            <Link to="/admin/etiquetas">Etiquetas</Link>
            {auth.status === 'signed-in' && auth.role === 'superadmin' && <>
              <Link to="/admin/multimedia">Biblioteca multimedia</Link>
              <Link to="/admin/banners">Banners publicitarios</Link>
              <Link to="/admin/configuracion">Configuración de emisora</Link>
              <Link to="/admin/usuarios">Usuarios y permisos</Link>
              <Link to="/admin/actividad">Registros de actividad</Link>
            </>}
          </div>
        </section>
        {auth.status === 'signed-in' && auth.role === 'superadmin' && (
          <section className="form-card">
            <div className="section-header"><div><span className="eyebrow">Auditoría informativa</span><h2>Actividad reciente</h2></div><Link to="/admin/actividad">Ver todo</Link></div>
            {loading ? <LoadingState title="Cargando actividad" /> : activity.length === 0
              ? <EmptyState title="Sin actividad reciente" message="Las operaciones confirmadas se mostrarán aquí." />
              : <ul className="activity-list">{activity.map((item) => <li key={item.id}><strong>{item.action} · {item.collection}</strong><span>{item.summary}</span><small>{item.createdAt.toDate().toLocaleString('es-AR')}</small></li>)}</ul>}
          </section>
        )}
      </div>
      <div className="demo-note"><strong>Persistencia activa solo para operaciones conectadas.</strong> Los módulos guardan en Firestore cuando Firebase está configurado. El contenido público actualmente sigue mostrando datos editoriales provisionales hasta integrarse con estas colecciones.</div>
    </div>
  )
}
