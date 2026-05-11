import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import HostPage from './pages/HostPage.jsx'
import GuestPage from './pages/GuestPage.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-end px-4 py-3">
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
