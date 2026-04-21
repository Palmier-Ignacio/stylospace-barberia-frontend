import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'

import Dashboard from './pages/admin/Dashboard'
import Turnos from './pages/admin/Turnos'
import Servicios from './pages/admin/Servicios'
import Disponibilidad from './pages/admin/Disponibilidad'
import CancelarTurno from './pages/CancelarTurno'

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  if (user === undefined) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login />} />
        <Route path="/cancelar-turno" element={<CancelarTurno />} />

        <Route path="/admin" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/turnos" element={<ProtectedRoute user={user}><Turnos /></ProtectedRoute>} />
        <Route path="/admin/servicios" element={<ProtectedRoute user={user}><Servicios /></ProtectedRoute>} />
        <Route path="/admin/disponibilidad" element={<ProtectedRoute user={user}><Disponibilidad /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}