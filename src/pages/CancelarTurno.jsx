import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cancelarTurnoPublico, getEstadoCancelacionPublica } from '../lib/api'
import { formatDateArgentina } from '../lib/argentinaDate'

function formatFechaLarga(fecha) {
  return formatDateArgentina(fecha, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function CancelarTurno() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') || ''
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [turno, setTurno] = useState(null)
  const [cancelacion, setCancelacion] = useState(null)
  const [contacto, setContacto] = useState({ whatsapp: '', instagram: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id || !token) {
      setError('El link de cancelación es inválido.')
      setLoading(false)
      return
    }

    getEstadoCancelacionPublica(id, token)
      .then((data) => {
        setTurno(data.turno)
        setCancelacion(data.cancelacion)
        setContacto(data.contacto || { whatsapp: '', instagram: '' })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, token])

  async function handleCancelar() {
    setSubmitting(true)
    setError('')
    try {
      const result = await cancelarTurnoPublico(id, token)
      setSuccess(true)
      setCancelacion({ ok: false, code: 'already_cancelled', message: 'Tu turno fue cancelado correctamente.' })
      if (result.contacto) setContacto(result.contacto)
    } catch (err) {
      setError(err.message)
      if (err.contacto) setContacto(err.contacto)
      if (err.code === 'already_cancelled') {
        setCancelacion({ ok: false, code: 'already_cancelled', message: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const mostrarContacto = useMemo(() => {
    return cancelacion?.code === 'deadline_passed' || Boolean(error && !loading && !success)
  }, [cancelacion, error, loading, success])

  return (
    <section className="booking-section" style={{ maxWidth: 760, margin: '0 auto', paddingInline: 24 }}>
      <div className="card fade-in" style={{ marginTop: 48, marginBottom: 48 }}>
        <h1 className="section-title" style={{ marginBottom: 12 }}>Cancelar turno</h1>

        {loading ? (
          <div className="page-loader" style={{ minHeight: 180 }}>
            <div className="spinner" />
          </div>
        ) : error && !turno ? (
          <>
            <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>
            <Link className="btn btn-outline" to="/">Volver al inicio</Link>
          </>
        ) : (
          <>
            {turno && (
              <div style={{ marginBottom: 24 }}>
                <p><strong>Cliente:</strong> {turno.nombre_cliente}</p>
                <p><strong>Servicio:</strong> {turno.servicio_nombre}</p>
                <p><strong>Fecha:</strong> {formatFechaLarga(turno.fecha)}</p>
                <p><strong>Hora:</strong> {turno.hora}</p>
                <p>
                  <strong>Estado:</strong>{' '}
                  <span className={`badge ${turno.estado === 'cancelled' ? 'badge-cancelled' : 'badge-confirmed'}`}>
                    {turno.estado === 'cancelled' ? 'Cancelado' : 'Confirmado'}
                  </span>
                </p>
                {turno.cancelado_por && <p><strong>Cancelado por:</strong> {turno.cancelado_por}</p>}
                
              </div>
            )}

            {success ? (
              <div className="success-msg" style={{ marginBottom: 18 }}>
                Tu turno fue cancelado con éxito.
              </div>
            ) : cancelacion?.ok ? (
              <>
                <p style={{ marginBottom: 18 }}>
                  Estás dentro del plazo permitido. Podés cancelar tu turno desde el siguiente botón.
                </p>
                <button className="btn btn-danger" onClick={handleCancelar} disabled={submitting}>
                  {submitting ? 'Cancelando...' : 'Cancelar turno'}
                </button>
              </>
            ) : (
              <div style={{ marginBottom: 18 }}>
                <p className={cancelacion?.code === 'already_cancelled' ? 'success-msg' : 'error-msg'} style={{ display: 'block' }}>
                  {cancelacion?.message || error}
                </p>
                
              </div>
            )}

            {mostrarContacto && (contacto.whatsapp || contacto.instagram) ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {contacto.whatsapp && (
                  <a className="btn btn-primary" href={contacto.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>
                )}
                {contacto.instagram && (
                  <a className="btn btn-outline" href={contacto.instagram} target="_blank" rel="noreferrer">Instagram</a>
                )}
              </div>
            ) : null}

            <div style={{ marginTop: 24 }}>
              <Link className="btn btn-outline" to="/">Volver al inicio</Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
