import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Home from './pages/Home'
import SpotDetails from './pages/SpotDetails'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spot/:id" element={<SpotDetails />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}

export default App