import type { NavigationItem, NewsItem, Program, SiteConfig } from '../types/site'

export const siteConfig: SiteConfig = {
  name: 'Radio 99.7 FM',
  slogan: 'Actualidad, deportes y conexión con la comunidad',
  locale: 'es-AR',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL?.trim() || null,
  phone: import.meta.env.VITE_CONTACT_PHONE?.trim() || null,
  streamUrl: null,
  whatsappUrl: import.meta.env.VITE_WHATSAPP_URL?.trim() || null,
  socialLinks: [
    { label: 'Instagram', href: import.meta.env.VITE_INSTAGRAM_URL?.trim() ?? '' },
    { label: 'Facebook', href: import.meta.env.VITE_FACEBOOK_URL?.trim() ?? '' },
    { label: 'YouTube', href: import.meta.env.VITE_YOUTUBE_URL?.trim() ?? '' },
  ].filter((link) => link.href.length > 0),
}

export const primaryNav: NavigationItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Programas', href: '/programas' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Buscar', href: '/buscar' },
  { label: 'En vivo', href: '/en-vivo' },
  { label: 'Programación', href: '/programacion' },
  { label: 'Deportes', href: '/deportes' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
]

export const featuredPrograms: Program[] = [
  {
    id: 'manana-continente',
    slug: 'manana-continental',
    title: 'Mañana Continental',
    category: 'Matinal',
    slot: '06:00 - 09:00',
    host: 'Pendiente de confirmar',
    description: 'El análisis del día, la actualidad local y la conversación con la comunidad.',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=960&q=78',
    imageAlt: 'Micrófono de estudio frente a una consola de radio',
    accent: 'var(--accent-amber)',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
  },
  {
    id: 'ambiente-deportivo',
    slug: 'ambiente-deportivo',
    title: 'Ambiente Deportivo',
    category: 'Deportes',
    slot: '12:00 - 14:00',
    host: 'Pendiente de confirmar',
    description: 'Debates, estadística y cobertura de la emoción deportiva del fin de semana.',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=960&q=78',
    imageAlt: 'Estadio de fútbol iluminado durante un partido',
    accent: 'var(--accent-sky)',
    days: ['Lunes', 'Miércoles', 'Viernes'],
  },
  {
    id: 'noche-rumbo',
    slug: 'noche-rumbo',
    title: 'Noche Rumbo',
    category: 'Cultura',
    slot: '21:00 - 23:00',
    host: 'Pendiente de confirmar',
    description: 'Música, entrevistas, voces de la escena local y contenido de interés general.',
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=960&q=78',
    imageAlt: 'Artista junto a un micrófono en un escenario',
    accent: 'var(--brand-pink)',
    days: ['Martes', 'Jueves'],
  },
]

export const newsItems: NewsItem[] = [
  {
    id: 'news-1',
    slug: 'espacio-publico-comunidad',
    title: 'Ejemplo de titular para una nota de comunidad',
    excerpt: 'Este texto de muestra ilustra el formato editorial. No informa hechos ocurridos.',
    category: 'Sociedad',
    publishedAt: 'Fecha pendiente',
    readTime: '4 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1440&q=82',
    imageAlt: 'Periódicos apilados sobre una mesa de redacción',
    body: [
      'Este artículo existe únicamente para mostrar cómo se verá una noticia en el sitio.',
      'No describe hechos reales. El contenido definitivo deberá ser redactado y verificado por el equipo editorial.',
    ],
  },
  {
    id: 'news-2',
    slug: 'equipo-temporada',
    title: 'Ejemplo de titular para cobertura deportiva',
    excerpt: 'Este contenido de muestra no informa resultados, fichajes ni declaraciones reales.',
    category: 'Deportes',
    publishedAt: 'Fecha pendiente',
    readTime: '3 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=78',
    imageAlt: 'Vista amplia de una cancha de fútbol',
    body: [
      'Este artículo existe únicamente para mostrar cómo se verá una noticia deportiva en el sitio.',
      'No informa resultados ni declaraciones reales. Los datos definitivos deberán verificarse antes de publicar.',
    ],
  },
  {
    id: 'news-3',
    slug: 'radio-comunitaria-nuevas-voces',
    title: 'Ejemplo de titular para una historia de la comunidad',
    excerpt: 'Este espacio se completará con una historia real, verificada y aprobada por la redacción.',
    category: 'Medio ambiente',
    publishedAt: 'Fecha pendiente',
    readTime: '5 min de lectura',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=78',
    imageAlt: 'Personas reunidas alrededor de una mesa conversando',
    body: [
      'Este artículo existe únicamente para mostrar cómo se presentará una historia de la comunidad.',
      'El texto no describe una historia real; la versión final requerirá fuentes y aprobación editorial.',
    ],
  },
]

export const quickStats = [
  { label: 'Enfoque', value: 'Actualidad' },
  { label: 'Cobertura', value: 'Comunidad' },
  { label: 'Especialidad', value: 'Deportes' },
  { label: 'Formato', value: 'Radio' },
]

export const provisionalContentLabel = 'Contenido provisional · No representa información oficial ni noticias verificadas.'

export const advertisingSlots = [
  { id: 'home-top', label: 'Espacio publicitario', placement: 'Banner superior' },
  { id: 'home-feed', label: 'Espacio publicitario', placement: 'Entre publicaciones' },
]
