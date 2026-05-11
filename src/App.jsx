import { Routes, Route, Navigate, Link } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HostPage from './pages/HostPage.jsx'
import GuestPage from './pages/GuestPage.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'

export default function App() {
  return (
    <>
      <div className="app-bg" aria-hidden="true" />
      <div className="app-bg-grid" aria-hidden="true" />
      <div className="min-h-full flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-8 py-4">
          <Link
            to="/"
            className="text-sm font-semibold tracking-tight text-white/90 hover:text-white transition"
          >
            <span>Drop</span>
            <span className="brand-gradient">&amp;Go</span>
          </Link>
          <LanguageToggle />
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/guest/:code" element={<GuestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}
