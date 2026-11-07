import { useEffect } from 'react'

const siteName = import.meta.env.VITE_APP_NAME?.trim() || 'Radio 99.7 FM'

type SeoHeadProps = {
  title: string
  description: string
  path: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedAt?: string
  modifiedAt?: string
  author?: string
  imageUrl?: string
  structuredData?: Record<string, unknown>
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export function SeoHead({
  title,
  description,
  path,
  noIndex = false,
  type = 'website',
  publishedAt,
  modifiedAt,
  author,
  imageUrl,
  structuredData,
}: SeoHeadProps) {
  useEffect(() => {
    const safeTitle = title.trim().slice(0, 180)
    const safeDescription = description.trim().slice(0, 320)
    const canonicalUrl = getSiteUrl(path)
    document.title = safeTitle
    upsertMeta('name', 'description', safeDescription)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:title', safeTitle)
    upsertMeta('property', 'og:description', safeDescription)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary')
    upsertMeta('name', 'twitter:title', safeTitle)
    upsertMeta('name', 'twitter:description', safeDescription)
    if (imageUrl && /^https:\/\//i.test(imageUrl)) {
      upsertMeta('property', 'og:image', imageUrl)
      upsertMeta('name', 'twitter:image', imageUrl)
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove()
      document.head.querySelector('meta[name="twitter:image"]')?.remove()
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl

    const articleProperties: Array<[string, string | undefined]> = [
      ['article:published_time', publishedAt],
      ['article:modified_time', modifiedAt],
      ['article:author', author],
    ]
    for (const [key, value] of articleProperties) {
      if (value) upsertMeta('property', key, value)
      else document.head.querySelector(`meta[property="${key}"]`)?.remove()
    }

    document.getElementById('page-structured-data')?.remove()
    if (structuredData) {
      const script = document.createElement('script')
      script.id = 'page-structured-data'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(structuredData)
      document.head.append(script)
    }
  }, [author, description, imageUrl, modifiedAt, noIndex, path, publishedAt, structuredData, title, type])

  return null
}

export function getConfiguredSocialImage(): string | undefined {
  const image = import.meta.env.VITE_SOCIAL_PREVIEW_IMAGE_URL?.trim()
  return image && /^https:\/\//i.test(image) ? image : undefined
}

export function getSiteUrl(path: string): string {
  const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim()
  const origin = configuredOrigin && /^https:\/\//i.test(configuredOrigin)
    ? configuredOrigin.replace(/\/+$/, '')
    : window.location.origin
  return new URL(path, `${origin}/`).toString()
}
