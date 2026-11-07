import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { primaryNav } from '../../data/site'
import { trackAnalyticsEvent } from '../../services/analytics'

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    if (query) navigate(`/buscar?q=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="site-header">
      <div className="header-topline">
        <div className="container">
          <span>Radio Continental</span>
          <span>Una radio, muchas voces.</span>
          <span className="header-frequency">99.7 FM</span>
        </div>
      </div>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Radio 99.7 FM, volver al inicio">
          <span className="brand-mark"><span>99</span><small>.7</small></span>
          <span className="brand-copy">
            <strong>Radio Continental</strong>
            <small>FM · 99.7</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Navegación principal">
          <PrimaryNavigation compact />
        </nav>

        <div className="header-actions">
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="header-content-search">Buscar noticias y programas</label>
            <input id="header-content-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" />
            <button type="submit" aria-label="Buscar noticias y programas">⌕</button>
          </form>
          <Link to="/en-vivo" className="header-live-button" onClick={() => trackAnalyticsEvent('live_click', { placement: 'header' })}>
            <span className="header-live-icon" aria-hidden="true">▶</span>
            <span>Escuchar en vivo</span>
          </Link>
          <div className={`mobile-nav ${mobileMenuOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="mobile-nav__toggle"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            >
              <span /><span /><span />
            </button>
            {mobileMenuOpen && (
              <nav id="mobile-navigation" aria-label="Navegación móvil">
                <PrimaryNavigation />
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function PrimaryNavigation({ compact = false }: { compact?: boolean }) {
  const navigation = compact
    ? primaryNav.filter((item) => !['/', '/en-vivo'].includes(item.href))
    : primaryNav

  return (
    <>
      {navigation.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  )
}
