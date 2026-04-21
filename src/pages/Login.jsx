import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card fade-in auth-card">
        <h2 className="auth-card__title">Acceso admin</h2>
        <p className="auth-card__subtitle">Solo para el equipo de Stylo Space</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@stylospace.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary auth-form__submit" disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
