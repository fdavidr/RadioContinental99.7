import { useLocation } from 'react-router-dom'

export function LegalPage() {
  const { pathname } = useLocation()
  const isPrivacy = pathname.endsWith('privacidad')
  const title = isPrivacy ? 'Política de privacidad' : 'Términos de uso'

  return (
    <article className="page-shell">
      <div className="container narrow">
        <span className="eyebrow">Información legal</span>
        <h1>{title}</h1>
        <p className="lead">
          Este apartado es una estructura preliminar. No sustituye una revisión legal ni describe prácticas reales de tratamiento de datos.
        </p>
        <section className="legal-copy">
          <h2>{isPrivacy ? 'Datos y privacidad' : 'Uso del sitio'}</h2>
          <p>
            Antes de publicar esta página, la emisora debe definir y revisar el texto aplicable a sus servicios,
            formularios, analítica, derechos de usuarios y canales de contacto.
          </p>
          <p>Última actualización: pendiente de revisión editorial y legal.</p>
        </section>
      </div>
    </article>
  )
}
