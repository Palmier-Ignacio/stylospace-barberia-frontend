import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import logo from '../assets/logo.jpg'

export default function Navbar({ user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')

  async function handleLogout() {
    await signOut(auth)
    navigate('/')
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--white)',
      borderBottom: '1px solid var(--gray-200)',
      padding: '0 32px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to={user ? "/admin" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src={logo}
          alt="StyloSpace"
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 300,
          letterSpacing: '0.05em',
        }}>
          StyloSpace
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isAdmin && (
          <>
            <Link to="/" className="btn btn-ghost" style={{ fontSize: '13px' }}>
              Reservar turno
            </Link>
            
          </>
        )}

        {isAdmin && (
          <>
            <NavLink to="/admin">Inicio</NavLink>
            <NavLink to="/admin/turnos">Turnos</NavLink>
            <NavLink to="/admin/servicios">Servicios</NavLink>
            <NavLink to="/admin/disponibilidad">Disponibilidad</NavLink>
          </>
        )}

        {user ? (
          <button onClick={handleLogout} className="btn btn-outline" style={{ marginLeft: '8px' }}>
            Salir
          </button>
        ) : (
          <Link to="/login" className="btn btn-outline" style={{ marginLeft: '8px', fontSize: '13px' }}>
            Admin
          </Link>
        )}
      </div>
    </nav>
  )
}

function NavLink({ to, children }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      style={{
        fontSize: '13px',
        padding: '6px 12px',
        color: active ? 'var(--black)' : 'var(--gray-600)',
        fontWeight: active ? 500 : 400,
        borderBottom: active ? '1px solid var(--black)' : '1px solid transparent',
        transition: 'var(--transition)',
      }}
    >
      {children}
    </Link>
  )
}
