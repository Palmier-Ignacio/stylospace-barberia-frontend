import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import logo from '../assets/logo.jpg'

export default function Navbar({ user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
    setMenuOpen(false)
  }

  function closeMenu() { setMenuOpen(false) }

  return (
    <>
      <nav className="navbar">
        <Link to={user ? '/admin' : '/'} className="navbar-brand" onClick={closeMenu}>
          <img src={logo} alt="Stylo Space" className="navbar-logo" />
          <span className="navbar-title">Stylo Space</span>
        </Link>

        {/* Desktop */}
        <div className="navbar-actions navbar-desktop">
          {!isAdmin && (
            <Link to="/" className="btn btn-ghost">Reservar turno</Link>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin">Inicio</NavLink>
              <NavLink to="/admin/turnos">Turnos</NavLink>
              <NavLink to="/admin/servicios">Servicios</NavLink>
              <NavLink to="/admin/disponibilidad">Disponibilidad</NavLink>
            </>
          )}
          {user && (
            <button onClick={handleLogout} className="btn btn-danger navbar-logout">Salir</button>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`navbar-hamburger ${menuOpen ? 'navbar-hamburger--open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menú"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`navbar-mobile-menu ${menuOpen ? 'navbar-mobile-menu--open' : ''}`}>
        {!isAdmin && (
          <Link to="/" className="navbar-mobile-link" onClick={closeMenu}>Reservar turno</Link>
        )}
        {isAdmin && (
          <>
            <MobileNavLink to="/admin" onClick={closeMenu}>Inicio</MobileNavLink>
            <MobileNavLink to="/admin/turnos" onClick={closeMenu}>Turnos</MobileNavLink>
            <MobileNavLink to="/admin/servicios" onClick={closeMenu}>Servicios</MobileNavLink>
            <MobileNavLink to="/admin/disponibilidad" onClick={closeMenu}>Disponibilidad</MobileNavLink>
          </>
        )}
        {user && (
          <button onClick={handleLogout} className="btn btn-danger navbar-mobile-logout">Salir</button>
        )}
      </div>
    </>
  )
}

function NavLink({ to, children }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} className={`navbar-link ${active ? 'navbar-link--active' : ''}`}>
      {children}
    </Link>
  )
}

function MobileNavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link to={to} onClick={onClick} className={`navbar-mobile-link ${active ? 'navbar-mobile-link--active' : ''}`}>
      {children}
    </Link>
  )
}