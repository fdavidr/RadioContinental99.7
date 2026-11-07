export type NavigationItem = {
  label: string
  href: string
}

export type SocialLink = {
  label: string
  href: string
}

export type Program = {
  id: string
  slug: string
  title: string
  category: string
  slot: string
  host: string
  description: string
  imageUrl: string
  imageAlt: string
  accent: string
  days: string[]
}

export type NewsItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  publishedAt: string
  readTime: string
  imageUrl: string
  imageAlt: string
  body: string[]
}

export type SiteConfig = {
  name: string
  slogan: string
  locale: string
  contactEmail: string | null
  phone: string | null
  streamUrl: string | null
  whatsappUrl: string | null
  socialLinks: SocialLink[]
}
