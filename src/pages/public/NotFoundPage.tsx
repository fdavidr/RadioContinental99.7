import { Link } from 'react-router-dom'
import { SeoHead } from '../../components/seo/SeoHead'

export function NotFoundPage() {
  return (
    <div className="page-shell centered-shell">
      <SeoHead title="404 · Página no encontrada | Radio 99.7 FM" description="La dirección solicitada no existe o no está disponible." path="/404" noIndex />
      <div className="container narrow text-center">
        <span className="eyebrow">404</span>
        <h1>Página no encontrada</h1>
        <p className="lead">La ruta que intentas abrir no existe o aún no fue publicada.</p>
        <Link to="/" className="button button--primary">Volver al inicio</Link>
      </div>
    </div>
  )
}
