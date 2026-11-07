import { siteConfig } from '../../data/site'
import { useRadio } from '../../contexts/RadioContext'
import { trackAnalyticsEvent } from '../../services/analytics'

export function ContactPage() {
  const { config } = useRadio()
  const contactEmail = config?.contactEmail || siteConfig.contactEmail
  const phone = config?.contactPhone || siteConfig.phone
  const whatsappUrl = config?.whatsappUrl || siteConfig.whatsappUrl
  const safeWhatsappUrl = whatsappUrl && /^https:\/\//i.test(whatsappUrl) ? whatsappUrl : null
  const hasContactChannel = Boolean(contactEmail || phone || safeWhatsappUrl)

  return (
    <div className="page-shell">
      <div className="container narrow">
        <span className="eyebrow">Contacto</span>
        <h1>Hablemos con la emisora</h1>
        <p className="lead">¿Tenés una consulta, una historia o una propuesta? Estos son los canales disponibles.</p>
      </div>
      <div className="container contact-grid">
        <section className="info-card contact-card">
          <span className="eyebrow">Radio 99.7 FM</span>
          <h2>Estamos para escucharte.</h2>
          {hasContactChannel ? (
            <ul>
              {contactEmail && <li><span>Correo</span><a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>}
              {phone && <li><span>Teléfono</span><a href={`tel:${phone}`}>{phone}</a></li>}
              {safeWhatsappUrl && <li><span>WhatsApp</span><a href={safeWhatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAnalyticsEvent('whatsapp_click', { placement: 'contact_page' })}>Abrir conversación <span aria-hidden="true">↗</span></a></li>}
            </ul>
          ) : (
            <div className="state-panel contact-pending">
              <strong>Canales oficiales pendientes</strong>
              <p>La emisora todavía no configuró sus datos de contacto. No hay un formulario activo que envíe mensajes.</p>
            </div>
          )}
        </section>
        <aside className="contact-side">
          <span className="eyebrow">En sintonía</span>
          <h2>Tu voz también es parte de la radio.</h2>
          <p>Cuando los canales oficiales estén configurados, vas a encontrarlos aquí.</p>
          <div className="contact-frequency">99.7 <span>FM</span></div>
        </aside>
      </div>
    </div>
  )
}
