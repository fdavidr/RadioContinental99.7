import { createPortal } from 'react-dom'
import { Outlet } from 'react-router-dom'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { siteConfig } from '../../data/site'
import { RadioProvider, useRadio } from '../../contexts/RadioContext'
import { RadioPlayer } from '../radio/RadioPlayer'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AnalyticsConsent } from '../common/AnalyticsConsent'
import { SeoHead, getConfiguredSocialImage } from '../seo/SeoHead'
import { trackAnalyticsEvent, trackPageView } from '../../services/analytics'
import { PublicBannerSlot } from '../public/PublicBannerSlot'

export function PublicLayout() {
  return (
    <RadioProvider>
      <PublicExperience />
    </RadioProvider>
  )
}

function PublicExperience() {
  const { pathname } = useLocation()
  const { config } = useRadio()
  const whatsappUrl = config?.whatsappUrl || siteConfig.whatsappUrl
  const safeWhatsappUrl = whatsappUrl && /^https:\/\//i.test(whatsappUrl) ? whatsappUrl : null

  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  return (
    <div className="app-shell">
      <DefaultRouteSeo pathname={pathname} />
      <AppHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <RadioDock />
      {safeWhatsappUrl && (
        <a
          className="whatsapp-float"
          href={safeWhatsappUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Contactar a Radio 99.7 FM por WhatsApp"
          onClick={() => trackAnalyticsEvent('whatsapp_click', { placement: 'floating_button' })}
        >
          <span aria-hidden="true">◉</span><span>WhatsApp</span>
        </a>
      )}
      <AnalyticsConsent />
      <PublicBannerSlot placement="footer" label="Pie de página" />
      <AppFooter />
    </div>
  )
}

function DefaultRouteSeo({ pathname }: { pathname: string }) {
  const routeMetadata: Record<string, { title: string; description: string }> = {
    '/en-vivo': { title: 'Escuchar en vivo | Radio 99.7 FM', description: 'Escuchá Radio 99.7 FM en vivo desde el reproductor oficial.' },
    '/contacto': { title: 'Contacto | Radio 99.7 FM', description: 'Canales oficiales de contacto de Radio 99.7 FM.' },
    '/nosotros': { title: 'Sobre nosotros | Radio 99.7 FM', description: 'Conocé Radio 99.7 FM y su propuesta de comunicación.' },
    '/programacion': { title: 'Programación | Radio 99.7 FM', description: 'Consultá la programación publicada de Radio 99.7 FM.' },
    '/privacidad': { title: 'Privacidad | Radio 99.7 FM', description: 'Información sobre privacidad y uso de este sitio.' },
    '/terminos': { title: 'Términos de uso | Radio 99.7 FM', description: 'Términos de uso del sitio de Radio 99.7 FM.' },
  }
  if (['/', '/noticias', '/programas', '/buscar', '/deportes'].includes(pathname) ||
    /^\/(noticias|programas)\/[^/]+$/.test(pathname)) return null
  const metadata = routeMetadata[pathname]
  if (!metadata) return null
  return (
    <SeoHead
      title={metadata.title}
      description={metadata.description}
      path={pathname}
      imageUrl={getConfiguredSocialImage()}
    />
  )
}

function RadioDock() {
  const { pathname } = useLocation()
  const { status } = useRadio()
  if (pathname === '/en-vivo' || !['playing', 'connecting', 'error'].includes(status)) return null
  return createPortal(<div className="radio-player-dock"><RadioPlayer compact /></div>, document.body)
}
