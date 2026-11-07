export const APP_ROUTES = {
  home: '/',
  programs: '/programas',
  news: '/noticias',
  live: '/en-vivo',
  schedule: '/programacion',
  sports: '/deportes',
  about: '/nosotros',
  contact: '/contacto',
  privacy: '/privacidad',
  terms: '/terminos',
  admin: '/admin',
  adminDashboard: '/admin',
} as const

export const ADMIN_SECTIONS = [
  { label: 'Dashboard', href: '/admin', roles: ['superadmin', 'editor'] },
  { label: 'Noticias y publicaciones', href: '/admin/noticias', roles: ['superadmin', 'editor'] },
  { label: 'Programas', href: '/admin/programas', roles: ['superadmin', 'editor'] },
  { label: 'Programación', href: '/admin/programacion', roles: ['superadmin', 'editor'] },
  { label: 'Categorías', href: '/admin/categorias', roles: ['superadmin', 'editor'] },
  { label: 'Etiquetas', href: '/admin/etiquetas', roles: ['superadmin', 'editor'] },
  { label: 'Multimedia', href: '/admin/multimedia', roles: ['superadmin'] },
  { label: 'Banners', href: '/admin/banners', roles: ['superadmin'] },
  { label: 'Configuración', href: '/admin/configuracion', roles: ['superadmin'] },
  { label: 'Usuarios y permisos', href: '/admin/usuarios', roles: ['superadmin'] },
  { label: 'Actividad', href: '/admin/actividad', roles: ['superadmin'] },
] as const
