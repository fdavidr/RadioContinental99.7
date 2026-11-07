import { Link } from 'react-router-dom'

import { primaryNav, siteConfig } from '../../data/site'
import { useRadio } from '../../contexts/RadioContext'

export function AppFooter() {
  const { config } = useRadio()
  const email = config?.contactEmail || siteConfig.contactEmail
  const phone = config?.contactPhone || siteConfig.phone
  const socialLinks = config?.socialLinks
    ? Object.entries(config.socialLinks)
      .filter(([, href]) => /^https:\/\//i.test(href))
      .map(([label, href]) => ({ label, href }))
    : siteConfig.socialLinks.filter((social) => /^https:\/\//i.test(social.href))
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="brand" aria-label="Radio 99.7 FM, inicio">
              <span className="brand-mark"><span>99</span><small>.7</small></span>
              <span className="brand-copy"><strong>Radio Continental</strong><small>FM · 99.7</small></span>
            </Link>
            <p>{siteConfig.slogan}.</p>
            <span className="footer-frequency">EN TU RADIO · 99.7 FM</span>
          </div>
          <div className="footer-column">
            <h2>Explorá</h2>
            <ul>{primaryNav.filter((item) => item.href !== '/').map((item) => <li key={item.href}><Link to={item.href}>{item.label}</Link></li>)}</ul>
          </div>
          <div className="footer-column">
            <h2>La emisora</h2>
            <ul>
              <li><Link to="/nosotros">Sobre nosotros</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/privacidad">Política de privacidad</Link></li>
              <li><Link to="/terminos">Términos de uso</Link></li>
            </ul>
          </div>
          <div className="footer-column footer-contact">
            <h2>Conectá con nosotros</h2>
            <p>{email ? <a href={`mailto:${email}`}>{email}</a> : 'Canales oficiales pendientes de configuración.'}</p>
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {socialLinks.length > 0 && (
              <ul className="social-links" aria-label="Redes sociales">
                {socialLinks.map((social) => (
                  <li key={social.label}><a href={social.href} target="_blank" rel="noreferrer">{social.label}<span aria-hidden="true">↗</span></a></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.</span>
          <span>Actualidad, comunidad y deporte.</span>
        </div>
      </div>
    </footer>
  )
}
