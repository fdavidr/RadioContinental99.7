export const PRODUCTION_SITE_URL = 'https://continental997.fm'

export function assertProductionSiteUrl(siteUrl) {
  if (siteUrl !== PRODUCTION_SITE_URL) {
    throw new Error(`VITE_SITE_URL debe ser exactamente ${PRODUCTION_SITE_URL} para producción.`)
  }
}
