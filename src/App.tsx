import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { LoadingState } from './components/common/LoadingState'
import { PublicLayout } from './components/layout/PublicLayout'
import { HomePage } from './pages/public/HomePage'

const AdminRoutes = lazy(() => import('./routes/AdminRoutes'))
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((module) => ({ default: module.AboutPage })))
const ContactPage = lazy(() => import('./pages/public/ContactPage').then((module) => ({ default: module.ContactPage })))
const LegalPage = lazy(() => import('./pages/public/LegalPage').then((module) => ({ default: module.LegalPage })))
const LivePage = lazy(() => import('./pages/public/LivePage').then((module) => ({ default: module.LivePage })))
const NewsDetailPage = lazy(() => import('./pages/public/NewsDetailPage').then((module) => ({ default: module.NewsDetailPage })))
const NewsPage = lazy(() => import('./pages/public/NewsPage').then((module) => ({ default: module.NewsPage })))
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const ProgramDetailPage = lazy(() => import('./pages/public/ProgramDetailPage').then((module) => ({ default: module.ProgramDetailPage })))
const ProgramsPage = lazy(() => import('./pages/public/ProgramsPage').then((module) => ({ default: module.ProgramsPage })))
const SchedulePage = lazy(() => import('./pages/public/SchedulePage').then((module) => ({ default: module.SchedulePage })))
const SearchPage = lazy(() => import('./pages/public/SearchPage').then((module) => ({ default: module.SearchPage })))
const SportsPage = lazy(() => import('./pages/public/SportsPage').then((module) => ({ default: module.SportsPage })))

function App() {
  return (
    <Suspense fallback={<LoadingState title="Cargando aplicación" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="programas" element={<ProgramsPage />} />
          <Route path="programas/:slug" element={<ProgramDetailPage />} />
          <Route path="noticias" element={<NewsPage />} />
          <Route path="noticias/:slug" element={<NewsDetailPage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="en-vivo" element={<LivePage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="nosotros" element={<AboutPage />} />
          <Route path="programacion" element={<SchedulePage />} />
          <Route path="deportes" element={<SportsPage />} />
          <Route path="privacidad" element={<LegalPage />} />
          <Route path="terminos" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin/*" element={<AdminRoutes />} />
      </Routes>
    </Suspense>
  )
}

export default App
