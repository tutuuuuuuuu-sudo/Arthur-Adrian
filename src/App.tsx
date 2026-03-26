import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Home from './pages/Home'
import SpotDetails from './pages/SpotDetails'
import LoginPage from './pages/LoginPage'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="text-[#5dcaa5] text-sm">Carregando...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="text-[#5dcaa5] text-sm">Carregando...</div>
    </div>
  )
  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/spot/:id" element={<ProtectedRoute><SpotDetails /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
