import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HostPage from './pages/HostPage.jsx'
import GuestPage from './pages/GuestPage.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import Brand from './components/Brand.jsx'

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
        <Brand size="sm" />
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
  )
}
